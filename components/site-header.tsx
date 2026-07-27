import { PublicNav } from "@/components/public-nav";
import { getCurrentUser } from "@/lib/current-user";

/** Server wrapper that resolves auth state and renders the public nav. */
export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <PublicNav signedIn={!!user} isHubAdmin={!!user?.profile?.is_hub_admin} />
  );
}
