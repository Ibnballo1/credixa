// File: apps/admin/src/features/users/actions/manage-user.ts
// Purpose: Server Actions for the sensitive user-management operations.
//          Every action here: (1) requires admin role, (2) blocks acting
//          on your own account (a solo admin banning or demoting
//          themselves would be a self-inflicted lockout with no recovery
//          path yet — Phase 7+ can revisit once multi-admin workflows
//          exist), (3) writes an audit_log row.

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth, requireRole } from "@credixa/auth";
import { db, createAuditLogRepository } from "@credixa/db";
import type { CredixaRole } from "@credixa/types";

export type ManageUserActionResult =
  | { success: true }
  | { success: false; error: string };

export async function setUserRoleAction(
  targetUserId: string,
  role: CredixaRole,
): Promise<ManageUserActionResult> {
  const session = await requireRole("admin");

  if (targetUserId === session.user.id) {
    return { success: false, error: "You cannot change your own role." };
  }

  try {
    await auth.api.setRole({
      body: { userId: targetUserId, role },
      headers: await headers(),
    });
  } catch {
    return { success: false, error: "Failed to update role." };
  }

  const auditLogRepository = createAuditLogRepository(db);
  await auditLogRepository.create({
    actorUserId: session.user.id,
    action: "admin.user.set_role",
    entityType: "user",
    entityId: targetUserId,
    metadata: { newRole: role },
  });

  revalidatePath(`/dashboard/users/${targetUserId}`);
  return { success: true };
}

export async function banUserAction(
  targetUserId: string,
  reason: string,
): Promise<ManageUserActionResult> {
  const session = await requireRole("admin");

  if (targetUserId === session.user.id) {
    return { success: false, error: "You cannot ban your own account." };
  }

  try {
    await auth.api.banUser({
      body: { userId: targetUserId, banReason: reason || undefined },
      headers: await headers(),
    });
  } catch {
    return { success: false, error: "Failed to ban user." };
  }

  const auditLogRepository = createAuditLogRepository(db);
  await auditLogRepository.create({
    actorUserId: session.user.id,
    action: "admin.user.ban",
    entityType: "user",
    entityId: targetUserId,
    metadata: { reason },
  });

  revalidatePath(`/dashboard/users/${targetUserId}`);
  return { success: true };
}

export async function unbanUserAction(
  targetUserId: string,
): Promise<ManageUserActionResult> {
  const session = await requireRole("admin");

  try {
    await auth.api.unbanUser({
      body: { userId: targetUserId },
      headers: await headers(),
    });
  } catch {
    return { success: false, error: "Failed to unban user." };
  }

  const auditLogRepository = createAuditLogRepository(db);
  await auditLogRepository.create({
    actorUserId: session.user.id,
    action: "admin.user.unban",
    entityType: "user",
    entityId: targetUserId,
  });

  revalidatePath(`/dashboard/users/${targetUserId}`);
  return { success: true };
}
