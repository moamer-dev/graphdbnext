import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export RBAC utilities for convenience
export * from './rbac'
export * from './nodeUtils'
export * from './propertyUtils'
export * from './graphDatabase'
export * from './savedQueries'
export * from './queryTemplates'
export * from './downloadTemplate'
export * from './cypherToBuilder'
