'use client'

import { useCallback } from 'react'
import { useAnalyticsStore } from '@/app/dashboard/stores/analyticsStore'
import type { AnalyticsData } from '@/lib/services/GraphAnalyticsService'

export function useGraphAnalytics() {
  const { data, loading, error, setData, setLoading, setError } = useAnalyticsStore()

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/database/analytics')
      const result = await response.json()
      
      if (result.success && result.data) {
        setData(result.data as AnalyticsData)
        setLoading(false)
      } else {
        setLoading(false)
        const errorMessage = result.error || 'Failed to fetch analytics'
        setError(errorMessage)
      }
    } catch (err) {
      setLoading(false)
      let errorMessage = 'Failed to fetch analytics'
      if (err instanceof Error) {
        if (err.message.includes('WebSocket') || err.message.includes('connection') || err.message.includes('fetch')) {
          errorMessage = 'Unable to connect to database. Please ensure the database is running and accessible.'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
      console.error('Error fetching analytics:', err)
    }
  }, [setLoading, setError, setData])

  return {
    data,
    loading,
    error,
    fetchAnalytics,
    refresh: fetchAnalytics
  }
}

