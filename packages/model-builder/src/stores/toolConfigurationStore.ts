'use client'

import { create } from 'zustand'
import type { ToolCanvasNode } from './toolCanvasStore'
import type { ConditionGroup, ConditionType, SwitchCase, SwitchSource } from '../components/sidebars/ToolConfigurationSidebar'
import type { ConnectionStatus } from '../components/shared/ConnectionStatusIndicator'

interface ToolConfigurationState {
  // Tool metadata
  toolNodeId: string | null
  toolLabel: string
  
  // Condition builder state
  conditionGroups: ConditionGroup[]
  selectedConditionType: ConditionType
  childInputValues: Record<string, string>
  ancestorInputValues: Record<string, string>
  
  // Switch tool state
  switchSource: SwitchSource
  switchAttributeName: string
  switchCases: SwitchCase[]
  switchCaseInputs: Record<string, string>
  
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
  
  // API Configuration
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
  
  // Tool-specific configs (lazy-loaded based on tool type)
  loopConfig: {
    filterChildren: string[]
    maxDepth?: number
    skipIgnored?: boolean
  }
  joinConfig: {
    joinWith: 'siblings' | 'children' | 'parent'
    joinBy: 'textContent' | 'attribute'
    attributeName?: string
    separator?: string
  }
  mergeConfig: {
    mergeStrategy: 'first' | 'last' | 'combine'
    sourceElements: string[]
  }
  filterConfig: {
    filterMode: 'ignoreElement' | 'ignoreSubtree' | 'ignoreTree'
    elementNames: string[]
  }
  transformConfig: {
    mappings: Array<{ id: string; source: string; target: string; defaultValue?: string }>
  }
  lookupConfig: {
    lookupType: 'id' | 'xpath' | 'attribute'
    lookupValue: string
    attributeName?: string
    storeResult?: boolean
    resultKey?: string
  }
  traverseConfig: {
    direction: 'ancestor' | 'descendant' | 'sibling'
    targetTags: string[]
    stopCondition?: string
  }
  delayConfig: {
    delayMs: number
  }
  aggregateConfig: {
    operation: 'count' | 'sum' | 'avg' | 'min' | 'max'
    source: 'children' | 'attribute' | 'textContent'
    attributeName?: string
    targetProperty?: string
    filterByTag?: string[]
  }
  sortConfig: {
    sortBy: 'attribute' | 'textContent' | 'elementName'
    attributeName?: string
    order: 'asc' | 'desc'
    target: 'children' | 'self'
  }
  limitConfig: {
    limit: number
    offset: number
    target: 'children' | 'self'
  }
  collectConfig: {
    targetProperty: string
    source: 'children' | 'attribute' | 'textContent'
    attributeName?: string
    filterByTag?: string[]
    asArray?: boolean
  }
  splitConfig: {
    splitBy: 'delimiter' | 'condition' | 'size'
    delimiter?: string
    condition?: 'hasAttribute' | 'hasText' | 'hasChildren'
    conditionValue?: string
    size?: number
  }
  validateConfig: {
    rules: Array<{
      type: 'requiredAttribute' | 'requiredText' | 'attributeFormat' | 'textLength'
      attributeName?: string
      format?: string
      minLength?: number
      maxLength?: number
    }>
    onFailure?: 'skip' | 'error' | 'default'
  }
  mapConfig: {
    mappings: Array<{
      source: 'attribute' | 'textContent' | 'elementName'
      sourceName?: string
      target: 'attribute' | 'property'
      targetName: string
      transform?: 'lowercase' | 'uppercase' | 'trim'
    }>
  }
  reduceConfig: {
    operation: 'concat' | 'sum' | 'join'
    source: 'children' | 'attribute' | 'textContent'
    attributeName?: string
    separator?: string
    targetProperty?: string
  }
  partitionConfig: {
    partitionBy: 'size' | 'condition'
    size?: number
    condition?: 'hasAttribute' | 'hasText'
    conditionValue?: string
  }
  distinctConfig: {
    distinctBy: 'attribute' | 'textContent' | 'elementName'
    attributeName?: string
    target: 'children' | 'self'
  }
  windowConfig: {
    windowSize: number
    step: number
    operation: 'collect' | 'aggregate'
    targetProperty?: string
  }
  unionConfig: {
    sources: Array<{
      type: 'children' | 'attribute' | 'xpath'
      value?: string
      attributeName?: string
      xpath?: string
    }>
    targetProperty?: string
  }
  intersectConfig: {
    sources: Array<{
      type: 'children' | 'attribute' | 'xpath'
      value?: string
      attributeName?: string
      xpath?: string
    }>
    matchBy?: 'elementName' | 'attribute' | 'textContent'
    attributeName?: string
    targetProperty?: string
  }
  diffConfig: {
    sourceA: { type: 'children' | 'attribute'; value: string }
    sourceB: { type: 'children' | 'attribute'; value: string }
    matchBy?: 'elementName' | 'attribute' | 'textContent'
    attributeName?: string
    targetProperty?: string
  }
  existsConfig: {
    checkType: 'element' | 'attribute' | 'text'
    elementName?: string
    attributeName?: string
    targetProperty?: string
  }
  rangeConfig: {
    start: number
    end: number
    step?: number
    target?: 'children' | 'self'
  }
  batchConfig: {
    batchSize: number
    target: 'children' | 'self'
    processInParallel?: boolean
  }
  loopInputValues: Record<string, string>
  filterInputValues: Record<string, string>
  
