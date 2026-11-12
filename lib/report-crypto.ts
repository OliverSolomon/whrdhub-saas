import { blindIndex, isEncrypted, openValue, sealValue } from "./crypto.ts";

/**
 * Which report columns are encrypted. Everything that says what happened, who
 * did it, how to reach the reporter, or where it was is sealed. What stays
 * readable on purpose is the coarse classification that matching, filtering and
 * statistics need: incident types, county, support needed, urgency, status and
 * dates. The county is a wide area, not an address.
 */
export const REPORT_TEXT_FIELDS = [
  "description", "what_description", "how_description",
  "tfgbv_link", "tfgbv_content_text",
  "perpetrator_detail", "location_description", "activism_context",
  "contact_method", "contact_value", "support_other",
  "defender_notes", "verification_notes",
] as const;

/** text[] columns: the whole list is sealed into one element. */
export const REPORT_LIST_FIELDS = ["tfgbv_screenshot_urls", "voice_note_paths", "derogatory_words"] as const;

const aad = (id: string, col: string) => `reports.${col}.${id}`;
const UNREADABLE = "[could not be decrypted]";

type Row = Record<string, unknown>;

/**
 * Encrypt the sensitive fields found in `fields` for the report `id`. Fields
 * that are absent are left alone, so it works for a full insert and for a
 * one-field update alike. Exact coordinates move into geo_enc and the plain
 * latitude and longitude columns are cleared.
 */
export function sealReport(id: string, fields: Row): Row {
  const out: Row = { ...fields };
  for (const col of REPORT_TEXT_FIELDS) {
    if (!(col in out)) continue;
    if (col === "contact_value") out.contact_hash = out[col] ? blindIndex(String(out[col])) : null;
    out[col] = sealValue(out[col], aad(id, col));
  }
  for (const col of REPORT_LIST_FIELDS) {
    if (!(col in out)) continue;
    const list = out[col];
    out[col] = Array.isArray(list) && list.length ? [sealValue(list, aad(id, col))] : null;
  }
  if ("latitude" in out || "longitude" in out) {
    const lat = out.latitude, lng = out.longitude;
    out.geo_enc = typeof lat === "number" && typeof lng === "number" ? sealValue({ lat, lng }, aad(id, "geo")) : null;
    out.latitude = null;
    out.longitude = null;
  }
  return out;
}

/** The reverse of sealReport for one row read from the database. Legacy plain rows pass through unchanged. */
export function openReport<T extends Row>(row: T): T {
  if (!row || typeof row !== "object") return row;
  const id = String(row.id ?? "");
  const out: Row = { ...row };
  for (const col of REPORT_TEXT_FIELDS) {
    if (!isEncrypted(out[col])) continue;
    try { out[col] = openValue<string>(out[col], aad(id, col)); }
    catch (e) { console.error("[crypto] could not decrypt", col, id, (e as Error).message); out[col] = UNREADABLE; }
  }
  for (const col of REPORT_LIST_FIELDS) {
    const list = out[col];
    if (!Array.isArray(list) || list.length !== 1 || !isEncrypted(list[0])) continue;
    try { out[col] = openValue<string[]>(list[0], aad(id, col)); }
    catch (e) { console.error("[crypto] could not decrypt", col, id, (e as Error).message); out[col] = []; }
  }
  if (isEncrypted(out.geo_enc)) {
    try {
      const g = openValue<{ lat: number; lng: number }>(out.geo_enc, aad(id, "geo"));
      out.latitude = g?.lat ?? null;
      out.longitude = g?.lng ?? null;
    } catch (e) { console.error("[crypto] could not decrypt geo", id, (e as Error).message); }
  }
  delete out.geo_enc;
  return out as T;
}

export const openReports = <T extends Row>(rows: T[] | null | undefined): T[] => (rows ?? []).map(openReport);

/** Columns a select must add so the sealed location can be opened. */
export const GEO_COLUMN = "geo_enc";
