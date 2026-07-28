// File: packages/db/src/ledger/wallet-ledger.ts
// Purpose: The ONLY code path permitted to change `wallet.balance`. Every
//          credit or debit — regardless of what triggers it (funding,
//          purchase, refund, commission, manual admin adjustment) — goes
//          through `creditWallet` or `debitWallet` below, which both wrap
//          a single shared, transaction-safe routine. See
//          docs/wallet-ledger.md for the full invariant this implements.
//
// Why this lives in packages/db, not an app-level service: both
// apps/web (customer-triggered funding/purchases, once Phase 4/5 exist)
// and apps/admin (manual corrections, Phase 6) need this same guarantee,
// and only packages/db has access to `db.transaction()`. This is a
// deliberate, documented exception to "packages/db is thin repositories
// only" — see docs/decisions/0006-audit-log-pulled-forward-to-phase-3.md
// for the related reasoning on audit_log.

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { wallet, idempotencyKey, walletTransaction, auditLog } from "../schema";
import type { WalletTransactionRecord } from "../repositories/wallet-transaction-repository";
import { isUniqueViolation } from "./is-unique-violation";
import { generateReference } from "./generate-reference";
import {
  InsufficientBalanceError,
  WalletNotFoundError,
  IdempotencyIntegrityError,
} from "./errors";

type LedgerTransactionType =
  | "funding"
  | "purchase"
  | "refund"
  | "reversal"
  | "commission"
  | "adjustment";

export interface LedgerOperationResult {
  transaction: WalletTransactionRecord;
  /** True if this call was a replay of an already-processed idempotency key. */
  alreadyProcessed: boolean;
}

interface ApplyLedgerEntryInput {
  walletId: string;
  /** Positive = credit, negative = debit. */
  signedAmount: number;
  type: LedgerTransactionType;
  idempotencyKey: string;
  operation: string;
  description?: string;
  metadata?: Record<string, unknown>;
  actorUserId: string | null;
}

/**
 * Shared routine for every ledger write. Protocol, in order:
 *   1. Pre-generate the wallet_transaction's id.
 *   2. Insert the idempotency_key row FIRST, using that pre-generated id
 *      as resultId. If this insert hits a unique violation, this exact
 *      idempotencyKey was already used — look up the original result and
 *      return it unchanged (alreadyProcessed: true). No other write in
 *      this function happens in that case.
 *   3. Row-lock the wallet (`SELECT ... FOR UPDATE`) so concurrent
 *      operations on the SAME wallet serialize instead of racing.
 *   4. Compute balanceAfter = balanceBefore + signedAmount. Reject if
 *      negative (insufficient balance) — this is the only place that
 *      check happens, so it can never be bypassed by a caller.
 *   5. Insert the immutable wallet_transaction row (reusing the id from
 *      step 1, so the idempotency_key's resultId always resolves).
 *   6. Update wallet.balance to balanceAfter.
 *   7. Insert an audit_log row.
 * All of this happens inside one db.transaction() — if any step throws,
 * everything rolls back, including the idempotency_key insert.
 */
async function applyLedgerEntry(
  db: Database,
  input: ApplyLedgerEntryInput,
): Promise<LedgerOperationResult> {
  return db.transaction(async (tx) => {
    const preGeneratedId = randomUUID();

    try {
      await tx.insert(idempotencyKey).values({
        key: input.idempotencyKey,
        operation: input.operation,
        resultType: "wallet_transaction",
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

    const [walletRow] = await tx
      .select()
      .from(wallet)
      .where(eq(wallet.id, input.walletId))
      .for("update")
      .limit(1);

    if (!walletRow) {
      throw new WalletNotFoundError(input.walletId);
    }

    const balanceBefore = walletRow.balance;
    const balanceAfter = balanceBefore + input.signedAmount;

    if (balanceAfter < 0) {
      throw new InsufficientBalanceError(
        input.walletId,
        balanceBefore,
        input.signedAmount,
      );
    }

    const [txnRow] = await tx
      .insert(walletTransaction)
      .values({
        id: preGeneratedId,
        walletId: input.walletId,
        type: input.type,
        amount: input.signedAmount,
        balanceBefore,
        balanceAfter,
        reference: generateReference("TXN"),
        idempotencyKey: input.idempotencyKey,
        description: input.description,
        metadata: input.metadata,
      })
      .returning();

    if (!txnRow) {
      throw new Error(
        "applyLedgerEntry: wallet_transaction insert returned no row",
      );
    }

    await tx
      .update(wallet)
      .set({ balance: balanceAfter, updatedAt: new Date() })
      .where(eq(wallet.id, input.walletId));

    await tx.insert(auditLog).values({
      actorUserId: input.actorUserId,
      action: input.operation,
      entityType: "wallet_transaction",
      entityId: txnRow.id,
      metadata: { amount: input.signedAmount, balanceBefore, balanceAfter },
    });

    return { transaction: txnRow, alreadyProcessed: false };
  });
}

export interface CreditWalletInput {
  walletId: string;
  /** Must be a positive integer (kobo). */
  amountKobo: number;
  type: Extract<
    LedgerTransactionType,
    "funding" | "commission" | "refund" | "reversal" | "adjustment"
  >;
  idempotencyKey: string;
  description?: string;
  metadata?: Record<string, unknown>;
  /** Null for system-initiated credits (e.g. an automated commission run). */
  actorUserId: string | null;
}

export async function creditWallet(
  db: Database,
  input: CreditWalletInput,
): Promise<LedgerOperationResult> {
  if (!Number.isInteger(input.amountKobo) || input.amountKobo <= 0) {
    throw new Error("creditWallet: amountKobo must be a positive integer");
  }

  return applyLedgerEntry(db, {
    walletId: input.walletId,
    signedAmount: input.amountKobo,
    type: input.type,
    idempotencyKey: input.idempotencyKey,
    operation: `wallet.credit.${input.type}`,
    description: input.description ?? `Credit of ${input.amountKobo} kobo`,
    metadata: input.metadata ?? { amount: input.amountKobo },
    actorUserId: input.actorUserId,
  });
}

export interface DebitWalletInput {
  walletId: string;
  /** Must be a positive integer (kobo). */
  amountKobo: number;
  type: Extract<LedgerTransactionType, "purchase" | "reversal" | "adjustment">;
  idempotencyKey: string;
  description?: string;
  metadata?: Record<string, unknown>;
  actorUserId: string | null;
}

/**
 * Direct debit — bypasses the hold mechanism entirely. Appropriate for
 * operations where there's no "pending provider call" step to protect
 * against (e.g. an admin manual correction). VTU purchases (Phase 5)
 * should use createHold + finalizeHold instead (see wallet-holds.ts),
 * since a purchase's success is only known after an external provider
 * call completes.
 */
export async function debitWallet(
  db: Database,
  input: DebitWalletInput,
): Promise<LedgerOperationResult> {
  if (!Number.isInteger(input.amountKobo) || input.amountKobo <= 0) {
    throw new Error("debitWallet: amountKobo must be a positive integer");
  }

  return applyLedgerEntry(db, {
    walletId: input.walletId,
    signedAmount: -input.amountKobo,
    type: input.type,
    idempotencyKey: input.idempotencyKey,
    operation: `wallet.debit.${input.type}`,
    description: input.description ?? `Debit of ${input.amountKobo} kobo`,
    metadata: input.metadata ?? { amount: input.amountKobo },
    actorUserId: input.actorUserId,
  });
}
