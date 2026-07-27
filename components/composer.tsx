"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PenLine, BookOpen, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { createPost, createBlog } from "@/app/actions/content";

export function Composer({ isHub = false }: { isHub?: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<"post" | "blog">("post");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // post
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  // blog
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [blogBody, setBlogBody] = useState("");
  const [cover, setCover] = useState("");

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res =
      tab === "post"
        ? await createPost(body, imageUrl ? [imageUrl] : [])
        : await createBlog({ title, excerpt, body: blogBody, cover_image_url: cover || undefined });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setDone(true);
    setBody("");
    setImageUrl("");
    setTitle("");
    setExcerpt("");
    setBlogBody("");
    setCover("");
    router.refresh();
  };

  return (
    <div className="bg-surface rounded-2xl border border-line p-5">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setTab("post"); setDone(false); }}
          className={cn("inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold", tab === "post" ? "bg-purple text-white" : "text-muted hover:bg-purple-050")}
        >
          <PenLine className="w-4 h-4" /> Quick post
        </button>
        <button
          onClick={() => { setTab("blog"); setDone(false); }}
          className={cn("inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold", tab === "blog" ? "bg-purple text-white" : "text-muted hover:bg-purple-050")}
        >
          <BookOpen className="w-4 h-4" /> Write a story
        </button>
      </div>

      {done ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
          {isHub
            ? "Published. It is live on the feed now."
            : "Sent to the Hub for review. You will see it on the feed once it is approved."}
        </div>
      ) : tab === "post" ? (
        <div className="space-y-3">
          <Textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share an update from your work or community..."
          />
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The headline of your story" />
          </div>
          <div>
            <Label>Short summary</Label>
            <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="One line that appears in the feed (optional)" />
          </div>
          <div>
            <Label>Cover image URL <span className="text-muted font-normal">(optional)</span></Label>
            <Input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Your story</Label>
            <Textarea rows={10} value={blogBody} onChange={(e) => setBlogBody(e.target.value)} placeholder="Write freely. Leave a blank line between paragraphs." />
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {!done && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted">
            {isHub ? "Posting as the Hub. Goes live immediately." : "Reviewed by the Hub before it goes public."}
          </p>
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> {isHub ? "Publish" : "Submit"}</>}
          </Button>
        </div>
      )}
    </div>
  );
}
