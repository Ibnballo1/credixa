// File: packages/db/src/ledger/is-unique-violation.ts
// Purpose: Detects a Postgres unique-violation error (SQLSTATE 23505)
//          thrown by the `postgres` driver. Used exclusively to detect
//          "this idempotency key was already claimed by a concurrent or
//          prior request" — see wallet-ledger.ts / wallet-holds.ts.

interface PostgresErrorLike {
  code?: string;
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as PostgresErrorLike).code === "23505"
  );
}
