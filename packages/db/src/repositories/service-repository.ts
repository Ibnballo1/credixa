// File: packages/db/src/repositories/service-repository.ts
// Purpose: Data-access layer for the `service` catalog table.

import { and, eq } from "drizzle-orm";
import type { Database } from "../client";
import { service } from "../schema";

export type ServiceRecord = typeof service.$inferSelect;

export function createServiceRepository(db: Database) {
  return {
    async findById(id: string): Promise<ServiceRecord | null> {
      const [row] = await db
        .select()
        .from(service)
        .where(eq(service.id, id))
        .limit(1);
      return row ?? null;
    },

    async listByType(type: ServiceRecord["type"]): Promise<ServiceRecord[]> {
      return db
        .select()
        .from(service)
        .where(and(eq(service.type, type), eq(service.isActive, true)));
    },

    async listNetworksByType(
      type: ServiceRecord["type"],
    ): Promise<ServiceRecord[]> {
      // For airtime/electricity there's one row per network/disco (no
      // plan variants) — same query as listByType, named separately so
      // call sites read clearly regardless of which shape they expect.
      return this.listByType(type);
    },
  };
}

export type ServiceRepository = ReturnType<typeof createServiceRepository>;
