// File: packages/lib/src/vtu/purchase-service.ts
// Purpose: The only place a VTU purchase is initiated or resolved. Two
//          entry points:
//
//   initiatePurchase — called ONCE by the customer-facing server action.
//     Reserves funds via a hold (Phase 3), routes to a provider (via
//     ProviderRouter), and either finalizes the hold (success), leaves
//     it pending (provider accepted but settles async), or releases it
//     (every provider failed).
//
//   resolvePendingPurchase — called by the retry/sweep job for purchases
//     left "pending." Re-checks status with the SAME provider that
//     accepted the order (via checkPurchaseStatus) — it does NOT re-run
//     the router across all providers again, which would risk
//     double-submitting an order a provider already accepted.

import {
  db,
  createServiceRepository,
  createProviderRepository,
  createVtuPurchaseRepository,
  createProviderTransactionRepository,
  createHold,
  finalizeHold,
  releaseHold,
} from "@credixa/db";
import {
  routePurchase,
  checkPurchaseStatus,
} from "../providers/provider-router";
import { redactRequestForLogging } from "../providers/types";
import type { PurchaseOutcome } from "../providers/types";

export interface InitiatePurchaseInput {
  userId: string;
  walletId: string;
  serviceId: string;
  amountKobo: number;
  /** Caller-supplied, stable across retries of the SAME purchase attempt
   * from the UI — this is what makes double-submission (e.g. a form
   * double-click) safe. */
  idempotencyKey: string;
  recipientPhone?: string;
  recipientMeterNumber?: string;
  recipientSmartCardNumber?: string;
}

export type PurchaseResultStatus = "success" | "pending" | "failed";

export interface PurchaseResult {
  status: PurchaseResultStatus;
  purchaseId: string;
  reason?: string;
}

interface RoutedAttempt {
  providerId: string;
  providerName: string;
  outcome: PurchaseOutcome;
}

export async function initiatePurchase(
  input: InitiatePurchaseInput,
): Promise<PurchaseResult> {
  const serviceRepository = createServiceRepository(db);
  const vtuPurchaseRepository = createVtuPurchaseRepository(db);
  const providerTransactionRepository = createProviderTransactionRepository(db);

  const serviceRow = await serviceRepository.findById(input.serviceId);
  if (!serviceRow) {
    throw new Error(`initiatePurchase: service ${input.serviceId} not found`);
  }

  // Idempotency check FIRST — if this exact purchase attempt was already
  // recorded (reference = idempotencyKey), don't create a second hold.
  let purchaseRow = await vtuPurchaseRepository.findByReference(
    input.idempotencyKey,
  );
  if (purchaseRow && purchaseRow.status !== "pending") {
    return purchaseRow.status === "success"
      ? { status: "success", purchaseId: purchaseRow.id }
      : {
          status: "failed",
          purchaseId: purchaseRow.id,
          reason: purchaseRow.lastError ?? "Unknown error",
        };
  }

  if (!purchaseRow) {
    // Step 1: reserve funds — nothing is charged yet.
    const holdResult = await createHold(db, {
      walletId: input.walletId,
      amountKobo: input.amountKobo,
      idempotencyKey: `${input.idempotencyKey}:hold`,
      description: `${serviceRow.name} purchase`,
      actorUserId: input.userId,
    });

    purchaseRow = await vtuPurchaseRepository.create({
      userId: input.userId,
      walletId: input.walletId,
      serviceId: input.serviceId,
      reference: input.idempotencyKey,
      amountKobo: input.amountKobo,
      walletHoldId: holdResult.hold.id,
      ...(input.recipientPhone ? { recipientPhone: input.recipientPhone } : {}),
      ...(input.recipientMeterNumber
        ? { recipientMeterNumber: input.recipientMeterNumber }
        : {}),
      ...(input.recipientSmartCardNumber
        ? { recipientSmartCardNumber: input.recipientSmartCardNumber }
        : {}),
    });
  }

  // Step 2: route to a provider.
  const routeResult = await routePurchase({
    type: serviceRow.type,
    network: serviceRow.network,
    amountKobo: input.amountKobo,
    requestReference: input.idempotencyKey,
    ...(input.recipientPhone ? { recipientPhone: input.recipientPhone } : {}),
    ...(input.recipientMeterNumber
      ? { recipientMeterNumber: input.recipientMeterNumber }
      : {}),
    ...(input.recipientSmartCardNumber
      ? { recipientSmartCardNumber: input.recipientSmartCardNumber }
      : {}),
    ...(serviceRow.providerPlanCode
      ? { providerPlanCode: serviceRow.providerPlanCode }
      : {}),
  });

  await logAttempts(
    providerTransactionRepository,
    vtuPurchaseRepository,
    purchaseRow.id,
    { network: serviceRow.network, amountKobo: input.amountKobo },
    routeResult.attempts,
  );

  const lastAttempt = routeResult.attempts[routeResult.attempts.length - 1];

  return resolveOutcome({
    purchaseId: purchaseRow.id,
    walletHoldId: purchaseRow.walletHoldId,
    userId: input.userId,
    serviceName: serviceRow.name,
    idempotencyKey: input.idempotencyKey,
    providerId: lastAttempt?.providerId ?? null,
    finalOutcome: routeResult.finalOutcome,
  });
}

