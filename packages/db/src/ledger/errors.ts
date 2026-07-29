// File: packages/db/src/ledger/errors.ts
// Purpose: Domain-specific errors thrown by the ledger. Callers (services
//          in apps/web, later Phase 4/5 payment/VTU logic) catch these by
//          type to distinguish "insufficient funds" (show the user a
//          message) from "something is broken" (log and alert).

export class InsufficientBalanceError extends Error {
  constructor(
    public readonly walletId: string,
    public readonly availableKobo: number,
    public readonly requestedKobo: number,
  ) {
    super(
      `Wallet ${walletId} has insufficient available balance: available ${availableKobo}, requested ${requestedKobo}`,
    );
    this.name = "InsufficientBalanceError";
  }
}

export class WalletNotFoundError extends Error {
  constructor(public readonly walletId: string) {
    super(`Wallet ${walletId} not found`);
    this.name = "WalletNotFoundError";
  }
}

/**
 * Thrown when a credit, debit, or hold is attempted against a
 * non-"active" wallet (e.g. "frozen" by an admin — see Phase 6b). Only
 * enforced at entry points that START a new financial effect
 * (creditWallet, debitWallet, createHold) — deliberately NOT enforced in
 * finalizeHold/releaseHold, since those complete something already in
 * flight rather than starting something new. Blocking finalization would
 * leave a hold stuck with no clean resolution if a wallet gets frozen
 * mid-purchase.
 */
export class WalletFrozenError extends Error {
  constructor(public readonly walletId: string) {
    super(
      `Wallet ${walletId} is frozen and cannot be credited, debited, or hold funds`,
    );
    this.name = "WalletFrozenError";
  }
}

export class WalletHoldNotFoundError extends Error {
  constructor(public readonly holdId: string) {
    super(`Wallet hold ${holdId} not found`);
    this.name = "WalletHoldNotFoundError";
  }
}

/**
 * Thrown when an idempotency key was claimed but the row it points to
 * can't be found — this should be architecturally impossible (both
 * writes happen in the same transaction), so surfacing it loudly rather
 * than silently is deliberate.
 */
export class IdempotencyIntegrityError extends Error {
  constructor(key: string, detail: string) {
    super(`Idempotency key ${key} integrity violation: ${detail}`);
    this.name = "IdempotencyIntegrityError";
  }
}
