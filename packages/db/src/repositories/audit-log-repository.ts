// File: packages/db/src/repositories/audit-log-repository.ts
// Purpose: Data-access layer for the `audit_log` table. Insert-only by
//          design — an audit trail that could be edited or deleted isn't
//          an audit trail. Phase 6 builds the admin UI that queries this
//          via listByEntity/listRecent; this repository just needs to
//          exist and be correct now, since every ledger operation writes
//          to it starting in Phase 3.

import { desc, and, eq } from "drizzle-orm";
import type { Database } from "../client";
import { auditLog } from "../schema";

export type AuditLogRecord = typeof auditLog.$inferSelect;

export interface CreateAuditLogInput {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export function createAuditLogRepository(db: Database) {
  return {
    async create(input: CreateAuditLogInput): Promise<AuditLogRecord> {
      const [row] = await db.insert(auditLog).values(input).returning();
      if (!row) {
        throw new Error(
          "createAuditLogRepository.create: insert returned no row",
        );
      }
      return row;
    },

    async listByEntity(
      entityType: string,
      entityId: string,
    ): Promise<AuditLogRecord[]> {
      return db
        .select()
        .from(auditLog)
        .where(
          and(
            eq(auditLog.entityType, entityType),
            eq(auditLog.entityId, entityId),
          ),
        )
        .orderBy(desc(auditLog.createdAt));
    },
  };
}

export type AuditLogRepository = ReturnType<typeof createAuditLogRepository>;
