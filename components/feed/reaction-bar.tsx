"use client";

import { Heart, MessageCircle } from "lucide-react";
import { useReaction } from "@/lib/use-reaction";
import { promptSignIn } from "@/lib/guest-reactions";
import { cn } from "@/lib/utils";

/**
 * Engagement bar for a post. Signed-out visitors can support a few posts (saved
 * locally); exceeding the limit prompts sign in. Their support syncs to the
 * database once they sign in.
 */
export function ReactionBar({
  postId,
  signedIn,
  initialCount,
  initialReacted,
}: {
  postId: string;
  signedIn: boolean;
  initialCount: number;
  initialReacted: boolean;
}) {
  const { count, reacted, react } = useReaction({ postId, signedIn, initialCount, initialReacted });

  return (
    <div className="mt-3 pt-3 border-t border-line flex items-center gap-1">
      <button
        onClick={() => react()}
        aria-pressed={reacted}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
          reacted ? "bg-magenta-050 text-magenta-700" : "text-ink/70 hover:bg-purple-050 hover:text-purple-700",
        )}
      >
        <Heart className={cn("w-4 h-4", reacted && "fill-current")} />
        Support
        {count > 0 && <span className="tabular-nums">· {count}</span>}
      </button>

      <button
        onClick={() => promptSignIn()}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-ink/70 hover:bg-purple-050 hover:text-purple-700 transition-colors"
        title="Sign in to join the conversation"
      >
        <MessageCircle className="w-4 h-4" /> Comment
      </button>
    </div>
  );
}
