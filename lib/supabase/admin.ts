import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS. Server-only — never import in a client
 * component or expose the key to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
