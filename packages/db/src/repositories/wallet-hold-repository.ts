// File: packages/db/src/repositories/wallet-hold-repository.ts
// Purpose: Data-access layer for the `wallet_hold` table. Status
//          transitions (pending → finalized | released) are written here
//          via conditional updates (`WHERE status = 'pending'`), but the
//          orchestration deciding WHEN to transition — and the
//          accompanying wallet_transaction/wallet.balance writes for
//          finalization — lives in packages/db/src/ledger/wallet-holds.ts.

import { and, eq, sql } from "drizzle-orm";
import type { Database } from "../client";
import { walletHold } from "../schema";

export type WalletHoldRecord = typeof walletHold.$inferSelect;

export function createWalletHoldRepository(db: Database) {
  return {
    async findById(id: string): Promise<WalletHoldRecord | null> {
      const [row] = await db
        .select()
        .from(walletHold)
        .where(eq(walletHold.id, id))
        .limit(1);
      return row ?? null;
    },

    /**
     * Sum of all currently-pending holds for a wallet — this is what
     * "available balance" (balance minus pending holds) is computed
     * against at hold-creation time. Returns 0 for no pending holds.
     */
    async sumPendingByWallet(walletId: string): Promise<number> {
      const [row] = await db
        .select({ total: sql<string>`coalesce(sum(${walletHold.amount}), 0)` })
        .from(walletHold)
        .where(
          and(
            eq(walletHold.walletId, walletId),
            eq(walletHold.status, "pending"),
          ),
        );
      return Number(row?.total ?? 0);
    },

    /** The actual pending hold rows for a wallet — used by the admin
     * wallet detail view (Phase 6b) alongside sumPendingByWallet's
     * aggregate. */
    async listPendingByWallet(walletId: string): Promise<WalletHoldRecord[]> {
      return db
        .select()
        .from(walletHold)
        .where(
          and(
            eq(walletHold.walletId, walletId),
            eq(walletHold.status, "pending"),
          ),
        );
    },

    /**
     * Atomically transitions a hold from pending → finalized, only if it
     * is still pending. Returns null (not an error) if the hold was
     * already finalized or released by a concurrent/prior call — the
     * caller (wallet-holds.ts) treats null as "nothing to do."
     */
    async markFinalized(
      id: string,
      finalizedTransactionId: string,
    ): Promise<WalletHoldRecord | null> {
      const [row] = await db
        .update(walletHold)
        .set({
          status: "finalized",
          finalizedTransactionId,
          updatedAt: new Date(),
        })
        .where(and(eq(walletHold.id, id), eq(walletHold.status, "pending")))
        .returning();
      return row ?? null;
    },

    /** Same atomic-conditional pattern as markFinalized, for release. */
    async markReleased(id: string): Promise<WalletHoldRecord | null> {
      const [row] = await db
        .update(walletHold)
        .set({ status: "released", updatedAt: new Date() })
        .where(and(eq(walletHold.id, id), eq(walletHold.status, "pending")))
        .returning();
      return row ?? null;
    },
  };
}

export type WalletHoldRepository = ReturnType<
  typeof createWalletHoldRepository
>;
