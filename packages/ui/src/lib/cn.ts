// File: packages/ui/src/lib/cn.ts
// Purpose: Standard clsx + tailwind-merge className combiner, used by every
//          component in this package to safely merge variant classes with
//          consumer-supplied `className` overrides.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
