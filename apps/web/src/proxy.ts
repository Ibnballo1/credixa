/**
 * File: apps/web/src/proxy.ts
 * Purpose: Optimistic route protection. Next.js 16 renamed the
 *          middleware.ts convention to proxy.ts (exported function `proxy`
 *          instead of `middleware`) — same runtime behavior, new name.
 *          Per Better Auth's own guidance, `getSessionCookie` only checks
 *          that a session cookie is present — it does NOT validate the
 *          session against the database, and this file must not be
 *          treated as the authoritative auth check. The real check is
 *          `requireAuth()` / `requireRole()` from @credixa/auth, called at
 *          the top of every protected page/action.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