  // Actions
  setToolNodeId: (id: string | null) => void
  loadFromToolNode: (toolNode: ToolCanvasNode | null) => void
  reset: () => void
  
  // Tool label
  setToolLabel: (label: string) => void
  
  // Condition builder actions
  setConditionGroups: (groups: ConditionGroup[]) => void
  setSelectedConditionType: (type: ConditionType) => void
  setChildInputValues: (values: Record<string, string>) => void
  setAncestorInputValues: (values: Record<string, string>) => void
  
  // Switch tool actions
  setSwitchSource: (source: SwitchSource) => void
  setSwitchAttributeName: (name: string) => void
  setSwitchCases: (cases: SwitchCase[]) => void
  setSwitchCaseInputs: (inputs: Record<string, string>) => void
  
  // Test/Execution actions
  setTestResult: (result: { success: boolean; output: string; details?: string } | null) => void
  setIsExecuting: (executing: boolean) => void
  setTestIdInput: (input: string) => void
  setExecutedApiResponse: (response: unknown | null) => void
  setApiResponseModalOpen: (open: boolean) => void
  setResponseHistory: (history: Array<{
    id: string
    timestamp: number
    toolId: string
    toolLabel: string
    response: unknown
    params?: Record<string, unknown>
  }>) => void
  addToResponseHistory: (entry: {
    id: string
    timestamp: number
    toolId: string
    toolLabel: string
    response: unknown
    params?: Record<string, unknown>
  }) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setValidationErrors: (errors: Array<{ field: string; message: string }>) => void
  
  // API Configuration actions
  setAuthenticatedApiConfig: (config: ToolConfigurationState['authenticatedApiConfig']) => void
  setHttpConfig: (config: ToolConfigurationState['httpConfig']) => void
  setFetchApiConfig: (config: ToolConfigurationState['fetchApiConfig']) => void
  
  // Tool-specific config actions (using Partial for updates)
  setLoopConfig: (config: Partial<ToolConfigurationState['loopConfig']>) => void
  setMergeConfig: (config: Partial<ToolConfigurationState['mergeConfig']>) => void
  setFilterConfig: (config: Partial<ToolConfigurationState['filterConfig']>) => void
  setTransformConfig: (config: Partial<ToolConfigurationState['transformConfig']>) => void
  setLookupConfig: (config: Partial<ToolConfigurationState['lookupConfig']>) => void
  setTraverseConfig: (config: Partial<ToolConfigurationState['traverseConfig']>) => void
  setDelayConfig: (config: Partial<ToolConfigurationState['delayConfig']>) => void
  setAggregateConfig: (config: Partial<ToolConfigurationState['aggregateConfig']>) => void
  setSortConfig: (config: Partial<ToolConfigurationState['sortConfig']>) => void
  setLimitConfig: (config: Partial<ToolConfigurationState['limitConfig']>) => void
  setCollectConfig: (config: Partial<ToolConfigurationState['collectConfig']>) => void
  setSplitConfig: (config: Partial<ToolConfigurationState['splitConfig']>) => void
  setValidateConfig: (config: Partial<ToolConfigurationState['validateConfig']>) => void
  setMapConfig: (config: Partial<ToolConfigurationState['mapConfig']>) => void
  setReduceConfig: (config: Partial<ToolConfigurationState['reduceConfig']>) => void
  setPartitionConfig: (config: Partial<ToolConfigurationState['partitionConfig']>) => void
  setDistinctConfig: (config: Partial<ToolConfigurationState['distinctConfig']>) => void
  setWindowConfig: (config: Partial<ToolConfigurationState['windowConfig']>) => void
  setJoinConfig: (config: Partial<ToolConfigurationState['joinConfig']>) => void
  setUnionConfig: (config: Partial<ToolConfigurationState['unionConfig']>) => void
  setIntersectConfig: (config: Partial<ToolConfigurationState['intersectConfig']>) => void
  setDiffConfig: (config: Partial<ToolConfigurationState['diffConfig']>) => void
  setExistsConfig: (config: Partial<ToolConfigurationState['existsConfig']>) => void
  setRangeConfig: (config: Partial<ToolConfigurationState['rangeConfig']>) => void
  setBatchConfig: (config: Partial<ToolConfigurationState['batchConfig']>) => void
  setLoopInputValues: (values: Record<string, string>) => void
  setFilterInputValues: (values: Record<string, string>) => void
  
