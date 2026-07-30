// File: packages/db/src/repositories/provider-repository.ts
// Purpose: Data-access layer for the `provider` table. Consumed by
//          ProviderRouter (packages/lib/src/providers/provider-router.ts)
//          to decide which active, capable provider(s) can handle a given
//          service type.

import { eq, asc } from "drizzle-orm";
import type { Database } from "../client";
import { provider } from "../schema";

export type ProviderRecord = typeof provider.$inferSelect;

export function createProviderRepository(db: Database) {
  return {
    async findByName(name: string): Promise<ProviderRecord | null> {
      const [row] = await db
        .select()
        .from(provider)
        .where(eq(provider.name, name))
        .limit(1);
      return row ?? null;
    },

    async findById(id: string): Promise<ProviderRecord | null> {
      const [row] = await db
        .select()
        .from(provider)
        .where(eq(provider.id, id))
        .limit(1);
      return row ?? null;
    },

    async listActive(): Promise<ProviderRecord[]> {
      return db
        .select()
        .from(provider)
        .where(eq(provider.isActive, true))
        .orderBy(asc(provider.priority));
    },

    /** Every provider, active or not — for the admin service
     * configuration view (Phase 6c). ProviderRouter uses listActive
     * instead; this is admin-only. */
    async listAll(): Promise<ProviderRecord[]> {
      return db.select().from(provider).orderBy(asc(provider.priority));
    },

    async setActive(
      id: string,
      isActive: boolean,
    ): Promise<ProviderRecord | null> {
      const [row] = await db
        .update(provider)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(provider.id, id))
        .returning();
      return row ?? null;
    },

    async setPriority(
      id: string,
      priority: number,
    ): Promise<ProviderRecord | null> {
      const [row] = await db
        .update(provider)
        .set({ priority, updatedAt: new Date() })
        .where(eq(provider.id, id))
        .returning();
      return row ?? null;
    },
  };
}

export type ProviderRepository = ReturnType<typeof createProviderRepository>;
