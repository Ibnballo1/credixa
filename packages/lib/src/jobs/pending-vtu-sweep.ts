// File: packages/lib/src/jobs/pending-vtu-sweep.ts
// Purpose: Retry/reconciliation for VTU purchases left "pending" (a
//          provider acknowledged the order but settles asynchronously).
//          Calls resolvePendingPurchase, which re-checks status with the
//          SAME provider that accepted the order — never re-routes to a
//          different provider for an already-pending purchase.

import { createVtuPurchaseRepository, db } from "@credixa/db";
import { inngest } from "./inngest-client";
import { resolvePendingPurchase } from "../vtu/purchase-service";

const STALE_AFTER_MINUTES = 5;

export const pendingVtuSweep = inngest.createFunction(
  {
    id: "pending-vtu-sweep",
    retries: 2,
    triggers: [{ cron: "*/10 * * * *" }], // Inngest v4 trigger syntax
  },
  async ({ step }) => {
    const stalePurchases = await step.run("find-stale-purchases", async () => {
      const vtuPurchaseRepository = createVtuPurchaseRepository(db);
      const threshold = new Date(Date.now() - STALE_AFTER_MINUTES * 60 * 1000);
      return vtuPurchaseRepository.listStalePending(threshold);
    });

    const results: { reference: string; status: string }[] = [];

    for (const purchaseRow of stalePurchases) {
      const result = await step.run(
        `resolve-${purchaseRow.reference}`,
        async () => resolvePendingPurchase(purchaseRow.id),
      );

      results.push({
        reference: purchaseRow.reference,
        status: result.status,
      });
    }

    return { staleCount: stalePurchases.length, results };
  },
);
