import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Keep all existing code and add this at the end
// This helps with any potential type errors during build
export const safelyHandleError = (error: unknown): Error => {
  if (error instanceof Error) return error
  return new Error(String(error))
}

// This helps with dynamic imports that might cause webpack issues
export const dynamicImport = async (modulePath: string) => {
  try {
    return await import(modulePath)
  } catch (error) {
    console.error(`Failed to import ${modulePath}:`, error)
    return null
  }
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
