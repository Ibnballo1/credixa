// File: apps/admin/src/lib/auth-client.ts
// Purpose: Browser-side Better Auth client for the admin app. Used only in
//          Client Components. Sign-in itself goes through a Server Action
//          (see features/auth/actions/sign-in.ts) for the same reason as
//          apps/web — server-side validation before Better Auth runs.

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_ADMIN_URL,
  plugins: [adminClient()],
});

export const { useSession, signOut } = authClient;
