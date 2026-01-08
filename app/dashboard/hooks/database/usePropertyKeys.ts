import { useState, useEffect, useCallback, startTransition } from 'react'
import { toast } from 'sonner'
import { useLoading } from '../util/useLoading'

const PROPERTY_KEYS_CACHE_KEY = 'graphdb_property_keys'
const PROPERTY_KEYS_CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

interface PropertyKeysCache {
  properties: string[]
  propertiesByLabel: Record<string, string[]>
  timestamp: number
}

export function usePropertyKeys () {
  const { loading, withLoading } = useLoading()
  const [propertyKeys, setPropertyKeys] = useState<string[]>([])
  const [propertiesByLabel, setPropertiesByLabel] = useState<Record<string, string[]>>({})

  const loadFromCache = useCallback((): { properties: string[], propertiesByLabel: Record<string, string[]> } | null => {
    try {
      const cached = localStorage.getItem(PROPERTY_KEYS_CACHE_KEY)
      if (!cached) return null

      const parsed: PropertyKeysCache = JSON.parse(cached)
      const now = Date.now()

      // Check if cache is still valid
      if (now - parsed.timestamp < PROPERTY_KEYS_CACHE_EXPIRY) {
        return {
          properties: parsed.properties,
          propertiesByLabel: parsed.propertiesByLabel || {}
        }
      }

      // Cache expired, remove it
      localStorage.removeItem(PROPERTY_KEYS_CACHE_KEY)
      return null
    } catch {
      return null
    }
  }, [])

  const saveToCache = useCallback((properties: string[], byLabel: Record<string, string[]>) => {
    try {
      const cache: PropertyKeysCache = {
        properties,
        propertiesByLabel: byLabel,
        timestamp: Date.now()
      }
      localStorage.setItem(PROPERTY_KEYS_CACHE_KEY, JSON.stringify(cache))
    } catch {
      // Ignore cache errors
    }
  }, [])

  const fetchPropertyKeys = useCallback(async () => {
    await withLoading(async () => {
      try {
        const response = await fetch('/api/properties')
        const data = await response.json()

        if (data.success) {
          setPropertyKeys(data.properties)
          setPropertiesByLabel(data.propertiesByLabel || {})
          saveToCache(data.properties, data.propertiesByLabel || {})
          toast.success(`Loaded ${data.count} property keys`)
        } else {
          toast.error(data.error || 'Failed to load property keys')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load property keys'
        toast.error(errorMessage)
      }
    })
  }, [withLoading, saveToCache])

  // Load from cache on mount
  useEffect(() => {
    const cached = loadFromCache()
    if (cached && cached.properties.length > 0) {
      startTransition(() => {
        setPropertyKeys(cached.properties)
        setPropertiesByLabel(cached.propertiesByLabel)
      })
    } else {
      // Auto-fetch if no cache
      fetchPropertyKeys()
    }
  }, [loadFromCache, fetchPropertyKeys])

  // Get properties for a specific label
  const getPropertiesForLabel = useCallback((label: string | undefined): string[] => {
    if (!label) return propertyKeys // Return all if no label
    return propertiesByLabel[label] || []
  }, [propertyKeys, propertiesByLabel])

  return {
    propertyKeys,
    propertiesByLabel,
    loading,
    updatePropertyKeys: fetchPropertyKeys,
    getPropertiesForLabel
  }
}

