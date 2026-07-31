// File: apps/admin/src/features/agents/actions/manage-agent.ts
// Purpose: Server Actions for agent application approval. Approving is
//          the ONLY path that grants the "agent" role — it calls Better
//          Auth's setRole directly (same mechanism as Phase 6a's
//          manage-user.ts), not just the agent-repository's own status
//          field, so pricing_rule's role="agent" rules actually apply
//          the moment an application is approved.

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth, requireRole } from "@credixa/auth";
import {
  db,
  createAgentRepository,
  createAuditLogRepository,
} from "@credixa/db";

export type AgentActionResult =
  | { success: true }
  | { success: false; error: string };

export async function approveAgentAction(
  agentId: string,
): Promise<AgentActionResult> {
  const session = await requireRole("admin");

  const agentRepository = createAgentRepository(db);
  const updated = await agentRepository.approve(agentId, session.user.id);
  if (!updated) {
    return { success: false, error: "Application not found or not pending." };
  }

  try {
    await auth.api.setRole({
      body: { userId: updated.userId, role: "agent" },
      headers: await headers(),
    });
  } catch {
    return {
      success: false,
      error: "Approved the application but failed to grant agent role.",
    };
  }

  const auditLogRepository = createAuditLogRepository(db);
  await auditLogRepository.create({
    actorUserId: session.user.id,
    action: "admin.agent.approve",
    entityType: "agent",
    entityId: agentId,
    metadata: { userId: updated.userId },
  });

  revalidatePath("/dashboard/agents");
  return { success: true };
}

export async function rejectAgentAction(
  agentId: string,
  reason: string,
): Promise<AgentActionResult> {
  const session = await requireRole("admin");

  const agentRepository = createAgentRepository(db);
  const updated = await agentRepository.reject(agentId, reason);
  if (!updated) {
    return { success: false, error: "Application not found or not pending." };
  }

  const auditLogRepository = createAuditLogRepository(db);
  await auditLogRepository.create({
    actorUserId: session.user.id,
    action: "admin.agent.reject",
    entityType: "agent",
    entityId: agentId,
    metadata: { reason },
  });

  revalidatePath("/dashboard/agents");
  return { success: true };
}

export async function suspendAgentAction(
  agentId: string,
  reason: string,
): Promise<AgentActionResult> {
  const session = await requireRole("admin");

  const agentRepository = createAgentRepository(db);
  const updated = await agentRepository.suspend(agentId, reason);
  if (!updated) {
    return {
      success: false,
      error: "Agent not found or not currently approved.",
    };
  }

  try {
    await auth.api.setRole({
      body: { userId: updated.userId, role: "customer" },
      headers: await headers(),
    });
  } catch {
    return {
      success: false,
      error: "Suspended the agent but failed to revert their role.",
    };
  }

  const auditLogRepository = createAuditLogRepository(db);
  await auditLogRepository.create({
    actorUserId: session.user.id,
    action: "admin.agent.suspend",
    entityType: "agent",
    entityId: agentId,
    metadata: { reason, userId: updated.userId },
  });

  revalidatePath("/dashboard/agents");
  return { success: true };
}
