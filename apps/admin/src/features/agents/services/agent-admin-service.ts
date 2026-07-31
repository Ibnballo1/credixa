// File: apps/admin/src/features/agents/services/agent-admin-service.ts
// Purpose: Read-side queries for the admin agent approval area.

import { db, createAgentRepository } from "@credixa/db";
import type { AgentRecord, AgentWithUser } from "@credixa/db";

export async function listAgentsByStatus(
  status: AgentRecord["status"],
): Promise<AgentWithUser[]> {
  const agentRepository = createAgentRepository(db);
  return agentRepository.listByStatus(status);
}
