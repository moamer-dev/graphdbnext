'use client'

import { create } from 'zustand'
import type { VisualizationConfig } from '@/lib/services/CustomVisualizationService'

interface VisualizationStore {
  config: VisualizationConfig | null
  comparisonMode: boolean
  graph1: { nodes: unknown[]; edges: unknown[] } | null
  graph2: { nodes: unknown[]; edges: unknown[] } | null
  
  setConfig: (config: VisualizationConfig) => void
  setComparisonMode: (enabled: boolean) => void
  setGraph1: (graph: { nodes: unknown[]; edges: unknown[] }) => void
  setGraph2: (graph: { nodes: unknown[]; edges: unknown[] }) => void
  reset: () => void
}

export const useVisualizationStore = create<VisualizationStore>((set) => ({
  config: null,
  comparisonMode: false,
  graph1: null,
  graph2: null,
  
  setConfig: (config) => set({ config }),
  
  setComparisonMode: (enabled) => set({ comparisonMode: enabled }),
  
  setGraph1: (graph) => set({ graph1: graph }),
  
  setGraph2: (graph) => set({ graph2: graph }),
  
  reset: () => set({
    config: null,
    comparisonMode: false,
    graph1: null,
    graph2: null
  })
}))

