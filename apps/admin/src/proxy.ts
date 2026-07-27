/**
 * File: apps/admin/src/proxy.ts
 * Purpose: Optimistic route protection for the admin app. Same caveat as
 *          apps/web/src/proxy.ts — this only checks for a session cookie,
 *          it does NOT verify the session or the user's role. The
 *          authoritative check (session validity AND role === "admin")
 *          happens in src/app/(admin)/dashboard/layout.tsx via
 *          requireRole("admin").
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
  matcher: ["/dashboard/:path*"],
};
