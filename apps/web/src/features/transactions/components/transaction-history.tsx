/**
 * File: apps/web/src/features/transactions/components/transaction-history.tsx
 * Purpose: Transaction history, now backed by real wallet_transaction
 *          rows as of Phase 4. Amounts are signed (positive = credit,
 *          negative = debit) — shown here with an explicit "+" prefix and
 *          green color for credits, since Intl's currency formatter only
 *          adds a sign for negative numbers by default.
 */
import { formatKoboAsNaira } from "@credixa/lib";
import type { TransactionSummary } from "../services/transaction-service";

export function TransactionHistory({
  transactions,
}: {
  transactions: TransactionSummary[];
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-slate-700">
        Recent activity
      </h2>

      {transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">No transactions yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Your airtime, data, and bill payments will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {transactions.map((tx) => {
            const isCredit = tx.amountKobo > 0;
            return (
              <li
                key={tx.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {tx.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    {tx.createdAt.toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${isCredit ? "text-primary" : "text-slate-900"}`}
                >
                  {isCredit ? "+" : ""}
                  {formatKoboAsNaira(tx.amountKobo)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
