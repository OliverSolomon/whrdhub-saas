import type { LucideIcon } from "lucide-react";

export interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** small caption under the value, e.g. "+30.8% This month" */
  caption?: string;
  captionTone?: "up" | "down" | "flat";
  /** soft icon chip classes, e.g. "bg-purple-050 text-purple" */
  tint?: string;
}

/**
 * A single combined stats strip (not separate cards). One rounded surface with
 * the figures laid out inline and separated by hairlines — the cleaner, calmer
 * treatment from the reference "Cedants Management" header.
 */
export function StatBar({ items }: { items: StatItem[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line">
        {items.map(({ label, value, icon: Icon, caption, captionTone = "flat", tint = "bg-purple-050 text-purple" }, i) => (
          <div key={i} className="flex items-start gap-3 px-0 sm:px-5 first:sm:pl-0 py-3 sm:py-0">
            <span className={`w-10 h-10 rounded-2xl grid place-items-center shrink-0 ${tint}`}><Icon className="w-5 h-5" /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted truncate">{label}</p>
              <p className="text-2xl font-black text-ink leading-tight">{value}</p>
              {caption && (
                <p className="text-xs truncate">
                  <span className={captionTone === "up" ? "text-emerald-600 font-bold" : captionTone === "down" ? "text-rose-500 font-bold" : "text-muted"}>{caption}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
