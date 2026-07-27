// File: packages/db/src/repositories/user-repository.ts
// Purpose: Data-access layer for the `user` table. Server actions and
//          services call these functions instead of importing `db` and
//          querying `user` directly — this is what keeps "no DB queries in
//          UI/business logic" enforceable: there is exactly one place
//          user reads/writes are allowed to happen.

import { eq } from "drizzle-orm";
import { user } from "../schema";
import type { CredixaRole } from "@credixa/types";

type Database = typeof import("../client").db;

export type UserRecord = typeof user.$inferSelect;

export function createUserRepository(db: Database) {
  return {
    async findById(id: string): Promise<UserRecord | null> {
      const [row] = await db
        .select()
        .from(user)
        .where(eq(user.id, id))
        .limit(1);
      return row ?? null;
    },

    async findByEmail(email: string): Promise<UserRecord | null> {
      const [row] = await db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);
      return row ?? null;
    },

    async findByPhone(phone: string): Promise<UserRecord | null> {
      const [row] = await db
        .select()
        .from(user)
        .where(eq(user.phone, phone))
        .limit(1);
      return row ?? null;
    },

    /**
     * Completes onboarding profile fields. Deliberately narrow — this
     * function cannot touch `role`, `banned`, or auth-managed fields.
     * Role changes must go through the admin-only role-change service
     * (Phase 6), never through this repository.
     */
    async completeProfile(
      id: string,
      data: { phone: string },
    ): Promise<UserRecord> {
      const [row] = await db
        .update(user)
        .set({ phone: data.phone, updatedAt: new Date() })
        .where(eq(user.id, id))
        .returning();

      if (!row) {
        throw new Error(`completeProfile: user ${id} not found`);
      }

      return row;
    },

    async listByRole(role: CredixaRole): Promise<UserRecord[]> {
      return db.select().from(user).where(eq(user.role, role));
    },
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;
