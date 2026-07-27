/**
 * File: apps/admin/src/app/(auth)/sign-in/page.tsx
 * Purpose: Admin sign-in page. There is no admin sign-up page — admin
 *          accounts are created via a seed script or promoted by an
 *          existing admin (Phase 6), never via self-registration.
 */
import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in — Credixa Admin",
};

export default function SignInPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">
        Admin sign in
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Restricted access. Staff credentials only.
      </p>
      <SignInForm />
    </div>
  );
}
