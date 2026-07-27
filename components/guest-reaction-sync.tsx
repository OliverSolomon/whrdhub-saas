"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getGuestLikes, clearGuestLikes } from "@/lib/guest-reactions";
import { flushGuestReactions } from "@/app/actions/reactions";

/**
 * After a visitor signs in, save any support they gave while signed out (stored
 * locally) to the database, then clear the local store. Also listens for auth
 * state changes so it fires right after sign in.
 */
export function GuestReactionSync() {
  useEffect(() => {
    const supabase = createClient();

    const flush = async () => {
      const ids = getGuestLikes();
      if (!ids.length) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const res = await flushGuestReactions(ids);
      if (res.saved > 0) clearGuestLikes();
    };

    // Run once on mount (covers the case where the user is already signed in).
    void flush();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void flush();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}
