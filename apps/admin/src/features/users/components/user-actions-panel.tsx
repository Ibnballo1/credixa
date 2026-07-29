"use client";

/**
 * File: apps/admin/src/features/users/components/user-actions-panel.tsx
 * Purpose: Role change + ban/unban controls for the user detail page.
 *          Uses a native confirm() for the destructive ban action —
 *          adequate for an internal admin tool at this stage; revisit
 *          with a proper modal if/when this UI gets more elaborate.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CREDIXA_ROLES, type CredixaRole } from "@credixa/types";
import { Button } from "@credixa/ui";
import { setUserRoleAction, banUserAction, unbanUserAction } from "../actions/manage-user";
import type { AdminUserSummary } from "../services/user-admin-service";

export function UserActionsPanel({ user }: { user: AdminUserSummary }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<CredixaRole>(user.role);

  function handleRoleChange(newRole: CredixaRole) {
    setRole(newRole);
    setError(null);
    startTransition(async () => {
      const result = await setUserRoleAction(user.id, newRole);
      if (!result.success) {
        setError(result.error);
        setRole(user.role); // revert the optimistic select
        return;
      }
      router.refresh();
    });
  }

  function handleBan() {
    const reason = window.prompt("Reason for ban (shown in the audit log):");
    if (reason === null) return; // cancelled
    setError(null);
    startTransition(async () => {
      const result = await banUserAction(user.id, reason);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleUnban() {
    setError(null);
    startTransition(async () => {
      const result = await unbanUserAction(user.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-700">
          Role
        </label>
        <select
          id="role"
          value={role}
          disabled={isPending}
          onChange={(e) => handleRoleChange(e.target.value as CredixaRole)}
          className="h-10 w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          {CREDIXA_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        {user.banned ? (
          <Button variant="outline" onClick={handleUnban} isLoading={isPending}>
            Unban user
          </Button>
        ) : (
          <Button variant="destructive" onClick={handleBan} isLoading={isPending}>
            Ban user
          </Button>
        )}
      </div>
    </div>
  );
}