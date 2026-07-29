/**
 * File: apps/web/src/app/(customer)/dashboard/cable/page.tsx
 * Purpose: Cable TV subscription payment — not yet enabled, same
 *          reasoning as electricity/page.tsx.
 */
import type { Metadata } from "next";
import { Tv } from "lucide-react";

export const metadata: Metadata = {
  title: "Cable TV Subscription — Credixa",
};

export default function CablePage() {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10">
        <Tv className="mx-auto mb-3 h-8 w-8 text-slate-400" />
        <h1 className="text-lg font-semibold text-slate-900">
          Cable TV subscription
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Coming soon — we&apos;re finishing verification with our providers
          before enabling this.
        </p>
      </div>
    </div>
  );
}
