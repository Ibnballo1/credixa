// File: apps/web/src/features/agents/services/agent-service.ts
// Purpose: Read-side query for the current user's agent application
//          status, used by the become-agent page and the dashboard badge.

import { db, createAgentRepository } from "@credixa/db";
import type { AgentRecord } from "@credixa/db";

export async function getMyAgentStatus(
  userId: string,
): Promise<AgentRecord | null> {
  const agentRepository = createAgentRepository(db);
  return agentRepository.findByUserId(userId);
}
