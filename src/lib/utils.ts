import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format large numbers with K/M suffixes
 * Examples: 1000 -> 1K, 10500 -> 10.5K, 1000000 -> 1M
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }
  
  if (num < 1000000) {
    const thousands = num / 1000;
    // Show decimal only if less than 10K and has meaningful decimal
    if (thousands < 10 && thousands % 1 !== 0) {
      return `${thousands.toFixed(1).replace(/\.0$/, '')}K`;
    }
    return `${Math.floor(thousands)}K`;
  }
  
  const millions = num / 1000000;
  // Show decimal only if less than 10M and has meaningful decimal
  if (millions < 10 && millions % 1 !== 0) {
    return `${millions.toFixed(1).replace(/\.0$/, '')}M`;
  }
  return `${Math.floor(millions)}M`;
}
