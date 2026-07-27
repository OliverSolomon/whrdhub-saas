import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { Composer } from "@/components/composer";

export const metadata = { title: "Share something — WHRD Hub" };

export default async function ComposePage() {
  const user = await getCurrentUser();

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-black text-ink mb-1">Share something</h1>
      <p className="text-sm text-muted mb-6">
        Post a quick update, or write a longer story. The Hub reviews everything before it reaches the public feed.
      </p>
      <Composer isHub={!!user?.profile?.is_hub_admin} />
    </div>
  );
}
