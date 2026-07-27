/**
 * File: apps/web/src/app/(auth)/sign-up/page.tsx
 * Purpose: Sign-up page. Server Component shell around the client form.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create your Credixa account",
};

export default function SignUpPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">
        Create your account
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Fast, secure payments — set up in under a minute.
      </p>
      <SignUpForm />
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
