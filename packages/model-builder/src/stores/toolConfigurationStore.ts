'use client'

import { create } from 'zustand'
import type { ToolCanvasNode } from './toolCanvasStore'
import type { ConnectionStatus } from '../components/shared/ConnectionStatusIndicator'

export interface ToolConfigurationState {
  toolNodeId: string | null
  toolLabel: string
  
  // Test/Execution state
  testResult: { success: boolean; output: string; details?: string } | null
  isExecuting: boolean
  testIdInput: string
  executedApiResponse: unknown | null
  apiResponseModalOpen: boolean
  responseHistory: Array<{
    id: string
    timestamp: number
    toolId: string
    toolLabel: string
    response: unknown
    params?: Record<string, unknown>
  }>
  connectionStatus: ConnectionStatus
  validationErrors: Array<{ field: string; message: string }>

  // Generic config object
  config: Record<string, any>

  // Actions
  setToolNodeId: (id: string | null) => void
  loadFromToolNode: (toolNode: ToolCanvasNode | null) => void
  reset: () => void
  setToolLabel: (label: string) => void
  
  setTestResult: (result: { success: boolean; output: string; details?: string } | null) => void
  setIsExecuting: (executing: boolean) => void
  setTestIdInput: (input: string) => void
  setExecutedApiResponse: (response: unknown | null) => void
  setApiResponseModalOpen: (open: boolean) => void
  setResponseHistory: (history: ToolConfigurationState['responseHistory']) => void
  addToResponseHistory: (entry: ToolConfigurationState['responseHistory'][number]) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setValidationErrors: (errors: Array<{ field: string; message: string }>) => void
  
  setConfig: (config: Record<string, any>) => void
  updateConfig: (updates: Partial<Record<string, any>>) => void
  getToolNodeConfig: (toolType: string) => Record<string, unknown>
}

const initialState = {
  toolNodeId: null,
  toolLabel: '',
  testResult: null,
  isExecuting: false,
  testIdInput: '',
  executedApiResponse: null,
  apiResponseModalOpen: false,
  responseHistory: [],
  connectionStatus: 'disconnected' as const,
  validationErrors: [],
  config: {}
}

export const useToolConfigurationStore = create<ToolConfigurationState>((set, get) => ({
  ...initialState,

  setToolNodeId: (id) => set({ toolNodeId: id }),

  loadFromToolNode: (toolNode) => {
    if (!toolNode) {
      set({ ...initialState, toolNodeId: null })
      return
    }

    set({
      toolNodeId: toolNode.id,
      toolLabel: toolNode.label || '',
      config: toolNode.config || {},
      executedApiResponse: toolNode.config?.executedResponse ?? null
    })
  },

  reset: () => set({ ...initialState }),
  setToolLabel: (label) => set({ toolLabel: label }),

  setTestResult: (result) => set({ testResult: result }),
  setIsExecuting: (executing) => set({ isExecuting: executing }),
  setTestIdInput: (input) => set({ testIdInput: input }),
  setExecutedApiResponse: (response) => set({ executedApiResponse: response }),
  setApiResponseModalOpen: (open) => set({ apiResponseModalOpen: open }),
  setResponseHistory: (history) => set({ responseHistory: history }),
  addToResponseHistory: (entry) => set((state) => ({
    responseHistory: [...state.responseHistory, entry]
  })),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setValidationErrors: (errors) => set({ validationErrors: errors }),

  setConfig: (config) => set({ config }),
  updateConfig: (updates) => set((state) => ({
    config: { ...state.config, ...updates }
  })),

  getToolNodeConfig: () => {
    return get().config
  }
}))

export const syncToolConfigurationToNode = (
  toolNodeId: string,
  toolType: string,
  updateToolNode: (id: string, updates: Partial<import('./toolCanvasStore').ToolCanvasNode>) => void
) => {
  const store = useToolConfigurationStore.getState()
  updateToolNode(toolNodeId, {
    label: store.toolLabel,
    config: store.config
  })
}
