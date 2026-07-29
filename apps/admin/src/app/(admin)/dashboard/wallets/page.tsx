/**
 * File: apps/admin/src/app/(admin)/dashboard/wallets/page.tsx
 * Purpose: Searchable, paginated wallet list.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { formatKoboAsNaira } from "@credixa/lib";
import { listWallets } from "@/features/wallets/services/wallet-admin-service";

export const metadata: Metadata = {
  title: "Wallets — Credixa Admin",
};

const PAGE_SIZE = 20;

export default async function WalletsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? "1") || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const listWalletsParams = {
    ...(q !== undefined ? { search: q } : {}),
    limit: PAGE_SIZE,
    offset,
  };

  const { wallets, total } = await listWallets(listWalletsParams);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Wallets</h1>
        <span className="text-sm text-slate-500">{total} total</span>
      </div>

      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by user name or email..."
          className="h-10 w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {wallets.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No wallets found.
                </td>
              </tr>
            ) : (
              wallets.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/wallets/${w.id}`}
                      className="font-medium text-slate-900 hover:text-primary"
                    >
                      {w.userName}
                    </Link>
                    <p className="text-xs text-slate-400">{w.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatKoboAsNaira(w.balance)}
                  </td>
                  <td className="px-4 py-3">
                    {w.status === "frozen" ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Frozen
                      </span>
                    ) : (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {w.createdAt.toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
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
                href={`/dashboard/wallets?${new URLSearchParams({ ...(q ? { q } : {}), page: String(pageNum) })}`}
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
