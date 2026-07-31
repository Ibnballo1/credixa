// File: packages/db/src/analytics/platform-stats.ts
// Purpose: Aggregate queries backing the admin dashboard overview
//          (Phase 6c). Deliberately simple, direct SQL aggregates rather
//          than a reporting/warehouse layer — appropriate for the
//          current data volume; revisit with materialized views or a
//          separate analytics store if these queries become slow at
//          scale.

import { and, count, eq, gte, sql } from "drizzle-orm";
import type { Database } from "../client";
import {
  user,
  wallet,
  walletTransaction,
  vtuPurchase,
  payment,
} from "../schema";

export interface PlatformStats {
  totalUsers: number;
  totalWalletBalanceKobo: number;
  last30Days: {
    fundingVolumeKobo: number;
    fundingCount: number;
    purchaseVolumeKobo: number;
    purchaseSuccessCount: number;
    purchaseFailedCount: number;
    purchaseSuccessRate: number | null; // null when there's no data to compute a rate from
  };
  pendingPurchaseCount: number;
  pendingPaymentCount: number;
}

export async function getPlatformStats(db: Database): Promise<PlatformStats> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [userCountRow] = await db.select({ value: count() }).from(user);

  const [walletBalanceRow] = await db
    .select({ value: sql<string>`coalesce(sum(${wallet.balance}), 0)` })
    .from(wallet);

  const [fundingRow] = await db
    .select({
      volume: sql<string>`coalesce(sum(${walletTransaction.amount}), 0)`,
      count: count(),
    })
    .from(walletTransaction)
    .where(
      and(
        eq(walletTransaction.type, "funding"),
        gte(walletTransaction.createdAt, thirtyDaysAgo),
      ),
    );

  const [purchaseVolumeRow] = await db
    .select({
      // purchase amounts are stored negative (debits) — abs() for a
      // human-readable "volume" figure.
      volume: sql<string>`coalesce(sum(abs(${walletTransaction.amount})), 0)`,
    })
    .from(walletTransaction)
    .where(
      and(
        eq(walletTransaction.type, "purchase"),
        gte(walletTransaction.createdAt, thirtyDaysAgo),
      ),
    );

  const [purchaseSuccessRow] = await db
    .select({ value: count() })
    .from(vtuPurchase)
    .where(
      and(
        eq(vtuPurchase.status, "success"),
        gte(vtuPurchase.createdAt, thirtyDaysAgo),
      ),
    );

  const [purchaseFailedRow] = await db
    .select({ value: count() })
    .from(vtuPurchase)
    .where(
      and(
        eq(vtuPurchase.status, "failed"),
        gte(vtuPurchase.createdAt, thirtyDaysAgo),
      ),
    );

  const [pendingPurchaseRow] = await db
    .select({ value: count() })
    .from(vtuPurchase)
    .where(eq(vtuPurchase.status, "pending"));

  const [pendingPaymentRow] = await db
    .select({ value: count() })
    .from(payment)
    .where(eq(payment.status, "initiated"));

  const successCount = purchaseSuccessRow?.value ?? 0;
  const failedCount = purchaseFailedRow?.value ?? 0;
  const totalResolved = successCount + failedCount;

  return {
    totalUsers: userCountRow?.value ?? 0,
    totalWalletBalanceKobo: Number(walletBalanceRow?.value ?? 0),
    last30Days: {
      fundingVolumeKobo: Number(fundingRow?.volume ?? 0),
      fundingCount: fundingRow?.count ?? 0,
      purchaseVolumeKobo: Number(purchaseVolumeRow?.volume ?? 0),
      purchaseSuccessCount: successCount,
      purchaseFailedCount: failedCount,
      purchaseSuccessRate:
        totalResolved > 0 ? successCount / totalResolved : null,
    },
    pendingPurchaseCount: pendingPurchaseRow?.value ?? 0,
    pendingPaymentCount: pendingPaymentRow?.value ?? 0,
  };
}
