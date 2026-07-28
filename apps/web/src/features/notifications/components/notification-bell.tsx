"use client";

/**
 * File: apps/web/src/features/notifications/components/notification-bell.tsx
 * Purpose: Header notification bell with a dropdown. Data is fetched
 *          server-side (see dashboard layout) and passed in as a prop —
 *          this component owns only the open/closed UI interaction, not
 *          the data fetch, keeping the "no DB access in components" rule
 *          intact even for a Client Component.
 */
import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import type { NotificationSummary } from "../services/notification-service";

export function NotificationBell({
  summary,
}: {
  summary: NotificationSummary;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {summary.unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold text-secondary-foreground">
            {summary.unreadCount > 9 ? "9+" : summary.unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <p className="px-2 py-1.5 text-sm font-medium text-slate-700">
            Notifications
          </p>
          {summary.recent.length === 0 ? (
            <div className="px-2 py-6 text-center">
              <p className="text-sm text-slate-500">
                You&apos;re all caught up
              </p>
              <p className="mt-1 text-xs text-slate-400">
                We&apos;ll let you know when something needs your attention.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {summary.recent.map((n) => (
                <li key={n.id} className="px-2 py-2.5">
                  <p className="text-sm font-medium text-slate-900">
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
