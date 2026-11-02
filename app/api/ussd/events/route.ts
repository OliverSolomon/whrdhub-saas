import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { openValue } from "@/lib/crypto";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Africa's Talking USSD session-end notification (the "events" callback).
// Set this URL as the Events/Notification callback on the live service code
// (Dashboard -> USSD -> Service Codes -> ... -> Callback). AT POSTs form fields
// (sessionId, phoneNumber, ...) once a session closes. We only SMS sessions
// that completed a report - timeouts and cancellations wrote no ussd_sessions
// row, so the lookup returns nothing and we stay quiet.

async function sendSMS(to: string, message: string) {
  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;
  if (!username || !apiKey) return; // ponytail: no-op until AT SMS creds are set
  const base = username === "sandbox" ? "https://api.sandbox.africastalking.com" : "https://api.africastalking.com";
  try {
    await fetch(`${base}/version1/messaging`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", apiKey },
      body: new URLSearchParams({ username, to, message }),
    });
  } catch (err) {
    console.error("USSD SMS error:", err);
  }
}

export async function POST(req: NextRequest) {
  if (!(await rateLimit(`ussd-events:${clientIp(req.headers)}`, 60, 120)).ok) return new NextResponse("", { status: 429 });
  const params = new URLSearchParams(await req.text());
  const sessionId = params.get("sessionId") || "";

  try {
    const admin = createAdminClient();
    const { data: session } = await admin
      .from("ussd_sessions")
      .select("phone_number, text_input, report_id")
      .eq("session_id", sessionId)
      .single();

    if (session?.report_id) {
      const text = openValue<string>(session.text_input, `ussd_sessions.text_input.${sessionId}`) ?? "";
      const lang = text.split("*")[0] || "1"; // step 0 = language
      const ref = session.report_id.slice(0, 8).toUpperCase();
      // Always the number stored when the report was filed, never one named in this request,
      // so this endpoint cannot be used to send an SMS to an arbitrary phone.
      const to = openValue<string>(session.phone_number, `ussd_sessions.phone_number.${sessionId}`) ?? "";
      if (to) {
        await sendSMS(to, lang === "2"
          ? `Ripoti yako WHRD Hub ${ref} imepokelewa. Tutafuatilia. Dharura: 1195.`
          : `Your WHRD Hub report ${ref} was received. We will follow up. Immediate help: 1195.`);
      }
    }
  } catch (err) {
    console.error("USSD events error:", err);
  }

  return new NextResponse("", { status: 200 }); // AT only needs a 200 ack
}
