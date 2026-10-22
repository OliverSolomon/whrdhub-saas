"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ExternalLink, Inbox as InboxIcon, Loader2, UserRoundX } from "lucide-react";
import { setResultStatus, muteAccount, takeOnCapture } from "@/app/actions/listening";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";
import { cn, timeAgo } from "@/lib/utils";
import { AI_LABEL, PLATFORM_LABEL, SEVERITY_DOT, isLikelyReal, type Result, type Run } from "./types";

const STATUSES = [
  { id: "new", label: "New" },
  { id: "reviewing", label: "In review" },
  { id: "actioned", label: "Actioned" },
  { id: "dismissed", label: "Dismissed" },
] as const;

type Status = (typeof STATUSES)[number]["id"];

/**
 * The shared inbox. Every admin sees the same captures, so each one shows who
 * has taken it on. A list on the left, the selected capture on the right; on a
 * phone the capture opens in a sheet.
 */
export function Inbox({ results, run, busy }: { results: Result[]; run: Run; busy: string | null }) {
  const [status, setStatus] = useState<Status>("new");
  const [onlyReal, setOnlyReal] = useState(false);
  const [platform, setPlatform] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const router = useRouter();

  const counts = useMemo(
    () => Object.fromEntries(STATUSES.map((s) => [s.id, results.filter((r) => r.status === s.id).length])) as Record<Status, number>,
    [results],
  );
  const anySorted = results.some((r) => r.ai_class);
  const platforms = useMemo(() => [...new Set(results.map((r) => r.source))], [results]);

  const list = useMemo(
    () =>
      results
        .filter((r) => r.status === status)
        .filter((r) => !onlyReal || isLikelyReal(r.ai_class))
        .filter((r) => platform === "all" || r.source === platform)
        // Likely real cases first, likely-not-relevant last, otherwise newest first.
        .sort(
          (a, b) =>
            Number(isLikelyReal(b.ai_class)) - Number(isLikelyReal(a.ai_class)) ||
            Number(a.ai_class === "not_relevant") - Number(b.ai_class === "not_relevant") ||
            new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime(),
        ),
    [results, status, onlyReal, platform],
  );

  const selected = list.find((r) => r.id === selectedId) ?? list[0] ?? null;

  /** Change a capture's status and move on to the next one, so a run of them can be worked through. */
  const move = async (r: Result, to: string) => {
    const idx = list.findIndex((x) => x.id === r.id);
    const next = list[idx + 1] ?? list[idx - 1] ?? null;
    await run(`s-${r.id}`, () => setResultStatus(r.id, to));
    setSelectedId(next?.id ?? null);
    setSheet(false);
  };

  /** Taking on opens a case: a normal report with the post and every tool, and we go straight to it. */
  const takeOn = async (r: Result) => {
    const res = await run(`s-${r.id}`, () => takeOnCapture(r.id));
    if (res?.reportId) router.push(`/hub/reporting/reports/${res.reportId}`);
  };

  const detail = selected ? (
    <Detail r={selected} busy={busy} onTakeOn={() => takeOn(selected)} onMove={(to) => move(selected, to)} onMute={() => run(`mute-${selected.id}`, () => muteAccount(selected.source, selected.author ?? ""))} />
  ) : null;

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-paper p-1" role="tablist" aria-label="Status">
          {STATUSES.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={status === s.id}
              onClick={() => { setStatus(s.id); setSelectedId(null); }}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                status === s.id ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {s.label}
              {counts[s.id] > 0 && <span className="ml-1.5 text-[11px] font-bold text-muted">{counts[s.id]}</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {platforms.length > 1 && (
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform" className="h-9 rounded-lg border border-line bg-surface px-2.5 text-[13px] font-medium text-ink">
              <option value="all">All platforms</option>
              {platforms.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p] ?? p}</option>)}
            </select>
          )}
          {anySorted && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink">
              <input type="checkbox" checked={onlyReal} onChange={(e) => setOnlyReal(e.target.checked)} className="accent-[#734e9e]" />
              Likely real cases only
            </label>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card-premium grid place-items-center px-6 py-20 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-050 text-purple"><InboxIcon className="h-6 w-6" /></span>
          <p className="mt-4 font-display text-lg font-semibold text-ink">{status === "new" ? "You are all caught up" : "Nothing here"}</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            {status === "new"
              ? "New captures appear after each scan. You can also press Scan now, or check a post you have been sent."
              : `Captures you ${status === "reviewing" ? "take on" : status === "actioned" ? "act on" : "dismiss"} will be listed here for everyone on the team.`}
          </p>
        </div>
      ) : (
        <div className="card-premium grid overflow-hidden lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          {/* List */}
          <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto border-line lg:border-r" role="listbox" aria-label="Captures">
            {list.map((r) => {
              const on = selected?.id === r.id;
              return (
                <li key={r.id} role="option" aria-selected={on}>
                  <button
                    onClick={() => { setSelectedId(r.id); setSheet(true); }}
                    className={cn("block w-full px-4 py-3.5 text-left transition-colors hover:bg-paper", on && "bg-purple-050/60")}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", SEVERITY_DOT[r.severity] ?? SEVERITY_DOT.low)} title={`${r.severity} severity`} />
                      <span className="min-w-0 truncate text-[13px] font-semibold text-ink">{r.author ?? "Unknown account"}</span>
                      <span className="ml-auto shrink-0 text-[11px] text-muted">{timeAgo(r.captured_at)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink/65">{r.content}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
                      <span>{PLATFORM_LABEL[r.source] ?? r.source}</span>
                      {isLikelyReal(r.ai_class) && <span className="font-semibold text-rose-600">Likely real</span>}
                      {r.status === "reviewing" && r.handled_by_name && <span className="font-semibold text-purple-700">With {r.handled_by_name}</span>}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Detail, side by side on large screens */}
          <div className="hidden min-h-[24rem] lg:block">{detail}</div>
        </div>
      )}

      {/* Detail as a sheet on small screens */}
      <div className="lg:hidden">
        <Modal open={sheet && !!selected} onClose={() => setSheet(false)} title="Capture">
          {detail}
        </Modal>
      </div>
    </div>
  );
}

function Detail({ r, busy, onMove, onTakeOn, onMute }: { r: Result; busy: string | null; onMove: (to: string) => void; onTakeOn: () => void; onMute: () => void }) {
  const ai = r.ai_class ? AI_LABEL[r.ai_class] : null;
  const working = busy === `s-${r.id}`;
  const canMute = !!r.author && (r.source === "instagram" || r.source === "x");

  const btn = (to: string, label: string, primary = false) => (
    <button
      key={to}
      onClick={() => onMove(to)}
      disabled={busy !== null}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-50",
        primary ? "bg-purple text-white hover:bg-purple-600" : "border border-line bg-surface text-ink hover:bg-paper",
      )}
    >
      {working ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </button>
  );

  return (
    <article className="flex h-full flex-col p-5 sm:p-7">
      <header>
        <p className="eyebrow">{PLATFORM_LABEL[r.source] ?? r.source}</p>
        <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-ink">{r.author ?? "Unknown account"}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>Captured {new Date(r.captured_at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
          <span className="inline-flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", SEVERITY_DOT[r.severity] ?? SEVERITY_DOT.low)} />{r.severity} severity</span>
        </p>
      </header>

      {ai && (
        <p className={cn("mt-4 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", ai.cls)}>
          {ai.label}
          {typeof r.ai_confidence === "number" && <span className="opacity-70">{Math.round(r.ai_confidence * 100)}% sure</span>}
        </p>
      )}

      <blockquote className="mt-4 whitespace-pre-line rounded-2xl bg-paper p-4 text-[15px] leading-relaxed text-ink">{r.content}</blockquote>

      {r.matched_keywords.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow mb-1.5">Matched</p>
          <div className="flex flex-wrap gap-1.5">
            {r.matched_keywords.map((w) => <span key={w} className="rounded-full bg-purple-050 px-2.5 py-0.5 text-xs font-semibold text-purple-700">{w}</span>)}
          </div>
        </div>
      )}

      {r.permalink && (
        <a href={r.permalink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-purple hover:underline">
          Open the original post <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      <footer className="mt-auto pt-6">
        {r.handled_by_name && r.status !== "new" && (
          <p className="mb-3 text-xs text-muted">
            {r.status === "reviewing" ? "Being reviewed by" : r.status === "actioned" ? "Actioned by" : "Dismissed by"}{" "}
            <span className="font-semibold text-ink">{r.handled_by_name}</span>
            {r.handled_at ? `, ${timeAgo(r.handled_at)}` : ""}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {r.report_id && (
            <Link href={`/hub/reporting/reports/${r.report_id}`} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-purple px-4 text-sm font-semibold text-white hover:bg-purple-600">
              Open case <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {r.status === "new" && [
            <button key="take" onClick={onTakeOn} disabled={busy !== null} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-purple px-4 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50">
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Take on <ArrowRight className="h-4 w-4" /></>}
            </button>,
            btn("actioned", "Mark actioned"), btn("dismissed", "Dismiss"),
          ]}
          {r.status === "reviewing" && [btn("actioned", "Mark actioned", !r.report_id), btn("dismissed", "Dismiss"), !r.report_id && btn("new", "Put back")]}
          {(r.status === "actioned" || r.status === "dismissed") && btn("new", "Reopen")}
        </div>
        {canMute && (
          <button onClick={onMute} disabled={busy !== null} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-rose-600 disabled:opacity-50">
            <UserRoundX className="h-3.5 w-3.5" /> Stop listening to this account
          </button>
        )}
      </footer>
    </article>
  );
}
