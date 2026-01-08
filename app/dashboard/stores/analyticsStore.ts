'use client'

import { create } from 'zustand'
import type { AnalyticsData } from '@/lib/services/GraphAnalyticsService'

interface AnalyticsStore {
  data: AnalyticsData | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  
  setData: (data: AnalyticsData) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  data: null,
  loading: false,
  error: null,
  lastUpdated: null,
  
  setData: (data) => set({ 
    data, 
    loading: false, 
    error: null,
    lastUpdated: new Date()
  }),
  
  setLoading: (loading) => set({ loading, error: null }),
  
  setError: (error) => set({ error, loading: false }),
  
  reset: () => set({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  })
}))

