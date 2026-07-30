/**
 * File: apps/admin/src/app/(admin)/dashboard/transactions/page.tsx
 * Purpose: Platform-wide ledger monitoring — every wallet_transaction
 *          across every user, filterable by type.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { formatKoboAsNaira } from "@credixa/lib";
import { listAllTransactions } from "@/features/transactions/services/transaction-admin-service";
import type { WalletTransactionRecord } from "@credixa/db";

export const metadata: Metadata = {
  title: "Transactions — Credixa Admin",
};

const PAGE_SIZE = 50;
const TYPES: Array<WalletTransactionRecord["type"] | "all"> = [
  "all",
  "funding",
  "purchase",
  "refund",
  "reversal",
  "commission",
  "adjustment",
];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const { type, page } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? "1") || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const typeFilter =
    type && type !== "all"
      ? (type as WalletTransactionRecord["type"])
      : undefined;

  const { transactions, total } = await listAllTransactions({
    ...(typeFilter ? { type: typeFilter } : {}),
    limit: PAGE_SIZE,
    offset,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Transactions</h1>
        <span className="text-sm text-slate-500">{total} total</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <Link
            key={t}
            href={`/dashboard/transactions${t === "all" ? "" : `?type=${t}`}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              (type ?? "all") === t
                ? "bg-primary text-primary-foreground"
                : "border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{tx.userName}</p>
                    <p className="text-xs text-slate-400">{tx.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {tx.description ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${tx.amount > 0 ? "text-primary" : "text-slate-900"}`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {formatKoboAsNaira(tx.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {tx.createdAt.toLocaleString("en-NG")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <Link
                key={pageNum}
                href={`/dashboard/transactions?${new URLSearchParams({
                  ...(type && type !== "all" ? { type } : {}),
                  page: String(pageNum),
                })}`}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  pageNum === currentPage
                    ? "bg-primary text-primary-foreground"
                    : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </Link>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
