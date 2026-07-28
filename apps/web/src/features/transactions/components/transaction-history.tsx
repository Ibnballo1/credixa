/**
 * File: apps/web/src/features/transactions/components/transaction-history.tsx
 * Purpose: Transaction history shell for the dashboard. Renders a proper
 *          empty state today; once Phase 4/5 wire up real data through
 *          `transaction-service.ts`, this component's list-rendering
 *          branch (already written below) takes over with no further
 *          changes needed here.
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
          {transactions.map((tx) => (
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
              <span className="text-sm font-semibold text-slate-900">
                {formatKoboAsNaira(tx.amountKobo)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
