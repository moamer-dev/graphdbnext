'use client'

import { useState, useEffect, type ComponentType } from 'react'
import { MODULE_IDS } from '../modules/types'
import type { ModelBuilderAdapterProps } from '../adapters/ModelBuilderAdapter'

/**
 * Hook to check if Model Builder module is enabled
 * and conditionally load the adapter
 */
export function useModelBuilder () {
  const [isEnabled, setIsEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ModelBuilderAdapter, setModelBuilderAdapter] = useState<ComponentType<ModelBuilderAdapterProps> | null>(null)
  const [adapterLoading, setAdapterLoading] = useState(false)

  // Check module status
  useEffect(() => {
    const checkModuleStatus = async () => {
      try {
        const response = await fetch('/api/modules')
        if (response.ok) {
          const data = await response.json()
          const mod = data.modules?.find((m: { id: string }) => m.id === MODULE_IDS.MODEL_BUILDER)
          setIsEnabled(mod?.enabled ?? false)
        }
      } catch (error) {
        console.error('Error checking module status:', error)
        setIsEnabled(false)
      } finally {
        setLoading(false)
      }
    }

    checkModuleStatus()
  }, [])

  // Dynamically load adapter when module is enabled
  // Use a function that returns a promise to avoid evaluating the module during import
  useEffect(() => {
    if (loading || !isEnabled || ModelBuilderAdapter) {
      return
    }

    const loadAdapter = async () => {
      setAdapterLoading(true)
      try {
        // Use a function import to delay evaluation
        const adapterModule = await import('../adapters/ModelBuilderAdapter')
        // Store the component, but it won't be evaluated until rendered
        setModelBuilderAdapter(() => adapterModule.ModelBuilderAdapter)
      } catch (error) {
        console.error('Failed to load ModelBuilderAdapter:', error)
        setModelBuilderAdapter(null)
      } finally {
        setAdapterLoading(false)
      }
    }

    loadAdapter()
  }, [isEnabled, loading, ModelBuilderAdapter])

  return {
    isEnabled,
    loading: loading || adapterLoading,
    ModelBuilderAdapter
  }
}

