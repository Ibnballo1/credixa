// File: packages/db/src/repositories/payment-webhook-repository.ts
// Purpose: Data-access layer for the `payment_webhook` table — logs every
//          inbound webhook (valid or not) before any processing decision
//          is made.

import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { paymentWebhook } from "../schema";

export type PaymentWebhookRecord = typeof paymentWebhook.$inferSelect;

export interface LogWebhookInput {
  provider: string;
  eventType: string;
  reference: string | null;
  rawPayload: unknown;
  signatureValid: boolean;
}

export function createPaymentWebhookRepository(db: Database) {
  return {
    async log(input: LogWebhookInput): Promise<PaymentWebhookRecord> {
      const [row] = await db.insert(paymentWebhook).values(input).returning();
      if (!row) {
        throw new Error(
          "createPaymentWebhookRepository.log: insert returned no row",
        );
      }
      return row;
    },

    async markProcessed(id: string): Promise<void> {
      await db
        .update(paymentWebhook)
        .set({ processedAt: new Date() })
        .where(eq(paymentWebhook.id, id));
    },

    async markProcessingError(id: string, error: string): Promise<void> {
      await db
        .update(paymentWebhook)
        .set({ processingError: error })
        .where(eq(paymentWebhook.id, id));
    },
  };
}

export type PaymentWebhookRepository = ReturnType<
  typeof createPaymentWebhookRepository
>;
