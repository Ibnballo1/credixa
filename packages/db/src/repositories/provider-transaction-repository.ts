// File: packages/db/src/repositories/provider-transaction-repository.ts
// Purpose: Data-access layer for `provider_transaction` — one row per
//          actual API call attempt to a provider (a single vtu_purchase
//          can have several, across retries/failover).

import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { providerTransaction } from "../schema";

export type ProviderTransactionRecord = typeof providerTransaction.$inferSelect;

export interface LogProviderTransactionInput {
  vtuPurchaseId: string;
  providerId: string;
  requestPayload: unknown;
  responsePayload: unknown;
  success: boolean;
  errorMessage?: string | null;
}

export function createProviderTransactionRepository(db: Database) {
  return {
    async log(
      input: LogProviderTransactionInput,
    ): Promise<ProviderTransactionRecord> {
      const [row] = await db
        .insert(providerTransaction)
        .values(input)
        .returning();
      if (!row) {
        throw new Error(
          "createProviderTransactionRepository.log: insert returned no row",
        );
      }
      return row;
    },

    async listByPurchase(
      vtuPurchaseId: string,
    ): Promise<ProviderTransactionRecord[]> {
      return db
        .select()
        .from(providerTransaction)
        .where(eq(providerTransaction.vtuPurchaseId, vtuPurchaseId));
    },
  };
}

export type ProviderTransactionRepository = ReturnType<
  typeof createProviderTransactionRepository
>;
