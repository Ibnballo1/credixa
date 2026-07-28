// File: packages/db/src/ledger/index.ts
// Purpose: Public entry point for the ledger module.

export { creditWallet, debitWallet } from "./wallet-ledger";
export type {
  CreditWalletInput,
  DebitWalletInput,
  LedgerOperationResult,
} from "./wallet-ledger";

export { createHold, finalizeHold, releaseHold } from "./wallet-holds";
export type {
  CreateHoldInput,
  FinalizeHoldInput,
  ReleaseHoldInput,
  HoldOperationResult,
} from "./wallet-holds";

export { reconcileWalletBalance, reconcileAllWallets } from "./reconciliation";
export type { WalletReconciliationReport } from "./reconciliation";

export {
  InsufficientBalanceError,
  WalletNotFoundError,
  WalletHoldNotFoundError,
  IdempotencyIntegrityError,
} from "./errors";
