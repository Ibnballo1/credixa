// File: packages/db/src/repositories/wallet-repository.ts
// Purpose: Data-access layer for the `wallet` table. Deliberately narrow:
//          only `findByUserId` and `createForUser` (both read/insert, no
//          update) exist. There is no `debit`/`credit`/`setBalance`
//          method — that path is intentionally absent until Phase 3
//          builds it wrapped in the ledger-transaction pattern described
//          in docs/wallet-ledger.md. Adding a balance-mutating method
//          here before then would be exactly the kind of un-audited write
//          that architecture is designed to prevent.

import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { wallet } from "../schema";

export type WalletRecord = typeof wallet.$inferSelect;

export function createWalletRepository(db: Database) {
  return {
    async findByUserId(userId: string): Promise<WalletRecord | null> {
      const [row] = await db
        .select()
        .from(wallet)
        .where(eq(wallet.userId, userId))
        .limit(1);
      return row ?? null;
    },

    /**
     * Creates a zero-balance wallet for a user. Safe to call even if a
     * wallet already exists — uses onConflictDoNothing against the
     * unique `userId` constraint, so concurrent calls (e.g. two tabs
     * loading the dashboard for a brand-new user at once) can't create
     * duplicates or throw.
     */
    async createForUser(userId: string): Promise<WalletRecord> {
      await db.insert(wallet).values({ userId }).onConflictDoNothing({
        target: wallet.userId,
      });

      const row = await this.findByUserId(userId);
      if (!row) {
        throw new Error(
          `createForUser: failed to create or find wallet for user ${userId}`,
        );
      }
      return row;
    },
  };
}

export type WalletRepository = ReturnType<typeof createWalletRepository>;
