/**
 * File: apps/admin/src/app/layout.tsx
 * Purpose: Root layout for the internal admin app. Server Component,
 *          no logic.
 */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Credixa Admin",
  robots: { index: false, follow: false },
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
