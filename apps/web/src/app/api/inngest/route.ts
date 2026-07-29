/**
 * File: apps/web/src/app/api/inngest/route.ts
 * Purpose: Registers every Inngest function with Inngest's platform. Add
 *          new job functions to the `functions` array as later phases
 *          introduce them (retry-failed-vtu-transaction, etc. — see
 *          docs/background-jobs.md) — this file itself should never
 *          contain job logic, only registration.
 */
import { serve } from "inngest/next";

import {
  inngest,
  walletReconciliation,
  pendingPaymentSweep,
  pendingVtuSweep,
} from "@credixa/lib/jobs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [walletReconciliation, pendingPaymentSweep, pendingVtuSweep],
});
