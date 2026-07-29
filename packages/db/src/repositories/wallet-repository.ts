// File: packages/db/src/repositories/wallet-repository.ts
// Purpose: Data-access layer for the `wallet` table. Deliberately narrow
//          on BALANCE: there is no `debit`/`credit`/`setBalance` method —
//          that path is intentionally absent, handled only by
//          packages/db/src/ledger (Phase 3), wrapped in the
//          ledger-transaction pattern described in docs/wallet-ledger.md.
//          Adding a balance-mutating method here would be exactly the
//          kind of un-audited write that architecture is designed to
//          prevent. `setStatus` (Phase 6b) is fine to live here — freezing
//          isn't a balance mutation, and the ledger itself enforces the
//          resulting status (see docs/decisions/0011-wallet-status-enforcement-fix.md).

import { desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Database } from "../client";
import { wallet, user } from "../schema";

export type WalletRecord = typeof wallet.$inferSelect;

export interface WalletWithUser extends WalletRecord {
  userName: string;
  userEmail: string;
}

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

    async findById(id: string): Promise<WalletRecord | null> {
      const [row] = await db
        .select()
        .from(wallet)
        .where(eq(wallet.id, id))
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

    /**
     * Admin wallet list (Phase 6b) — joins the (read-only) `user` table
     * for display purposes. Reading `user` via a plain select here is
     * fine; WRITING to it must still only ever go through Better Auth's
     * API (see apps/admin/src/features/users/actions/manage-user.ts).
     */
    async listWithUser(params: {
      search?: string;
      limit?: number;
      offset?: number;
    }): Promise<{ wallets: WalletWithUser[]; total: number }> {
      const limit = params.limit ?? 20;
      const offset = params.offset ?? 0;

      const searchCondition = params.search
        ? or(
            ilike(user.name, `%${params.search}%`),
            ilike(user.email, `%${params.search}%`),
          )
        : undefined;

      const rows = await db
        .select({
          id: wallet.id,
          userId: wallet.userId,
          balance: wallet.balance,
          currency: wallet.currency,
          status: wallet.status,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
          userName: user.name,
          userEmail: user.email,
        })
        .from(wallet)
        .innerJoin(user, eq(wallet.userId, user.id))
        .where(searchCondition)
        .orderBy(desc(wallet.createdAt))
        .limit(limit)
        .offset(offset);

      const [countRow] = await db
        .select({ count: sql<string>`count(*)` })
        .from(wallet)
        .innerJoin(user, eq(wallet.userId, user.id))
        .where(searchCondition);

      return { wallets: rows, total: Number(countRow?.count ?? 0) };
    },

    async setStatus(
      id: string,
      status: "active" | "frozen",
    ): Promise<WalletRecord | null> {
      const [row] = await db
        .update(wallet)
        .set({ status, updatedAt: new Date() })
        .where(eq(wallet.id, id))
        .returning();
      return row ?? null;
    },
  };
}

export type WalletRepository = ReturnType<typeof createWalletRepository>;
