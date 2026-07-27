/**
 * File: apps/web/src/app/layout.tsx
 * Purpose: Root layout for the customer/agent-facing app. Server Component
 *          (no "use client") — no business logic, only shell markup.
 */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Credixa — Fast, secure digital payments",
  description:
    "Buy airtime, data, pay bills, and manage your wallet with Credixa, Nigeria's modern digital payments platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
