// File: apps/admin/src/features/users/services/user-admin-service.ts
// Purpose: Read-side queries for the admin user management area, wrapping
//          Better Auth's `admin` plugin endpoints (auth.api.listUsers /
//          auth.api.getUser — confirmed against the official Better Auth
//          docs at better-auth.com/docs/plugins/admin before writing
//          this) plus a wallet balance lookup for the detail view.
//
// TYPING NOTE: Better Auth's admin plugin types its user objects as
// `UserWithRole`, which may not automatically merge with this project's
// custom `additionalFields` (phone, kycStatus) in every Better Auth
// version's type inference. Rather than use `any`, this file defines an
// explicit `AdminUserSummary` interface and asserts the shape via
// `unknown` — verify with `pnpm typecheck` that the asserted fields
// genuinely exist on the runtime response (they do, per
// packages/auth/src/auth.ts's additionalFields config and Better Auth's
// documented behavior of including additionalFields in returned user
// objects by default) before relying on this in production.

import { headers } from "next/headers";
import { auth } from "@credixa/auth";
import { db, createWalletRepository } from "@credixa/db";
import type { CredixaRole } from "@credixa/types";

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: CredixaRole;
  banned: boolean;
  banReason: string | null;
  kycStatus: string;
  createdAt: Date;
}

interface RawAdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  kycStatus?: string | null;
  createdAt: Date;
}

function toSummary(raw: RawAdminUser): AdminUserSummary {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone ?? null,
    role: (raw.role as CredixaRole | undefined) ?? "customer",
    banned: raw.banned ?? false,
    banReason: raw.banReason ?? null,
    kycStatus: raw.kycStatus ?? "unverified",
    createdAt: raw.createdAt,
  };
}

export interface ListUsersParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListUsersResult {
  users: AdminUserSummary[];
  total: number;
  limit: number;
  offset: number;
}

export async function listUsers(
  params: ListUsersParams,
): Promise<ListUsersResult> {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;

  const result = await auth.api.listUsers({
    query: {
      limit,
      offset,
      ...(params.search
        ? {
            searchField: "email" as const,
            searchOperator: "contains" as const,
            searchValue: params.search,
          }
        : {}),
    },
    headers: await headers(),
  });

  const rawUsers = result.users as unknown as RawAdminUser[];

  return {
    users: rawUsers.map(toSummary),
    total: result.total,
    limit,
    offset,
  };
}

export async function getUserById(
  id: string,
): Promise<AdminUserSummary | null> {
  const result = await auth.api.getUser({
    query: { id },
    headers: await headers(),
  });
  if (!result) return null;
  return toSummary(result as unknown as RawAdminUser);
}

export async function getUserWalletBalance(
  userId: string,
): Promise<number | null> {
  const walletRepository = createWalletRepository(db);
  const wallet = await walletRepository.findByUserId(userId);
  return wallet?.balance ?? null;
}
