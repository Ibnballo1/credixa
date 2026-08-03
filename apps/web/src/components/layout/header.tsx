"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  LogOut,
  User,
  UserCheck,
  ShieldCheck,
  Banknote,
  Users,
} from "lucide-react";
import { Button, Logo } from "@credixa/ui";
import { signOutAction } from "@/features/auth/actions/sign-out";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@credixa/ui";
import type { Session } from "@credixa/auth";
import type { CredixaRole } from "@credixa/types";
import type { NotificationSummary } from "@/features/notifications/services/notification-service";

interface HeaderProps {
  session: Session;
  notificationSummary: NotificationSummary;
}

export function Header({ session, notificationSummary }: HeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  const role =
    (session.user.role as CredixaRole | null | undefined) ?? "customer";
  const userInitials = session.user.name
    ? session.user.name.charAt(0).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
        {/* Brand Logo */}
        <div className="flex shrink-0 items-center gap-2">
          <Logo size="lg" className="h-10 w-10" />
        </div>

        {/* Navigation & User Tools */}
        <nav className="flex items-center gap-2 md:gap-5">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Dashboard
          </Link>
          <Link
            href="/profile"
            className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 md:block"
          >
            Profile
          </Link>
          <Link
            href="/dashboard/referrals"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Referrals
          </Link>
          <Link
            href="/dashboard/earnings"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Earnings
          </Link>

          {/* Role Status: Agent Badge vs Become Agent Link */}
          {role === "agent" ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Agent
            </span>
          ) : (
            <Link
              href="/dashboard/become-agent"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Become an agent
            </Link>
          )}

          {/* Notification Bell */}
          <div className="mx-1">
            <NotificationBell summary={notificationSummary} />
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full bg-slate-200 p-0 focus-visible:ring-2 focus-visible:ring-primary shrink-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-slate-700">
                  {userInitials}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none text-slate-900">
                      {session.user.name}
                    </p>
                    {role === "agent" && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-primary">
                        <ShieldCheck className="mr-0.5 h-3 w-3" /> Agent
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-none text-slate-500">
                    {session.user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/referrals" className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" /> Referrals
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/earnings" className="cursor-pointer">
                  <Banknote className="mr-2 h-4 w-4" /> Earnings
                </Link>
              </DropdownMenuItem>

              {role !== "agent" && (
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/become-agent"
                    className="cursor-pointer"
                  >
                    <UserCheck className="mr-2 h-4 w-4" /> Become an agent
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleSignOut}
                disabled={isPending}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isPending ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
