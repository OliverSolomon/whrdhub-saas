import { auth } from "@/lib/auth/server";

// Everything the browser asks of Neon Auth goes through here, so the session
// cookie stays on this site's own domain.
export const { GET, POST, PUT, DELETE, PATCH } = auth.handler();
