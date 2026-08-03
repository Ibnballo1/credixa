// File: packages/db/src/repositories/referral-code-repository.ts
// Purpose: Data-access layer for `referral_code`. Codes are generated
//          lazily (same pattern as wallet-repository.ts's
//          createForUser) rather than at signup time, so existing
//          pre-Phase-7b users get a code the first time they visit the
//          referrals page, with no backfill migration needed.

import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import type { Database } from "../client";
import { referralCode } from "../schema";
import { isUniqueViolation } from "../ledger/is-unique-violation";

export type ReferralCodeRecord = typeof referralCode.$inferSelect;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids visual ambiguity when shared
const CODE_LENGTH = 8;

function generateCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return code;
}

export function createReferralCodeRepository(db: Database) {
  return {
    async findByUserId(userId: string): Promise<ReferralCodeRecord | null> {
      const [row] = await db
        .select()
        .from(referralCode)
        .where(eq(referralCode.userId, userId))
        .limit(1);
      return row ?? null;
    },

    async findByCode(code: string): Promise<ReferralCodeRecord | null> {
      const [row] = await db
        .select()
        .from(referralCode)
        .where(eq(referralCode.code, code.toUpperCase()))
        .limit(1);
      return row ?? null;
    },

    /**
     * Returns the user's existing code, or generates and inserts a new
     * one. Retries on a code collision (astronomically unlikely at 8
     * chars from a 33-character alphabet, but the unique constraint
     * exists specifically so we never silently accept a duplicate).
     */
    async getOrCreate(userId: string): Promise<ReferralCodeRecord> {
      const existing = await this.findByUserId(userId);
      if (existing) return existing;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const [row] = await db
            .insert(referralCode)
            .values({ userId, code: generateCode() })
            .returning();
          if (!row) throw new Error("getOrCreate: insert returned no row");
          return row;
        } catch (err) {
          if (isUniqueViolation(err) && attempt < 2) continue;
          throw err;
        }
      }

      throw new Error(
        `getOrCreate: failed to generate a unique code for user ${userId} after retries`,
      );
    },
  };
}

export type ReferralCodeRepository = ReturnType<
  typeof createReferralCodeRepository
>;
