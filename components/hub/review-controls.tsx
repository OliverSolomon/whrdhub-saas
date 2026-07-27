"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Pin, Loader2, Pencil, Save } from "lucide-react";
import { reviewContent, togglePin, editContent } from "@/app/actions/content";

export function ReviewControls({
  kind,
  id,
  pinned,
  body = "",
  title = "",
  excerpt = "",
  status = "pending",
}: {
  kind: "post" | "blog";
  id: string;
  pinned: boolean;
  body?: string;
  title?: string;
  excerpt?: string;
  status?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [eBody, setEBody] = useState(body);
  const [eTitle, setETitle] = useState(title);
  const [eExcerpt, setEExcerpt] = useState(excerpt);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<{ error?: string } | undefined>, tag: string) => {
    setBusy(tag);
    setError(null);
    const res = await fn();
    setBusy(null);
    if (res?.error) { setError(res.error); return; }
    router.refresh();
  };

  const saveEdit = async () => {
    setBusy("save");
    setError(null);
    const res = await editContent(kind, id, kind === "post" ? { body: eBody } : { title: eTitle, excerpt: eExcerpt, body: eBody });
    setBusy(null);
    if (res?.error) { setError(res.error); return; }
    setEditing(false);
    router.refresh();
  };

  return (
    <div className="mt-3 pt-3 border-t border-line">
      {editing ? (
        <div className="space-y-2">
          {kind === "blog" && (
            <>
              <input value={eTitle} onChange={(e) => setETitle(e.target.value)} placeholder="Title" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple/30" />
              <input value={eExcerpt} onChange={(e) => setEExcerpt(e.target.value)} placeholder="Summary" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30" />
            </>
          )}
          <textarea value={eBody} onChange={(e) => setEBody(e.target.value)} rows={kind === "blog" ? 6 : 3} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30" />
          <div className="flex gap-2">
            <button onClick={saveEdit} disabled={busy !== null} className="inline-flex items-center gap-1.5 rounded-lg bg-purple text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
              {busy === "save" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save edits
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-muted px-2">Cancel</button>
          </div>
        </div>
      ) : showReject ? (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Reason for not approving (shared with the author)"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
          />
          <div className="flex gap-2">
            <button
              onClick={() => run(() => reviewContent(kind, id, "rejected", notes), "reject")}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {busy === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} Confirm reject
            </button>
            <button onClick={() => setShowReject(false)} className="text-xs text-muted px-2">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {status !== "approved" && (
            <button
              onClick={() => run(() => reviewContent(kind, id, "approved"), "approve")}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {busy === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} {status === "rejected" ? "Publish" : "Approve & publish"}
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-purple-050"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          {status !== "rejected" && (
            <button
              onClick={() => setShowReject(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-rose-50"
            >
              <X className="w-3.5 h-3.5" /> {status === "approved" ? "Take down" : "Reject"}
            </button>
          )}
          <button
            onClick={() => run(() => togglePin(kind, id, !pinned), "pin")}
            disabled={busy !== null}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${pinned ? "border-purple text-purple bg-purple-050" : "border-line text-ink hover:bg-purple-050"}`}
          >
            {busy === "pin" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pin className="w-3.5 h-3.5" />} {pinned ? "Unpin" : "Pin"}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
