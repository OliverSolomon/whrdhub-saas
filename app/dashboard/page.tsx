import { redirect } from "next/navigation";
import Link from "next/link";
import { PenLine, Building2, Users, Heart, FileText, BookOpen, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Avatar } from "@/components/ui/field";
import { SignOutButton } from "@/components/sign-out-button";
import { timeAgo } from "@/lib/utils";
import { CONTENT_STATUS_META, VERIF_STATUS_META } from "@/lib/data";

const LOGO = "https://whrdhub.org/wp-content/uploads/2025/05/imageedit_10_2063970092-600x198.png";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  if (!user.profile?.hub_onboarded) redirect("/onboarding");

  const supabase = await createClient();

  const [{ data: posts }, { data: blogs }, { data: matches }] = await Promise.all([
    supabase.from("posts").select("id, body, status, created_at").eq("author_id", user.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("blogs").select("id, title, slug, status, created_at").eq("author_id", user.id).order("created_at", { ascending: false }).limit(10),
    supabase
      .from("mentorship_matches")
      .select("id, mentor_id, mentee_id, score, overlap, status")
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
      .order("score", { ascending: false })
      .limit(6),
  ]);

  const org = user.membership?.organizations;
  const name = user.profile?.full_name || user.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={LOGO} alt="WHRD Hub" className="h-8 w-auto" /></Link>
          <div className="flex items-center gap-3">
            {user.profile?.is_hub_admin && <Button href="/hub" variant="ghost" size="sm"><ShieldCheck className="w-4 h-4" /> Hub console</Button>}
            <Button href="/mentorship" variant="ghost" size="sm">Femtorship</Button>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Greeting */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-ink">Karibu, {name}</h1>
            <p className="text-sm text-muted mt-1">Share your work, follow your submissions, and grow through femtorship.</p>
          </div>
          <Button href="/dashboard/compose"><PenLine className="w-4 h-4" /> Share something</Button>
        </div>

        {/* Org + quick stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold uppercase"><Building2 className="w-4 h-4" /> Organisation</div>
            {org ? (
              <>
                <p className="mt-2 font-bold text-ink">{org.name}</p>
                <div className="mt-1">
                  <Pill tone={VERIF_STATUS_META[org.verification_status]?.tone ?? "slate"}>
                    {VERIF_STATUS_META[org.verification_status]?.label ?? org.verification_status}
                  </Pill>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Not in an organisation yet. <Link href="/onboarding" className="text-purple font-semibold">Join one</Link>.</p>
            )}
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold uppercase"><FileText className="w-4 h-4" /> Updates</div>
            <p className="mt-2 text-2xl font-black text-ink">{posts?.length ?? 0}</p>
            <p className="text-xs text-muted">posts submitted</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold uppercase"><Heart className="w-4 h-4" /> Femtorship</div>
            <p className="mt-2 text-2xl font-black text-ink">{matches?.length ?? 0}</p>
            <p className="text-xs text-muted">suggested matches</p>
          </div>
        </div>

        {/* Submissions */}
        <section>
          <h2 className="text-lg font-black text-ink mb-3">Your submissions</h2>
          {(!posts?.length && !blogs?.length) ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
              <p className="text-sm text-muted">Nothing yet. Share your first update or story.</p>
              <Button href="/dashboard/compose" size="sm" className="mt-3">Get started</Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {blogs?.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5">
                  <BookOpen className="w-4 h-4 text-purple shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-ink truncate">{b.title}</p>
                    <p className="text-xs text-muted">Story · {timeAgo(b.created_at)}</p>
                  </div>
                  <Pill tone={CONTENT_STATUS_META[b.status]?.tone ?? "slate"}>{CONTENT_STATUS_META[b.status]?.label ?? b.status}</Pill>
                </div>
              ))}
              {posts?.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5">
                  <FileText className="w-4 h-4 text-cyan-700 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink truncate">{p.body}</p>
                    <p className="text-xs text-muted">Post · {timeAgo(p.created_at)}</p>
                  </div>
                  <Pill tone={CONTENT_STATUS_META[p.status]?.tone ?? "slate"}>{CONTENT_STATUS_META[p.status]?.label ?? p.status}</Pill>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Matches preview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-ink">Your femtorship matches</h2>
            <Link href="/mentorship" className="text-sm text-purple font-semibold">View all</Link>
          </div>
          {!matches?.length ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted flex flex-col items-center gap-2">
              <Users className="w-6 h-6 text-purple" />
              No matches yet. As more defenders join and the Hub runs matching, suggestions appear here.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {matches.map((m) => {
                const iAmMentor = m.mentor_id === user.id;
                return (
                  <div key={m.id} className="rounded-xl border border-line bg-surface p-4 flex items-start gap-3">
                    <Avatar name="WHRD" size={40} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{iAmMentor ? "You could femtor a defender" : "A femtor could support you"}</p>
                      {(m.overlap as string[])?.length > 0 && (
                        <p className="text-xs text-muted mt-0.5">On: {(m.overlap as string[]).join(", ")}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
