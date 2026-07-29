/**
 * File: apps/admin/src/app/(admin)/dashboard/users/[id]/page.tsx
 * Purpose: Single user's admin detail view — profile, KYC status, wallet
 *          balance, and the role/ban controls.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatKoboAsNaira } from "@credixa/lib";
import {
  getUserById,
  getUserWalletBalance,
} from "@/features/users/services/user-admin-service";
import { UserActionsPanel } from "@/features/users/components/user-actions-panel";

export const metadata: Metadata = {
  title: "User detail — Credixa Admin",
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) {
    notFound();
  }

  const walletBalance = await getUserWalletBalance(user.id);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-semibold text-slate-900">{user.name}</h1>
        <p className="text-sm text-slate-500">{user.email}</p>

        <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-6 text-sm">
          <div>
            <dt className="text-slate-500">Phone</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {user.phone ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">KYC status</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {user.kycStatus}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Wallet balance</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {walletBalance != null
                ? formatKoboAsNaira(walletBalance)
                : "No wallet yet"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Joined</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {user.createdAt.toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </dd>
          </div>
          {user.banned ? (
            <div className="col-span-2">
              <dt className="text-slate-500">Ban reason</dt>
              <dd className="mt-1 font-medium text-red-700">
                {user.banReason ?? "No reason given"}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">Actions</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <UserActionsPanel user={user} />
        </div>
      </div>
    </div>
  );
}
