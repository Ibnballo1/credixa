// File: packages/lib/src/jobs/wallet-reconciliation.ts
// Purpose: Scheduled (hourly) job that recomputes every wallet's balance
//          from the wallet_transaction ledger and compares it against the
//          cached wallet.balance column. Any drift means something wrote
//          to wallet.balance outside packages/db/src/ledger/'s sanctioned
//          path — see docs/wallet-ledger.md.

import { db, reconcileAllWallets } from "@credixa/db";
import { inngest } from "./inngest-client";

export const walletReconciliation = inngest.createFunction(
  {
    id: "wallet-reconciliation",
    retries: 2,
    triggers: [{ cron: "0 * * * *" }], // Inngest v4 trigger syntax
  },
  async ({ step }) => {
    const reports = await step.run("reconcile-all-wallets", async () => {
      return reconcileAllWallets(db);
    });

    const unhealthy = reports.filter((report) => !report.isHealthy);

    if (unhealthy.length > 0) {
      console.error("[wallet-reconciliation] balance drift detected", {
        unhealthyCount: unhealthy.length,
        totalWallets: reports.length,
        drifts: unhealthy.map((report) => ({
          walletId: report.walletId,
          cachedBalance: report.cachedBalance,
          ledgerBalance: report.ledgerBalance,
          driftKobo: report.driftKobo,
        })),
      });
    }

    return {
      totalWallets: reports.length,
      healthyCount: reports.length - unhealthy.length,
      unhealthyCount: unhealthy.length,
    };
  },
);
