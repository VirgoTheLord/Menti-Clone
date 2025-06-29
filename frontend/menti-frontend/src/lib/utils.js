// src/lib/utils.js

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine Tailwind classes with conflict resolution
export function cn(...inputs) {
  return twMerge(clsx(...inputs));
}
