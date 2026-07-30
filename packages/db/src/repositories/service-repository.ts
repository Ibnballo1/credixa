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

    /** Every service, active or not — for the admin catalog view (Phase
     * 6c). Customer-facing queries use listByType instead. */
    async listAll(): Promise<ServiceRecord[]> {
      return db.select().from(service);
    },

    async setActive(
      id: string,
      isActive: boolean,
    ): Promise<ServiceRecord | null> {
      const [row] = await db
        .update(service)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(service.id, id))
        .returning();
      return row ?? null;
    },

    /** Sets the fixed catalog price (data/cable plans only — airtime and
     * electricity have no fixed price by design, see docs/database-schema.md). */
    async setPrice(
      id: string,
      priceKobo: number,
    ): Promise<ServiceRecord | null> {
      const [row] = await db
        .update(service)
        .set({ priceKobo, updatedAt: new Date() })
        .where(eq(service.id, id))
        .returning();
      return row ?? null;
    },
  };
}

export type ServiceRepository = ReturnType<typeof createServiceRepository>;
