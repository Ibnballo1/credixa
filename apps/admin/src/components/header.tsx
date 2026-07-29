"use client";

import Link from "next/link";
import { useTransition } from "react";
import { LogOut, Users, LayoutDashboard } from "lucide-react";
import { signOutAction } from "@/features/auth/actions/sign-out";
import type { Session } from "@credixa/auth";
import {
  Button,
  Logo,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@credixa/ui";

interface HeaderProps {
  session: Session;
}

export function Header({ session }: HeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  const userInitials = session.user.name
    ? session.user.name.charAt(0).toUpperCase()
    : "A";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo & Brand */}
        <div className="flex shrink-0 items-center gap-3">
          <Logo size="lg" className="h-10 w-10" />
          <span className="text-base hidden md:block font-semibold text-slate-900 sm:text-lg">
            Credixa Admin
          </span>
        </div>

        {/* Navigation & Avatar Menu */}
        <nav className="flex items-center gap-4 md:gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-300"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/users"
            className="text-sm hidden md:block font-medium text-slate-600 transition-colors hover:text-slate-300"
          >
            Users
          </Link>

          {/* Profile Dropdown Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full bg-slate-200 p-0 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                  {userInitials}
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-slate-300">
                    {session.user.name}
                  </p>
                  <p className="text-xs leading-none text-slate-500">
                    {session.user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/users" className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </Link>
              </DropdownMenuItem>

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
