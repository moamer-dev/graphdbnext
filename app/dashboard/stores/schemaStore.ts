'use client'

import { create } from 'zustand'
import type { SchemaStatistics } from '@/lib/services/SchemaExplorerService'

interface SchemaStore {
  statistics: SchemaStatistics | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  
  setStatistics: (statistics: SchemaStatistics) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useSchemaStore = create<SchemaStore>((set) => ({
  statistics: null,
  loading: false,
  error: null,
  lastUpdated: null,
  
  setStatistics: (statistics) => set({ 
    statistics, 
    loading: false, 
    error: null,
    lastUpdated: new Date()
  }),
  
  setLoading: (loading) => set({ loading, error: null }),
  
  setError: (error) => set({ error, loading: false }),
  
  reset: () => set({
    statistics: null,
    loading: false,
    error: null,
    lastUpdated: null
  })
}))

