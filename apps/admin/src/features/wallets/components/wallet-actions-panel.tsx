"use client";

/**
 * File: apps/admin/src/features/wallets/components/wallet-actions-panel.tsx
 * Purpose: Manual balance adjustment + freeze/unfreeze controls for the
 *          wallet detail page. The idempotency key is re-derived from
 *          wallet.updatedAt so each new adjustment (which bumps
 *          updatedAt and triggers router.refresh()) gets a fresh key,
 *          rather than accidentally reusing one across genuinely
 *          different adjustments in the same page session.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@credixa/ui";
import {
  adjustBalanceAction,
  freezeWalletAction,
  unfreezeWalletAction,
} from "../actions/manage-wallet";
import type { WalletRecord } from "@credixa/db";

export function WalletActionsPanel({ wallet }: { wallet: WalletRecord }) {
  const router = useRouter();
  const idempotencyKey = useMemo(
    () => crypto.randomUUID(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wallet.id, wallet.updatedAt.getTime()],
  );

  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amountNaira, setAmountNaira] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await adjustBalanceAction({
      walletId: wallet.id,
      direction,
      amountNaira: Number(amountNaira),
      reason,
      idempotencyKey,
    });

    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setAmountNaira("");
    setReason("");
    router.refresh();
  }

  function handleFreeze() {
    const reasonInput = window.prompt(
      "Reason for freezing this wallet (shown in the audit log):",
    );
    if (reasonInput === null) return;
    setError(null);
    setIsSubmitting(true);
    freezeWalletAction(wallet.id, reasonInput).then((result) => {
      setIsSubmitting(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleUnfreeze() {
    setError(null);
    setIsSubmitting(true);
    unfreezeWalletAction(wallet.id).then((result) => {
      setIsSubmitting(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-700">
          Wallet status
        </h3>
        {wallet.status === "frozen" ? (
          <Button
            variant="outline"
            onClick={handleUnfreeze}
            isLoading={isSubmitting}
          >
            Unfreeze wallet
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={handleFreeze}
            isLoading={isSubmitting}
          >
            Freeze wallet
          </Button>
        )}
      </div>

      <form
        onSubmit={handleAdjust}
        className="space-y-4 border-t border-slate-200 pt-6"
      >
        <h3 className="text-sm font-medium text-slate-700">
          Manual adjustment
        </h3>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDirection("credit")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
              direction === "credit"
                ? "border-primary bg-primary/10 text-primary"
                : "border-slate-300 text-slate-600"
            }`}
          >
            Credit
          </button>
          <button
            type="button"
            onClick={() => setDirection("debit")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
              direction === "debit"
                ? "border-red-400 bg-red-50 text-red-700"
                : "border-slate-300 text-slate-600"
            }`}
          >
            Debit
          </button>
        </div>

        <div>
          <Label htmlFor="amountNaira">Amount (₦)</Label>
          <Input
            id="amountNaira"
            type="number"
            inputMode="numeric"
            value={amountNaira}
            onChange={(e) => setAmountNaira(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="reason">
            Reason (required, shown in the audit log)
          </Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
          disabled={wallet.status === "frozen"}
        >
          Apply {direction}
        </Button>
        {wallet.status === "frozen" ? (
          <p className="text-xs text-slate-400">
            Unfreeze the wallet before adjusting its balance.
          </p>
        ) : null}
      </form>
    </div>
  );
}
