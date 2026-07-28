// File: packages/db/src/repositories/idempotency-repository.ts
// Purpose: Data-access layer for the `idempotency_key` table. This is
//          deliberately thin — the actual "claim this key or discover it
//          was already used" protocol lives in packages/db/src/ledger/,
//          because it must run inside the SAME db.transaction() as the
//          financial write it's guarding. See that module for why the
//          key is inserted with a pre-generated resultId BEFORE the
//          financial effect happens, rather than after.

import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { idempotencyKey } from "../schema";

export type IdempotencyKeyRecord = typeof idempotencyKey.$inferSelect;

export function createIdempotencyRepository(db: Database) {
  return {
    async findByKey(key: string): Promise<IdempotencyKeyRecord | null> {
      const [row] = await db
        .select()
        .from(idempotencyKey)
        .where(eq(idempotencyKey.key, key))
        .limit(1);
      return row ?? null;
    },
  };
}

export type IdempotencyRepository = ReturnType<
  typeof createIdempotencyRepository
>;
