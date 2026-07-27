// File: apps/web/src/features/auth/schemas/sign-in-schema.ts
// Purpose: Validation schema for the sign-in form.

import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type SignInInput = z.infer<typeof signInSchema>;
