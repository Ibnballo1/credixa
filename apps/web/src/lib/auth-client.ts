/**
 * File: apps/web/src/lib/auth-client.ts
 * Purpose: Browser-side Better Auth client instance for Next.js Client Components.
 */

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [adminClient()],
});

export const { useSession, signOut, signIn, signUp, admin } = authClient;
