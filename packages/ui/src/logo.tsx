// File: packages/ui/src/logo.tsx
// Purpose: Shared brand logo component using your custom image asset.

import * as React from "react";
import { cn } from "./lib/cn";

export interface LogoProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Path to your logo image (e.g. "/logo.svg" or "/logo.png") */
  imageSrc?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** If true, shows only the icon without text */
  iconOnly?: boolean;
  /** Size variant for height scaling */
  size?: "sm" | "md" | "lg";
  /** Destination link (defaults to "/") */
  href?: string;
}

const sizeVariants = {
  sm: "h-6",
  md: "h-8",
  lg: "h-10",
};

export function Logo({
  imageSrc = "/icon.png", // Default path to your custom logo file in your public folder
  alt = "Credixa",
  iconOnly = false,
  size = "md",
  href = "/",
  className,
  ...props
}: LogoProps) {
  const heightClass = sizeVariants[size];

  return (
    <a
      href={href}
      className={cn(
        "inline-flex justify-center items-center gap-0.5 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm",
        className,
      )}
      {...props}
    >
      <img src={imageSrc} alt={alt} className={cn("w-12 h-12", heightClass)} />
      {!iconOnly && (
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Credixa<span className="text-primary">.</span>
        </span>
      )}
    </a>
  );
}
