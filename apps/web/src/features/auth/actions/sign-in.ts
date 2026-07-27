// File: apps/web/src/features/auth/actions/sign-in.ts
// Purpose: Server Action for email/password sign-in.

"use server";

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

  try {
    await auth.api.signInEmail({ body: parsed.data });
  } catch {
    // Deliberately generic: never confirm/deny whether the email exists,
    // to avoid account enumeration.
    return { success: false, error: "Incorrect email or password" };
  }

  redirect("/dashboard");
}
