"use client";

/**
 * File: apps/admin/src/features/agents/components/agent-row.tsx
 * Purpose: One row in the agents table. Shows approve/reject for
 *          pending applications, suspend for approved agents.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@credixa/ui";
import {
  approveAgentAction,
  rejectAgentAction,
  suspendAgentAction,
} from "../actions/manage-agent";
import type { AgentWithUser } from "@credixa/db";

export function AgentRow({ agent }: { agent: AgentWithUser }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setError(null);
    setIsPending(true);
    const result = await approveAgentAction(agent.id);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  function handleReject() {
    const reason = window.prompt("Reason for rejecting this application:");
    if (reason === null) return;
    setError(null);
    setIsPending(true);
    rejectAgentAction(agent.id, reason).then((result) => {
      setIsPending(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleSuspend() {
    const reason = window.prompt("Reason for suspending this agent:");
    if (reason === null) return;
    setError(null);
    setIsPending(true);
    suspendAgentAction(agent.id, reason).then((result) => {
      setIsPending(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{agent.businessName}</p>
        {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      </td>
      <td className="px-4 py-3">
        <p className="text-slate-900">{agent.userName}</p>
        <p className="text-xs text-slate-400">{agent.userEmail}</p>
      </td>
      <td className="px-4 py-3 text-slate-500">
        {agent.createdAt.toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-4 py-3">
        {agent.status === "pending" ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleApprove} isLoading={isPending}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={isPending}
            >
              Reject
            </Button>
          </div>
        ) : agent.status === "approved" ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleSuspend}
            isLoading={isPending}
          >
            Suspend
          </Button>
        ) : (
          <span className="text-xs text-slate-400">
            {agent.rejectionReason ?? "—"}
          </span>
        )}
      </td>
    </tr>
  );
}
