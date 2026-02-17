import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function areFlatObjectsEqual<T extends Record<string, any>>(obj1: T, obj2: T): boolean {
  if (obj1 === obj2) return true;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

export function areArraysOfFlatObjectsEqual<T extends Record<string, any>>(arr1: T[], arr2: T[]): boolean {
  if (arr1 === arr2) return true;
  if (arr1.length !== arr2.length) return false;

  for (let i = 0; i < arr1.length; i++) {
    if (!areFlatObjectsEqual(arr1[i], arr2[i])) {
      return false;
    }
  }

  return true;
}

export function areDeepEqual(val1: any, val2: any): boolean {
  if (val1 === val2) return true;

  if (typeof val1 !== 'object' || val1 === null || typeof val2 !== 'object' || val2 === null) {
    return false;
  }

  if (Array.isArray(val1)) {
    if (!Array.isArray(val2) || val1.length !== val2.length) return false;
    for (let i = 0; i < val1.length; i++) {
      if (!areDeepEqual(val1[i], val2[i])) return false;
    }
    return true;
  }

  // If one is array and other is object (but not null), they are not equal
  if (Array.isArray(val2)) return false;

  const keys1 = Object.keys(val1);
  const keys2 = Object.keys(val2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!Object.prototype.hasOwnProperty.call(val2, key)) return false;
    if (!areDeepEqual(val1[key], val2[key])) return false;
  }

  return true;
}
