import { useState, useEffect } from 'react'

/**
 * Hook to persist tab selection in localStorage
 */
export function useTabPersistence<T extends string>(
  key: string,
  defaultValue: T,
  validValues: T[]
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const stored = localStorage.getItem(key)
      if (stored && validValues.includes(stored as T)) {
        return stored as T
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
    }
    
    return defaultValue
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.warn('Failed to write to localStorage:', error)
    }
  }, [key, value])

  return [value, setValue]
}

