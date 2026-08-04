// File: packages/lib/src/commissions/commission-service.ts
// Purpose: The only place a commission is awarded. Two entry points,
//          each triggered from exactly one place in the codebase:
//
//   awardReferralCommission — called from
//     packages/lib/src/payments/verify-and-credit-payment.ts right after
//     a referral qualifies (Phase 7b). Flat bonus, paid once.
//
//   awardAgentMarginCommission — called from
//     packages/lib/src/vtu/purchase-service.ts right after a VTU
//     purchase succeeds. Percentage cashback, only for purchasers whose
//     role is "agent" — a no-op for everyone else.
//
// Both rely on `commission`'s unique (sourceType, sourceId) index for
// idempotency: the create() call is attempted first, and a unique-
// violation means "already awarded," not an error — same claim-via-
// insert pattern as packages/db/src/ledger's idempotency_key protocol.
//
// See docs/decisions/0015-commission-engine-design.md for why these two
// specific trigger points and flat/percentage constants (not yet an
// admin-configurable rate table).

import {
  db,
  createCommissionRepository,
  createReferralRepository,
  createVtuPurchaseRepository,
  createUserRepository,
  createWalletRepository,
  creditWallet,
  isUniqueViolation,
} from "@credixa/db";

// v1 constants — see docs/decisions/0015-commission-engine-design.md for
// why these aren't an admin-configurable table yet.
const REFERRAL_COMMISSION_KOBO = 50_000; // NGN 500 flat, per qualified referral
const AGENT_MARGIN_BASIS_POINTS = 100; // 1% of the purchase amount

export interface AwardCommissionResult {
  status: "paid" | "already_awarded" | "not_applicable" | "failed";
  commissionId: string | null;
  reason?: string;
}

export async function awardReferralCommission(
  referralId: string,
): Promise<AwardCommissionResult> {
  return awardCommission({
    sourceType: "referral",
    sourceId: referralId,
    commissionType: "referral",
    resolveRecipientAndAmount: async () => {
      const referralRepository = createReferralRepository(db);
      const referralRow = await referralRepository.findById(referralId);
      if (!referralRow) return null;
      return {
        userId: referralRow.referrerUserId,
        amountKobo: REFERRAL_COMMISSION_KOBO,
      };
    },
  });
}

export async function awardAgentMarginCommission(
  vtuPurchaseId: string,
): Promise<AwardCommissionResult> {
  return awardCommission({
    sourceType: "vtu_purchase",
    sourceId: vtuPurchaseId,
    commissionType: "agent_margin",
    resolveRecipientAndAmount: async () => {
      const vtuPurchaseRepository = createVtuPurchaseRepository(db);
      const purchaseRow = await vtuPurchaseRepository.findById(vtuPurchaseId);
      if (!purchaseRow || purchaseRow.status !== "success") return null;

      const userRepository = createUserRepository(db);
      const userRow = await userRepository.findById(purchaseRow.userId);
      if (!userRow || userRow.role !== "agent") {
        return null; // not an agent purchase — no margin commission applies
      }

      const amountKobo = Math.round(
        (purchaseRow.amountKobo * AGENT_MARGIN_BASIS_POINTS) / 10_000,
      );
      if (amountKobo <= 0) return null;

      return { userId: purchaseRow.userId, amountKobo };
    },
  });
}

/**
 * Shared awarding routine. Order matters: the `commission` row is
 * created FIRST (relying on its unique (sourceType, sourceId) index for
 * idempotency, same claim-via-insert pattern as the ledger's
 * idempotency_key), and only once that succeeds does the actual wallet
 * credit happen. This ordering means a crashed process between "row
 * created" and "wallet credited" leaves a `pending` commission rather
 * than a silently-lost one — visible in the admin monitoring view for
 * manual follow-up rather than invisible.
 */
async function awardCommission(input: {
  sourceType: string;
  sourceId: string;
  commissionType: "referral" | "agent_margin";
  resolveRecipientAndAmount: () => Promise<{
    userId: string;
    amountKobo: number;
  } | null>;
}): Promise<AwardCommissionResult> {
  const commissionRepository = createCommissionRepository(db);

  const existing = await commissionRepository.findBySource(
    input.sourceType,
    input.sourceId,
  );
  if (existing) {
    return { status: "already_awarded", commissionId: existing.id };
  }

  const resolved = await input.resolveRecipientAndAmount();
  if (!resolved) {
    return { status: "not_applicable", commissionId: null };
  }

  let commissionRow;
  try {
    commissionRow = await commissionRepository.create({
      userId: resolved.userId,
      type: input.commissionType,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      amountKobo: resolved.amountKobo,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      const raced = await commissionRepository.findBySource(
        input.sourceType,
        input.sourceId,
      );
      return { status: "already_awarded", commissionId: raced?.id ?? null };
    }
    throw err;
  }

  try {
    const walletRepository = createWalletRepository(db);
    const walletRow = await walletRepository.createForUser(resolved.userId);

    const creditResult = await creditWallet(db, {
      walletId: walletRow.id,
      amountKobo: resolved.amountKobo,
      type: "commission",
      idempotencyKey: `commission:${input.sourceType}:${input.sourceId}`,
      description:
        input.commissionType === "referral"
          ? "Referral commission"
          : "Agent margin commission",
      actorUserId: null,
    });

    await commissionRepository.markPaid(
      commissionRow.id,
      creditResult.transaction.id,
    );
    return { status: "paid", commissionId: commissionRow.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await commissionRepository.markFailed(commissionRow.id, message);
    return {
      status: "failed",
      commissionId: commissionRow.id,
      reason: message,
    };
  }
}
