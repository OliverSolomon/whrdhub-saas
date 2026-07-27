"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { verifyOrganization } from "@/app/actions/content";

export function OrgVerifyControls({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (decision: "verified" | "rejected", tag: string) => {
    setBusy(tag);
    setError(null);
    const res = await verifyOrganization(id, decision);
    setBusy(null);
    if (res?.error) { setError(res.error); return; }
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => run("verified", "v")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
      >
        {busy === "v" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Verify
      </button>
      <button
        onClick={() => run("rejected", "r")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-rose-50 disabled:opacity-50"
      >
        {busy === "r" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} Reject
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
