import { Inbox, type LucideIcon } from "lucide-react";

/**
 * Friendly empty state for tables and panels: a soft icon chip, a heading, and
 * a short explanation. Calm, comfortable radius, plenty of breathing room.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  subtitle,
  action,
  className = "",
}: {
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-14 ${className}`}>
      <span className="w-14 h-14 rounded-2xl bg-purple-050 text-purple grid place-items-center">
        <Icon className="w-7 h-7" />
      </span>
      <p className="mt-4 font-bold text-ink">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-muted max-w-sm">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
