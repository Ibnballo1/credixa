/**
 * File: apps/admin/src/app/(admin)/dashboard/users/page.tsx
 * Purpose: Searchable, paginated user list.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { listUsers } from "@/features/users/services/user-admin-service";

export const metadata: Metadata = {
  title: "Users — Credixa Admin",
};

const PAGE_SIZE = 20;

export default async function UsersListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? "1") || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const { users, total } = await listUsers(
    q ? { search: q, limit: PAGE_SIZE, offset } : { limit: PAGE_SIZE, offset },
  );
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <span className="text-sm text-slate-500">{total} total</span>
      </div>

      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by email..."
          className="h-10 w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/users/${user.id}`}
                      className="font-medium text-slate-900 hover:text-primary"
                    >
                      {user.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.banned ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Banned
                      </span>
                    ) : (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {user.createdAt.toLocaleDateString("en-NG", {
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
                href={`/dashboard/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(pageNum) })}`}
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
