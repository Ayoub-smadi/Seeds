import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, _currency = 'JOD', lang = 'en', symbol?: string) {
  const formatted = price.toFixed(3);
  if (symbol) return `${formatted} ${symbol}`;
  if (lang === 'ar') return `${formatted} د.أ`;
  return `${formatted} JD`;
}
