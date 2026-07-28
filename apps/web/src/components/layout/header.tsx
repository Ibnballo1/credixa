"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
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
} from "@credixa/ui"; // Assuming your UI package exports these

export function Header({ session, notificationSummary }: any) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      {/* Container: Added px-4 (mobile) and md:px-6 (tablet/desktop) for spacing */}
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo - Fixed shrinking issue with shrink-0 */}
        <div className="flex shrink-0 items-center gap-2">
          <Logo size="lg" className="w-10 h-10" />
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-2 md:gap-6">
          {/* Main Links - Always Visible */}
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Dashboard
          </Link>
          <Link
            href="/profile"
            className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Profile
          </Link>

          {/* Notifications - Always Visible */}
          <div className="mx-2">
            <NotificationBell summary={notificationSummary} />
          </div>

          {/* User Menu Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative bg-slate-200 h-9 w-9 rounded-full"
              >
                <div className="flex h-9 w-fit items-center justify-center rounded-full bg-inherit text-xs font-bold text-slate-600">
                  {session.user.name?.charAt(0) || "U"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session.user.name}
                  </p>
                  <p className="text-xs leading-none text-slate-500">
                    {session.user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOutAction} className="w-full">
                  <button
                    type="submit"
                    className="flex w-full items-center text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
