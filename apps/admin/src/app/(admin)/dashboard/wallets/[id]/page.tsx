/**
 * File: apps/admin/src/app/(admin)/dashboard/wallets/[id]/page.tsx
 * Purpose: Wallet detail — balance, recent ledger entries, pending holds,
 *          and the manual adjustment / freeze controls.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { formatKoboAsNaira } from "@credixa/lib";
import { getWalletDetail } from "@/features/wallets/services/wallet-admin-service";
import { WalletActionsPanel } from "@/features/wallets/components/wallet-actions-panel";

export const metadata: Metadata = {
  title: "Wallet detail — Credixa Admin",
};

export default async function WalletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getWalletDetail(id);
  if (!detail) {
    notFound();
  }

  const { wallet, userName, userEmail, recentTransactions, pendingHolds } =
    detail;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          {userName}&apos;s wallet
        </h1>
        <p className="text-sm text-slate-500">{userEmail}</p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <span className="text-sm text-slate-500">Balance</span>
          <p className="mt-1 text-3xl font-semibold text-slate-900">
            {formatKoboAsNaira(wallet.balance)}
          </p>
          <span
            className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              wallet.status === "frozen"
                ? "bg-red-100 text-red-700"
                : "bg-primary/10 text-primary"
            }`}
          >
            {wallet.status === "frozen" ? "Frozen" : "Active"}
          </span>
        </div>

        {pendingHolds.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-slate-700">
              Pending holds ({pendingHolds.length})
            </h2>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {pendingHolds.map((hold) => (
                <li
                  key={hold.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="text-slate-600">
                    {hold.description ?? "Hold"}
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatKoboAsNaira(hold.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-slate-700">
            Recent ledger activity
          </h2>
          {recentTransactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
              No transactions yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {recentTransactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {tx.description ?? tx.type}
                    </p>
                    <p className="text-xs text-slate-400">
                      {tx.createdAt.toLocaleString("en-NG")} · {tx.type}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${tx.amount > 0 ? "text-primary" : "text-slate-900"}`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {formatKoboAsNaira(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          <Link
            href={`/dashboard/users/${wallet.userId}`}
            className="hover:text-primary"
          >
            View user profile →
          </Link>
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">Actions</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <WalletActionsPanel wallet={wallet} />
        </div>
      </div>
    </div>
  );
}
