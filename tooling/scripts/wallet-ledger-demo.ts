// File: tooling/scripts/wallet-ledger-demo.ts
// Purpose: Manual QA script for Phase 3. There is no UI caller for the
//          ledger yet (funding is Phase 4, VTU purchases are Phase 5), so
//          this script is how the ledger engine gets exercised end to
//          end before those phases exist. Run with:
//              pnpm ledger:demo -- <userId>
//          where <userId> is any existing user's id (check the `user`
//          table, or sign up a test account via apps/web first).
//
// This is a development tool, not part of the application — it is never
// imported by apps/web or apps/admin.

import {
  db,
  createWalletRepository,
  createWalletTransactionRepository,
  creditWallet,
  debitWallet,
  createHold,
  finalizeHold,
  releaseHold,
  reconcileWalletBalance,
  InsufficientBalanceError,
} from "@credixa/db";

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error("Usage: pnpm ledger:demo -- <userId>");
    process.exit(1);
  }

  const walletRepository = createWalletRepository(db);
  const walletTransactionRepository = createWalletTransactionRepository(db);

  const wallet = await walletRepository.createForUser(userId);
  console.log("Starting wallet:", { id: wallet.id, balance: wallet.balance });

  // 1. Credit the wallet.
  const credit1 = await creditWallet(db, {
    walletId: wallet.id,
    amountKobo: 500_000, // NGN 5,000.00
    type: "adjustment",
    idempotencyKey: "demo-credit-1",
    description: "Phase 3 QA: initial credit",
    actorUserId: null,
  });
  console.log("After credit #1:", {
    alreadyProcessed: credit1.alreadyProcessed,
    balanceAfter: credit1.transaction.balanceAfter,
  });

  // 2. Replay the SAME idempotency key — must be a no-op, same result.
  const credit1Replay = await creditWallet(db, {
    walletId: wallet.id,
    amountKobo: 500_000,
    type: "adjustment",
    idempotencyKey: "demo-credit-1",
    description: "Phase 3 QA: initial credit (replay)",
    actorUserId: null,
  });
  console.log("Replay of credit #1 (expect alreadyProcessed: true):", {
    alreadyProcessed: credit1Replay.alreadyProcessed,
    sameTransactionId: credit1Replay.transaction.id === credit1.transaction.id,
  });

  // 3. Attempt to over-debit — must throw InsufficientBalanceError.
  try {
    await debitWallet(db, {
      walletId: wallet.id,
      amountKobo: 10_000_000, // far more than the balance
      type: "adjustment",
      idempotencyKey: "demo-overdebit-1",
      actorUserId: null,
    });
    console.error(
      "FAIL: over-debit should have thrown InsufficientBalanceError",
    );
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      console.log("Over-debit correctly rejected:", err.message);
    } else {
      throw err;
    }
  }

  // 4. Create a hold, then finalize it (simulates a successful purchase).
  const hold1 = await createHold(db, {
    walletId: wallet.id,
    amountKobo: 100_000, // NGN 1,000.00
    idempotencyKey: "demo-hold-1",
    description: "Phase 3 QA: simulated purchase hold",
    actorUserId: null,
  });
  console.log("Hold created:", {
    id: hold1.hold.id,
    status: hold1.hold.status,
  });

  const finalized = await finalizeHold(db, {
    holdId: hold1.hold.id,
    idempotencyKey: "demo-hold-1-finalize",
    actorUserId: null,
  });
  console.log("Hold finalized:", {
    balanceAfter: finalized.transaction.balanceAfter,
    amount: finalized.transaction.amount,
  });

  // 5. Create a second hold, then release it (simulates a failed purchase).
  const hold2 = await createHold(db, {
    walletId: wallet.id,
    amountKobo: 50_000,
    idempotencyKey: "demo-hold-2",
    description: "Phase 3 QA: simulated failed purchase hold",
    actorUserId: null,
  });

  const released = await releaseHold(db, {
    holdId: hold2.hold.id,
    idempotencyKey: "demo-hold-2-release",
    reason: "Simulated provider failure",
    actorUserId: null,
  });
  console.log("Hold released:", {
    id: released.hold.id,
    status: released.hold.status,
  });

  // 6. Reconcile — should be healthy (drift: 0).
  const report = await reconcileWalletBalance(db, wallet.id);
  console.log("Reconciliation report:", report);

  // 7. Final state.
  const finalWallet = await walletRepository.findByUserId(userId);
  const history = await walletTransactionRepository.listByWallet(wallet.id);
  console.log("Final wallet balance:", finalWallet?.balance);
  console.log(
    "Ledger history:",
    history.map((t) => ({
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
    })),
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("wallet-ledger-demo failed:", err);
  process.exit(1);
});
