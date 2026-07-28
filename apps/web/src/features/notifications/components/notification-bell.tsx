"use client";

/**
 * File: apps/web/src/features/notifications/components/notification-bell.tsx
 * Purpose: Header notification bell with a dropdown responsive across mobile & desktop.
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
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        <Bell className="h-5 w-5" />
        {summary.unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold text-secondary-foreground">
            {summary.unreadCount > 9 ? "9+" : summary.unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed left-4 right-4 top-16 z-50 mt-2 max-h-[80vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-80 sm:max-h-[28rem]">
          <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2 pt-1.5">
            <p className="text-sm font-semibold text-slate-900">
              Notifications
            </p>
            {summary.unreadCount > 0 ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {summary.unreadCount} new
              </span>
            ) : null}
          </div>

          {summary.recent.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <p className="text-sm font-medium text-slate-600">
                You&apos;re all caught up
              </p>
              <p className="mt-1 text-xs text-slate-400">
                We&apos;ll let you know when something needs your attention.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {summary.recent.map((n) => (
                <li
                  key={n.id}
                  className="px-2 py-3 hover:bg-slate-50/80 transition-colors"
                >
                  <p className="text-sm font-medium text-slate-900">
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    {n.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
