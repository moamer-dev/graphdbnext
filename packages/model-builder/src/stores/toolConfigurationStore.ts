'use client'

import { create } from 'zustand'
import type { ToolCanvasNode } from './toolCanvasStore'
import type { ConditionGroup, ConditionType, SwitchCase, SwitchSource } from '../components/sidebars/ToolConfigurationSidebar'
import type { ConnectionStatus } from '../components/shared/ConnectionStatusIndicator'

interface ToolConfigurationState {
  toolNodeId: string | null
  toolLabel: string
  conditionGroups: ConditionGroup[]
  selectedConditionType: ConditionType
  childInputValues: Record<string, string>
  ancestorInputValues: Record<string, string>
  switchSource: SwitchSource
  switchAttributeName: string
  switchCases: SwitchCase[]
  switchCaseInputs: Record<string, string>
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
  authenticatedApiConfig: {
    credentialId: string
    idSource: 'attribute' | 'textContent' | 'xpath'
    idAttribute?: string
    idXpath?: string
    timeout?: number
    storeInContext?: string
  }
  httpConfig: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    url: string
    useCredential?: boolean
    credentialId?: string
    authType?: 'none' | 'bearer' | 'basic' | 'apiKey' | 'custom'
    apiKey?: string
    apiKeyHeader?: string
    bearerToken?: string
    basicUsername?: string
    basicPassword?: string
    customHeaderName?: string
    customHeaderValue?: string
    headers?: Array<{ id: string; key: string; value: string }>
    queryParams?: Array<{ id: string; key: string; value: string }>
    body?: string
    bodyType?: 'json' | 'text' | 'form-data' | 'x-www-form-urlencoded'
    timeout?: number
    storeInContext?: string
  }
  fetchApiConfig: {
    apiProvider: string
    idSource: 'attribute' | 'textContent' | 'xpath'
    idAttribute?: string
    idXpath?: string
    apiKey?: string
    customEndpoint?: string
    timeout?: number
    storeInContext?: string
  }
  delayConfig: {
    delayMs: number
  }
  setToolNodeId: (id: string | null) => void
  loadFromToolNode: (toolNode: ToolCanvasNode | null) => void
  reset: () => void
  setToolLabel: (label: string) => void
  setConditionGroups: (groups: ConditionGroup[]) => void
  setSelectedConditionType: (type: ConditionType) => void
  setChildInputValues: (values: Record<string, string>) => void
  setAncestorInputValues: (values: Record<string, string>) => void
  setSwitchSource: (source: SwitchSource) => void
  setSwitchAttributeName: (name: string) => void
  setSwitchCases: (cases: SwitchCase[]) => void
  setSwitchCaseInputs: (inputs: Record<string, string>) => void
  setTestResult: (result: { success: boolean; output: string; details?: string } | null) => void
  setIsExecuting: (executing: boolean) => void
  setTestIdInput: (input: string) => void
  setExecutedApiResponse: (response: unknown | null) => void
  setApiResponseModalOpen: (open: boolean) => void
  setResponseHistory: (history: ToolConfigurationState['responseHistory']) => void
  addToResponseHistory: (entry: ToolConfigurationState['responseHistory'][number]) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setValidationErrors: (errors: Array<{ field: string; message: string }>) => void
  setAuthenticatedApiConfig: (config: ToolConfigurationState['authenticatedApiConfig']) => void
  setHttpConfig: (config: ToolConfigurationState['httpConfig']) => void
  setFetchApiConfig: (config: ToolConfigurationState['fetchApiConfig']) => void
  setDelayConfig: (config: ToolConfigurationState['delayConfig']) => void
  getToolNodeConfig: (toolType: string) => Record<string, unknown>
}

const initialState = {
  toolNodeId: null,
  toolLabel: '',
  conditionGroups: [],
  selectedConditionType: 'HasChildren' as const,
  childInputValues: {},
  ancestorInputValues: {},
  switchSource: 'attribute' as const,
  switchAttributeName: '',
  switchCases: [],
  switchCaseInputs: {},
  testResult: null,
  isExecuting: false,
  testIdInput: '',
  executedApiResponse: null,
  apiResponseModalOpen: false,
  responseHistory: [],
  connectionStatus: 'disconnected' as const,
  validationErrors: [],
  authenticatedApiConfig: {
    credentialId: '',
    idSource: 'attribute' as const,
    idAttribute: '',
    timeout: 10000
  },
  httpConfig: {
    method: 'GET' as const,
    url: '',
    useCredential: false,
    authType: 'none' as const
  },
  fetchApiConfig: {
    apiProvider: 'wikidata' as const,
    idSource: 'attribute' as const,
    idAttribute: 'wiki:id',
    timeout: 10000
  },
  delayConfig: {
    delayMs: 0
  }
}

