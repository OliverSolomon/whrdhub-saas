import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request and gates the
 * authenticated areas. Public marketing + blog + auth routes stay open.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const hasEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!hasEnv) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Decode the JWT locally (no network round-trip, avoids RSC re-render loops).
  // RLS is the real security boundary; this only drives UI-level redirects.
  const { data: { session } } = await supabase.auth.getSession();

  const publicPaths = [
    "/", "/login", "/signup", "/auth", "/feed",
    "/blog", "/about", "/our-work", "/organizations", "/counties", "/contact",
    "/partners", "/activity-images", "/press", "/resources", "/newsletter", "/opportunities",
  ];
  const path = request.nextUrl.pathname;
  const isPublic = publicPaths.some((p) => path === p || path.startsWith(p + "/"));

  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}
