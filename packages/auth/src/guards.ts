// File: packages/auth/src/guards.ts
// Purpose: The ONLY place session/role checks should be implemented.
//          Server actions and route handlers call these instead of
//          re-implementing "is this user logged in / do they have role X"
//          inline — keeps authorization logic consistent and auditable in
//          one file.

import { headers } from "next/headers";
import { auth, type Session } from "./auth";
import type { CredixaRole } from "@credixa/types";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to perform this action") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Returns the current session, or null if the request is unauthenticated. */
export async function getCurrentSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

/** Throws UnauthorizedError if there is no active session. */
export async function requireAuth(): Promise<Session> {
  const session = await getCurrentSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

/**
 * Throws UnauthorizedError if unauthenticated, ForbiddenError if the
 * user's role isn't one of `allowedRoles`.
 *
 * Usage: `const session = await requireRole("admin");`
 */
export async function requireRole(
  ...allowedRoles: CredixaRole[]
): Promise<Session> {
  const session = await requireAuth();
  const currentRole = session.user.role as CredixaRole | null | undefined;

  if (!currentRole || !allowedRoles.includes(currentRole)) {
    throw new ForbiddenError(`Requires role: ${allowedRoles.join(" or ")}`);
  }

  return session;
}
