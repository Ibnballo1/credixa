/**
 * File: apps/web/src/app/(customer)/dashboard/fund/callback/page.tsx
 * Purpose: Where Paystack redirects the user after checkout. This page
 *          NEVER trusts the redirect itself as proof of payment — it
 *          calls verifyAndCreditPayment, which re-checks Paystack's own
 *          API server-side before crediting anything. If a webhook or
 *          the recovery sweep already resolved this payment first, this
 *          page just displays that outcome without re-verifying.
 */
import Link from "next/link";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { requireAuth } from "@credixa/auth";
import { formatKoboAsNaira, type VerifyAndCreditStatus } from "@credixa/lib";
import { verifyAndCreditPayment } from "@credixa/lib/jobs";
import { getPaymentForUser } from "@/features/payments/services/funding-service";

export default async function FundingCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const session = await requireAuth();
  const { reference } = await searchParams;

  if (!reference) {
    return <CallbackState icon="error" title="Missing payment reference" />;
  }

  const paymentRow = await getPaymentForUser(reference, session.user.id);
  if (!paymentRow) {
    return <CallbackState icon="error" title="We couldn't find this payment" />;
  }

  // If this payment was already resolved (by a webhook that beat us
  // here, or a prior visit to this page), don't call Paystack again —
  // just report what's already on file.
  let status: VerifyAndCreditStatus;
  if (paymentRow.status === "initiated") {
    try {
      status = (await verifyAndCreditPayment(reference)).status;
    } catch {
      return (
        <CallbackState
          icon="error"
          title="Something went wrong"
          description="We couldn't confirm this payment right now. Please try again shortly."
          reference={paymentRow.reference}
          showRecheckLink
        />
      );
    }
  } else {
    status = paymentRow.status as VerifyAndCreditStatus;
  }

  if (status === "success" || status === "already_processed") {
    return (
      <CallbackState
        icon="success"
        title="Payment successful"
        description={`${formatKoboAsNaira(paymentRow.amountKobo)} has been added to your wallet.`}
      />
    );
  }

  if (status === "abandoned") {
    return (
      <CallbackState
        icon="warning"
        title="Payment not completed"
        description="It looks like the payment was cancelled or not completed."
      />
    );
  }

  if (status === "pending") {
    return (
      <CallbackState
        icon="warning"
        title="Still processing"
        description="Your payment is still being confirmed by Paystack."
        reference={paymentRow.reference}
        showRecheckLink
      />
    );
  }

  return (
    <CallbackState
      icon="error"
      title="Payment failed"
      description="We couldn't confirm this payment. If you were charged, contact support with your reference below."
      reference={paymentRow.reference}
    />
  );
}

function CallbackState({
  icon,
  title,
  description,
  reference,
  showRecheckLink,
}: {
  icon: "success" | "error" | "warning";
  title: string;
  description?: string;
  reference?: string;
  showRecheckLink?: boolean;
}) {
  const Icon =
    icon === "success"
      ? CheckCircle2
      : icon === "warning"
        ? HelpCircle
        : XCircle;
  const iconColor =
    icon === "success"
      ? "text-primary"
      : icon === "warning"
        ? "text-accent"
        : "text-red-500";

  return (
    <div className="mx-auto max-w-md text-center">
      <Icon className={`mx-auto mb-4 h-12 w-12 ${iconColor}`} />
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      {description ? (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      ) : null}
      {reference ? (
        <p className="mt-2 text-xs text-slate-400">Reference: {reference}</p>
      ) : null}
      <div className="mt-6 flex justify-center gap-3">
        {showRecheckLink && reference ? (
          <Link
            href={`/dashboard/fund/callback?reference=${encodeURIComponent(reference)}`}
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Check again
          </Link>
        ) : null}
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
