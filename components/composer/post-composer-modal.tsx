"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, PenLine } from "lucide-react";
import { Composer } from "@/components/composer";
import { Avatar } from "@/components/ui/field";

/**
 * Compose surface used on the feed ("bar" trigger) and the dashboard ("card"
 * trigger). Opens in place — a centered modal on desktop, a full-screen drawer
 * on mobile — so the user is never redirected to compose.
 */
export function PostComposerModal({
  isHub = false,
  userName,
  avatarUrl,
  variant = "bar",
}: {
  isHub?: boolean;
  userName?: string;
  avatarUrl?: string | null;
  variant?: "bar" | "card";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (params.get("compose") === "1") setOpen(true);
  }, [params]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => {
    setOpen(false);
    if (params.get("compose")) router.replace(window.location.pathname);
  };

  return (
    <>
      {variant === "bar" ? (
        <div className="rounded-2xl border border-line bg-surface p-3 flex items-center gap-3 mb-4">
          <Avatar name={userName} src={avatarUrl} size={40} />
          <button onClick={() => setOpen(true)} className="flex-1 text-left rounded-full border border-line bg-paper px-4 h-11 text-sm text-muted hover:bg-purple-050 transition-colors">
            Share an update or write a story…
          </button>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-purple text-white px-4 h-11 text-sm font-bold hover:bg-purple-600 shrink-0">
            <PenLine className="w-4 h-4" /> <span className="hidden sm:inline">Post</span>
          </button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="block text-left w-full h-full">
          <div className="rounded-2xl bg-emerald-50 p-5 h-full hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-xl grid place-items-center bg-white text-emerald-600"><PenLine className="w-5 h-5" /></div>
            <p className="mt-3 font-bold text-ink">Share something</p>
            <p className="text-xs text-ink/60">Post or write a story</p>
          </div>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex sm:items-start sm:justify-center sm:p-4" onClick={close}>
          <div className="bg-surface w-full h-full sm:h-auto sm:max-w-4xl sm:mt-6 sm:rounded-2xl sm:border sm:border-line shadow-2xl flex flex-col sm:max-h-[88vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 h-14 border-b border-line shrink-0">
              <p className="font-black text-ink">Create</p>
              <button onClick={close} aria-label="Close" className="text-muted hover:text-ink"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto feed-scroll">
              <Composer isHub={isHub} onDone={() => { router.refresh(); setTimeout(close, 900); }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
