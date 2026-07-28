// File: apps/web/src/features/profile/schemas/update-profile-schema.ts
// Purpose: Validation schema for profile edits. Deliberately covers only
//          name and phone — email changes require Better Auth's
//          changeEmail verification flow (not enabled yet) and are out of
//          scope for this phase.

import { z } from "zod";
import { NIGERIAN_PHONE_REGEX } from "@credixa/lib";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z
    .string()
    .trim()
    .regex(NIGERIAN_PHONE_REGEX, "Enter a valid Nigerian phone number"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
