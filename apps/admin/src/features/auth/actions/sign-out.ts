// File: apps/admin/src/features/auth/actions/sign-out.ts
// Purpose: Server Action to end the current admin session.

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@credixa/auth";

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/sign-in");
}
