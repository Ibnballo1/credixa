// File: packages/lib/src/currency/format-naira.ts
// Purpose: Formats an integer kobo amount as a Naira display string.
//          Wallet balances (and every future ledger amount) are stored as
//          integers in the smallest currency unit (kobo) — never as
//          floating point Naira — to avoid rounding errors in financial
//          arithmetic. This is the only place that conversion to a
//          display string should happen.

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  currencyDisplay: "narrowSymbol",
});

/**
 * @param kobo Integer amount in kobo (1 Naira = 100 kobo). Must be a
 *             whole number — throws on non-integer input to catch a
 *             float accidentally leaking into financial display code.
 */
export function formatKoboAsNaira(kobo: number): string {
  if (!Number.isInteger(kobo)) {
    throw new Error(
      `formatKoboAsNaira received a non-integer (${kobo}) — wallet amounts must be integer kobo, never floating point Naira.`,
    );
  }
  return nairaFormatter.format(kobo / 100);
}
