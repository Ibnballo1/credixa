// File: apps/admin/src/features/auth/actions/sign-in.ts
// Purpose: Server Action for admin sign-in. Better Auth itself has no
//          concept of "this is the admin app" — a valid customer or agent
//          credential would otherwise authenticate successfully here too.
//          This action explicitly enforces that only `role === "admin"`
//          may hold a session in this app, signing the user back out
//          immediately if not.

// File: apps/admin/src/features/auth/actions/sign-in.ts
// Purpose: Server Action for admin sign-in with role validation.

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@credixa/auth";
import { signInSchema, type SignInInput } from "../schemas/sign-in-schema";

export type SignInActionResult =
  | { success: true }
  | { success: false; error: string };

export async function signInAction(
  input: SignInInput,
): Promise<SignInActionResult> {
  const parsed = signInSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Enter a valid email and password" };
  }

  const reqHeaders = await headers();

  try {
    // 1. Authenticate and extract user directly from the response
    const response = await auth.api.signInEmail({
      body: parsed.data,
      headers: reqHeaders,
      returnHeaders: true, // Ensures cookies set by auth are attached to response
    });

    // 2. Check role on the returned user object
    if (response?.response?.user?.role !== "admin") {
      // Sign out immediately if not an admin
      await auth.api.signOut({ headers: reqHeaders });
      return {
        success: false,
        error: "This account does not have admin access.",
      };
    }
  } catch (error) {
    return { success: false, error: "Incorrect email or password" };
  }

  redirect("/dashboard");
}
