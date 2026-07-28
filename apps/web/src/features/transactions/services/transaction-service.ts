// File: apps/web/src/features/transactions/services/transaction-service.ts
// Purpose: Deliberately a stub. There is no `transactions` table yet —
//          its schema depends on decisions Phase 4 (Payments) and Phase 5
//          (VTU) haven't made yet (what a payment record vs. a VTU
//          purchase record needs to capture). Committing to a schema now
//          risked exactly the kind of rework Phase 0 flagged as a
//          long-term-vision risk. This function exists so the dashboard
//          page goes through a service call (keeping the layering rule
//          intact) rather than the component hardcoding an empty array
//          itself.

export interface TransactionSummary {
  id: string;
  description: string;
  amountKobo: number;
  createdAt: Date;
}

export async function getRecentTransactions(
  _userId: string,
): Promise<TransactionSummary[]> {
  // Phase 4/5 will replace this with a real query against the
  // `transactions` table once its schema is designed.
  return [];
}
