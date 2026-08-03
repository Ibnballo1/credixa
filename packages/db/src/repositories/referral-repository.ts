// File: packages/db/src/repositories/referral-repository.ts
// Purpose: Data-access layer for `referral`. Created at signup time
//          (apps/web's sign-up action) when a valid referral code is
//          provided; qualified by
//          packages/lib/src/payments/verify-and-credit-payment.ts on a
//          referred user's first successful funding.

import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "../client";
import { referral, user } from "../schema";

export type ReferralRecord = typeof referral.$inferSelect;

export interface ReferralWithReferredUser extends ReferralRecord {
  referredUserName: string;
  referredUserEmail: string;
}

export interface ReferralWithBothUsers extends ReferralWithReferredUser {
  referrerUserName: string;
  referrerUserEmail: string;
}

export interface CreateReferralInput {
  referrerUserId: string;
  referredUserId: string;
  referralCode: string;
}

export function createReferralRepository(db: Database) {
  return {
    async findByReferredUserId(
      referredUserId: string,
    ): Promise<ReferralRecord | null> {
      const [row] = await db
        .select()
        .from(referral)
        .where(eq(referral.referredUserId, referredUserId))
        .limit(1);
      return row ?? null;
    },

    async findById(id: string): Promise<ReferralRecord | null> {
      const [row] = await db
        .select()
        .from(referral)
        .where(eq(referral.id, id))
        .limit(1);
      return row ?? null;
    },

    async create(input: CreateReferralInput): Promise<ReferralRecord> {
      const [row] = await db.insert(referral).values(input).returning();
      if (!row)
        throw new Error(
          "createReferralRepository.create: insert returned no row",
        );
      return row;
    },

    /**
     * Marks a referral qualified — conditional on it still being
     * "pending", so calling this more than once for the same user (e.g.
     * a second successful funding) is a safe no-op, not an error.
     * Returns null if there was nothing to qualify (no referral, or
     * already qualified).
     */
    async qualifyIfPending(
      referredUserId: string,
    ): Promise<ReferralRecord | null> {
      const [row] = await db
        .update(referral)
        .set({ status: "qualified", qualifiedAt: new Date() })
        .where(
          and(
            eq(referral.referredUserId, referredUserId),
            eq(referral.status, "pending"),
          ),
        )
        .returning();
      return row ?? null;
    },

    async listByReferrer(
      referrerUserId: string,
    ): Promise<ReferralWithReferredUser[]> {
      return db
        .select({
          id: referral.id,
          referrerUserId: referral.referrerUserId,
          referredUserId: referral.referredUserId,
          referralCode: referral.referralCode,
          status: referral.status,
          qualifiedAt: referral.qualifiedAt,
          createdAt: referral.createdAt,
          referredUserName: user.name,
          referredUserEmail: user.email,
        })
        .from(referral)
        .innerJoin(user, eq(referral.referredUserId, user.id))
        .where(eq(referral.referrerUserId, referrerUserId))
        .orderBy(desc(referral.createdAt));
    },

    /**
     * Every referral, with both referrer and referred user details — for
     * the admin monitoring view. Deliberately two queries rather than a
     * self-join (joining `user` to itself twice needs a CTE/alias in
     * drizzle, which is more machinery than this admin-only, low-volume
     * read justifies): fetch referrals + referred-user details in one
     * join, then batch-fetch referrer details by their distinct IDs.
     */
    async listAllWithDetails(): Promise<ReferralWithBothUsers[]> {
      const withReferred = await db
        .select({
          id: referral.id,
          referrerUserId: referral.referrerUserId,
          referredUserId: referral.referredUserId,
          referralCode: referral.referralCode,
          status: referral.status,
          qualifiedAt: referral.qualifiedAt,
          createdAt: referral.createdAt,
          referredUserName: user.name,
          referredUserEmail: user.email,
        })
        .from(referral)
        .innerJoin(user, eq(referral.referredUserId, user.id))
        .orderBy(desc(referral.createdAt));

      const referrerIds = [
        ...new Set(withReferred.map((r) => r.referrerUserId)),
      ];
      const referrers =
        referrerIds.length > 0
          ? await db
              .select({ id: user.id, name: user.name, email: user.email })
              .from(user)
              .where(inArray(user.id, referrerIds))
          : [];
      const referrerById = new Map(referrers.map((r) => [r.id, r]));

      return withReferred.map((r) => ({
        ...r,
        referrerUserName: referrerById.get(r.referrerUserId)?.name ?? "Unknown",
        referrerUserEmail:
          referrerById.get(r.referrerUserId)?.email ?? "Unknown",
      }));
    },
  };
}

export type ReferralRepository = ReturnType<typeof createReferralRepository>;
