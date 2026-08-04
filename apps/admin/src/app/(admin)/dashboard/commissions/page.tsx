/**
 * File: apps/admin/src/app/(admin)/dashboard/commissions/page.tsx
 * Purpose: Platform-wide commission monitoring — especially useful for
 *          spotting "failed" commissions that need manual follow-up
 *          (the commission engine does not auto-retry failed credits).
 */
import Link from "next/link";
import type { Metadata } from "next";
import { formatKoboAsNaira } from "@credixa/lib";
import { listAllCommissions } from "@/features/commissions/services/commission-admin-service";
import type { CommissionRecord } from "@credixa/db";

export const metadata: Metadata = {
  title: "Commissions — Credixa Admin",
};

const PAGE_SIZE = 50;
const STATUSES: Array<CommissionRecord["status"] | "all"> = [
  "all",
  "pending",
  "paid",
  "failed",
];

const STATUS_STYLES: Record<CommissionRecord["status"], string> = {
  pending: "bg-slate-100 text-slate-700",
  paid: "bg-primary/10 text-primary",
  failed: "bg-red-100 text-red-700",
};

const TYPE_LABELS: Record<CommissionRecord["type"], string> = {
  referral: "Referral",
  agent_margin: "Agent margin",
};

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? "1") || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const statusFilter =
    status && status !== "all"
      ? (status as CommissionRecord["status"])
      : undefined;

  const { commissions, total } = await listAllCommissions({
    ...(statusFilter ? { status: statusFilter } : {}),
    limit: PAGE_SIZE,
    offset,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Commissions</h1>
        <span className="text-sm text-slate-500">{total} total</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/dashboard/commissions${s === "all" ? "" : `?status=${s}`}`}
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
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {commissions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No commissions found.
                </td>
              </tr>
            ) : (
              commissions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{c.userName}</p>
                    <p className="text-xs text-slate-400">{c.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {TYPE_LABELS[c.type]}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatKoboAsNaira(c.amountKobo)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status]}`}
                    >
                      {c.status}
                    </span>
                    {c.status === "failed" && c.errorMessage ? (
                      <p
                        className="mt-1 max-w-xs truncate text-xs text-red-500"
                        title={c.errorMessage}
                      >
                        {c.errorMessage}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {c.createdAt.toLocaleString("en-NG")}
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
                href={`/dashboard/commissions?${new URLSearchParams({
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
