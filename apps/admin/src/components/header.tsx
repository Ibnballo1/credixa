"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  LogOut,
  Users,
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ShoppingBag,
  CreditCard,
} from "lucide-react";
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

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Wallets", href: "/dashboard/wallets", icon: Wallet },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: ArrowLeftRight,
  },
  { label: "Purchases", href: "/dashboard/purchases", icon: ShoppingBag },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
];

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
        <div className="flex shrink-0 items-center gap-2">
          <Logo size="lg" className="h-10 w-10" iconOnly={true} />
          <span className="text-base font-semibold text-slate-900 sm:text-lg">
            Credixa Admin
          </span>
        </div>

        {/* Desktop Links Container */}
        <div className="flex items-center gap-4 md:gap-6">
          <nav className="hidden items-center gap-1 sm:flex sm:gap-2 md:gap-4 overflow-x-auto no-scrollbar max-w-[400px] lg:max-w-none">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Profile Dropdown Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full bg-slate-200 p-0 focus-visible:ring-2 focus-visible:ring-primary shrink-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                  {userInitials}
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-slate-900">
                    {session.user.name}
                  </p>
                  <p className="text-xs leading-none text-slate-500">
                    {session.user.email}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* All links available in dropdown for mobile and fast navigation */}
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className="cursor-pointer">
                      <Icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}

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
        </div>
      </div>
    </header>
  );
}
