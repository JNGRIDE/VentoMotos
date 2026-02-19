import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function areDeepEqual(val1: any, val2: any): boolean {
  if (val1 === val2) return true;

  if (typeof val1 !== 'object' || val1 === null || typeof val2 !== 'object' || val2 === null) {
    return false;
  }

  if (Array.isArray(val1) !== Array.isArray(val2)) return false;

  if (Array.isArray(val1)) {
    if (val1.length !== val2.length) return false;
    for (let i = 0; i < val1.length; i++) {
      if (!areDeepEqual(val1[i], val2[i])) return false;
    }
    return true;
  }

  const keys1 = Object.keys(val1);
  const keys2 = Object.keys(val2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!Object.prototype.hasOwnProperty.call(val2, key)) return false;
    if (!areDeepEqual(val1[key], val2[key])) return false;
  }

  return true;
}
