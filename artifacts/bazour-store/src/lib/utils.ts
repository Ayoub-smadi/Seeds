import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, _currency = 'JOD', lang = 'en') {
  const formatted = price.toFixed(3);
  if (lang === 'ar') {
    return `${formatted} د.أ`;
  }
  return `${formatted} JD`;
}
