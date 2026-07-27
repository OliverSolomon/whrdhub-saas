"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Pin, Loader2 } from "lucide-react";
import { reviewContent, togglePin } from "@/app/actions/content";

export function ReviewControls({
  kind,
  id,
  pinned,
}: {
  kind: "post" | "blog";
  id: string;
  pinned: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<{ error?: string } | undefined>, tag: string) => {
    setBusy(tag);
    setError(null);
    const res = await fn();
    setBusy(null);
    if (res?.error) { setError(res.error); return; }
    router.refresh();
  };

  return (
    <div className="mt-3 pt-3 border-t border-line">
      {showReject ? (
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
          <button
            onClick={() => run(() => reviewContent(kind, id, "approved"), "approve")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {busy === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve &amp; publish
          </button>
          <button
            onClick={() => setShowReject(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-rose-50"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
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
