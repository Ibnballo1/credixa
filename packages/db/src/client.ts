// File: packages/db/src/client.ts
// Purpose: Single Drizzle client instance shared by every repository and by
//          the Better Auth Drizzle adapter. Uses the pooled DATABASE_URL
//          (Supabase's connection pooler), not DIRECT_URL — DIRECT_URL is
//          reserved for drizzle-kit migrations only (see drizzle.config.ts).

// DATABASE_URL:
// Runtime application connection using Supabase PgBouncer.
//
// DIRECT_URL:
// Direct PostgreSQL connection used ONLY for migrations
// because PgBouncer doesn't support schema migrations correctly

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@credixa/config/";
import * as schema from "./schema";

// Prevent multiple instances of postgres connection pool in development
declare global {
  var postgresClient: postgres.Sql | undefined;
}

export const sql =
  globalThis.postgresClient ??
  postgres(env.DATABASE_URL, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (env.NODE_ENV !== "production") {
  globalThis.postgresClient = sql;
}

export const db = drizzle(sql, { schema });

export type Database = typeof db;

export { schema };

export async function closeDatabase() {
  await sql.end();
}

export async function healthCheck() {
  await sql`SELECT 1`;
}
