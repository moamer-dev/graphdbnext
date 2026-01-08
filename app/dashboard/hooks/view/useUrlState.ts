import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

/**
 * Generic hook for managing URL search parameters as state
 * 
 * @param paramName - The URL parameter name (e.g., 'view', 'mode', 'page')
 * @param defaultValue - Default value if parameter is not in URL
 * @param options - Optional configuration
 * @returns [state, setState] tuple similar to useState
 * 
 * @example
 * ```tsx
 * const [viewMode, setViewMode] = useUrlState<'table' | 'grid'>('view', 'table')
 * ```
 */
export function useUrlState<T extends string>(
  paramName: string,
  defaultValue: T,
  options?: {
    /**
     * If true, removes the parameter from URL when value equals defaultValue
     * If false, always keeps the parameter in URL
     * @default true
     */
    removeWhenDefault?: boolean
    /**
     * Custom serializer for the value (defaults to string)
     */
    serialize?: (value: T) => string
    /**
     * Custom deserializer for the value (defaults to string)
     */
    deserialize?: (value: string) => T
  }
): [T, (value: T) => void] {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { removeWhenDefault = true, serialize, deserialize } = options || {}
  
  // Initialize from URL or default value using function initializer
  const getInitialValue = (): T => {
    const paramValue = searchParams.get(paramName)
    if (paramValue) {
      return deserialize 
        ? deserialize(paramValue)
        : (paramValue as T)
    }
    return defaultValue
  }
  
  const [state, setState] = useState<T>(getInitialValue)
  const lastUrlValueRef = useRef<string | null>(searchParams.get(paramName))
  const isInternalUpdateRef = useRef(false)
  
  // Update URL when state changes (but only if it's different from URL)
  useEffect(() => {
    // Skip if we're updating from URL change
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false
      return
    }
    
    const currentParamValue = searchParams.get(paramName)
    const serializedState = serialize ? serialize(state) : state
    
    // Determine what should be in the URL
    const shouldBeInUrl = removeWhenDefault && state === defaultValue 
      ? null 
      : serializedState
    
    // Only update if URL doesn't match current state
    if (currentParamValue !== shouldBeInUrl) {
      const params = new URLSearchParams(searchParams.toString())
      
      if (shouldBeInUrl === null) {
        params.delete(paramName)
      } else {
        params.set(paramName, shouldBeInUrl)
      }
      
      const newUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname
      
      lastUrlValueRef.current = shouldBeInUrl
      router.replace(newUrl, { scroll: false })
    }
  }, [state, paramName, defaultValue, removeWhenDefault, serialize, router, searchParams])
  
  // Sync state when URL changes externally (e.g., browser back/forward)
  useEffect(() => {
    const paramValue = searchParams.get(paramName)
    
    // Only process if URL actually changed
    if (paramValue === lastUrlValueRef.current) {
      return
    }
    
    lastUrlValueRef.current = paramValue
    const urlValue = paramValue
      ? (deserialize ? deserialize(paramValue) : (paramValue as T))
      : defaultValue
    
    // Only update state if URL value differs from current state
    if (urlValue !== state) {
      isInternalUpdateRef.current = true
      setState(urlValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, paramName, defaultValue, deserialize])
  
  return [state, setState]
}

