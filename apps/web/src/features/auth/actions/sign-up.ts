// File: apps/web/src/features/auth/actions/sign-up.ts
// Purpose: Server Action for account creation. This is the ONLY path a
//          sign-up can happen through — the client form never calls
//          Better Auth directly, so every account creation is guaranteed
//          to pass through server-side Zod validation first, even if the
//          client-side check were ever bypassed.

"use server";

import { redirect } from "next/navigation";
import { auth } from "@credixa/auth";
import {
  db,
  createUserRepository,
  createReferralCodeRepository,
  createReferralRepository,
} from "@credixa/db";
import { signUpSchema, type SignUpInput } from "../schemas/sign-up-schema";

export type SignUpActionResult =
  | { success: true }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<keyof SignUpInput, string>>;
    };

export async function signUpAction(
  input: SignUpInput,
): Promise<SignUpActionResult> {
  const parsed = signUpSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof SignUpInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof SignUpInput | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      success: false,
      error: "Please fix the errors below",
      fieldErrors,
    };
  }

  const { name, email, phone, password, referralCode } = parsed.data;

  let newUserId: string | undefined;
  try {
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        // Better Auth additionalFields (see packages/auth/src/auth.ts) —
        // `phone` is `input: true` so it's accepted here.
        phone,
      },
    });
    // Defensive: signUpEmail's documented return includes the created
    // user, but rather than depend entirely on that shape, fall back to
    // a lookup by email if it's ever missing — referral tracking must
    // never be able to break account creation itself.
    newUserId = (result as { user?: { id?: string } } | undefined)?.user?.id;
  } catch (err) {
    return { success: false, error: normalizeSignUpError(err) };
  }

  if (referralCode) {
    await tryCreateReferral(newUserId, email, referralCode);
  }

  // Deliberately outside the try/catch: Next.js's redirect() throws a
  // special control-flow error internally, which the catch block above
  // would otherwise swallow and misreport as a sign-up failure.
  redirect("/dashboard");
}

/**
 * Best-effort referral creation. An invalid/unknown code, a self-
 * referral attempt (impossible in practice at signup, guarded anyway),
 * or any other failure here is swallowed — a broken referral code must
 * never prevent the account that was just successfully created from
 * completing sign-up.
 */
async function tryCreateReferral(
  newUserId: string | undefined,
  newUserEmail: string,
  referralCode: string,
): Promise<void> {
  try {
    const userId =
      newUserId ??
      (await createUserRepository(db).findByEmail(newUserEmail))?.id;
    if (!userId) return;

    const referralCodeRepository = createReferralCodeRepository(db);
    const codeRow = await referralCodeRepository.findByCode(referralCode);
    if (!codeRow || codeRow.userId === userId) return; // unknown code, or (impossible) self-referral

    const referralRepository = createReferralRepository(db);
    await referralRepository.create({
      referrerUserId: codeRow.userId,
      referredUserId: userId,
      referralCode: codeRow.code,
    });
  } catch {
    // Swallow — see function comment.
  }
}

/**
 * Better Auth surfaces provider-level error messages that shouldn't be
 * shown verbatim to end users (they can be overly technical, or in rare
 * cases hint at internal implementation details). Normalize to the two
 * cases that matter for sign-up and a safe generic fallback otherwise.
 */
function normalizeSignUpError(err: unknown): string {
  const message = err instanceof Error ? err.message.toLowerCase() : "";

  if (message.includes("email") && message.includes("exist")) {
    return "An account with this email already exists.";
  }
  if (message.includes("phone") || message.includes("unique")) {
    return "This phone number is already registered.";
  }
  return "We couldn't create your account. Please try again.";
}
