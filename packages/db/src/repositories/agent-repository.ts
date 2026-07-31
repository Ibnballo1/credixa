// File: packages/db/src/repositories/agent-repository.ts
// Purpose: Data-access layer for the `agent` table. Approving/rejecting
//          is handled here for the `agent` row itself, but the actual
//          role change (customer -> agent) goes through Better Auth's
//          setRole (apps/admin/src/features/agents/actions/manage-agent.ts),
//          same pattern as Phase 6a's user role management — this
//          repository never touches `user.role` directly.

import { and, desc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { agent, user } from "../schema";

export type AgentRecord = typeof agent.$inferSelect;

export interface AgentWithUser extends AgentRecord {
  userName: string;
  userEmail: string;
}

export interface ApplyForAgentInput {
  userId: string;
  businessName: string;
}

export function createAgentRepository(db: Database) {
  return {
    async findByUserId(userId: string): Promise<AgentRecord | null> {
      const [row] = await db
        .select()
        .from(agent)
        .where(eq(agent.userId, userId))
        .limit(1);
      return row ?? null;
    },

    async findById(id: string): Promise<AgentRecord | null> {
      const [row] = await db
        .select()
        .from(agent)
        .where(eq(agent.id, id))
        .limit(1);
      return row ?? null;
    },

    /**
     * Creates a new application, OR — if this user previously applied
     * and was rejected — resubmits by resetting the existing row back
     * to "pending" rather than inserting a second row (userId is
     * unique). Throws if an application is already pending/approved,
     * since re-applying in those states doesn't make sense.
     */
    async apply(input: ApplyForAgentInput): Promise<AgentRecord> {
      const existing = await this.findByUserId(input.userId);

      if (existing) {
        if (existing.status === "pending" || existing.status === "approved") {
          throw new Error(
            `apply: user ${input.userId} already has a ${existing.status} application`,
          );
        }
        const [row] = await db
          .update(agent)
          .set({
            businessName: input.businessName,
            status: "pending",
            rejectionReason: null,
            approvedAt: null,
            approvedBy: null,
            updatedAt: new Date(),
          })
          .where(eq(agent.id, existing.id))
          .returning();
        if (!row) throw new Error("apply: resubmission update returned no row");
        return row;
      }

      const [row] = await db
        .insert(agent)
        .values({ userId: input.userId, businessName: input.businessName })
        .returning();
      if (!row) throw new Error("apply: insert returned no row");
      return row;
    },

    async listByStatus(
      status: AgentRecord["status"],
    ): Promise<AgentWithUser[]> {
      return db
        .select({
          id: agent.id,
          userId: agent.userId,
          businessName: agent.businessName,
          status: agent.status,
          tier: agent.tier,
          approvedAt: agent.approvedAt,
          approvedBy: agent.approvedBy,
          rejectionReason: agent.rejectionReason,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
          userName: user.name,
          userEmail: user.email,
        })
        .from(agent)
        .innerJoin(user, eq(agent.userId, user.id))
        .where(eq(agent.status, status))
        .orderBy(desc(agent.createdAt));
    },

    async approve(id: string, approvedBy: string): Promise<AgentRecord | null> {
      const [row] = await db
        .update(agent)
        .set({
          status: "approved",
          approvedAt: new Date(),
          approvedBy,
          updatedAt: new Date(),
        })
        .where(and(eq(agent.id, id), eq(agent.status, "pending")))
        .returning();
      return row ?? null;
    },

    async reject(id: string, reason: string): Promise<AgentRecord | null> {
      const [row] = await db
        .update(agent)
        .set({
          status: "rejected",
          rejectionReason: reason,
          updatedAt: new Date(),
        })
        .where(and(eq(agent.id, id), eq(agent.status, "pending")))
        .returning();
      return row ?? null;
    },

    async suspend(id: string, reason: string): Promise<AgentRecord | null> {
      const [row] = await db
        .update(agent)
        .set({
          status: "suspended",
          rejectionReason: reason,
          updatedAt: new Date(),
        })
        .where(and(eq(agent.id, id), eq(agent.status, "approved")))
        .returning();
      return row ?? null;
    },
  };
}

export type AgentRepository = ReturnType<typeof createAgentRepository>;
