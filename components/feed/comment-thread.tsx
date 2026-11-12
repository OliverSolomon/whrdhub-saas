"use client";

import { useState, useTransition } from "react";
import { Send, Trash2, Loader2, CornerDownRight, X } from "lucide-react";
import { Avatar } from "@/components/ui/field";
import { timeAgo } from "@/lib/utils";
import { addComment } from "@/app/actions/comments";
import { deleteOwnContent, adminSoftDelete } from "@/app/actions/lifecycle";
import { toast } from "@/components/ui/toast";
import { promptSignIn } from "@/lib/guest-reactions";
import type { FeedComment } from "@/lib/feed";

/**
 * Comments under a feed post, with replies one level deep.
 *
 * Commenting needs an account, unlike supporting a post. New comments appear
 * immediately and are reconciled with the server id when the action returns,
 * so the thread never feels laggy on a slow connection.
 */
export function CommentThread({
  postId,
  initial,
  signedIn,
  isHubAdmin = false,
  onCountChange,
}: {
  postId: string;
  initial: FeedComment[];
  signedIn: boolean;
  isHubAdmin?: boolean;
  onCountChange?: (n: number) => void;
}) {
  const [comments, setComments] = useState<FeedComment[]>(initial);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [pending, startTransition] = useTransition();

  // Replies sit under the comment they answer; a reply to a reply stays under the same comment.
  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  const update = (next: FeedComment[]) => {
    setComments(next);
    onCountChange?.(next.length);
  };

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    if (!signedIn) {
      promptSignIn("comment");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const parentId = replyTo ? (replyTo.parent_id ?? replyTo.id) : null;
    const optimistic: FeedComment = {
      id: tempId,
      body,
      author: { id: null, name: "You", title: null, avatar_url: null },
      created_at: new Date().toISOString(),
      mine: true,
      parent_id: parentId,
    };
    update([...comments, optimistic]);
    setDraft("");
    const answering = replyTo;
    setReplyTo(null);

    startTransition(async () => {
      const res = await addComment(postId, body, replyTo?.id);
      if (res?.error) {
        // Roll the optimistic comment back out and hand the text back so the
        // person does not lose what they wrote.
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        setDraft(body);
        setReplyTo(answering);
        toast.error(res.error);
        return;
      }
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? { ...c, id: res.id ?? c.id } : c)),
      );
    });
  };

  const remove = (c: FeedComment) => {
    const before = comments;
    // Taking a comment away takes its replies with it.
    update(comments.filter((x) => x.id !== c.id && x.parent_id !== c.id));
    startTransition(async () => {
      const res = c.mine
        ? await deleteOwnContent("comment", c.id)
        : await adminSoftDelete("comment", c.id);
      if (res?.error) {
        update(before);
        toast.error(res.error);
      }
    });
  };

  const CommentRow = ({ c }: { c: FeedComment }) => (
    <div className="flex items-start gap-2">
      <Avatar name={c.author.name} src={c.author.avatar_url} size={c.parent_id ? 26 : 32} />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-surface px-3 py-2">
          <p className="text-[13px] font-semibold text-ink">{c.author.name}</p>
          <p className="whitespace-pre-wrap text-sm leading-snug text-ink/90">{c.body}</p>
        </div>
        <p className="mt-1 flex items-center gap-3 px-3 text-[11px] text-muted">
          <span>{timeAgo(c.created_at)}</span>
          {!c.id.startsWith("temp-") && (
            <button
              onClick={() => (signedIn ? setReplyTo(c) : promptSignIn("comment"))}
              className="inline-flex items-center gap-1 font-semibold hover:text-purple hover:underline"
            >
              <CornerDownRight className="h-3 w-3" /> Reply
            </button>
          )}
          {(c.mine || isHubAdmin) && (
            <button
              onClick={() => remove(c)}
              className="inline-flex items-center gap-1 font-semibold hover:text-rose-600 hover:underline"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
        </p>
      </div>
    </div>
  );

  return (
    <div className="border-t border-line bg-paper/60 px-3 py-3">
      {comments.length === 0 && (
        <p className="px-1 pb-2 text-xs text-muted">
          No comments yet. Be the first to say something.
        </p>
      )}

      <ul className="space-y-2.5">
        {topLevel.map((c) => (
          <li key={c.id}>
            <CommentRow c={c} />
            {repliesOf(c.id).length > 0 && (
              <ul className="ml-10 mt-2 space-y-2.5 border-l border-line pl-3">
                {repliesOf(c.id).map((r) => (
                  <li key={r.id}><CommentRow c={r} /></li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {replyTo && (
        <p className="mt-3 flex items-center gap-2 px-1 text-xs text-muted">
          <CornerDownRight className="h-3.5 w-3.5" />
          <span className="min-w-0 flex-1 truncate">Replying to <strong className="text-ink">{replyTo.author.name}</strong></span>
          <button onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="rounded-full p-1 hover:bg-purple-050">
            <X className="h-3.5 w-3.5" />
          </button>
        </p>
      )}
      <div className={`${replyTo ? "mt-1.5" : "mt-3"} flex items-start gap-2`}>
        <Avatar name="You" size={32} />
        <div className="relative flex-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={signedIn ? (replyTo ? "Write a reply…" : "Write a comment…") : "Sign in to comment"}
            aria-label={replyTo ? "Write a reply" : "Write a comment"}
            className="w-full resize-none rounded-2xl border border-line bg-surface py-2.5 pl-3.5 pr-11 text-sm text-ink placeholder:text-muted focus:border-purple/40 focus:outline-none focus:ring-2 focus:ring-purple/30"
          />
          <button
            onClick={submit}
            disabled={pending || !draft.trim()}
            aria-label="Post comment"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-purple transition-colors hover:bg-purple-050 disabled:opacity-40"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>

    </div>
  );
}
