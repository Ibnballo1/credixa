/**
 * File: apps/web/src/app/(customer)/dashboard/airtime/page.tsx
 * Purpose: Airtime purchase page.
 */
import type { Metadata } from "next";
import { AirtimePurchaseForm } from "@/features/vtu/components/airtime-purchase-form";
import { getAirtimeNetworks } from "@/features/vtu/services/vtu-catalog-service";

export const metadata: Metadata = {
  title: "Buy Airtime — Credixa",
};

export default async function AirtimePage() {
  const networks = await getAirtimeNetworks();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">
        Buy airtime
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Top up any Nigerian network instantly.
      </p>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {networks.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            Airtime purchases are temporarily unavailable. Please check back
            shortly.
          </p>
        ) : (
          <AirtimePurchaseForm networks={networks} />
        )}
      </div>
    </div>
  );
}
