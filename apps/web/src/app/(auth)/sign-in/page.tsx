/**
 * File: apps/web/src/app/(auth)/sign-in/page.tsx
 * Purpose: Sign-in page. Server Component shell around the client form.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in to Credixa",
};

export default function SignInPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">
        Welcome back
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Sign in to continue to your wallet.
      </p>
      <SignInForm />
      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-primary hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
