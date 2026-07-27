// File: packages/types/src/roles.ts
// Purpose: Single source of truth for Credixa's role model. Consumed by:
//            - packages/db (Postgres enum for the user.role column)
//            - packages/auth (Better Auth access control roles)
//            - apps/web, apps/admin (route guards, UI conditionals)
//          Keeping this as one exported const array (not scattered string
//          literals) means adding a role later is a one-file change.

export const CREDIXA_ROLES = ["customer", "agent", "admin"] as const;

export type CredixaRole = (typeof CREDIXA_ROLES)[number];

export const DEFAULT_ROLE: CredixaRole = "customer";

export function isCredixaRole(value: string): value is CredixaRole {
  return (CREDIXA_ROLES as readonly string[]).includes(value);
}