export const useToolConfigurationStore = create<ToolConfigurationState>((set, get) => ({
  ...initialState,

  setToolNodeId: (id) => set({ toolNodeId: id }),

  loadFromToolNode: (toolNode) => {
    if (!toolNode) {
      set({ ...initialState, toolNodeId: null })
      return
    }

    const config = toolNode.config || {}
    let conditionGroups: ConditionGroup[] = []
    if (config.conditionGroups) {
      conditionGroups = config.conditionGroups as ConditionGroup[]
    } else if (config.conditions) {
      const oldConditions = config.conditions as Array<unknown>
      if (oldConditions.length > 0) {
        conditionGroups = [{
          id: `group_${Date.now()}`,
          conditions: oldConditions as ConditionGroup['conditions'],
          internalOperator: 'AND'
        }]
      }
    }

    const switchSource = (config.switchSource as SwitchSource) || 'attribute'
    const switchAttributeName = (config.switchAttributeName as string) || ''
    const switchCases = (config.switchCases as SwitchCase[]) || []
    const toolType = toolNode.type

    const nextState: Partial<ToolConfigurationState> = {
      toolNodeId: toolNode.id,
      toolLabel: toolNode.label || '',
      conditionGroups,
      switchSource,
      switchAttributeName,
      switchCases
    }

    if (toolType === 'tool:delay') {
      nextState.delayConfig = {
        delayMs: typeof config.delayMs === 'number' ? config.delayMs : 0
      }
    }

    if (toolType === 'tool:fetch-api') {
      nextState.fetchApiConfig = {
        apiProvider: (config.apiProvider as string) || 'wikidata',
        idSource: (config.idSource as 'attribute' | 'textContent' | 'xpath') || 'attribute',
        idAttribute: config.idAttribute as string | undefined,
        idXpath: config.idXpath as string | undefined,
        apiKey: config.apiKey as string | undefined,
        customEndpoint: config.customEndpoint as string | undefined,
        timeout: config.timeout as number | undefined,
        storeInContext: config.storeInContext as string | undefined
      }
      nextState.executedApiResponse = config.executedResponse ?? null
    }

    if (['tool:fetch-orcid', 'tool:fetch-geonames', 'tool:fetch-europeana', 'tool:fetch-getty'].includes(toolType)) {
      nextState.authenticatedApiConfig = {
        credentialId: (config.credentialId as string) || '',
        idSource: (config.idSource as 'attribute' | 'textContent' | 'xpath') || 'attribute',
        idAttribute: config.idAttribute as string | undefined,
        idXpath: config.idXpath as string | undefined,
        timeout: typeof config.timeout === 'number' ? config.timeout : 10000,
        storeInContext: config.storeInContext as string | undefined
      }
    }

    if (toolType === 'tool:http') {
      nextState.httpConfig = {
        method: (config.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') || 'GET',
        url: (config.url as string) || '',
        useCredential: config.useCredential as boolean | undefined,
        credentialId: config.credentialId as string | undefined,
        authType: (config.authType as 'none' | 'bearer' | 'basic' | 'apiKey' | 'custom') || 'none',
        apiKey: config.apiKey as string | undefined,
        apiKeyHeader: config.apiKeyHeader as string | undefined,
        bearerToken: config.bearerToken as string | undefined,
        basicUsername: config.basicUsername as string | undefined,
        basicPassword: config.basicPassword as string | undefined,
        customHeaderName: config.customHeaderName as string | undefined,
        customHeaderValue: config.customHeaderValue as string | undefined,
        headers: config.headers as Array<{ id: string; key: string; value: string }> | undefined,
        queryParams: config.queryParams as Array<{ id: string; key: string; value: string }> | undefined,
        body: config.body as string | undefined,
        bodyType: (config.bodyType as 'json' | 'text' | 'form-data' | 'x-www-form-urlencoded') || 'json',
        timeout: config.timeout as number | undefined,
        storeInContext: (config.storeInContext as string) || 'httpResponse'
      }
    }

    // Preserve current test result and execution state when loading
    const currentState = get()
    set({ 
      ...initialState, 
      ...nextState,
      // Preserve test execution state
      testResult: currentState.testResult,
      isExecuting: currentState.isExecuting,
      executedApiResponse: currentState.executedApiResponse,
      responseHistory: currentState.responseHistory,
      connectionStatus: currentState.connectionStatus,
      validationErrors: currentState.validationErrors
    })
  },

  reset: () => set({ ...initialState }),

  // Tool label
  setToolLabel: (label) => set({ toolLabel: label }),

  // Condition builder
  setConditionGroups: (groups) => set({ conditionGroups: groups }),
  setSelectedConditionType: (type) => set({ selectedConditionType: type }),
  setChildInputValues: (values) => set({ childInputValues: values }),
  setAncestorInputValues: (values) => set({ ancestorInputValues: values }),

  // Switch tool
  setSwitchSource: (source) => set({ switchSource: source }),
  setSwitchAttributeName: (name) => set({ switchAttributeName: name }),
  setSwitchCases: (cases) => set({ switchCases: cases }),
  setSwitchCaseInputs: (inputs) => set({ switchCaseInputs: inputs }),

  // Test/Execution
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

  // API Configuration
  setAuthenticatedApiConfig: (config) => set({ authenticatedApiConfig: config }),
  setHttpConfig: (config) => set({ httpConfig: config }),
  setFetchApiConfig: (config) => set({ fetchApiConfig: config }),
  setDelayConfig: (config) => set({ delayConfig: config }),

  // Helper function to convert store state to toolNode config format
  getToolNodeConfig: (toolType: string): Record<string, unknown> => {
    const state = get()
    const config: Record<string, unknown> = {}

    // Common configs
    if (state.conditionGroups.length > 0) {
      config.conditionGroups = state.conditionGroups
    }
    if (state.switchSource !== 'attribute' || state.switchCases.length > 0) {
      config.switchSource = state.switchSource
      config.switchAttributeName = state.switchAttributeName
      config.switchCases = state.switchCases
    }

    // Tool-specific configs
    switch (toolType) {
      case 'tool:delay':
        config.delayMs = state.delayConfig.delayMs
        break
      case 'tool:fetch-api':
        config.apiProvider = state.fetchApiConfig.apiProvider
        config.idSource = state.fetchApiConfig.idSource
        if (state.fetchApiConfig.idAttribute) config.idAttribute = state.fetchApiConfig.idAttribute
        if (state.fetchApiConfig.idXpath) config.idXpath = state.fetchApiConfig.idXpath
        if (state.fetchApiConfig.apiKey) config.apiKey = state.fetchApiConfig.apiKey
        if (state.fetchApiConfig.customEndpoint) config.customEndpoint = state.fetchApiConfig.customEndpoint
        if (state.fetchApiConfig.timeout !== undefined) config.timeout = state.fetchApiConfig.timeout
        if (state.fetchApiConfig.storeInContext) config.storeInContext = state.fetchApiConfig.storeInContext
        if (state.executedApiResponse) config.executedResponse = state.executedApiResponse
        break
    }

    if (['tool:fetch-orcid', 'tool:fetch-geonames', 'tool:fetch-europeana', 'tool:fetch-getty'].includes(toolType)) {
      if (state.authenticatedApiConfig.credentialId) config.credentialId = state.authenticatedApiConfig.credentialId
      config.idSource = state.authenticatedApiConfig.idSource
      if (state.authenticatedApiConfig.idAttribute) config.idAttribute = state.authenticatedApiConfig.idAttribute
      if (state.authenticatedApiConfig.idXpath) config.idXpath = state.authenticatedApiConfig.idXpath
      if (state.authenticatedApiConfig.timeout !== undefined) config.timeout = state.authenticatedApiConfig.timeout
      if (state.authenticatedApiConfig.storeInContext) config.storeInContext = state.authenticatedApiConfig.storeInContext
    }

    if (toolType === 'tool:http') {
      config.method = state.httpConfig.method
      config.url = state.httpConfig.url
      if (state.httpConfig.useCredential !== undefined) config.useCredential = state.httpConfig.useCredential
      if (state.httpConfig.credentialId) config.credentialId = state.httpConfig.credentialId
      config.authType = state.httpConfig.authType
      if (state.httpConfig.apiKey) config.apiKey = state.httpConfig.apiKey
      if (state.httpConfig.apiKeyHeader) config.apiKeyHeader = state.httpConfig.apiKeyHeader
      if (state.httpConfig.bearerToken) config.bearerToken = state.httpConfig.bearerToken
      if (state.httpConfig.basicUsername) config.basicUsername = state.httpConfig.basicUsername
      if (state.httpConfig.basicPassword) config.basicPassword = state.httpConfig.basicPassword
      if (state.httpConfig.customHeaderName) config.customHeaderName = state.httpConfig.customHeaderName
      if (state.httpConfig.customHeaderValue) config.customHeaderValue = state.httpConfig.customHeaderValue
      if (state.httpConfig.headers) config.headers = state.httpConfig.headers
      if (state.httpConfig.queryParams) config.queryParams = state.httpConfig.queryParams
      if (state.httpConfig.body) config.body = state.httpConfig.body
      if (state.httpConfig.bodyType) config.bodyType = state.httpConfig.bodyType
      if (state.httpConfig.timeout !== undefined) config.timeout = state.httpConfig.timeout
      if (state.httpConfig.storeInContext) config.storeInContext = state.httpConfig.storeInContext
    }

    return config
  }
}))

// Export helper function for syncing store state to toolNode
export const syncToolConfigurationToNode = (
  toolNodeId: string,
  toolType: string,
  updateToolNode: (id: string, updates: Partial<import('./toolCanvasStore').ToolCanvasNode>) => void
) => {
  const store = useToolConfigurationStore.getState()
  const config = store.getToolNodeConfig(toolType)

  updateToolNode(toolNodeId, {
    label: store.toolLabel,
    config
  })
}

