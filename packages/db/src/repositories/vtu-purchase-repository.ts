// File: packages/db/src/repositories/vtu-purchase-repository.ts
// Purpose: Data-access layer for the `vtu_purchase` table. Status
//          transitions and the walletTransactionId link are only ever
//          written by packages/lib/src/vtu/purchase-service.ts.

import { and, eq, lt, sql, desc } from "drizzle-orm";
import type { Database } from "../client";
import { vtuPurchase, user, service } from "../schema";

export type VtuPurchaseRecord = typeof vtuPurchase.$inferSelect;

export interface VtuPurchaseWithDetails extends VtuPurchaseRecord {
  userName: string;
  userEmail: string;
  serviceName: string;
}

export interface CreateVtuPurchaseInput {
  userId: string;
  walletId: string;
  serviceId: string;
  reference: string;
  amountKobo: number;
  walletHoldId: string;
  recipientPhone?: string;
  recipientMeterNumber?: string;
  recipientSmartCardNumber?: string;
}

export function createVtuPurchaseRepository(db: Database) {
  return {
    async create(input: CreateVtuPurchaseInput): Promise<VtuPurchaseRecord> {
      const [row] = await db.insert(vtuPurchase).values(input).returning();
      if (!row) {
        throw new Error(
          "createVtuPurchaseRepository.create: insert returned no row",
        );
      }
      return row;
    },

    async findById(id: string): Promise<VtuPurchaseRecord | null> {
      const [row] = await db
        .select()
        .from(vtuPurchase)
        .where(eq(vtuPurchase.id, id))
        .limit(1);
      return row ?? null;
    },

    async findByReference(
      reference: string,
    ): Promise<VtuPurchaseRecord | null> {
      const [row] = await db
        .select()
        .from(vtuPurchase)
        .where(eq(vtuPurchase.reference, reference))
        .limit(1);
      return row ?? null;
    },

    async listByUser(userId: string, limit = 20): Promise<VtuPurchaseRecord[]> {
      return db
        .select()
        .from(vtuPurchase)
        .where(eq(vtuPurchase.userId, userId))
        .limit(limit);
    },

    /** Purchases stuck "pending" past `olderThan` — consumed by the
     * pending-vtu-sweep Inngest job. */
    async listStalePending(olderThan: Date): Promise<VtuPurchaseRecord[]> {
      return db
        .select()
        .from(vtuPurchase)
        .where(
          and(
            eq(vtuPurchase.status, "pending"),
            lt(vtuPurchase.updatedAt, olderThan),
          ),
        );
    },

    /**
     * Records one provider-call attempt against a purchase (atomic
     * increment, no read-then-write race) — called once per attempt,
     * regardless of whether that attempt succeeded or failed. The
     * per-attempt request/response detail lives in `provider_transaction`
     * (see provider-transaction-repository.ts); this just tracks the
     * count and the most recent error for quick inspection.
     */
    async recordAttempt(
      id: string,
      data: { providerId: string | null; lastError: string | null },
    ): Promise<void> {
      await db
        .update(vtuPurchase)
        .set({
          providerId: data.providerId,
          lastError: data.lastError,
          attemptCount: sql`${vtuPurchase.attemptCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(vtuPurchase.id, id));
    },

    async markSuccess(
      id: string,
      data: {
        providerId: string;
        providerReference: string | null;
        walletTransactionId: string;
        metadata?: Record<string, unknown>;
      },
    ): Promise<VtuPurchaseRecord | null> {
      const [row] = await db
        .update(vtuPurchase)
        .set({
          status: "success",
          providerId: data.providerId,
          providerReference: data.providerReference,
          walletTransactionId: data.walletTransactionId,
          metadata: data.metadata,
          updatedAt: new Date(),
        })
        .where(and(eq(vtuPurchase.id, id), eq(vtuPurchase.status, "pending")))
        .returning();
      return row ?? null;
    },

    async markFailed(
      id: string,
      lastError: string,
    ): Promise<VtuPurchaseRecord | null> {
      const [row] = await db
        .update(vtuPurchase)
        .set({ status: "failed", lastError, updatedAt: new Date() })
        .where(and(eq(vtuPurchase.id, id), eq(vtuPurchase.status, "pending")))
        .returning();
      return row ?? null;
    },

    /** Platform-wide purchase feed for Phase 6b's admin monitoring view. */
    async listAllWithDetails(params: {
      status?: VtuPurchaseRecord["status"];
      limit?: number;
      offset?: number;
    }): Promise<{ purchases: VtuPurchaseWithDetails[]; total: number }> {
      const limit = params.limit ?? 50;
      const offset = params.offset ?? 0;
      const statusCondition = params.status
        ? eq(vtuPurchase.status, params.status)
        : undefined;

      const rows = await db
        .select({
          id: vtuPurchase.id,
          userId: vtuPurchase.userId,
          walletId: vtuPurchase.walletId,
          serviceId: vtuPurchase.serviceId,
          providerId: vtuPurchase.providerId,
          status: vtuPurchase.status,
          recipientPhone: vtuPurchase.recipientPhone,
          recipientMeterNumber: vtuPurchase.recipientMeterNumber,
          recipientSmartCardNumber: vtuPurchase.recipientSmartCardNumber,
          amountKobo: vtuPurchase.amountKobo,
          reference: vtuPurchase.reference,
          providerReference: vtuPurchase.providerReference,
          walletHoldId: vtuPurchase.walletHoldId,
          walletTransactionId: vtuPurchase.walletTransactionId,
          attemptCount: vtuPurchase.attemptCount,
          lastError: vtuPurchase.lastError,
          metadata: vtuPurchase.metadata,
          createdAt: vtuPurchase.createdAt,
          updatedAt: vtuPurchase.updatedAt,
          userName: user.name,
          userEmail: user.email,
          serviceName: service.name,
        })
        .from(vtuPurchase)
        .innerJoin(user, eq(vtuPurchase.userId, user.id))
        .innerJoin(service, eq(vtuPurchase.serviceId, service.id))
        .where(statusCondition)
        .orderBy(desc(vtuPurchase.createdAt))
        .limit(limit)
        .offset(offset);

      const [countRow] = await db
        .select({ count: sql<string>`count(*)` })
        .from(vtuPurchase)
        .where(statusCondition);

      return { purchases: rows, total: Number(countRow?.count ?? 0) };
    },
  };
}

export type VtuPurchaseRepository = ReturnType<
  typeof createVtuPurchaseRepository
>;
