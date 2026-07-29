/**
 * File: apps/web/src/app/(customer)/dashboard/data/page.tsx
 * Purpose: Data bundle purchase page.
 */
import type { Metadata } from "next";
import { DataPurchaseForm } from "@/features/vtu/components/data-purchase-form";
import { getDataPlans } from "@/features/vtu/services/vtu-catalog-service";

export const metadata: Metadata = {
  title: "Buy Data — Credixa",
};

export default async function DataPage() {
  const plans = await getDataPlans();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Buy data</h1>
      <p className="mb-6 text-sm text-slate-500">
        Get a data bundle for any Nigerian network.
      </p>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {plans.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            Data purchases are temporarily unavailable. Please check back
            shortly.
          </p>
        ) : (
          <DataPurchaseForm plans={plans} />
        )}
      </div>
    </div>
  );
}
