import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { escalateOverdue } from "@/lib/alerts";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Fail closed when it is not configured. */
function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/** Raise urgent reports nobody has acknowledged. Schedule every 5 to 15 minutes. */
export async function GET(req: Request) {
  if (!authorised(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    // Tidy the shared rate-limit counters while we are here (best effort).
    await createAdminClient().rpc("purge_rate_limits").then(() => undefined, () => undefined);
    return NextResponse.json({ ok: true, ...(await escalateOverdue()) });
  } catch (e) {
    console.error("[cron] escalate-reports failed:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
