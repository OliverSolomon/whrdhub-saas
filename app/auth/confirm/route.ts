import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Links in emails sent before the move to Neon Auth point here. Those links
 * were issued by the old sign-in service and can no longer be honoured, so the
 * person is sent somewhere useful instead of to an error.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  if (searchParams.get("type") === "recovery") {
    return NextResponse.redirect(`${origin}/forgot-password`);
  }
  return NextResponse.redirect(`${origin}/login`);
}
