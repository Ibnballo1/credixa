/**
 * File: packages/config/src/env.ts
 * Purpose: Safe environment variable validation for both Node.js (server) and Browser (client).
 */

import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

const isBrowser = typeof globalThis !== "undefined" && "window" in globalThis;

// Load root .env file when running in Node.js / SSR
if (!isBrowser) {
  dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  NEXT_PUBLIC_ADMIN_URL: z
    .string()
    .url("NEXT_PUBLIC_ADMIN_URL must be a valid URL"),
});

const fullSchema = serverSchema.merge(clientSchema);

function getEnv() {
  const isServer =
    typeof globalThis === "undefined" || !("window" in globalThis);

  if (isServer) {
    const result = fullSchema.safeParse(process.env);
    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      throw new Error(
        `Invalid environment variables:\n${issues}\n\nCheck your .env file.`,
      );
    }
    return result.data;
  }

  // On the browser, validate ONLY client-safe NEXT_PUBLIC_ variables
  const result = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid client environment variables:\n${issues}`);
  }

  // Return client variables safely (server keys will be undefined on client)
  return {
    ...result.data,
    DATABASE_URL: "",
    DIRECT_URL: "",
    BETTER_AUTH_SECRET: "",
    BETTER_AUTH_URL: "",
    NODE_ENV: process.env.NODE_ENV || "development",
  } as z.infer<typeof fullSchema>;
}

export const env = getEnv();
