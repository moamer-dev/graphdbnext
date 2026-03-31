'use client'

import { create } from 'zustand'
import type { ActionCanvasNode } from './actionCanvasStore'

export interface TextTransform {
  type: 'lowercase' | 'uppercase' | 'trim' | 'replace' | 'regex' | 'slugify' | 'pascalcase' | 'camelcase' | 'snakecase'
  replaceFrom?: string
  replaceTo?: string
  regexPattern?: string
  regexReplacement?: string
}

export interface ActionConfigurationState {
  // Action metadata
  actionNodeId: string | null
  actionLabel: string
  selectedGroupId: string

  // Group config (for action:group type)
  groupLabel: string
  groupEnabled: boolean

  // Test/Execution state
  testResult: { success: boolean; output: string; details?: string } | null
  isExecuting: boolean
  showApiResponseModal: boolean
  graphResult: Array<Record<string, unknown>> | null
  showGraphModal: boolean

  // Generic config object (New)
  config: Record<string, any>

  // Actions (setters)
  setActionNodeId: (id: string | null) => void
  setActionLabel: (label: string) => void
  setSelectedGroupId: (groupId: string) => void
  setGroupLabel: (label: string) => void
  setGroupEnabled: (enabled: boolean) => void
  setTestResult: (result: { success: boolean; output: string; details?: string } | null) => void
  setIsExecuting: (executing: boolean) => void
  setShowApiResponseModal: (show: boolean) => void
  setGraphResult: (result: Array<Record<string, unknown>> | null) => void
  setShowGraphModal: (show: boolean) => void

  // Config setters
  setConfig: (config: Record<string, any>) => void
  updateConfig: (updates: Partial<Record<string, any>>) => void

  // Helper functions
  loadFromActionNode: (actionNode: ActionCanvasNode | null) => void
  getActionNodeConfig: (actionType: string) => Record<string, unknown>
}

const initialState: Omit<ActionConfigurationState, 
  | 'setActionNodeId' | 'setActionLabel' | 'setSelectedGroupId' | 'setGroupLabel' | 'setGroupEnabled' 
  | 'setTestResult' | 'setIsExecuting' | 'setShowApiResponseModal' | 'setGraphResult' | 'setShowGraphModal'
  | 'setConfig' | 'updateConfig' | 'loadFromActionNode' | 'getActionNodeConfig'
> = {
  actionNodeId: null,
  actionLabel: '',
  selectedGroupId: 'none',
  groupLabel: '',
  groupEnabled: true,
  testResult: null,
  isExecuting: false,
  showApiResponseModal: false,
  graphResult: null,
  showGraphModal: false,
  config: {}
}

export const useActionConfigurationStore = create<ActionConfigurationState>((set, get) => ({
  ...initialState,

  setActionNodeId: (id) => set({ actionNodeId: id }),
  setActionLabel: (label) => set({ actionLabel: label }),
  setSelectedGroupId: (groupId) => set({ selectedGroupId: groupId }),
  setGroupLabel: (label) => set({ groupLabel: label }),
  setGroupEnabled: (enabled) => set({ groupEnabled: enabled }),
  setTestResult: (result) => set({ testResult: result }),
  setIsExecuting: (executing) => set({ isExecuting: executing }),
  setShowApiResponseModal: (show) => set({ showApiResponseModal: show }),
  setGraphResult: (result) => set({ graphResult: result }),
  setShowGraphModal: (show) => set({ showGraphModal: show }),

  setConfig: (config) => set({ config }),
  updateConfig: (updates) => set((state) => ({ 
    config: { ...state.config, ...updates } 
  })),

  loadFromActionNode: (actionNode) => {
    if (!actionNode) {
      set({ ...initialState })
      return
    }

    // Set basic info and load config directly from node
    set({
      actionNodeId: actionNode.id,
      actionLabel: actionNode.label || '',
      config: actionNode.config || {},
      // Group config
      groupLabel: (actionNode.type === 'action:group' || actionNode.isGroup) ? (actionNode.label || 'Action Group') : '',
      groupEnabled: actionNode.enabled !== false
    })
  },

  getActionNodeConfig: () => {
    return get().config
  }
}))
