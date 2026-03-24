import { useEffect, useRef } from 'react'

interface UseLiveUpdateOptions {
  delay?: number
  enabled?: boolean
}

/**
 * Hook for live updates with debouncing
 * Useful for form inputs that should update state automatically
 */
export function useLiveUpdate<T> (
  value: T,
  currentValue: T,
  onUpdate: (value: T) => void,
  options: UseLiveUpdateOptions = {}
) {
  const { delay = 300, enabled = true } = options
  const isUpdatingRef = useRef(false)

  useEffect(() => {
    if (!enabled || value === currentValue || !value || isUpdatingRef.current) {
      return
    }

    const timeoutId = setTimeout(() => {
      // Double-check the value hasn't changed
      if (value !== currentValue && value && !isUpdatingRef.current) {
        isUpdatingRef.current = true
        onUpdate(value)
        setTimeout(() => { isUpdatingRef.current = false }, 50)
      }
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [value, currentValue, onUpdate, delay, enabled])
}

/**
 * Hook for live updates of complex objects (arrays, objects) with deep comparison
 */
export function useLiveUpdateComplex<T> (
  value: T,
  currentValue: T,
  onUpdate: (value: T) => void,
  options: UseLiveUpdateOptions = {}
) {
  const { delay = 300, enabled = true } = options
  const isUpdatingRef = useRef(false)

  useEffect(() => {
    if (!enabled || isUpdatingRef.current) {
      return
    }

    const valueStr = JSON.stringify(value)
    const currentValueStr = JSON.stringify(currentValue)

    if (valueStr === currentValueStr) {
      return
    }

    const timeoutId = setTimeout(() => {
      // Double-check the value hasn't changed
      if (!isUpdatingRef.current) {
        const updatedValueStr = JSON.stringify(value)
        const updatedCurrentValueStr = JSON.stringify(currentValue)
        
        if (updatedValueStr !== updatedCurrentValueStr) {
          isUpdatingRef.current = true
          onUpdate(value)
          setTimeout(() => { isUpdatingRef.current = false }, 50)
        }
      }
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [value, currentValue, onUpdate, delay, enabled])
}

