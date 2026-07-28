// File: packages/lib/src/jobs/pending-payment-sweep.ts
// Purpose: "Failed payment recovery." A payment can get stuck in
//          "initiated" if the user closes the tab before returning to the
//          callback page AND the webhook never arrives (network issue,
//          Paystack outage, webhook URL misconfigured, etc.). This job
//          periodically finds those and resolves them the same way every
//          other path does — through verifyAndCreditPayment, which
//          re-checks Paystack's own API rather than guessing.

import { createPaymentRepository, db } from "@credixa/db";
import { inngest } from "./inngest-client";
import { verifyAndCreditPayment } from "../payments/verify-and-credit-payment";

const STALE_AFTER_MINUTES = 10;

export const pendingPaymentSweep = inngest.createFunction(
  {
    id: "pending-payment-sweep",
    retries: 2,
    triggers: [{ cron: "*/15 * * * *" }], // Inngest v4 trigger syntax
  },
  async ({ step }) => {
    const stalePayments = await step.run("find-stale-payments", async () => {
      const paymentRepository = createPaymentRepository(db);
      const threshold = new Date(Date.now() - STALE_AFTER_MINUTES * 60 * 1000);
      return paymentRepository.listStaleInitiated(threshold);
    });

    const results: { reference: string; status: string }[] = [];

    for (const paymentRow of stalePayments) {
      // Each payment resolved in its own step — if one fails (e.g.
      // Paystack rate-limits us mid-sweep), Inngest retries only that
      // step's remaining work on the next attempt, not the whole batch
      // from scratch.
      const result = await step.run(
        `resolve-${paymentRow.reference}`,
        async () => {
          return verifyAndCreditPayment(paymentRow.reference);
        },
      );
      results.push({ reference: paymentRow.reference, status: result.status });
    }

    return { staleCount: stalePayments.length, results };
  },
);
