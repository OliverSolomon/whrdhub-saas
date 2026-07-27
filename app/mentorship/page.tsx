import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Sparkles, HandHeart } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { Pill } from "@/components/ui/pill";
import { MatchActions, RunMatching } from "@/components/mentorship/match-actions";

export const metadata = { title: "Femtorship — WHRD Hub" };

export default async function MentorshipPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mentorship");
  if (!user.profile?.hub_onboarded) redirect("/onboarding");

  const supabase = await createClient();
  const { data: matches } = await supabase
    .from("mentorship_matches")
    .select("id, mentor_id, mentee_id, overlap, score, status")
    .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
    .order("score", { ascending: false });

  const list = matches ?? [];
  const asMentor = list.filter((m) => m.mentor_id === user.id);
  const asMentee = list.filter((m) => m.mentee_id === user.id);

  const Card = ({ m, role }: { m: (typeof list)[number]; role: "mentor" | "mentee" }) => (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">
            {role === "mentor" ? "A defender you could femtor" : "A femtor who could support you"}
          </p>
          <p className="text-xs text-muted mt-0.5">
            Identities stay private until you both accept.
          </p>
        </div>
        <Pill tone={m.status === "accepted" ? "green" : m.status === "declined" ? "slate" : "purple"}>
          {m.status === "accepted" ? "Accepted" : m.status === "declined" ? "Passed" : "Suggested"}
        </Pill>
      </div>
      {(m.overlap as string[])?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(m.overlap as string[]).map((o) => (
            <span key={o} className="rounded-full bg-purple-050 text-purple text-xs font-medium px-2.5 py-0.5">{o}</span>
          ))}
        </div>
      )}
      {m.status === "suggested" && (
        <div className="mt-4">
          <MatchActions matchId={m.id} />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-ink flex items-center gap-2">
              <Heart className="w-6 h-6 text-magenta" /> Femtorship
            </h1>
            <p className="text-sm text-muted mt-1 max-w-2xl">
              We pair defenders by what one needs and what another can offer. You can be a femtor and
              a femtee at the same time.
            </p>
          </div>
          {user.profile?.is_hub_admin && <RunMatching />}
        </div>

        {list.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
            <Sparkles className="w-8 h-8 text-purple mx-auto" />
            <p className="mt-3 font-semibold text-ink">No matches yet</p>
            <p className="text-sm text-muted mt-1 max-w-md mx-auto">
              As more defenders complete their femtorship profile, the Hub runs matching and your
              suggestions appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-magenta mb-3 flex items-center gap-1.5">
                <HandHeart className="w-4 h-4" /> Where you could give ({asMentor.length})
              </h2>
              <div className="space-y-3">
                {asMentor.length ? asMentor.map((m) => <Card key={m.id} m={m} role="mentor" />) : (
                  <p className="text-sm text-muted">No femtee suggestions yet.</p>
                )}
              </div>
            </section>
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-purple mb-3 flex items-center gap-1.5">
                <Heart className="w-4 h-4" /> Where you could grow ({asMentee.length})
              </h2>
              <div className="space-y-3">
                {asMentee.length ? asMentee.map((m) => <Card key={m.id} m={m} role="mentee" />) : (
                  <p className="text-sm text-muted">No femtor suggestions yet.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
