// File: packages/auth/src/index.ts
// Purpose: Public entry point for @credixa/auth.

export { auth } from "./auth";
export type { Session } from "./auth";
export {
  getCurrentSession,
  requireAuth,
  requireRole,
  UnauthorizedError,
  ForbiddenError,
} from "./guards";
