"use client";

import { useState } from "react";
import {
  RadioTower, RefreshCw, Loader2, Plus, X, Circle, ExternalLink,
  EyeOff, Search, Link2, ShieldAlert,
} from "lucide-react";
import { scanSocialLinks, seedPoliticalKeywords, addSource, muteAccount, toggleSource, removeSource, scanAllNow, addKeyword, removeKeyword, toggleKeyword, setResultStatus } from "@/app/actions/listening";
import type { Source } from "@/lib/listening-sources";
import { SUGGESTED_SOURCES } from "@/lib/listening-suggestions";
import { useRouter } from "next/navigation";

export interface Keyword { id: string; word: string; severity: string; active: boolean }
export interface Result {
  id: string; source: string; permalink: string | null; author: string | null;
  content: string; matched_keywords: string[]; severity: string; status: string; captured_at: string;
  ai_class?: string | null; ai_confidence?: number | null;
}

const AI_LABEL: Record<string, { label: string; cls: string }> = {
  real_incident: { label: "Likely a real case", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  targeted_abuse: { label: "Abuse aimed at someone", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  awareness: { label: "Awareness or news", cls: "bg-cyan-050 text-cyan-700 border-cyan/30" },
  not_relevant: { label: "Likely not relevant", cls: "bg-slate-50 text-slate-500 border-slate-200" },
};
const isLikelyReal = (c?: string | null) => c === "real_incident" || c === "targeted_abuse";

const PLATFORM_LABEL: Record<string, string> = { instagram: "Instagram", x: "X", facebook: "Facebook" };

const SEV: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};
const STATUS_TABS = ["new", "reviewing", "actioned", "dismissed"] as const;

export function ListeningView({ sources, keywords, results }: { sources: Source[]; keywords: Keyword[]; results: Result[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("new");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [newWord, setNewWord] = useState("");
  const [newSev, setNewSev] = useState("high");
  const [links, setLinks] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const [onlyReal, setOnlyReal] = useState(false);
  const [srcPlatform, setSrcPlatform] = useState<"instagram" | "x" | "facebook">("instagram");
  const [srcKind, setSrcKind] = useState<"profile" | "hashtag">("profile");
  const [srcValue, setSrcValue] = useState("");

  const run = async (tag: string, fn: () => Promise<{ error?: string; ok?: boolean; stored?: number; scanned?: number; added?: number; problems?: string[] } | undefined>) => {
    setBusy(tag); setMsg(null); setProblems([]);
    const res = await fn();
    setBusy(null);
    if (res?.error) { setMsg(res.error); return; }
    if (typeof res?.added === "number") setMsg(res.added ? `Added ${res.added} keyword(s).` : "Those keywords are already on your list.");
    if (typeof res?.stored === "number") setMsg(res.scanned ? `Looked at ${res.scanned} post${res.scanned === 1 ? "" : "s"} and kept ${res.stored} for review.` : "Scan finished. Nothing new to look at.");
    if (res?.problems?.length) setProblems(res.problems);
    router.refresh();
  };

  const lastScan = sources.map((x) => x.last_scanned_at).filter(Boolean).sort().pop() ?? null;
  const counts = STATUS_TABS.reduce((a, s) => ({ ...a, [s]: results.filter((r) => r.status === s).length }), {} as Record<string, number>);
  const anySorted = results.some((r) => r.ai_class);
  const shown = results
    .filter((r) => r.status === tab)
    .filter((r) => !onlyReal || isLikelyReal(r.ai_class))
    // Likely-real first, likely-not-relevant last; otherwise newest first (the order the list arrived in).
    .sort((a, b) => Number(isLikelyReal(b.ai_class)) - Number(isLikelyReal(a.ai_class)) || Number(a.ai_class === "not_relevant") - Number(b.ai_class === "not_relevant"));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-1.5">Early warning</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink flex items-center gap-2.5"><RadioTower className="w-7 h-7 text-purple" /> Online listening</h1>
          <p className="text-sm text-muted mt-1.5 max-w-2xl">
            Watches Facebook, Instagram and X for threats and abuse aimed at defenders, and flags what it finds for you to review.
            Everything you watch is scanned automatically every day.
            {lastScan && <> Last scan: {new Date(lastScan).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.</>}
          </p>
        </div>
        <button onClick={() => run("all", scanAllNow)} disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-xl bg-purple text-white px-5 h-11 text-sm font-bold hover:bg-purple/90 disabled:opacity-50">
          {busy === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Scan now
        </button>
      </div>
      {msg && <p role="status" className="rounded-xl border border-purple/20 bg-purple-050 px-4 py-2.5 text-sm font-semibold text-purple-700">{msg}</p>}

      {/* Social links */}
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(28,21,34,0.04)]">
        <h2 className="font-bold text-ink flex items-center gap-2"><Link2 className="w-4 h-4 text-purple" /> Check specific posts</h2>
        <p className="text-xs text-muted mt-1">
          Paste links to public Instagram or X posts, one per line. Only the post itself is read and kept.
        </p>
        <textarea value={links} onChange={(e) => setLinks(e.target.value)} rows={3}
          placeholder={"https://www.instagram.com/p/…\nhttps://x.com/someone/status/…"}
          className="mt-3 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 resize-y" />
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => run("scan", async () => { const r = await scanSocialLinks(links); if (r && "ok" in r && r.ok) setLinks(""); return r; })}
            disabled={busy !== null || !links.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-purple text-white px-4 h-10 text-sm font-bold hover:bg-purple/90 disabled:opacity-50">
            {busy === "scan" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Check links
          </button>
        </div>
        {problems.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
            {problems.map((p) => <li key={p}>{p}</li>)}
          </ul>
        )}
      </section>

      {/* Watched accounts and hashtags */}
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(28,21,34,0.04)]">
        <h2 className="font-bold text-ink flex items-center gap-2"><RadioTower className="w-4 h-4 text-purple" /> Accounts and hashtags to watch</h2>
        <p className="text-xs text-muted mt-1">
          Their latest public posts are read every day. You are warned when several captured posts name the same person.
        </p>
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
          {sources.length === 0 && <li className="p-3 text-sm text-muted">Nothing watched yet. Add an account or a hashtag below.</li>}
          {sources.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-bold text-muted">{PLATFORM_LABEL[s.platform] ?? s.platform}</span>
              <span className={`text-sm font-semibold ${s.active ? "text-ink" : "text-muted line-through"}`}>
                {s.kind === "hashtag" ? "#" : "@"}{s.handle}
              </span>
              <span className="text-xs text-muted">
                {!s.active
                  ? (s.kind === "profile" ? "Paused: posts from this account are ignored" : "Paused: not being scanned")
                  : s.last_scanned_at ? `Scanned ${new Date(s.last_scanned_at).toLocaleDateString()} · ${s.last_result ?? ""}` : "Not scanned yet"}
              </span>
              <span className="ml-auto flex items-center gap-2">
                <button onClick={() => run(`ts-${s.id}`, () => toggleSource(s.id, !s.active))} className="text-xs font-semibold text-purple hover:underline">{s.active ? "Pause listening" : "Resume listening"}</button>
                <button onClick={() => run(`rs-${s.id}`, () => removeSource(s.id))} className="text-xs font-semibold text-rose-600 hover:underline">Remove</button>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select value={srcPlatform} onChange={(e) => { const v = e.target.value as "instagram" | "x" | "facebook"; setSrcPlatform(v); if (v === "facebook") setSrcKind("profile"); }} aria-label="Platform" className="h-9 rounded-lg border border-line bg-surface px-2 text-sm">
            <option value="instagram">Instagram</option><option value="x">X</option><option value="facebook">Facebook page</option>
          </select>
          {srcPlatform !== "facebook" && (
            <select value={srcKind} onChange={(e) => setSrcKind(e.target.value as "profile" | "hashtag")} aria-label="Account or hashtag" className="h-9 rounded-lg border border-line bg-surface px-2 text-sm">
              <option value="profile">Account</option><option value="hashtag">Hashtag</option>
            </select>
          )}
          <input value={srcValue} onChange={(e) => setSrcValue(e.target.value)} placeholder={srcKind === "hashtag" && srcPlatform !== "facebook" ? "one or more, e.g. endfemicideke" : srcPlatform === "facebook" ? "page name, as in facebook.com/pagename" : "one or more account names"}
            className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30" />
          <button onClick={() => run("addsrc", async () => { const r = await addSource(srcPlatform, srcKind, srcValue); if (!r?.error) setSrcValue(""); return r; })}
            disabled={busy !== null || !srcValue.trim()} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 h-9 text-sm font-semibold hover:bg-paper disabled:opacity-50">
            {busy === "addsrc" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Watch
          </button>
        </div>
        {(() => {
          const open = SUGGESTED_SOURCES.filter((g) => !sources.some((x) => x.platform === g.platform && x.kind === g.kind && x.handle.toLowerCase() === g.handle.toLowerCase()));
          if (open.length === 0) return null;
          return (
            <div className="mt-4 border-t border-line pt-3">
              <p className="eyebrow mb-2">Suggested accounts</p>
              <div className="flex flex-wrap gap-2">
                {open.map((g) => (
                  <button key={`${g.platform}-${g.handle}`} onClick={() => run(`sg-${g.handle}`, () => addSource(g.platform, g.kind, g.handle))}
                    disabled={busy !== null} title={`${g.focus}${g.check ? `. ${g.check}` : ""}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-purple-050 disabled:opacity-50">
                    {busy === `sg-${g.handle}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 text-purple" />}
                    {g.name} <span className="text-muted">{PLATFORM_LABEL[g.platform]}{g.check ? " (check)" : ""}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Keyword manager */}
      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="font-bold text-ink flex items-center gap-2"><Search className="w-4 h-4 text-purple" /> Watch keywords</h2>
        <p className="text-xs text-muted mt-1">Comments and posts containing these words are captured. High-severity words are surfaced first.</p>
        <button onClick={() => run("seed", seedPoliticalKeywords)} disabled={busy !== null}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 h-9 text-xs font-semibold text-ink hover:bg-paper disabled:opacity-50">
          {busy === "seed" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5 text-magenta" />} Add political-harassment keywords
        </button>
        <div className="mt-4 flex flex-wrap gap-2">
          {keywords.map((k) => (
            <span key={k.id} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${k.active ? SEV[k.severity] ?? SEV.low : "bg-paper text-muted border-line line-through opacity-60"}`}>
              <button onClick={() => run(`t-${k.id}`, () => toggleKeyword(k.id, !k.active))} title={k.active ? "Mute" : "Activate"} className="hover:opacity-70">
                {k.active ? <Circle className="w-2.5 h-2.5 fill-current" /> : <EyeOff className="w-3 h-3" />}
              </button>
              {k.word}
              <button onClick={() => run(`d-${k.id}`, () => removeKeyword(k.id))} title="Remove" className="hover:opacity-70">
                {busy === `d-${k.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              </button>
            </span>
          ))}
          {keywords.length === 0 && <p className="text-sm text-muted">No keywords yet. Add some below.</p>}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="Add a keyword"
            onKeyDown={(e) => { if (e.key === "Enter" && newWord.trim()) run("add", async () => { const r = await addKeyword(newWord, newSev); if (!r?.error) setNewWord(""); return r; }); }}
            className="rounded-lg border border-line bg-surface px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30" />
          <select value={newSev} onChange={(e) => setNewSev(e.target.value)} className="rounded-lg border border-line bg-surface px-2 h-9 text-sm">
            <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <button onClick={() => run("add", async () => { const r = await addKeyword(newWord, newSev); if (!r?.error) setNewWord(""); return r; })} disabled={busy !== null || !newWord.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 h-9 text-sm font-semibold hover:bg-paper disabled:opacity-50">
            {busy === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
          </button>
        </div>
      </section>

      {/* Results */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-line bg-paper p-1 w-fit">
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => setTab(s)}
              className={`rounded-md px-3 py-1.5 text-sm font-bold capitalize transition-colors ${tab === s ? "bg-surface text-purple shadow-sm" : "text-muted hover:text-ink"}`}>
              {s} {counts[s] ? <span className="ml-1 text-xs opacity-70">{counts[s]}</span> : null}
            </button>
          ))}
        </div>
        {anySorted && (
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
            <input type="checkbox" checked={onlyReal} onChange={(e) => setOnlyReal(e.target.checked)} className="accent-[#734e9e]" />
            Only likely real cases
          </label>
        )}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
            <RadioTower className="w-8 h-8 mx-auto text-purple/60" />
            <p className="mt-3">Nothing {tab === "new" ? "new" : tab} here. {tab === "new" ? "Posts that match your keywords appear after the next scan, or press Scan now." : ""}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {shown.map((r) => (
              <article key={r.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${SEV[r.severity] ?? SEV.low}`}>{r.severity}</span>
                  <span className="text-xs text-muted capitalize">{r.source} · {new Date(r.captured_at).toLocaleDateString()}</span>
                </div>
                {r.ai_class && AI_LABEL[r.ai_class] && (
                  <p className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${AI_LABEL[r.ai_class].cls}`}>
                    {AI_LABEL[r.ai_class].label}
                    {typeof r.ai_confidence === "number" && <span className="opacity-70">{Math.round(r.ai_confidence * 100)}%</span>}
                  </p>
                )}
                <p className="mt-2 text-sm text-ink line-clamp-4">{r.content}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.matched_keywords.map((w) => <span key={w} className="text-[11px] rounded bg-purple/10 text-purple px-1.5 py-0.5 font-semibold">{w}</span>)}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                  <div className="flex items-center gap-1.5">
                    {r.status !== "reviewing" && <StatusBtn label="Review" onClick={() => run(`s-${r.id}`, () => setResultStatus(r.id, "reviewing"))} busy={busy === `s-${r.id}`} />}
                    {r.status !== "actioned" && <StatusBtn label="Actioned" onClick={() => run(`s-${r.id}`, () => setResultStatus(r.id, "actioned"))} busy={busy === `s-${r.id}`} />}
                    {r.status !== "dismissed" && <StatusBtn label="Dismiss" onClick={() => run(`s-${r.id}`, () => setResultStatus(r.id, "dismissed"))} busy={busy === `s-${r.id}`} />}
                  </div>
                  {r.author && <span className="text-xs text-muted truncate max-w-[8rem]">{r.author}</span>}
                  {r.author && (r.source === "instagram" || r.source === "x") && (
                    <button onClick={() => run(`mute-${r.id}`, () => muteAccount(r.source, r.author as string))} disabled={busy !== null}
                      title="Keep this account on the list but ignore its posts from now on"
                      className="text-[11px] font-semibold text-muted hover:text-rose-600 disabled:opacity-50">
                      {busy === `mute-${r.id}` ? "…" : "Stop listening"}
                    </button>
                  )}
                  {r.permalink && <a href={r.permalink} target="_blank" rel="noopener noreferrer" className="text-purple shrink-0" title="Open original post"><ExternalLink className="w-4 h-4" /></a>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBtn({ label, onClick, busy }: { label: string; onClick: () => void; busy: boolean }) {
  return (
    <button onClick={onClick} disabled={busy} className="rounded-md border border-line px-2 py-1 text-[11px] font-semibold text-ink hover:bg-paper disabled:opacity-50">
      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : label}
    </button>
  );
}
