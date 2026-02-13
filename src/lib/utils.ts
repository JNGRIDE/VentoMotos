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
