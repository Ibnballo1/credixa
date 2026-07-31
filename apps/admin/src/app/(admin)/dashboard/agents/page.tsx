/**
 * File: apps/admin/src/app/(admin)/dashboard/agents/page.tsx
 * Purpose: Agent application review — defaults to pending applications.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { listAgentsByStatus } from "@/features/agents/services/agent-admin-service";
import { AgentRow } from "@/features/agents/components/agent-row";
import type { AgentRecord } from "@credixa/db";

export const metadata: Metadata = {
  title: "Agents — Credixa Admin",
};

const STATUSES: AgentRecord["status"][] = [
  "pending",
  "approved",
  "rejected",
  "suspended",
];

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus =
    status && STATUSES.includes(status as AgentRecord["status"])
      ? (status as AgentRecord["status"])
      : "pending";

  const agents = await listAgentsByStatus(activeStatus);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Agents</h1>
      <p className="mt-1 text-sm text-slate-500">
        Review and manage agent applications.
      </p>

      <div className="my-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/dashboard/agents?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              activeStatus === s
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
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {agents.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No {activeStatus} applications.
                </td>
              </tr>
            ) : (
              agents.map((a) => <AgentRow key={a.id} agent={a} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