  // Helper to convert store state to toolNode config
  getToolNodeConfig: (toolType: string) => Record<string, unknown>
}

const initialState: Omit<ToolConfigurationState, 
  | 'setToolNodeId' 
  | 'loadFromToolNode' 
  | 'reset'
  | 'setToolLabel'
  | 'setConditionGroups'
  | 'setSelectedConditionType'
  | 'setChildInputValues'
  | 'setAncestorInputValues'
  | 'setSwitchSource'
  | 'setSwitchAttributeName'
  | 'setSwitchCases'
  | 'setSwitchCaseInputs'
  | 'setTestResult'
  | 'setIsExecuting'
  | 'setTestIdInput'
  | 'setExecutedApiResponse'
  | 'setApiResponseModalOpen'
  | 'setResponseHistory'
  | 'addToResponseHistory'
  | 'setConnectionStatus'
  | 'setValidationErrors'
  | 'setAuthenticatedApiConfig'
  | 'setHttpConfig'
  | 'setFetchApiConfig'
  | 'setLoopConfig'
  | 'setMergeConfig'
  | 'setFilterConfig'
  | 'setTransformConfig'
  | 'setLookupConfig'
  | 'setTraverseConfig'
  | 'setDelayConfig'
  | 'setAggregateConfig'
  | 'setSortConfig'
  | 'setLimitConfig'
  | 'setCollectConfig'
  | 'setSplitConfig'
  | 'setValidateConfig'
  | 'setMapConfig'
  | 'setReduceConfig'
  | 'setPartitionConfig'
  | 'setDistinctConfig'
  | 'setWindowConfig'
  | 'setJoinConfig'
  | 'setUnionConfig'
  | 'setIntersectConfig'
  | 'setDiffConfig'
  | 'setExistsConfig'
  | 'setRangeConfig'
  | 'setBatchConfig'
  | 'setLoopInputValues'
  | 'setFilterInputValues'
  | 'getToolNodeConfig'
