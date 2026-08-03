// File: apps/web/src/features/auth/schemas/sign-up-schema.ts
// Purpose: Single source of validation truth for the sign-up form, shared
//          between the client-side form (react-hook-form) and the server
//          action (which re-validates — client validation is a UX
//          convenience, never a security boundary).

import { z } from "zod";
import { NIGERIAN_PHONE_REGEX } from "@credixa/lib";

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(100),
    email: z.string().trim().email("Enter a valid email address"),
    phone: z
      .string()
      .trim()
      .regex(NIGERIAN_PHONE_REGEX, "Enter a valid Nigerian phone number"),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
    referralCode: z.string().trim().max(20).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
