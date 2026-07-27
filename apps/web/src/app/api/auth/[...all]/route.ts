/**
 * File: apps/web/src/app/api/auth/[...all]/route.ts
 * Purpose: Catch-all route handler that delegates every /api/auth/* request
 *          (sign-up, sign-in, sign-out, session, admin endpoints) to Better
 *          Auth. This file should never contain logic — all auth behavior
 *          is configured in packages/auth/src/auth.ts.
 */
import { auth } from "@credixa/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
