// File: packages/db/src/repositories/wallet-transaction-repository.ts
// Purpose: Data-access layer for the `wallet_transaction` ledger. There is
//          NO update or delete method here, on purpose — ledger rows are
//          immutable once inserted. The only writer of this table is
//          packages/db/src/ledger/wallet-ledger.ts, always inside a
//          db.transaction() alongside a wallet.balance update.

import { desc, eq, sql } from "drizzle-orm";
import type { Database } from "../client";
import { walletTransaction, wallet, user } from "../schema";

export type WalletTransactionRecord = typeof walletTransaction.$inferSelect;

export interface WalletTransactionWithUser extends WalletTransactionRecord {
  userName: string;
  userEmail: string;
}

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

    /**
     * Platform-wide transaction feed for Phase 6b's admin monitoring
     * view — joins through `wallet` to `user` (read-only join, same
     * caveat as wallet-repository.ts's listWithUser: writing to `user`
     * must still only go through Better Auth's API).
     */
    async listAllWithUser(params: {
      type?: WalletTransactionRecord["type"];
      limit?: number;
      offset?: number;
    }): Promise<{ transactions: WalletTransactionWithUser[]; total: number }> {
      const limit = params.limit ?? 50;
      const offset = params.offset ?? 0;
      const typeCondition = params.type
        ? eq(walletTransaction.type, params.type)
        : undefined;

      const rows = await db
        .select({
          id: walletTransaction.id,
          walletId: walletTransaction.walletId,
          type: walletTransaction.type,
          amount: walletTransaction.amount,
          balanceBefore: walletTransaction.balanceBefore,
          balanceAfter: walletTransaction.balanceAfter,
          reference: walletTransaction.reference,
          idempotencyKey: walletTransaction.idempotencyKey,
          description: walletTransaction.description,
          metadata: walletTransaction.metadata,
          createdAt: walletTransaction.createdAt,
          userName: user.name,
          userEmail: user.email,
        })
        .from(walletTransaction)
        .innerJoin(wallet, eq(walletTransaction.walletId, wallet.id))
        .innerJoin(user, eq(wallet.userId, user.id))
        .where(typeCondition)
        .orderBy(desc(walletTransaction.createdAt))
        .limit(limit)
        .offset(offset);

      const [countRow] = await db
        .select({ count: sql<string>`count(*)` })
        .from(walletTransaction)
        .where(typeCondition);

      return { transactions: rows, total: Number(countRow?.count ?? 0) };
    },
  };
}

export type WalletTransactionRepository = ReturnType<
  typeof createWalletTransactionRepository
>;
