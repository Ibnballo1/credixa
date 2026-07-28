// File: packages/db/src/repositories/wallet-transaction-repository.ts
// Purpose: Data-access layer for the `wallet_transaction` ledger. There is
//          NO update or delete method here, on purpose — ledger rows are
//          immutable once inserted. The only writer of this table is
//          packages/db/src/ledger/wallet-ledger.ts, always inside a
//          db.transaction() alongside a wallet.balance update.

import { desc, eq, sql } from "drizzle-orm";
import type { Database } from "../client";
import { walletTransaction } from "../schema";

export type WalletTransactionRecord = typeof walletTransaction.$inferSelect;

export function createWalletTransactionRepository(db: Database) {
  return {
    async findById(id: string): Promise<WalletTransactionRecord | null> {
      const [row] = await db
        .select()
        .from(walletTransaction)
        .where(eq(walletTransaction.id, id))
        .limit(1);
      return row ?? null;
    },

    async listByWallet(
      walletId: string,
      limit = 20,
    ): Promise<WalletTransactionRecord[]> {
      return db
        .select()
        .from(walletTransaction)
        .where(eq(walletTransaction.walletId, walletId))
        .orderBy(desc(walletTransaction.createdAt))
        .limit(limit);
    },

    /**
     * Sums every ledger entry for a wallet — this is the "true" balance
     * per the ledger, independent of whatever `wallet.balance` currently
     * says. Used exclusively by the reconciliation job to detect drift.
     * Returns 0 (not null) for a wallet with no transactions yet.
     */
    async sumByWallet(walletId: string): Promise<number> {
      const [row] = await db
        .select({
          total: sql<string>`coalesce(sum(${walletTransaction.amount}), 0)`,
        })
        .from(walletTransaction)
        .where(eq(walletTransaction.walletId, walletId));
      return Number(row?.total ?? 0);
    },
  };
}

export type WalletTransactionRepository = ReturnType<
  typeof createWalletTransactionRepository
>;
