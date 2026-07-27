"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Published" },
  { id: "rejected", label: "Declined" },
  { id: "all", label: "All" },
] as const;

/** Status filter for the Hub Posts / Stories pages. Drives ?status= on the URL. */
export function ContentTabs({ active, counts }: { active: string; counts?: Partial<Record<string, number>> }) {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 rounded-xl border border-line bg-paper p-1 w-fit overflow-x-auto">
      {TABS.map((t) => {
        const on = active === t.id;
        const n = counts?.[t.id];
        return (
          <Link
            key={t.id}
            href={t.id === "pending" ? pathname : `${pathname}?status=${t.id}`}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-1.5",
              on ? "bg-purple text-white" : "text-ink/70 hover:bg-purple-050",
            )}
          >
            {t.label}
            {typeof n === "number" && (
              <span className={cn("text-[11px] font-bold rounded-full px-1.5", on ? "bg-white/25" : "bg-purple-050 text-purple-700")}>{n}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
