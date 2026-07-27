"use client";

import { useEffect, useState } from "react";
import { Accessibility, X, Type, Contrast, Underline, Sparkles, RotateCcw } from "lucide-react";

interface Prefs {
  scale: number; // 1, 1.1, 1.25, 1.4
  contrast: boolean;
  links: boolean;
  motion: boolean;
}

const DEFAULT: Prefs = { scale: 1, contrast: false, links: false, motion: false };
const KEY = "whrd-a11y";

function apply(p: Prefs) {
  const root = document.documentElement;
  root.style.setProperty("--a11y-scale", String(p.scale));
  root.classList.toggle("a11y-contrast", p.contrast);
  root.classList.toggle("a11y-links", p.links);
  root.classList.toggle("a11y-motion", p.motion);
}

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const p = { ...DEFAULT, ...JSON.parse(saved) } as Prefs;
        setPrefs(p);
        apply(p);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const update = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    apply(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const reset = () => update(DEFAULT);

  const Toggle = ({ on, onClick, icon: Icon, label }: { on: boolean; onClick: () => void; icon: typeof Contrast; label: string }) => (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`flex items-center gap-3 w-full rounded-xl border px-3.5 py-3 text-sm font-semibold transition-colors ${
        on ? "border-purple bg-purple-050 text-purple-700" : "border-line bg-surface text-ink hover:bg-purple-050"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" /> {label}
      <span className={`ml-auto text-xs font-bold ${on ? "text-purple-700" : "text-muted"}`}>{on ? "On" : "Off"}</span>
    </button>
  );

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Accessibility options"
        aria-expanded={open}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 flex items-center justify-center rounded-full bg-purple text-white shadow-xl shadow-purple/25 hover:bg-purple-600 active:scale-95 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-purple/30"
      >
        <Accessibility className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed bottom-24 left-6 z-50 w-[19rem] max-w-[calc(100vw-3rem)] rounded-2xl border border-line bg-surface shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-ink flex items-center gap-2"><Accessibility className="w-5 h-5 text-purple" /> Accessibility</p>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
          </div>

          {/* Text size */}
          <div className="rounded-xl border border-line p-3 mb-2.5">
            <p className="text-sm font-semibold text-ink flex items-center gap-2 mb-2"><Type className="w-4 h-4" /> Text size</p>
            <div className="flex gap-1.5">
              {[
                { label: "A", v: 1 },
                { label: "A+", v: 1.1 },
                { label: "A++", v: 1.25 },
                { label: "A+++", v: 1.4 },
              ].map((s) => (
                <button
                  key={s.v}
                  onClick={() => update({ scale: s.v })}
                  className={`flex-1 rounded-lg border py-2 text-sm font-bold transition-colors ${
                    prefs.scale === s.v ? "border-purple bg-purple text-white" : "border-line bg-surface text-ink hover:bg-purple-050"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <Toggle on={prefs.contrast} onClick={() => update({ contrast: !prefs.contrast })} icon={Contrast} label="Higher contrast" />
            <Toggle on={prefs.links} onClick={() => update({ links: !prefs.links })} icon={Underline} label="Underline links" />
            <Toggle on={prefs.motion} onClick={() => update({ motion: !prefs.motion })} icon={Sparkles} label="Reduce motion" />
          </div>

          <button onClick={reset} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink hover:bg-purple-050">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      )}
    </>
  );
}
