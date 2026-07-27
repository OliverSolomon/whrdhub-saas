import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/hub/empty-state";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** CSS grid track for this column, e.g. "1fr", "180px". Default "1fr". */
  width?: string;
  className?: string;
}

/**
 * Shared admin table, modelled on the reference dashboards. Server component:
 * column `cell` renderers run on the server, so rows can hold links, pills,
 * avatars, and small client controls. Grid tracks are set with an inline style
 * (Tailwind can't JIT dynamic arbitrary values), and the whole thing scrolls
 * horizontally on small screens like a real data table.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  chevron = true,
  minWidth = 680,
  emptyIcon,
  emptyTitle = "Nothing here yet",
  emptySubtitle,
  emptyAction,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string | undefined;
  chevron?: boolean;
  minWidth?: number;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: ReactNode;
}) {
  const gridTemplateColumns = [
    ...columns.map((c) => c.width ?? "1fr"),
    chevron ? "28px" : null,
  ].filter(Boolean).join(" ");

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState icon={emptyIcon} title={emptyTitle} subtitle={emptySubtitle} action={emptyAction} />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>
          {/* Header */}
          <div className="grid gap-3 px-5 py-3.5 border-b border-line bg-paper/50 text-xs font-bold uppercase tracking-wide text-muted" style={{ gridTemplateColumns }}>
            {columns.map((c) => <span key={c.key} className={c.className}>{c.header}</span>)}
            {chevron && <span />}
          </div>
          {/* Rows */}
          <div className="divide-y divide-line">
            {rows.map((row) => {
              const href = rowHref?.(row);
              const cells = (
                <>
                  {columns.map((c) => (
                    <div key={c.key} className={cn("min-w-0 flex items-center", c.className)}>{c.cell(row)}</div>
                  ))}
                  {chevron && <ChevronRight className="w-4 h-4 text-muted justify-self-end self-center" />}
                </>
              );
              const base = "grid gap-3 px-5 py-4 items-center";
              return href ? (
                <Link key={rowKey(row)} href={href} className={cn(base, "hover:bg-purple-050/40 transition-colors")} style={{ gridTemplateColumns }}>
                  {cells}
                </Link>
              ) : (
                <div key={rowKey(row)} className={base} style={{ gridTemplateColumns }}>{cells}</div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