> = {
  toolNodeId: null,
  toolLabel: '',
  conditionGroups: [],
  selectedConditionType: 'HasChildren',
  childInputValues: {},
  ancestorInputValues: {},
  switchSource: 'attribute',
  switchAttributeName: '',
  switchCases: [],
  switchCaseInputs: {},
  testResult: null,
  isExecuting: false,
  testIdInput: '',
  executedApiResponse: null,
  apiResponseModalOpen: false,
  responseHistory: [],
  connectionStatus: 'disconnected',
  validationErrors: [],
  authenticatedApiConfig: {
    credentialId: '',
    idSource: 'attribute',
    timeout: 10000
  },
  httpConfig: {
    method: 'GET',
    url: '',
    useCredential: false,
    authType: 'none'
  },
  fetchApiConfig: {
    apiProvider: 'wikidata',
    idSource: 'attribute',
    idAttribute: 'wiki:id',
    timeout: 10000
  },
  loopConfig: {
    filterChildren: []
  },
  mergeConfig: {
    mergeStrategy: 'first',
    sourceElements: []
  },
  filterConfig: {
    filterMode: 'ignoreElement',
    elementNames: []
  },
  transformConfig: {
    mappings: []
  },
  lookupConfig: {
    lookupType: 'id',
    lookupValue: ''
  },
  traverseConfig: {
    direction: 'ancestor',
    targetTags: []
  },
  delayConfig: {
    delayMs: 0
  },
  aggregateConfig: {
    operation: 'count',
    source: 'children'
  },
  sortConfig: {
    sortBy: 'attribute',
    order: 'asc',
    target: 'children'
  },
  limitConfig: {
    limit: 10,
    offset: 0,
    target: 'children'
  },
  collectConfig: {
    targetProperty: 'collected',
    source: 'children'
  },
  splitConfig: {
    splitBy: 'delimiter'
  },
  validateConfig: {
    rules: []
  },
  mapConfig: {
    mappings: []
  },
  reduceConfig: {
    operation: 'concat',
    source: 'children'
  },
  partitionConfig: {
    partitionBy: 'size',
    size: 10
  },
  distinctConfig: {
    distinctBy: 'attribute',
    target: 'children'
  },
  windowConfig: {
    windowSize: 3,
    step: 1,
    operation: 'collect'
  },
  joinConfig: {
    joinWith: 'siblings',
    joinBy: 'textContent',
    separator: ' '
  },
  unionConfig: {
    sources: []
  },
  intersectConfig: {
    sources: []
  },
  diffConfig: {
    sourceA: { type: 'children', value: '' },
    sourceB: { type: 'children', value: '' }
  },
  existsConfig: {
    checkType: 'element'
  },
  rangeConfig: {
    start: 0,
    end: 10,
    step: 1,
    target: 'children'
  },
  batchConfig: {
    batchSize: 10,
    target: 'children',
    processInParallel: false
  },
  loopInputValues: {},
  filterInputValues: {}
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
    
    // Load condition groups (support migration from old format)
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
    
    // Load switch config
    const switchSource = config.switchSource as SwitchSource || 'attribute'
    const switchAttributeName = config.switchAttributeName as string || ''
    const switchCases = config.switchCases as SwitchCase[] || []
    
    // Load tool-specific configs based on tool type
    const toolType = toolNode.type
    
    set({
      toolNodeId: toolNode.id,
      toolLabel: toolNode.label || '',
      conditionGroups,
      switchSource,
      switchAttributeName,
      switchCases,
      
      // Load tool-specific configs conditionally
      ...(toolType === 'tool:loop' && {
        loopConfig: {
          filterChildren: config.filterChildren as string[] || [],
          maxDepth: config.maxDepth as number | undefined,
          skipIgnored: config.skipIgnored as boolean | undefined
        }
      }),
      ...(toolType === 'tool:merge' && {
        mergeConfig: {
          mergeStrategy: (config.mergeStrategy as 'first' | 'last' | 'combine') || 'first',
          sourceElements: config.sourceElements as string[] || []
        }
      }),
      ...(toolType === 'tool:filter' && {
        filterConfig: {
          filterMode: (config.filterMode as 'ignoreElement' | 'ignoreSubtree' | 'ignoreTree') || 'ignoreElement',
          elementNames: config.elementNames as string[] || []
        }
      }),
      ...(toolType === 'tool:transform' && {
        transformConfig: {
          mappings: config.mappings as Array<{ id: string; source: string; target: string; defaultValue?: string }> || []
        }
      }),
      ...(toolType === 'tool:lookup' && {
        lookupConfig: {
          lookupType: (config.lookupType as 'id' | 'xpath' | 'attribute') || 'id',
          lookupValue: config.lookupValue as string || '',
          attributeName: config.attributeName as string | undefined,
          storeResult: config.storeResult as boolean | undefined,
          resultKey: config.resultKey as string | undefined
        }
      }),
      ...(toolType === 'tool:traverse' && {
        traverseConfig: {
          direction: (config.direction as 'ancestor' | 'descendant' | 'sibling') || 'ancestor',
          targetTags: config.targetTags as string[] || [],
          stopCondition: config.stopCondition as string | undefined
        }
      }),
      ...(toolType === 'tool:delay' && {
        delayConfig: {
          delayMs: config.delayMs as number || 0
        }
      }),
      ...(toolType === 'tool:aggregate' && {
        aggregateConfig: {
          operation: (config.operation as 'count' | 'sum' | 'avg' | 'min' | 'max') || 'count',
          source: (config.source as 'children' | 'attribute' | 'textContent') || 'children',
          attributeName: config.attributeName as string | undefined,
          targetProperty: config.targetProperty as string | undefined,
          filterByTag: config.filterByTag as string[] | undefined
        }
      }),
      ...(toolType === 'tool:sort' && {
        sortConfig: {
          sortBy: (config.sortBy as 'attribute' | 'textContent' | 'elementName') || 'attribute',
          attributeName: config.attributeName as string | undefined,
          order: (config.order as 'asc' | 'desc') || 'asc',
          target: (config.target as 'children' | 'self') || 'children'
        }
      }),
      ...(toolType === 'tool:limit' && {
        limitConfig: {
          limit: config.limit as number ?? 10,
          offset: config.offset as number ?? 0,
          target: (config.target as 'children' | 'self') || 'children'
        }
      }),
      ...(toolType === 'tool:collect' && {
        collectConfig: {
          targetProperty: config.targetProperty as string || 'collected',
          source: (config.source as 'children' | 'attribute' | 'textContent') || 'children',
          attributeName: config.attributeName as string | undefined,
          filterByTag: config.filterByTag as string[] | undefined,
          asArray: config.asArray as boolean | undefined
        }
      }),
      ...(toolType === 'tool:split' && {
        splitConfig: {
          splitBy: (config.splitBy as 'delimiter' | 'condition' | 'size') || 'delimiter',
          delimiter: config.delimiter as string | undefined,
          condition: config.condition as 'hasAttribute' | 'hasText' | 'hasChildren' | undefined,
          conditionValue: config.conditionValue as string | undefined,
          size: config.size as number | undefined
        }
      }),
      ...(toolType === 'tool:validate' && {
        validateConfig: {
          rules: config.rules as Array<{
            type: 'requiredAttribute' | 'requiredText' | 'attributeFormat' | 'textLength'
            attributeName?: string
            format?: string
            minLength?: number
            maxLength?: number
          }> || [],
          onFailure: (config.onFailure as 'skip' | 'error' | 'default') || undefined
        }
      }),
      ...(toolType === 'tool:map' && {
        mapConfig: {
          mappings: config.mappings as Array<{
            source: 'attribute' | 'textContent' | 'elementName'
            sourceName?: string
            target: 'attribute' | 'property'
            targetName: string
            transform?: 'lowercase' | 'uppercase' | 'trim'
          }> || []
        }
      }),
      ...(toolType === 'tool:reduce' && {
        reduceConfig: {
          operation: (config.operation as 'concat' | 'sum' | 'join') || 'concat',
          source: (config.source as 'children' | 'attribute' | 'textContent') || 'children',
          attributeName: config.attributeName as string | undefined,
          separator: config.separator as string | undefined,
          targetProperty: config.targetProperty as string | undefined
        }
      }),
      ...(toolType === 'tool:partition' && {
        partitionConfig: {
          partitionBy: (config.partitionBy as 'size' | 'condition') || 'size',
          size: config.size as number | undefined,
          condition: config.condition as 'hasAttribute' | 'hasText' | undefined,
          conditionValue: config.conditionValue as string | undefined
        }
      }),
      ...(toolType === 'tool:distinct' && {
        distinctConfig: {
          distinctBy: (config.distinctBy as 'attribute' | 'textContent' | 'elementName') || 'attribute',
          attributeName: config.attributeName as string | undefined,
          target: (config.target as 'children' | 'self') || 'children'
        }
      }),
      ...(toolType === 'tool:window' && {
        windowConfig: {
          windowSize: config.windowSize as number ?? 3,
          step: config.step as number ?? 1,
          operation: (config.operation as 'collect' | 'aggregate') || 'collect',
          targetProperty: config.targetProperty as string | undefined
        }
      }),
      ...(toolType === 'tool:join' && {
        joinConfig: {
          joinWith: (config.joinWith as 'siblings' | 'children' | 'parent') || 'siblings',
          joinBy: (config.joinBy as 'textContent' | 'attribute') || 'textContent',
          attributeName: config.attributeName as string | undefined,
          separator: config.separator as string | undefined
        }
      }),
      ...(toolType === 'tool:union' && {
        unionConfig: {
          sources: config.sources as Array<{
            type: 'children' | 'attribute' | 'xpath'
            value?: string
            attributeName?: string
            xpath?: string
          }> || [],
          targetProperty: config.targetProperty as string | undefined
        }
      }),
      ...(toolType === 'tool:intersect' && {
        intersectConfig: {
          sources: config.sources as Array<{
            type: 'children' | 'attribute' | 'xpath'
            value?: string
            attributeName?: string
            xpath?: string
          }> || [],
          matchBy: config.matchBy as 'elementName' | 'attribute' | 'textContent' | undefined,
          attributeName: config.attributeName as string | undefined,
          targetProperty: config.targetProperty as string | undefined
        }
      }),
      ...(toolType === 'tool:diff' && {
        diffConfig: {
          sourceA: config.sourceA as { type: 'children' | 'attribute'; value: string } || { type: 'children' as const, value: '' },
          sourceB: config.sourceB as { type: 'children' | 'attribute'; value: string } || { type: 'children' as const, value: '' },
          matchBy: config.matchBy as 'elementName' | 'attribute' | 'textContent' | undefined,
          attributeName: config.attributeName as string | undefined,
          targetProperty: config.targetProperty as string | undefined
        }
      }),
      ...(toolType === 'tool:exists' && {
        existsConfig: {
          checkType: (config.checkType as 'element' | 'attribute' | 'text') || 'element',
          elementName: config.elementName as string | undefined,
          attributeName: config.attributeName as string | undefined,
          targetProperty: config.targetProperty as string | undefined
        }
      }),
      ...(toolType === 'tool:range' && {
        rangeConfig: {
          start: config.start as number ?? 0,
          end: config.end as number ?? 10,
          step: config.step as number ?? 1,
          target: (config.target as 'children' | 'self') || 'children'
        }
      }),
      ...(toolType === 'tool:batch' && {
        batchConfig: {
          batchSize: config.batchSize as number ?? 10,
          target: (config.target as 'children' | 'self') || 'children',
          processInParallel: config.processInParallel as boolean | undefined
        }
      }),
      ...(toolType === 'tool:fetch-api' && {
        fetchApiConfig: {
          apiProvider: config.apiProvider as string || 'wikidata',
          idSource: (config.idSource as 'attribute' | 'textContent' | 'xpath') || 'attribute',
          idAttribute: config.idAttribute as string | undefined,
          idXpath: config.idXpath as string | undefined,
          apiKey: config.apiKey as string | undefined,
          customEndpoint: config.customEndpoint as string | undefined,
          timeout: config.timeout as number | undefined,
          storeInContext: config.storeInContext as string | undefined
        },
        executedApiResponse: config.executedResponse as unknown | null || null
      }),
      ...(['tool:fetch-orcid', 'tool:fetch-geonames', 'tool:fetch-europeana', 'tool:fetch-getty'].includes(toolType) && {
        authenticatedApiConfig: {
          credentialId: config.credentialId as string || '',
          idSource: (config.idSource as 'attribute' | 'textContent' | 'xpath') || 'attribute',
          idAttribute: config.idAttribute as string | undefined,
          idXpath: config.idXpath as string | undefined,
          timeout: config.timeout as number || 10000,
          storeInContext: config.storeInContext as string | undefined
        }
      }),
      ...(toolType === 'tool:http' && {
        httpConfig: {
          method: (config.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') || 'GET',
          url: config.url as string || '',
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
          storeInContext: config.storeInContext as string || 'httpResponse'
        }
      })
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
  
  // Tool-specific configs (using Partial for updates)
  setLoopConfig: (config) => set((state) => ({
    loopConfig: { ...state.loopConfig, ...config }
  })),
  setMergeConfig: (config) => set((state) => ({
    mergeConfig: { ...state.mergeConfig, ...config }
  })),
  setFilterConfig: (config) => set((state) => ({
    filterConfig: { ...state.filterConfig, ...config }
  })),
  setTransformConfig: (config) => set((state) => ({
    transformConfig: { ...state.transformConfig, ...config }
  })),
  setLookupConfig: (config) => set((state) => ({
    lookupConfig: { ...state.lookupConfig, ...config }
  })),
  setTraverseConfig: (config) => set((state) => ({
    traverseConfig: { ...state.traverseConfig, ...config }
  })),
  setDelayConfig: (config) => set((state) => ({
    delayConfig: { ...state.delayConfig, ...config }
  })),
  setAggregateConfig: (config) => set((state) => ({
    aggregateConfig: { ...state.aggregateConfig, ...config }
  })),
  setSortConfig: (config) => set((state) => ({
    sortConfig: { ...state.sortConfig, ...config }
  })),
  setLimitConfig: (config) => set((state) => ({
    limitConfig: { ...state.limitConfig, ...config }
  })),
  setCollectConfig: (config) => set((state) => ({
    collectConfig: { ...state.collectConfig, ...config }
  })),
  setSplitConfig: (config) => set((state) => ({
    splitConfig: { ...state.splitConfig, ...config }
  })),
  setValidateConfig: (config) => set((state) => ({
    validateConfig: { ...state.validateConfig, ...config }
  })),
  setMapConfig: (config) => set((state) => ({
    mapConfig: { ...state.mapConfig, ...config }
  })),
  setReduceConfig: (config) => set((state) => ({
    reduceConfig: { ...state.reduceConfig, ...config }
  })),
  setPartitionConfig: (config) => set((state) => ({
    partitionConfig: { ...state.partitionConfig, ...config }
  })),
  setDistinctConfig: (config) => set((state) => ({
    distinctConfig: { ...state.distinctConfig, ...config }
  })),
  setWindowConfig: (config) => set((state) => ({
    windowConfig: { ...state.windowConfig, ...config }
  })),
  setJoinConfig: (config) => set((state) => ({
    joinConfig: { ...state.joinConfig, ...config }
  })),
  setUnionConfig: (config) => set((state) => ({
    unionConfig: { ...state.unionConfig, ...config }
  })),
  setIntersectConfig: (config) => set((state) => ({
    intersectConfig: { ...state.intersectConfig, ...config }
  })),
  setDiffConfig: (config) => set((state) => ({
    diffConfig: { ...state.diffConfig, ...config }
  })),
  setExistsConfig: (config) => set((state) => ({
    existsConfig: { ...state.existsConfig, ...config }
  })),
  setRangeConfig: (config) => set((state) => ({
    rangeConfig: { ...state.rangeConfig, ...config }
  })),
  setBatchConfig: (config) => set((state) => ({
    batchConfig: { ...state.batchConfig, ...config }
  })),
  setLoopInputValues: (values) => set({ loopInputValues: values }),
  setFilterInputValues: (values) => set({ filterInputValues: values }),
  
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
      case 'tool:loop':
        config.filterChildren = state.loopConfig.filterChildren
        if (state.loopConfig.maxDepth !== undefined) config.maxDepth = state.loopConfig.maxDepth
        if (state.loopConfig.skipIgnored !== undefined) config.skipIgnored = state.loopConfig.skipIgnored
        break
      case 'tool:merge':
        config.mergeStrategy = state.mergeConfig.mergeStrategy
        config.sourceElements = state.mergeConfig.sourceElements
        break
      case 'tool:filter':
        config.filterMode = state.filterConfig.filterMode
        config.elementNames = state.filterConfig.elementNames
        break
      case 'tool:transform':
        config.mappings = state.transformConfig.mappings
        break
      case 'tool:lookup':
        config.lookupType = state.lookupConfig.lookupType
        config.lookupValue = state.lookupConfig.lookupValue
        if (state.lookupConfig.attributeName) config.attributeName = state.lookupConfig.attributeName
        if (state.lookupConfig.storeResult !== undefined) config.storeResult = state.lookupConfig.storeResult
        if (state.lookupConfig.resultKey) config.resultKey = state.lookupConfig.resultKey
        break
      case 'tool:traverse':
        config.direction = state.traverseConfig.direction
        config.targetTags = state.traverseConfig.targetTags
        if (state.traverseConfig.stopCondition) config.stopCondition = state.traverseConfig.stopCondition
        break
      case 'tool:delay':
        config.delayMs = state.delayConfig.delayMs
        break
      case 'tool:aggregate':
        config.operation = state.aggregateConfig.operation
        config.source = state.aggregateConfig.source
        if (state.aggregateConfig.attributeName) config.attributeName = state.aggregateConfig.attributeName
        if (state.aggregateConfig.targetProperty) config.targetProperty = state.aggregateConfig.targetProperty
        if (state.aggregateConfig.filterByTag) config.filterByTag = state.aggregateConfig.filterByTag
        break
      case 'tool:sort':
        config.sortBy = state.sortConfig.sortBy
        if (state.sortConfig.attributeName) config.attributeName = state.sortConfig.attributeName
        config.order = state.sortConfig.order
        config.target = state.sortConfig.target
        break
      case 'tool:limit':
        config.limit = state.limitConfig.limit
        config.offset = state.limitConfig.offset
        config.target = state.limitConfig.target
        break
      case 'tool:collect':
        config.targetProperty = state.collectConfig.targetProperty
        config.source = state.collectConfig.source
        if (state.collectConfig.attributeName) config.attributeName = state.collectConfig.attributeName
        if (state.collectConfig.filterByTag) config.filterByTag = state.collectConfig.filterByTag
        if (state.collectConfig.asArray !== undefined) config.asArray = state.collectConfig.asArray
        break
      case 'tool:split':
        config.splitBy = state.splitConfig.splitBy
        if (state.splitConfig.delimiter) config.delimiter = state.splitConfig.delimiter
        if (state.splitConfig.condition) config.condition = state.splitConfig.condition
        if (state.splitConfig.conditionValue) config.conditionValue = state.splitConfig.conditionValue
        if (state.splitConfig.size !== undefined) config.size = state.splitConfig.size
        break
      case 'tool:validate':
        config.rules = state.validateConfig.rules
        if (state.validateConfig.onFailure) config.onFailure = state.validateConfig.onFailure
        break
      case 'tool:map':
        config.mappings = state.mapConfig.mappings
        break
      case 'tool:reduce':
        config.operation = state.reduceConfig.operation
        config.source = state.reduceConfig.source
        if (state.reduceConfig.attributeName) config.attributeName = state.reduceConfig.attributeName
        if (state.reduceConfig.separator) config.separator = state.reduceConfig.separator
        if (state.reduceConfig.targetProperty) config.targetProperty = state.reduceConfig.targetProperty
        break
      case 'tool:partition':
        config.partitionBy = state.partitionConfig.partitionBy
        if (state.partitionConfig.size !== undefined) config.size = state.partitionConfig.size
        if (state.partitionConfig.condition) config.condition = state.partitionConfig.condition
        if (state.partitionConfig.conditionValue) config.conditionValue = state.partitionConfig.conditionValue
        break
      case 'tool:distinct':
        config.distinctBy = state.distinctConfig.distinctBy
        if (state.distinctConfig.attributeName) config.attributeName = state.distinctConfig.attributeName
        config.target = state.distinctConfig.target
        break
      case 'tool:window':
        config.windowSize = state.windowConfig.windowSize
        config.step = state.windowConfig.step
        config.operation = state.windowConfig.operation
        if (state.windowConfig.targetProperty) config.targetProperty = state.windowConfig.targetProperty
        break
      case 'tool:join':
        config.joinWith = state.joinConfig.joinWith
        config.joinBy = state.joinConfig.joinBy
        if (state.joinConfig.attributeName) config.attributeName = state.joinConfig.attributeName
        if (state.joinConfig.separator) config.separator = state.joinConfig.separator
        break
      case 'tool:union':
        config.sources = state.unionConfig.sources
        if (state.unionConfig.targetProperty) config.targetProperty = state.unionConfig.targetProperty
        break
      case 'tool:intersect':
        config.sources = state.intersectConfig.sources
        if (state.intersectConfig.matchBy) config.matchBy = state.intersectConfig.matchBy
        if (state.intersectConfig.attributeName) config.attributeName = state.intersectConfig.attributeName
        if (state.intersectConfig.targetProperty) config.targetProperty = state.intersectConfig.targetProperty
        break
      case 'tool:diff':
        config.sourceA = state.diffConfig.sourceA
        config.sourceB = state.diffConfig.sourceB
        if (state.diffConfig.matchBy) config.matchBy = state.diffConfig.matchBy
        if (state.diffConfig.attributeName) config.attributeName = state.diffConfig.attributeName
        if (state.diffConfig.targetProperty) config.targetProperty = state.diffConfig.targetProperty
        break
      case 'tool:exists':
        config.checkType = state.existsConfig.checkType
        if (state.existsConfig.elementName) config.elementName = state.existsConfig.elementName
        if (state.existsConfig.attributeName) config.attributeName = state.existsConfig.attributeName
        if (state.existsConfig.targetProperty) config.targetProperty = state.existsConfig.targetProperty
        break
      case 'tool:range':
        config.start = state.rangeConfig.start
        config.end = state.rangeConfig.end
        if (state.rangeConfig.step !== undefined) config.step = state.rangeConfig.step
        if (state.rangeConfig.target) config.target = state.rangeConfig.target
        break
      case 'tool:batch':
        config.batchSize = state.batchConfig.batchSize
        config.target = state.batchConfig.target
        if (state.batchConfig.processInParallel !== undefined) config.processInParallel = state.batchConfig.processInParallel
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
    
    // Authenticated API tools
    if (['tool:fetch-orcid', 'tool:fetch-geonames', 'tool:fetch-europeana', 'tool:fetch-getty'].includes(toolType)) {
      if (state.authenticatedApiConfig.credentialId) config.credentialId = state.authenticatedApiConfig.credentialId
      config.idSource = state.authenticatedApiConfig.idSource
      if (state.authenticatedApiConfig.idAttribute) config.idAttribute = state.authenticatedApiConfig.idAttribute
      if (state.authenticatedApiConfig.idXpath) config.idXpath = state.authenticatedApiConfig.idXpath
      if (state.authenticatedApiConfig.timeout !== undefined) config.timeout = state.authenticatedApiConfig.timeout
      if (state.authenticatedApiConfig.storeInContext) config.storeInContext = state.authenticatedApiConfig.storeInContext
    }
    
    // HTTP tool
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

