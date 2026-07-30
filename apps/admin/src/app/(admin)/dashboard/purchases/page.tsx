/**
 * File: apps/admin/src/app/(admin)/dashboard/purchases/page.tsx
 * Purpose: Platform-wide VTU purchase monitoring — especially useful for
 *          spotting purchases stuck "pending" before the sweep job
 *          catches them, or "failed" ones worth investigating.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { formatKoboAsNaira } from "@credixa/lib";
import { listAllPurchases } from "@/features/vtu/services/vtu-admin-service";
import type { VtuPurchaseRecord } from "@credixa/db";

export const metadata: Metadata = {
  title: "VTU Purchases — Credixa Admin",
};

const PAGE_SIZE = 50;
const STATUSES: Array<VtuPurchaseRecord["status"] | "all"> = [
  "all",
  "pending",
  "success",
  "failed",
];

const STATUS_STYLES: Record<VtuPurchaseRecord["status"], string> = {
  pending: "bg-accent/20 text-accent-foreground",
  success: "bg-primary/10 text-primary",
  failed: "bg-red-100 text-red-700",
};

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? "1") || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const statusFilter =
    status && status !== "all"
      ? (status as VtuPurchaseRecord["status"])
      : undefined;

  const { purchases, total } = await listAllPurchases({
    ...(statusFilter ? { status: statusFilter } : {}),
    limit: PAGE_SIZE,
    offset,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">VTU Purchases</h1>
        <span className="text-sm text-slate-500">{total} total</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/dashboard/purchases${s === "all" ? "" : `?status=${s}`}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              (status ?? "all") === s
                ? "bg-primary text-primary-foreground"
                : "border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No purchases found.
                </td>
              </tr>
            ) : (
              purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{p.userName}</p>
                    <p className="text-xs text-slate-400">{p.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.serviceName}
                    {p.recipientPhone ? (
                      <p className="text-xs text-slate-400">
                        {p.recipientPhone}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatKoboAsNaira(p.amountKobo)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}
                    >
                      {p.status}
                    </span>
                    {p.status === "failed" && p.lastError ? (
                      <p
                        className="mt-1 max-w-xs truncate text-xs text-red-500"
                        title={p.lastError}
                      >
                        {p.lastError}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.attemptCount}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.createdAt.toLocaleString("en-NG")}
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
                href={`/dashboard/purchases?${new URLSearchParams({
                  ...(status && status !== "all" ? { status } : {}),
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
