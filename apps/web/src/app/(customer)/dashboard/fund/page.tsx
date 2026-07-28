/**
 * File: apps/web/src/app/(customer)/dashboard/fund/page.tsx
 * Purpose: Wallet funding page — amount entry, then redirect to Paystack.
 */
import type { Metadata } from "next";
import { FundWalletForm } from "@/features/payments/components/fund-wallet-form";

export const metadata: Metadata = {
  title: "Fund Wallet — Credixa",
};

export default function FundWalletPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">
        Fund your wallet
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Add money to your Credixa wallet using your card or bank account.
      </p>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <FundWalletForm />
      </div>
    </div>
  );
}
