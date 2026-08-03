// File: packages/db/src/repositories/payment-repository.ts
// Purpose: Data-access layer for the `payment` table. Status transitions
//          (success/failed/abandoned) and the walletTransactionId link
//          are only ever written by
//          packages/lib/src/payments/verify-and-credit-payment.ts — this
//          repository just needs to expose the right queries.

import { and, eq, lt, sql, desc, count } from "drizzle-orm";
import type { Database } from "../client";
import { payment, user } from "../schema";

export type PaymentRecord = typeof payment.$inferSelect;

export interface PaymentWithUser extends PaymentRecord {
  userName: string;
  userEmail: string;
}

export interface CreatePaymentInput {
  userId: string;
  walletId: string;
  reference: string;
  amountKobo: number;
}

export function createPaymentRepository(db: Database) {
  return {
    async create(input: CreatePaymentInput): Promise<PaymentRecord> {
      const [row] = await db
        .insert(payment)
        .values({
          userId: input.userId,
          walletId: input.walletId,
          reference: input.reference,
          amountKobo: input.amountKobo,
        })
        .returning();
      if (!row) {
        throw new Error(
          "createPaymentRepository.create: insert returned no row",
        );
      }
      return row;
    },

    async findByReference(reference: string): Promise<PaymentRecord | null> {
      const [row] = await db
        .select()
        .from(payment)
        .where(eq(payment.reference, reference))
        .limit(1);
      return row ?? null;
    },

    async findById(id: string): Promise<PaymentRecord | null> {
      const [row] = await db
        .select()
        .from(payment)
        .where(eq(payment.id, id))
        .limit(1);
      return row ?? null;
    },

    async listByUser(userId: string, limit = 20): Promise<PaymentRecord[]> {
      return db
        .select()
        .from(payment)
        .where(eq(payment.userId, userId))
        .limit(limit);
    },

    /** Used by the Phase 7b referral-qualification hook to detect a
     * user's first successful funding — count === 1 means "this one is
     * the first." */
    async countSuccessfulByUser(userId: string): Promise<number> {
      const [row] = await db
        .select({ value: count() })
        .from(payment)
        .where(and(eq(payment.userId, userId), eq(payment.status, "success")));
      return row?.value ?? 0;
    },

    /**
     * Payments stuck in "initiated" past `olderThan` — the user redirected
     * to Paystack but neither the callback page nor a webhook has
     * resolved the payment since. Consumed by the pending-payment-sweep
     * Inngest job (Phase 4's "failed payment recovery").
     */
    async listStaleInitiated(olderThan: Date): Promise<PaymentRecord[]> {
      return db
        .select()
        .from(payment)
        .where(
          and(
            eq(payment.status, "initiated"),
            lt(payment.createdAt, olderThan),
          ),
        );
    },

    async markSuccess(
      id: string,
      data: {
        walletTransactionId: string;
        channel: string | null;
        paidAt: Date;
        providerTransactionId: string | null;
        metadata: Record<string, unknown>;
      },
    ): Promise<PaymentRecord | null> {
      const [row] = await db
        .update(payment)
        .set({
          status: "success",
          walletTransactionId: data.walletTransactionId,
          channel: data.channel,
          paidAt: data.paidAt,
          providerTransactionId: data.providerTransactionId,
          metadata: data.metadata,
          updatedAt: new Date(),
        })
        // Conditional on NOT already success — makes this call safe to
        // invoke from multiple concurrent callers (callback page,
        // webhook, sweep) without double-crediting risk at this layer
        // too (the ledger's own idempotency key is the primary guard;
        // this is defense in depth).
        .where(and(eq(payment.id, id), eq(payment.status, "initiated")))
        .returning();
      return row ?? null;
    },

    async markFailed(
      id: string,
      status: "failed" | "abandoned",
      metadata: Record<string, unknown>,
    ): Promise<PaymentRecord | null> {
      const [row] = await db
        .update(payment)
        .set({ status, metadata, updatedAt: new Date() })
        .where(and(eq(payment.id, id), eq(payment.status, "initiated")))
        .returning();
      return row ?? null;
    },

    /** Platform-wide payment feed for Phase 6b's admin monitoring view. */
    async listAllWithUser(params: {
      status?: PaymentRecord["status"];
      limit?: number;
      offset?: number;
    }): Promise<{ payments: PaymentWithUser[]; total: number }> {
      const limit = params.limit ?? 50;
      const offset = params.offset ?? 0;
      const statusCondition = params.status
        ? eq(payment.status, params.status)
        : undefined;

      const rows = await db
        .select({
          id: payment.id,
          userId: payment.userId,
          walletId: payment.walletId,
          provider: payment.provider,
          status: payment.status,
          reference: payment.reference,
          providerTransactionId: payment.providerTransactionId,
          amountKobo: payment.amountKobo,
          currency: payment.currency,
          channel: payment.channel,
          walletTransactionId: payment.walletTransactionId,
          paidAt: payment.paidAt,
          metadata: payment.metadata,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          userName: user.name,
          userEmail: user.email,
        })
        .from(payment)
        .innerJoin(user, eq(payment.userId, user.id))
        .where(statusCondition)
        .orderBy(desc(payment.createdAt))
        .limit(limit)
        .offset(offset);

      const [countRow] = await db
        .select({ count: sql<string>`count(*)` })
        .from(payment)
        .where(statusCondition);

      return { payments: rows, total: Number(countRow?.count ?? 0) };
    },
  };
}

export type PaymentRepository = ReturnType<typeof createPaymentRepository>;
