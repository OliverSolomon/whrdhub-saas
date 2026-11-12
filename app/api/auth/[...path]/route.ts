import { auth } from "@/lib/auth/server";

// Everything the browser asks of Neon Auth goes through here, so the session
// cookie stays on this site's own domain.
//
// Each method is exported as a function rather than destructured at load time,
// so importing this route during a build does not need the sign-in secret.
type Ctx = { params: Promise<{ path: string[] }> };

export function GET(request: Request, ctx: Ctx) {
  return auth.handler().GET(request, ctx);
}
export function POST(request: Request, ctx: Ctx) {
  return auth.handler().POST(request, ctx);
}
export function PUT(request: Request, ctx: Ctx) {
  return auth.handler().PUT(request, ctx);
}
export function DELETE(request: Request, ctx: Ctx) {
  return auth.handler().DELETE(request, ctx);
}
export function PATCH(request: Request, ctx: Ctx) {
  return auth.handler().PATCH(request, ctx);
}
