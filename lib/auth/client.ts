"use client";

import { createAuthClient } from "@neon/auth/next";

/** Neon Auth in the browser. Talks to this site's own /api/auth, never to Neon directly. */
export const authClient = createAuthClient();
