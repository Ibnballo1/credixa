/**
 * File: apps/web/src/app/(customer)/dashboard/become-agent/page.tsx
 */
import type { Metadata } from "next";
import { requireAuth } from "@credixa/auth";
import type { CredixaRole } from "@credixa/types";
import { getMyAgentStatus } from "@/features/agents/services/agent-service";
import { ApplyAgentForm } from "@/features/agents/components/apply-agent-form";

export const metadata: Metadata = {
  title: "Become an Agent — Credixa",
};

export default async function BecomeAgentPage() {
  const session = await requireAuth();
  const agentStatus = await getMyAgentStatus(session.user.id);
  const userRole = (session.user.role as CredixaRole | null) ?? "customer";

  // Check if they are actually active as an agent in user.role
  const isApprovedAgent =
    userRole === "agent" && agentStatus?.status === "approved";

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">
        Become a Credixa Agent
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Agents get discounted pricing on airtime, data, and other services to
        resell to their own customers.
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {!agentStatus ||
        agentStatus.status === "rejected" ||
        (!isApprovedAgent &&
          agentStatus.status !== "pending" &&
          agentStatus.status !== "suspended") ? (
          <>
            {agentStatus?.status === "rejected" ? (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Your previous application was not approved
                {agentStatus.rejectionReason
                  ? `: ${agentStatus.rejectionReason}`
                  : "."}{" "}
                You can submit a new application below.
              </div>
            ) : null}
            <ApplyAgentForm />
          </>
        ) : agentStatus.status === "pending" ? (
          <div className="text-center">
            <p className="text-sm font-medium text-slate-900">
              Application under review
            </p>
            <p className="mt-1 text-xs text-slate-500">
              You applied as &ldquo;{agentStatus.businessName}&rdquo;.
              We&apos;ll notify you once it&apos;s reviewed.
            </p>
          </div>
        ) : isApprovedAgent ? (
          <div className="text-center">
            <p className="text-sm font-medium text-primary">
              You&apos;re an approved agent
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Your account already has agent pricing applied automatically.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-red-700">
              Agent account suspended
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {agentStatus.rejectionReason ?? "Contact support for details."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
