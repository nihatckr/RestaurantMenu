import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge conditional class lists and de-duplicate conflicting Tailwind utilities
// (so a passed `className` can safely override a component's defaults).
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
