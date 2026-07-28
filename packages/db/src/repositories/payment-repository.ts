// File: packages/db/src/repositories/payment-repository.ts
// Purpose: Data-access layer for the `payment` table. Status transitions
//          (success/failed/abandoned) and the walletTransactionId link
//          are only ever written by
//          packages/lib/src/payments/verify-and-credit-payment.ts — this
//          repository just needs to expose the right queries.

import { and, eq, lt } from "drizzle-orm";
import type { Database } from "../client";
import { payment } from "../schema";

export type PaymentRecord = typeof payment.$inferSelect;

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
  };
}

export type PaymentRepository = ReturnType<typeof createPaymentRepository>;
