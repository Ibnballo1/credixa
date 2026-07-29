// File: packages/db/src/ledger/wallet-holds.ts
// Purpose: The debit-then-confirm pattern for operations where success
//          isn't known until an external step completes (e.g. a Phase 5
//          VTU provider call). A hold reserves funds WITHOUT writing a
//          wallet_transaction or touching wallet.balance — "available
//          balance" is computed as wallet.balance minus the sum of that
//          wallet's pending holds, checked fresh on every createHold
//          call. This keeps the invariant in docs/wallet-ledger.md exact:
//          wallet.balance changes ONLY via a wallet_transaction row,
//          holds included — finalizing a hold is what produces that row.

import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "../client";
import {
  wallet,
  walletHold,
  idempotencyKey,
  walletTransaction,
  auditLog,
} from "../schema";
import type { WalletHoldRecord } from "../repositories/wallet-hold-repository";
import type { LedgerOperationResult } from "./wallet-ledger";
import { isUniqueViolation } from "./is-unique-violation";
import { generateReference } from "./generate-reference";
import {
  InsufficientBalanceError,
  WalletNotFoundError,
  WalletHoldNotFoundError,
  WalletFrozenError,
  IdempotencyIntegrityError,
} from "./errors";

export interface HoldOperationResult {
  hold: WalletHoldRecord;
  alreadyProcessed: boolean;
}

export interface CreateHoldInput {
  walletId: string;
  /** Must be a positive integer (kobo). */
  amountKobo: number;
  idempotencyKey: string;
  description?: string;
  metadata?: Record<string, unknown>;
  actorUserId: string | null;
}

