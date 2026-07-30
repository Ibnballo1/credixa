// File: apps/admin/src/features/services/actions/manage-service.ts
// Purpose: Server Actions for Phase 6c service configuration. These
//          write to configuration tables only (provider, service) — no
//          direct financial effect, but disabling a provider or changing
//          a price directly affects real purchases, so they're
//          audit-logged for the same traceability reasons as the
//          financial actions in Phase 6a/6b.

"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@credixa/auth";
import {
  db,
  createProviderRepository,
  createServiceRepository,
  createAuditLogRepository,
} from "@credixa/db";

export type ServiceActionResult =
  | { success: true }
  | { success: false; error: string };

export async function toggleProviderActiveAction(
  providerId: string,
  isActive: boolean,
): Promise<ServiceActionResult> {
  const session = await requireRole("admin");

  const providerRepository = createProviderRepository(db);
  const updated = await providerRepository.setActive(providerId, isActive);
  if (!updated) {
    return { success: false, error: "Provider not found." };
  }

  const auditLogRepository = createAuditLogRepository(db);
  await auditLogRepository.create({
    actorUserId: session.user.id,
    action: isActive ? "admin.provider.enable" : "admin.provider.disable",
    entityType: "provider",
    entityId: providerId,
  });

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function updateProviderPriorityAction(
  providerId: string,
  priority: number,
): Promise<ServiceActionResult> {
  const session = await requireRole("admin");

  if (!Number.isInteger(priority) || priority < 0) {
    return {
      success: false,
      error: "Priority must be a non-negative whole number.",
    };
  }

  const providerRepository = createProviderRepository(db);
  const updated = await providerRepository.setPriority(providerId, priority);
  if (!updated) {
    return { success: false, error: "Provider not found." };
  }

  const auditLogRepository = createAuditLogRepository(db);
  await auditLogRepository.create({
    actorUserId: session.user.id,
    action: "admin.provider.set_priority",
    entityType: "provider",
    entityId: providerId,
    metadata: { priority },
  });

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function toggleServiceActiveAction(
  serviceId: string,
  isActive: boolean,
): Promise<ServiceActionResult> {
  const session = await requireRole("admin");

  const serviceRepository = createServiceRepository(db);
  const updated = await serviceRepository.setActive(serviceId, isActive);
  if (!updated) {
    return { success: false, error: "Service not found." };
  }

  const auditLogRepository = createAuditLogRepository(db);
  await auditLogRepository.create({
    actorUserId: session.user.id,
    action: isActive ? "admin.service.enable" : "admin.service.disable",
    entityType: "service",
    entityId: serviceId,
  });

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function updateServicePriceAction(
  serviceId: string,
  priceNaira: number,
): Promise<ServiceActionResult> {
  const session = await requireRole("admin");

  if (!Number.isInteger(priceNaira) || priceNaira <= 0) {
    return { success: false, error: "Enter a whole, positive Naira amount." };
  }

  const serviceRepository = createServiceRepository(db);
  const updated = await serviceRepository.setPrice(serviceId, priceNaira * 100);
  if (!updated) {
    return { success: false, error: "Service not found." };
  }

  const auditLogRepository = createAuditLogRepository(db);
  await auditLogRepository.create({
    actorUserId: session.user.id,
    action: "admin.service.set_price",
    entityType: "service",
    entityId: serviceId,
    metadata: { priceKobo: priceNaira * 100 },
  });

  revalidatePath("/dashboard/services");
  return { success: true };
}
