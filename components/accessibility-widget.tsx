"use client";

import { useState } from "react";
import { Accessibility, X } from "lucide-react";
import { AccessibilityControls } from "@/components/accessibility-controls";

/** Floating accessibility button (desktop only; hidden on mobile where the
 *  same controls live in the profile). Opens a panel with the shared controls. */
export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Accessibility options"
        aria-expanded={open}
        className="hidden md:flex fixed bottom-6 left-6 z-50 w-14 h-14 items-center justify-center rounded-full bg-purple text-white shadow-xl shadow-purple/25 hover:bg-purple-600 active:scale-95 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-purple/30"
      >
        <Accessibility className="w-6 h-6" />
      </button>

      {open && (
        <div className="hidden md:block fixed bottom-24 left-6 z-50 w-[19rem] max-w-[calc(100vw-3rem)] rounded-2xl border border-line bg-surface shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-ink flex items-center gap-2"><Accessibility className="w-5 h-5 text-purple" /> Accessibility</p>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
          </div>
          <AccessibilityControls />
        </div>
      )}
    </>
  );
}