export async function createHold(
  db: Database,
  input: CreateHoldInput,
): Promise<HoldOperationResult> {
  if (!Number.isInteger(input.amountKobo) || input.amountKobo <= 0) {
    throw new Error("createHold: amountKobo must be a positive integer");
  }

  return db.transaction(async (tx) => {
    const preGeneratedId = randomUUID();

    try {
      await tx.insert(idempotencyKey).values({
        key: input.idempotencyKey,
        operation: "wallet.hold.create",
        resultType: "wallet_hold",
        resultId: preGeneratedId,
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;

      const [existingKey] = await tx
        .select()
        .from(idempotencyKey)
        .where(eq(idempotencyKey.key, input.idempotencyKey))
        .limit(1);
      if (!existingKey) {
        throw new IdempotencyIntegrityError(
          input.idempotencyKey,
          "unique violation on insert but no existing row found on lookup",
        );
      }

      const [existingHold] = await tx
        .select()
        .from(walletHold)
        .where(eq(walletHold.id, existingKey.resultId))
        .limit(1);
      if (!existingHold) {
        throw new IdempotencyIntegrityError(
          input.idempotencyKey,
          `points to missing wallet_hold ${existingKey.resultId}`,
        );
      }

      return { hold: existingHold, alreadyProcessed: true };
    }

    const [walletRow] = await tx
      .select()
      .from(wallet)
      .where(eq(wallet.id, input.walletId))
      .for("update")
      .limit(1);
    if (!walletRow) {
      throw new WalletNotFoundError(input.walletId);
    }
    if (walletRow.status !== "active") {
      throw new WalletFrozenError(input.walletId);
    }

    const [pendingSumRow] = await tx
      .select({ total: sql<string>`coalesce(sum(${walletHold.amount}), 0)` })
      .from(walletHold)
      .where(
        and(
          eq(walletHold.walletId, input.walletId),
          eq(walletHold.status, "pending"),
        ),
      );
    const pendingHoldsTotal = Number(pendingSumRow?.total ?? 0);

    const available = walletRow.balance - pendingHoldsTotal;
    if (available < input.amountKobo) {
      throw new InsufficientBalanceError(
        input.walletId,
        available,
        input.amountKobo,
      );
    }

    const [holdRow] = await tx
      .insert(walletHold)
      .values({
        id: preGeneratedId,
        walletId: input.walletId,
        amount: input.amountKobo,
        status: "pending",
        reference: generateReference("HOLD"),
        idempotencyKey: input.idempotencyKey,
        description: input.description,
        metadata: input.metadata,
      })
      .returning();

    if (!holdRow) {
      throw new Error("createHold: insert returned no row");
    }

    await tx.insert(auditLog).values({
      actorUserId: input.actorUserId,
      action: "wallet.hold.create",
      entityType: "wallet_hold",
      entityId: holdRow.id,
      metadata: { amount: input.amountKobo, availableBeforeHold: available },
    });

    return { hold: holdRow, alreadyProcessed: false };
  });
}

export interface FinalizeHoldInput {
  holdId: string;
  idempotencyKey: string;
  description?: string;
  metadata?: Record<string, unknown>;
  actorUserId: string | null;
}

/** Converts a pending hold into a real ledger debit — call this once the
 * external step (e.g. provider call) the hold was protecting has
 * succeeded. */
export async function finalizeHold(
  db: Database,
  input: FinalizeHoldInput,
): Promise<LedgerOperationResult> {
  return db.transaction(async (tx) => {
    const preGeneratedTxnId = randomUUID();

    try {
      await tx.insert(idempotencyKey).values({
        key: input.idempotencyKey,
        operation: "wallet.hold.finalize",
        resultType: "wallet_transaction",
        resultId: preGeneratedTxnId,
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;

      const [existingKey] = await tx
        .select()
        .from(idempotencyKey)
        .where(eq(idempotencyKey.key, input.idempotencyKey))
        .limit(1);
      if (!existingKey) {
        throw new IdempotencyIntegrityError(
          input.idempotencyKey,
          "unique violation on insert but no existing row found on lookup",
        );
      }

      const [existingTxn] = await tx
        .select()
        .from(walletTransaction)
        .where(eq(walletTransaction.id, existingKey.resultId))
        .limit(1);
      if (!existingTxn) {
        throw new IdempotencyIntegrityError(
          input.idempotencyKey,
          `points to missing wallet_transaction ${existingKey.resultId}`,
        );
      }

      return { transaction: existingTxn, alreadyProcessed: true };
    }

    const [holdRow] = await tx
      .select()
      .from(walletHold)
      .where(eq(walletHold.id, input.holdId))
      .limit(1);
    if (!holdRow) {
      throw new WalletHoldNotFoundError(input.holdId);
    }
    if (holdRow.status !== "pending") {
      // Should be unreachable if callers always reuse the same
      // idempotency key for retries of the same finalize attempt — this
      // means a genuinely new idempotency key was used against a hold
      // that isn't pending anymore. Fail loudly rather than silently
      // double-processing or no-op-ing.
      throw new Error(
        `finalizeHold: hold ${input.holdId} is not pending (status: ${holdRow.status})`,
      );
    }

    const [walletRow] = await tx
      .select()
      .from(wallet)
      .where(eq(wallet.id, holdRow.walletId))
      .for("update")
      .limit(1);
    if (!walletRow) {
      throw new WalletNotFoundError(holdRow.walletId);
    }

    const balanceBefore = walletRow.balance;
    const balanceAfter = balanceBefore - holdRow.amount;
    if (balanceAfter < 0) {
      // Shouldn't happen if createHold correctly reserved the amount,
      // but never let balance go negative under any code path.
      throw new InsufficientBalanceError(
        holdRow.walletId,
        balanceBefore,
        holdRow.amount,
      );
    }

    const [txnRow] = await tx
      .insert(walletTransaction)
      .values({
        id: preGeneratedTxnId,
        walletId: holdRow.walletId,
        type: "purchase",
        amount: -holdRow.amount,
        balanceBefore,
        balanceAfter,
        reference: generateReference("TXN"),
        idempotencyKey: input.idempotencyKey,
        description: input.description ?? holdRow.description,
        metadata: input.metadata,
      })
      .returning();
    if (!txnRow) {
      throw new Error(
        "finalizeHold: wallet_transaction insert returned no row",
      );
    }

    await tx
      .update(wallet)
      .set({ balance: balanceAfter, updatedAt: new Date() })
      .where(eq(wallet.id, holdRow.walletId));

    const [updatedHold] = await tx
      .update(walletHold)
      .set({
        status: "finalized",
        finalizedTransactionId: txnRow.id,
        updatedAt: new Date(),
      })
      .where(
        and(eq(walletHold.id, holdRow.id), eq(walletHold.status, "pending")),
      )
      .returning();

    if (!updatedHold) {
      // The wallet row-lock above serializes concurrent
      // finalize/release attempts on this hold, so reaching here means
      // something is structurally wrong, not a benign race.
      throw new Error(
        `finalizeHold: hold ${holdRow.id} status changed unexpectedly`,
      );
    }

    await tx.insert(auditLog).values({
      actorUserId: input.actorUserId,
      action: "wallet.hold.finalize",
      entityType: "wallet_transaction",
      entityId: txnRow.id,
      metadata: {
        holdId: holdRow.id,
        amount: holdRow.amount,
        balanceBefore,
        balanceAfter,
      },
    });

    return { transaction: txnRow, alreadyProcessed: false };
  });
}

export interface ReleaseHoldInput {
  holdId: string;
  idempotencyKey: string;
  reason?: string;
  actorUserId: string | null;
}

/** Cancels a pending hold without ever touching wallet.balance or the
 * ledger — call this once the external step the hold was protecting has
 * failed or timed out. */
export async function releaseHold(
  db: Database,
  input: ReleaseHoldInput,
): Promise<HoldOperationResult> {
  return db.transaction(async (tx) => {
    const [holdBeforeCheck] = await tx
      .select()
      .from(walletHold)
      .where(eq(walletHold.id, input.holdId))
      .limit(1);
    if (!holdBeforeCheck) {
      throw new WalletHoldNotFoundError(input.holdId);
    }

    try {
      // Releasing doesn't create a wallet_transaction, so the
      // idempotency key's resultId points back at the hold itself.
      await tx.insert(idempotencyKey).values({
        key: input.idempotencyKey,
        operation: "wallet.hold.release",
        resultType: "wallet_hold",
        resultId: input.holdId,
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      return { hold: holdBeforeCheck, alreadyProcessed: true };
    }

    // Safe without a prior explicit row lock: Postgres takes an implicit
    // row lock for the duration of an UPDATE, so a concurrent
    // finalize/release targeting the same row serializes here too, and
    // the `status = 'pending'` guard re-evaluates after that lock clears.
    const [releasedRow] = await tx
      .update(walletHold)
      .set({ status: "released", updatedAt: new Date() })
      .where(
        and(eq(walletHold.id, input.holdId), eq(walletHold.status, "pending")),
      )
      .returning();

    if (!releasedRow) {
      throw new Error(
        `releaseHold: hold ${input.holdId} was not pending (status: ${holdBeforeCheck.status})`,
      );
    }

    await tx.insert(auditLog).values({
      actorUserId: input.actorUserId,
      action: "wallet.hold.release",
      entityType: "wallet_hold",
      entityId: releasedRow.id,
      metadata: { reason: input.reason ?? null },
    });

    return { hold: releasedRow, alreadyProcessed: false };
  });
}
