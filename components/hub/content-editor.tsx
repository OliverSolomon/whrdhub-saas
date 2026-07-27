"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Check, X, Pin, Eye, Pencil, Youtube } from "lucide-react";
import { Input, Label } from "@/components/ui/field";
import { RichEditor } from "@/components/composer/rich-editor";
import { MediaUploader, type MediaItem } from "@/components/composer/media-uploader";
import { MediaBlock } from "@/components/feed/media-block";
import { cn } from "@/lib/utils";
import { editContent, reviewContent, togglePin } from "@/app/actions/content";

interface Props {
  kind: "post" | "blog";
  id: string;
  status: string;
  pinned: boolean;
  initial: { title?: string; excerpt?: string; body: string; cover?: string | null };
  media?: MediaItem[];
}

/**
 * Edit-then-publish surface for a single post or story. Blogs use the WYSIWYG
 * editor (HTML); posts use a plain textarea. Switch to Preview to see it exactly
 * as the feed will render it. Works on drafts, pending items, and already-live
 * content.
 */
export function ContentEditor({ kind, id, status, pinned, initial, media = [] }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [title, setTitle] = useState(initial.title ?? "");
  const [excerpt, setExcerpt] = useState(initial.excerpt ?? "");
  const [body, setBody] = useState(initial.body ?? "");
  const [cover, setCover] = useState<MediaItem[]>(initial.cover ? [{ type: "image", url: initial.cover, name: "cover" }] : []);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(pinned);
  const [showReject, setShowReject] = useState(false);
  const [notes, setNotes] = useState("");

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(null), 2500); };

  const save = async () => {
    setBusy("save"); setError(null);
    const res = await editContent(kind, id, kind === "post"
      ? { body }
      : { title, excerpt, body, cover_image_url: cover[0]?.url ?? null });
    setBusy(null);
    if (res?.error) { setError(res.error); return; }
    flash("Saved."); router.refresh();
  };

  const publish = async () => {
    setBusy("publish"); setError(null);
    // Save edits first so we publish the latest version.
    const e = await editContent(kind, id, kind === "post" ? { body } : { title, excerpt, body, cover_image_url: cover[0]?.url ?? null });
    if (e?.error) { setBusy(null); setError(e.error); return; }
    const res = await reviewContent(kind, id, "approved");
    setBusy(null);
    if (res?.error) { setError(res.error); return; }
    router.push(kind === "post" ? "/hub/posts" : "/hub/blogs");
    router.refresh();
  };

  const decline = async () => {
    setBusy("decline"); setError(null);
    const res = await reviewContent(kind, id, "rejected", notes);
    setBusy(null);
    if (res?.error) { setError(res.error); return; }
    router.push(kind === "post" ? "/hub/posts" : "/hub/blogs");
    router.refresh();
  };

  const pin = async () => {
    setBusy("pin"); setError(null);
    const res = await togglePin(kind, id, !isPinned);
    setBusy(null);
    if (res?.error) { setError(res.error); return; }
    setIsPinned((v) => !v); flash(isPinned ? "Unpinned." : "Pinned to top.");
  };

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex gap-1 rounded-xl border border-line bg-paper p-1 w-fit">
        {(["edit", "preview"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={cn("flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold capitalize transition-colors", view === v ? "bg-purple text-white" : "text-ink/70 hover:bg-purple-050")}>
            {v === "edit" ? <Pencil className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {v}
          </button>
        ))}
      </div>

      {view === "edit" ? (
        <div className="space-y-4">
          {kind === "blog" && (
            <>
              <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Story title" /></div>
              <div><Label>Summary</Label><Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="One line shown in the feed" /></div>
              <div><Label>Cover image</Label><MediaUploader value={cover} onChange={(v) => setCover(v.slice(-1))} /></div>
              <div><Label>Story</Label><RichEditor value={body} onChange={setBody} placeholder="Edit the story with the toolbar for headings, quotes, lists, and links." /></div>
            </>
          )}
          {kind === "post" && (
            <div>
              <Label>Post text</Label>
              <textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/30 resize-y" />
              {media.length > 0 && <p className="text-xs text-muted mt-2 flex items-center gap-1"><Youtube className="w-3.5 h-3.5" /> Attached media is shown in Preview and cannot be changed here.</p>}
            </div>
          )}
        </div>
      ) : (
        <article className="rounded-2xl border border-line bg-surface p-6">
          {kind === "blog" ? (
            <>
              {cover[0]?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover[0].url} alt="" className="w-full max-h-72 object-cover rounded-xl border border-line mb-4" />
              )}
              <h1 className="text-2xl font-black text-ink">{title || "Untitled story"}</h1>
              {excerpt && <p className="text-muted mt-1">{excerpt}</p>}
              <div className="blog-content mt-4" dangerouslySetInnerHTML={{ __html: body || "<p class='text-muted'>Nothing to preview yet.</p>" }} />
            </>
          ) : (
            <>
              <p className="text-[15px] text-ink whitespace-pre-wrap">{body || "Nothing to preview yet."}</p>
              <MediaBlock media={media} />
            </>
          )}
        </article>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {msg && <p className="text-sm text-emerald-700 font-semibold">{msg}</p>}

      {/* Actions */}
      {showReject ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-2">
          <Label>Reason for declining (shared with the author)</Label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30" />
          <div className="flex gap-2">
            <button onClick={decline} disabled={busy !== null} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 text-white px-4 h-10 text-sm font-bold disabled:opacity-50">
              {busy === "decline" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Confirm decline
            </button>
            <button onClick={() => setShowReject(false)} className="rounded-lg border border-line px-4 h-10 text-sm font-semibold">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button onClick={save} disabled={busy !== null} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 h-11 text-sm font-bold text-ink hover:bg-purple-050 disabled:opacity-50">
            {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
          </button>
          {status !== "approved" && (
            <button onClick={publish} disabled={busy !== null} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-5 h-11 text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">
              {busy === "publish" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {status === "rejected" ? "Publish" : "Approve & publish"}
            </button>
          )}
          <button onClick={pin} disabled={busy !== null} className={cn("inline-flex items-center gap-1.5 rounded-xl border px-4 h-11 text-sm font-bold disabled:opacity-50", isPinned ? "border-purple text-purple bg-purple-050" : "border-line text-ink hover:bg-purple-050")}>
            {busy === "pin" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pin className="w-4 h-4" />} {isPinned ? "Unpin" : "Pin"}
          </button>
          {status !== "rejected" && (
            <button onClick={() => setShowReject(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 h-11 text-sm font-bold text-ink hover:bg-rose-50">
              <X className="w-4 h-4" /> {status === "approved" ? "Take down" : "Decline"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
