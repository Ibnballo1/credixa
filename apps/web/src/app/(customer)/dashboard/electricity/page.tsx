/**
 * File: apps/web/src/app/(customer)/dashboard/electricity/page.tsx
 * Purpose: Electricity bill payment — not yet enabled. Both providers'
 *          electricity field names are unverified (see
 *          packages/lib/src/providers/clubkonnect-adapter.ts and
 *          docs/decisions/0009-vtu-provider-api-verification-status.md),
 *          so `ProviderAdapter.supports("electricity")` returns false
 *          for both today. This page is honest about that rather than
 *          showing a form that would always fail at purchase time.
 */
import type { Metadata } from "next";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Pay Electricity Bill — Credixa",
};

export default function ElectricityPage() {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10">
        <Zap className="mx-auto mb-3 h-8 w-8 text-slate-400" />
        <h1 className="text-lg font-semibold text-slate-900">
          Electricity bill payment
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Coming soon — we&apos;re finishing verification with our providers
          before enabling this.
        </p>
      </div>
    </div>
  );
}
