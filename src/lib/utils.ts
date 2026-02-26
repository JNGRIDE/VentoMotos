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

export function areDeepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (obj1 === null || obj1 === undefined || obj2 === null || obj2 === undefined) {
    return obj1 === obj2;
  }

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }

  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }

  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false;
    if (!areDeepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}
