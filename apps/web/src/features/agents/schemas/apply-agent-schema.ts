// File: apps/web/src/features/agents/schemas/apply-agent-schema.ts
// Purpose: Validation for the "become an agent" application form.

import { z } from "zod";

export const applyAgentSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name").max(150),
});

export type ApplyAgentInput = z.infer<typeof applyAgentSchema>;