/**
 * Called by the retry/sweep job for a purchase currently "pending."
 * Re-checks status with the SAME provider that last accepted it —
 * deliberately does not re-run the router, since the order was already
 * accepted by that provider and re-submitting elsewhere risks fulfilling
 * it twice.
 */
export async function resolvePendingPurchase(
  purchaseId: string,
): Promise<PurchaseResult> {
  const vtuPurchaseRepository = createVtuPurchaseRepository(db);
  const providerRepository = createProviderRepository(db);
  const providerTransactionRepository = createProviderTransactionRepository(db);

  const purchaseRow = await vtuPurchaseRepository.findById(purchaseId);
  if (!purchaseRow) {
    throw new Error(`resolvePendingPurchase: purchase ${purchaseId} not found`);
  }
  if (purchaseRow.status !== "pending") {
    return purchaseRow.status === "success"
      ? { status: "success", purchaseId }
      : {
          status: "failed",
          purchaseId,
          reason: purchaseRow.lastError ?? "Unknown error",
        };
  }
  if (!purchaseRow.providerId || !purchaseRow.providerReference) {
    // Never got far enough to receive a provider reference — nothing to
    // re-check yet. Leave as pending; persistent cases surface via the
    // sweep job's own logging for a human to investigate.
    return { status: "pending", purchaseId };
  }

  const providerRow = await providerRepository.findById(purchaseRow.providerId);
  if (!providerRow) {
    return { status: "pending", purchaseId };
  }

  const outcome = await checkPurchaseStatus(
    providerRow.name,
    purchaseRow.providerReference,
  );

  await providerTransactionRepository.log({
    vtuPurchaseId: purchaseId,
    providerId: purchaseRow.providerId,
    requestPayload: {
      action: "checkStatus",
      providerReference: purchaseRow.providerReference,
    },
    responsePayload: outcome.raw,
    success: outcome.status !== "failed",
    errorMessage: outcome.status === "failed" ? outcome.reason : null,
  });

  return resolveOutcome({
    purchaseId,
    walletHoldId: purchaseRow.walletHoldId,
    userId: purchaseRow.userId,
    serviceName: "purchase",
    idempotencyKey: purchaseRow.reference,
    providerId: purchaseRow.providerId,
    finalOutcome: outcome,
  });
}

async function logAttempts(
  providerTransactionRepository: ReturnType<
    typeof createProviderTransactionRepository
  >,
  vtuPurchaseRepository: ReturnType<typeof createVtuPurchaseRepository>,
  purchaseId: string,
  requestContext: { network: string; amountKobo: number },
  attempts: RoutedAttempt[],
): Promise<void> {
  for (const attempt of attempts) {
    await providerTransactionRepository.log({
      vtuPurchaseId: purchaseId,
      providerId: attempt.providerId,
      requestPayload: redactRequestForLogging({ ...requestContext }, []),
      responsePayload: attempt.outcome.raw,
      success: attempt.outcome.status !== "failed",
      errorMessage:
        attempt.outcome.status === "failed" ? attempt.outcome.reason : null,
    });
    await vtuPurchaseRepository.recordAttempt(purchaseId, {
      providerId: attempt.providerId,
      lastError:
        attempt.outcome.status === "failed" ? attempt.outcome.reason : null,
    });
  }
}

async function resolveOutcome(input: {
  purchaseId: string;
  walletHoldId: string;
  userId: string;
  serviceName: string;
  idempotencyKey: string;
  providerId: string | null;
  finalOutcome: PurchaseOutcome;
}): Promise<PurchaseResult> {
  const vtuPurchaseRepository = createVtuPurchaseRepository(db);

  if (input.finalOutcome.status === "success") {
    const finalized = await finalizeHold(db, {
      holdId: input.walletHoldId,
      idempotencyKey: `${input.idempotencyKey}:finalize`,
      description: `${input.serviceName} purchase`,
      actorUserId: input.userId,
    });

    if (!input.providerId) {
      throw new Error(
        `resolveOutcome: purchase ${input.purchaseId} succeeded with no providerId recorded`,
      );
    }

    await vtuPurchaseRepository.markSuccess(input.purchaseId, {
      providerId: input.providerId,
      providerReference: input.finalOutcome.providerReference,
      walletTransactionId: finalized.transaction.id,
    });

    return { status: "success", purchaseId: input.purchaseId };
  }

  if (input.finalOutcome.status === "pending") {
    return { status: "pending", purchaseId: input.purchaseId };
  }

  await releaseHold(db, {
    holdId: input.walletHoldId,
    idempotencyKey: `${input.idempotencyKey}:release`,
    reason: input.finalOutcome.reason,
    actorUserId: input.userId,
  });
  await vtuPurchaseRepository.markFailed(
    input.purchaseId,
    input.finalOutcome.reason,
  );

  return {
    status: "failed",
    purchaseId: input.purchaseId,
    reason: input.finalOutcome.reason,
  };
}
