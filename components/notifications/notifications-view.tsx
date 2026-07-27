"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, CheckCircle2, XCircle, Inbox } from "lucide-react";
import { markAllRead } from "@/app/actions/notifications";
import { timeAgo, cn } from "@/lib/utils";

export interface Notif {
  id: string; type: string; title: string; body: string | null; link: string | null; read: boolean; created_at: string;
}

const ICON: Record<string, typeof Bell> = {
  content_published: CheckCircle2,
  content_declined: XCircle,
  content_submitted: Inbox,
};

export function NotificationsView({ notifications }: { notifications: Notif[] }) {
  const router = useRouter();
  const unread = notifications.filter((n) => !n.read).length;

  const markRead = async () => { await markAllRead(); router.refresh(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-black text-ink flex items-center gap-2"><Bell className="w-6 h-6 text-purple" /> Notifications</h1>
        {unread > 0 && (
          <button onClick={markRead} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 h-10 text-sm font-bold text-ink hover:bg-purple-050">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Bell className="w-8 h-8 text-purple mx-auto" />
          <p className="mt-3 font-semibold text-ink">You&apos;re all caught up</p>
          <p className="text-sm text-muted">Notifications about your content and matches will appear here.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
          {notifications.map((n) => {
            const Icon = ICON[n.type] ?? Bell;
            const inner = (
              <div className={cn("flex items-start gap-3 p-4", !n.read && "bg-purple-050/40")}>
                <span className={cn("w-9 h-9 rounded-full grid place-items-center shrink-0", n.type === "content_declined" ? "bg-rose-50 text-rose-600" : n.type === "content_published" ? "bg-emerald-50 text-emerald-600" : "bg-purple-050 text-purple")}>
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{n.title}</p>
                  {n.body && <p className="text-sm text-muted">{n.body}</p>}
                  <p className="text-xs text-muted mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-magenta shrink-0 mt-2" />}
              </div>
            );
            return n.link ? <Link key={n.id} href={n.link} className="block hover:bg-paper transition-colors">{inner}</Link> : <div key={n.id}>{inner}</div>;
          })}
        </div>
      )}
    </div>
  );
}
