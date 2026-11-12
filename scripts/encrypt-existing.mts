/**
 * One-off backfill: encrypt report and USSD rows that were written before
 * encryption was switched on, and fill reports.contact_hash.
 *
 *   dry run (default):  node --experimental-strip-types --env-file=.env.local scripts/encrypt-existing.mts
 *   apply:              ... scripts/encrypt-existing.mts --apply
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATA_ENCRYPTION_KEYS
 * and BLIND_INDEX_KEY in the environment. Safe to run twice: values that are
 * already encrypted are skipped. Take a database backup first.
 */
import { createClient } from "@supabase/supabase-js";
import { sealReport, REPORT_TEXT_FIELDS, REPORT_LIST_FIELDS } from "../lib/report-crypto.ts";
import { isEncrypted, sealValue } from "../lib/crypto.ts";

const apply = process.argv.includes("--apply");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
const db = createClient(url, key, { auth: { persistSession: false } });

const needs = (v: unknown) => v != null && v !== "" && !(Array.isArray(v) ? v.length === 1 && isEncrypted(v[0]) : isEncrypted(v));

let reports = 0, sessions = 0;
for (let from = 0; ; from += 200) {
  const { data, error } = await db.from("reports").select("*").order("id").range(from, from + 199);
  if (error) throw error;
  if (!data?.length) break;
  for (const row of data as Record<string, unknown>[]) {
    const plain: Record<string, unknown> = {};
    for (const c of [...REPORT_TEXT_FIELDS, ...REPORT_LIST_FIELDS]) if (needs(row[c])) plain[c] = row[c];
    const hasGeo = typeof row.latitude === "number" && typeof row.longitude === "number";
    if (hasGeo) { plain.latitude = row.latitude; plain.longitude = row.longitude; }
    if (!Object.keys(plain).length) continue;
    // Fields that were empty stay empty; only present values are sealed.
    const patch = sealReport(String(row.id), plain);
    reports++;
    if (apply) {
      const { error: e } = await db.from("reports").update(patch).eq("id", row.id as string);
      if (e) throw e;
    }
  }
}

for (let from = 0; ; from += 200) {
  const { data, error } = await db.from("ussd_sessions").select("id, session_id, phone_number, text_input").order("id").range(from, from + 199);
  if (error) throw error;
  if (!data?.length) break;
  for (const row of data as { id: string; session_id: string; phone_number: string | null; text_input: string | null }[]) {
    const patch: Record<string, unknown> = {};
    if (needs(row.phone_number)) patch.phone_number = sealValue(row.phone_number, `ussd_sessions.phone_number.${row.session_id}`);
    if (needs(row.text_input)) patch.text_input = sealValue(row.text_input, `ussd_sessions.text_input.${row.session_id}`);
    if (!Object.keys(patch).length) continue;
    sessions++;
    if (apply) {
      const { error: e } = await db.from("ussd_sessions").update(patch).eq("id", row.id);
      if (e) throw e;
    }
  }
}

console.log(`${apply ? "Encrypted" : "Would encrypt"} ${reports} reports and ${sessions} USSD sessions.`);
if (!apply) console.log("Dry run only. Re-run with --apply after taking a backup.");
