// File: apps/web/src/features/agents/actions/apply-agent.ts
// Purpose: Server Action for submitting/resubmitting an agent
//          application. Never changes the user's role — that only ever
//          happens when an admin approves (apps/admin/src/features/agents/actions/manage-agent.ts).

"use server";

import { requireAuth } from "@credixa/auth";
import { db, createAgentRepository } from "@credixa/db";
import {
  applyAgentSchema,
  type ApplyAgentInput,
} from "../schemas/apply-agent-schema";

export type ApplyAgentActionResult =
  | { success: true }
  | { success: false; error: string };

export async function applyAgentAction(
  input: ApplyAgentInput,
): Promise<ApplyAgentActionResult> {
  const session = await requireAuth();

  const parsed = applyAgentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const agentRepository = createAgentRepository(db);

  try {
    await agentRepository.apply({
      userId: session.user.id,
      businessName: parsed.data.businessName,
    });
  } catch {
    return {
      success: false,
      error: "You already have a pending or approved agent application.",
    };
  }

  return { success: true };
}
