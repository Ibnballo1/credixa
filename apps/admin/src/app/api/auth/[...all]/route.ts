/**
 * File: apps/admin/src/app/api/auth/[...all]/route.ts
 * Purpose: Delegates every /api/auth/* request to the SAME Better Auth
 *          instance used by apps/web (@credixa/auth) — one source of
 *          truth for sessions across both apps. No logic here.
 */
import { auth } from "@credixa/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
