// File: packages/db/src/repositories/commission-repository.ts
// Purpose: Data-access layer for `commission`. `create` relies on the
//          schema's unique index on (sourceType, sourceId) for
//          idempotency — see commission-service.ts (packages/lib) for
//          how a unique-violation on insert is interpreted as "already
//          awarded, not an error."

import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../client";
import { commission, user } from "../schema";

export type CommissionRecord = typeof commission.$inferSelect;

export interface CommissionWithUser extends CommissionRecord {
  userName: string;
  userEmail: string;
}

export interface CreateCommissionInput {
  userId: string;
  type: CommissionRecord["type"];
  sourceType: string;
  sourceId: string;
  amountKobo: number;
}

export function createCommissionRepository(db: Database) {
  return {
    async create(input: CreateCommissionInput): Promise<CommissionRecord> {
      const [row] = await db.insert(commission).values(input).returning();
      if (!row)
        throw new Error(
          "createCommissionRepository.create: insert returned no row",
        );
      return row;
    },

    async findBySource(
      sourceType: string,
      sourceId: string,
    ): Promise<CommissionRecord | null> {
      const [row] = await db
        .select()
        .from(commission)
        .where(
          and(
            eq(commission.sourceType, sourceType),
            eq(commission.sourceId, sourceId),
          ),
        )
        .limit(1);
      return row ?? null;
    },

    async markPaid(
      id: string,
      walletTransactionId: string,
    ): Promise<CommissionRecord | null> {
      const [row] = await db
        .update(commission)
        .set({ status: "paid", walletTransactionId, updatedAt: new Date() })
        .where(and(eq(commission.id, id), eq(commission.status, "pending")))
        .returning();
      return row ?? null;
    },

    async markFailed(
      id: string,
      errorMessage: string,
    ): Promise<CommissionRecord | null> {
      const [row] = await db
        .update(commission)
        .set({ status: "failed", errorMessage, updatedAt: new Date() })
        .where(and(eq(commission.id, id), eq(commission.status, "pending")))
        .returning();
      return row ?? null;
    },

    async listByUser(userId: string, limit = 50): Promise<CommissionRecord[]> {
      return db
        .select()
        .from(commission)
        .where(eq(commission.userId, userId))
        .orderBy(desc(commission.createdAt))
        .limit(limit);
    },

    async listAllWithUser(params: {
      status?: CommissionRecord["status"];
      limit?: number;
      offset?: number;
    }): Promise<{ commissions: CommissionWithUser[]; total: number }> {
      const limit = params.limit ?? 50;
      const offset = params.offset ?? 0;
      const statusCondition = params.status
        ? eq(commission.status, params.status)
        : undefined;

      const rows = await db
        .select({
          id: commission.id,
          userId: commission.userId,
          type: commission.type,
          sourceType: commission.sourceType,
          sourceId: commission.sourceId,
          amountKobo: commission.amountKobo,
          status: commission.status,
          walletTransactionId: commission.walletTransactionId,
          errorMessage: commission.errorMessage,
          createdAt: commission.createdAt,
          updatedAt: commission.updatedAt,
          userName: user.name,
          userEmail: user.email,
        })
        .from(commission)
        .innerJoin(user, eq(commission.userId, user.id))
        .where(statusCondition)
        .orderBy(desc(commission.createdAt))
        .limit(limit)
        .offset(offset);

      const [countRow] = await db
        .select({ count: sql<string>`count(*)` })
        .from(commission)
        .where(statusCondition);

      return { commissions: rows, total: Number(countRow?.count ?? 0) };
    },
  };
}

export type CommissionRepository = ReturnType<
  typeof createCommissionRepository
>;
