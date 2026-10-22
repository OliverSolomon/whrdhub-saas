"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireReportingAdmin } from "@/lib/reporting-access";
import { fetchRecentContent, metaConfigured, metaDiagnose, type MetaDiagnosis } from "@/lib/meta";
import { ingestItems } from "@/lib/listening";
import { readSocialLink, socialEnabled } from "@/lib/social-fetch";
import { POLITICAL_HARASSMENT_KEYWORDS } from "@/lib/political-harassment";
import type { RawItem } from "@/lib/meta";

const MAX_LINKS_PER_SCAN = 10;

async function requireAdmin() {
  return await requireReportingAdmin();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any;

export async function pollMeta() {
  if (!(await requireAdmin())) return { error: "Admins only." };
  if (!metaConfigured()) return { error: "Meta is not connected yet. Add the META_* environment variables first." };
  try {
    const items = await fetchRecentContent();
    const { stored } = await ingestItems(items, { triage: true });
    revalidatePath("/hub/reporting/listening");
    return { ok: true, stored, scanned: items.length };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Sync failed." };
  }
}

/**
 * Run the real Graph requests and report what Meta said.
 *
 * Admin-gated, because the result names the Page id and quotes Meta's own error
 * messages back — useful to whoever is configuring this, not for anyone else.
 */
export async function diagnoseMeta(): Promise<{ error: string } | { ok: true; diagnosis: MetaDiagnosis }> {
  if (!(await requireAdmin())) return { error: "Admins only." };
  try {
    return { ok: true, diagnosis: await metaDiagnose() };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not reach Meta." };
  }
}

export async function addKeyword(word: string, severity: string) {
  if (!(await requireAdmin())) return { error: "Admins only." };
  const w = word.trim();
  if (w.length < 2) return { error: "Keyword is too short." };
  const { error } = await db().from("listening_keywords").insert({ word: w, severity });
  if (error) return { error: error.message.includes("duplicate") ? "That keyword already exists." : error.message };
  revalidatePath("/hub/reporting/listening");
  return { ok: true };
}

export async function toggleKeyword(id: string, active: boolean) {
  if (!(await requireAdmin())) return { error: "Admins only." };
  const { error } = await db().from("listening_keywords").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/hub/reporting/listening");
  return { ok: true };
}

export async function removeKeyword(id: string) {
  if (!(await requireAdmin())) return { error: "Admins only." };
  const { error } = await db().from("listening_keywords").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/hub/reporting/listening");
  return { ok: true };
}

export async function setResultStatus(id: string, status: string) {
  if (!(await requireAdmin())) return { error: "Admins only." };
  const { error } = await db().from("listening_results").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/hub/reporting/listening");
  return { ok: true };
}

/**
 * Read the Instagram and X links an admin pastes, and run the posts through the
 * same keyword matching as everything else. Only the public text of the post is
 * kept; nothing about its comments, followers or the author's profile.
 */
export async function scanSocialLinks(input: string) {
  if (!(await requireAdmin())) return { error: "Admins only." };
  if (!socialEnabled()) return { error: "Social lookups are switched off (SOCIAL_PROVIDER=off)." };
  const links = [...new Set(input.split(/[\s,]+/).map((l) => l.trim()).filter((l) => /^https?:\/\//i.test(l)))];
  if (!links.length) return { error: "Paste one or more Instagram or X post links." };
  if (links.length > MAX_LINKS_PER_SCAN) return { error: `Scan at most ${MAX_LINKS_PER_SCAN} links at a time.` };

  const items: RawItem[] = [];
  const problems: string[] = [];
  for (const link of links) {
    const r = await readSocialLink(link);
    if (r.post && r.post.text) {
      items.push({ source: r.post.source, source_id: r.post.sourceId, permalink: r.post.url, author: r.post.author, content: r.post.text });
    } else {
      problems.push(`${link.replace(/^https?:\/\/(www\.)?/, "").slice(0, 48)}: ${r.post ? "the post has no text" : r.message}`);
    }
  }
  try {
    const { stored, triaged } = await ingestItems(items, { triage: true });
    revalidatePath("/hub/reporting/listening");
    return { ok: true, scanned: items.length, stored, triaged, problems };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Scan failed." };
  }
}

/** Add the political-harassment vocabulary to the watch list (existing words are left alone). */
export async function seedPoliticalKeywords() {
  if (!(await requireAdmin())) return { error: "Admins only." };
  const { data: existing } = await db().from("listening_keywords").select("word");
  const have = new Set((existing ?? []).map((k: { word: string }) => k.word.toLowerCase()));
  const fresh = POLITICAL_HARASSMENT_KEYWORDS.filter((k) => !have.has(k.word.toLowerCase()));
  if (fresh.length) {
    const { error } = await db().from("listening_keywords").insert(fresh);
    if (error) return { error: error.message };
  }
  revalidatePath("/hub/reporting/listening");
  return { ok: true, added: fresh.length };
}
