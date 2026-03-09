'use client'

import { create } from 'zustand'
import type { ActionCanvasNode } from './actionCanvasStore'

export interface TextTransform {
  type: 'lowercase' | 'uppercase' | 'trim' | 'replace' | 'regex'
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

  // Action-specific configs

  createRelationshipConfig: {
    relationshipType: string
    fromNode: string
    toNode: string
    properties: Array<{ key: string; value: string }>
  }
  setPropertyConfig: {
    propertyKey: string
    propertyValue: string
    valueSource: 'static' | 'attribute'
  }








  deferRelationshipConfig: {
    relationshipType: string
    targetTag: string
    targetAttributeName: string
    targetAttributeValue: string
    searchScope: 'children' | 'descendants' | 'global'
    condition: 'always' | 'hasAttribute' | 'hasText'
  }
  skipConfig: {
    skipMainNode: boolean
    skipChildren: boolean
    skipChildrenMode: 'all' | 'selected'
    skipChildrenTags: string[]
  }


  createNodeCompleteConfig: {
    nodeLabel: string
    attributeMappings: Array<{
      attributeName: string
      propertyKey: string
      transforms?: TextTransform[]
      defaultValue?: string
    }>
    parentRelationship: string
    uniqueId?: string
    relationship?: {
      mode: 'standalone' | 'connected' | 'existing' | 'deferred'
      type: string
      targetNodeId?: string
      targetNodeLabel?: string
      direction: 'outgoing' | 'incoming'
    }
  }
  extractAndNormalizeAttributesConfig: {
    attributeMappings: Array<{
      attributeName: string
      propertyKey: string
      transforms: TextTransform[]
      defaultValue?: string
    }>
    removeOriginal: boolean
  }
  createAnnotationNodesConfig: {
    referenceAttribute: string
    relationshipType: string
  }
  createReferenceChainConfig: {
    referenceAttribute: string
    targetNodeLabel: string
    relationshipType: string
    resolveStrategy: 'id' | 'xpath'
    createTargetIfMissing: boolean
  }
  mergeChildrenTextConfig: {
    propertyKey: string
    separator: string
    filterByTag: string[]
    excludeTags: string[]
    transforms: TextTransform[]
  }

  extractAndComputePropertyConfig: {
    propertyKey: string
    sources: Array<{
      type: 'textContent' | 'attribute' | 'static'
      attributeName?: string
      staticValue?: string
    }>
    computation: 'concat' | 'sum' | 'join'
    separator: string
  }
  createTextNodeConfig: {
    nodeLabel: string
    textSource: 'textContent' | 'attribute'
    attributeName: string
    transforms: TextTransform[]
    propertyKey: string
    parentRelationship: string
    inheritProperties: boolean
    propertyMappings: Array<{ key: string; value: string }>
  }
  createTokenNodesConfig: {
    parentNodeLabel: string
    textSource: 'textContent' | 'attribute'
    attributeName: string
    transforms: TextTransform[]
    splitBy: string
    tokenNodeLabel: string
    filterPattern: string
    relationshipType: string
    properties: Array<{
      key: string
      source: 'token' | 'attribute' | 'index' | 'static'
      attributeName?: string
      staticValue?: string
    }>
    structure: 'flat' | 'chained'
    nextRelationshipType: string
  }
  createNodeWithLookupConfig: {
    nodeLabel: string
    attributeMappings: Array<{
      attributeName: string
      propertyKey: string
      defaultValue: string
    }>
    lookupLabel: string
    lookupPropertyKey: string
    lookupPropertyValue: string
    relationshipType: string
    direction: 'outgoing' | 'incoming'
    mustResolve: boolean
    inheritProperties: boolean
  }

  updateNodeConfig: {
    targetAlias: 'current' | 'parent' | 'lookup'
    targetLookup?: { label: string; propertyKey: string; propertyValue: string }
    properties: Array<{ key: string; value: string }>
    labels: string[]
  }
  deleteNodeConfig: {
    targetAlias: 'current' | 'parent' | 'lookup'
    targetLookup?: { label: string; propertyKey: string; propertyValue: string }
    propertyMatch: Array<{ key: string; value: string }>
  }
  cloneNodeConfig: {
    targetAlias: 'current' | 'parent' | 'lookup'
    targetLookup?: { label: string; propertyKey: string; propertyValue: string }
    modifications: Array<{ key: string; value: string }>
    newLabels?: string[]
    relationshipType?: string
    relationshipDirection?: 'outgoing' | 'incoming'
    relationshipTargetAlias?: 'original' | 'parent' | 'current' | 'lookup'
    relationshipTargetLookup?: { label: string; propertyKey: string; propertyValue: string }
  }
  mergeNodesConfig: {
    targetAlias: 'current' | 'parent' | 'lookup'
    targetLookup?: { label: string; propertyKey: string; propertyValue: string }
    sourceAlias: 'current' | 'parent' | 'lookup'
    sourceLookup?: { label: string; propertyKey: string; propertyValue: string }
    mergeStrategy: 'union' | 'preferSource' | 'preferTarget'
  }
  updateRelationshipConfig: {
    fromAlias: 'current' | 'parent' | 'lookup'
    fromLookup?: { label: string; propertyKey: string; propertyValue: string }
    toAlias: 'current' | 'parent' | 'lookup'
    toLookup?: { label: string; propertyKey: string; propertyValue: string }
    relationshipType: string
    newRelationshipType?: string
    properties: Array<{ key: string; value: string }>
  }
  deleteRelationshipConfig: {
    fromAlias: 'current' | 'parent' | 'lookup'
    fromLookup?: { label: string; propertyKey: string; propertyValue: string }
    toAlias: 'current' | 'parent' | 'lookup'
    toLookup?: { label: string; propertyKey: string; propertyValue: string }
    relationshipType: string
    propertyMatch?: Array<{ key: string; value: string }>
  }
  reverseRelationshipConfig: {
    fromAlias: 'current' | 'parent' | 'lookup'
    fromLookup?: { label: string; propertyKey: string; propertyValue: string }
    toAlias: 'current' | 'parent' | 'lookup'
    toLookup?: { label: string; propertyKey: string; propertyValue: string }
    relationshipType: string
  }
  copyPropertyConfig: {
    sourceProperty: string
    targetProperty: string
    sourceNodeId?: string
  }
  formatPropertyConfig: {
    propertyKey: string
    format: 'date' | 'number' | 'currency' | 'percentage' | 'text'
    formatString: string
  }
  splitPropertyConfig: {
    sourceProperty: string
    separator: string
    targetProperties: string[]
  }
  mergePropertiesConfig: {
    sourceProperties: string[]
    targetProperty: string
    mergeStrategy: 'concat' | 'object' | 'array'
  }

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
  setCreateRelationshipConfig: (config: Partial<ActionConfigurationState['createRelationshipConfig']>) => void
  setSetPropertyConfig: (config: Partial<ActionConfigurationState['setPropertyConfig']>) => void




  setDeferRelationshipConfig: (config: Partial<ActionConfigurationState['deferRelationshipConfig']>) => void
  setSkipConfig: (config: Partial<ActionConfigurationState['skipConfig']>) => void
  setCreateNodeCompleteConfig: (config: Partial<ActionConfigurationState['createNodeCompleteConfig']>) => void
  setExtractAndNormalizeAttributesConfig: (config: Partial<ActionConfigurationState['extractAndNormalizeAttributesConfig']>) => void
  setCreateAnnotationNodesConfig: (config: Partial<ActionConfigurationState['createAnnotationNodesConfig']>) => void
  setCreateReferenceChainConfig: (config: Partial<ActionConfigurationState['createReferenceChainConfig']>) => void
  setMergeChildrenTextConfig: (config: Partial<ActionConfigurationState['mergeChildrenTextConfig']>) => void
  setExtractAndComputePropertyConfig: (config: Partial<ActionConfigurationState['extractAndComputePropertyConfig']>) => void
  setCreateTextNodeConfig: (config: Partial<ActionConfigurationState['createTextNodeConfig']>) => void
  setCreateTokenNodesConfig: (config: Partial<ActionConfigurationState['createTokenNodesConfig']>) => void
  setCreateNodeWithLookupConfig: (config: Partial<ActionConfigurationState['createNodeWithLookupConfig']>) => void

  setUpdateNodeConfig: (config: Partial<ActionConfigurationState['updateNodeConfig']>) => void
  setDeleteNodeConfig: (config: Partial<ActionConfigurationState['deleteNodeConfig']>) => void
  setCloneNodeConfig: (config: Partial<ActionConfigurationState['cloneNodeConfig']>) => void
  setMergeNodesConfig: (config: Partial<ActionConfigurationState['mergeNodesConfig']>) => void
  setUpdateRelationshipConfig: (config: Partial<ActionConfigurationState['updateRelationshipConfig']>) => void
  setDeleteRelationshipConfig: (config: Partial<ActionConfigurationState['deleteRelationshipConfig']>) => void
  setReverseRelationshipConfig: (config: Partial<ActionConfigurationState['reverseRelationshipConfig']>) => void
  setCopyPropertyConfig: (config: Partial<ActionConfigurationState['copyPropertyConfig']>) => void
  setFormatPropertyConfig: (config: Partial<ActionConfigurationState['formatPropertyConfig']>) => void
  setSplitPropertyConfig: (config: Partial<ActionConfigurationState['splitPropertyConfig']>) => void
  setMergePropertiesConfig: (config: Partial<ActionConfigurationState['mergePropertiesConfig']>) => void

  // Helper functions
  loadFromActionNode: (actionNode: ActionCanvasNode | null) => void
  getActionNodeConfig: (actionType: string) => Record<string, unknown>
}

const initialState: Omit<ActionConfigurationState, keyof {
  setActionNodeId: never
  setActionLabel: never
  setSelectedGroupId: never
  setGroupLabel: never
  setGroupEnabled: never
  setTestResult: never
  setIsExecuting: never
  setShowApiResponseModal: never
  setGraphResult: never
  setShowGraphModal: never
  setCreateRelationshipConfig: never
  setSetPropertyConfig: never

  setProcessChildrenConfig: never
  setExtractPropertyConfig: never

  setDeferRelationshipConfig: never
  setSkipConfig: never
  setCreateNodeCompleteConfig: never
  setExtractAndNormalizeAttributesConfig: never
  setCreateAnnotationNodesConfig: never
  setCreateReferenceChainConfig: never
  setMergeChildrenTextConfig: never
  setExtractAndComputePropertyConfig: never
  setCreateTextNodeConfig: never
  setCreateTokenNodesConfig: never
  setCreateNodeWithLookupConfig: never
  setCreateNodeWithAttributesConfig: never
  setNormalizeAndDeduplicateConfig: never
  setUpdateNodeConfig: never
  setDeleteNodeConfig: never
  setCloneNodeConfig: never
  setMergeNodesConfig: never
  setUpdateRelationshipConfig: never
  setDeleteRelationshipConfig: never
  setReverseRelationshipConfig: never
  setCopyPropertyConfig: never
  setFormatPropertyConfig: never
  setSplitPropertyConfig: never
  setMergePropertiesConfig: never
  setCreateConditionalNodeConfig: never
  setCreateHierarchicalNodesConfig: never
  setCreateNodeWithFilteredChildrenConfig: never
  loadFromActionNode: never
  getActionNodeConfig: never
}> = {
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

  createRelationshipConfig: {
    relationshipType: 'relatedTo',
    fromNode: '',
    toNode: '',
    properties: []
  },
  setPropertyConfig: {
    propertyKey: '',
    propertyValue: '',
    valueSource: 'static'
  },








  deferRelationshipConfig: {
    relationshipType: 'contains',
    targetTag: '',
    targetAttributeName: '',
    targetAttributeValue: '',
    searchScope: 'children',
    condition: 'always'
  },
  skipConfig: {
    skipMainNode: true,
    skipChildren: true,
    skipChildrenMode: 'all',
    skipChildrenTags: []
  },

  createNodeCompleteConfig: {
    nodeLabel: '',
    attributeMappings: [],
    parentRelationship: 'contains',
    uniqueId: '',
    relationship: {
      mode: 'connected',
      type: 'contains',
      direction: 'outgoing'
    }
  },
  extractAndNormalizeAttributesConfig: {
    attributeMappings: [],
    removeOriginal: false
  },
  createAnnotationNodesConfig: {
    referenceAttribute: '',
    relationshipType: 'annotatedBy'
  },
  createReferenceChainConfig: {
    referenceAttribute: 'corresp',
    targetNodeLabel: '',
    relationshipType: 'refersTo',
    resolveStrategy: 'id',
    createTargetIfMissing: false
  },
  mergeChildrenTextConfig: {
    propertyKey: 'text',
    separator: ' ',
    filterByTag: [],
    excludeTags: [],
    transforms: []
  },

  extractAndComputePropertyConfig: {
    propertyKey: '',
    sources: [],
    computation: 'concat',
    separator: ' '
  },
  createTextNodeConfig: {
    nodeLabel: '',
    textSource: 'textContent',
    attributeName: '',
    transforms: [],
    propertyKey: 'text',
    parentRelationship: 'contains',
    inheritProperties: true,
    propertyMappings: []
  },
  createTokenNodesConfig: {
    parentNodeLabel: '',
    textSource: 'textContent',
    attributeName: '',
    transforms: [],
    splitBy: '',
    tokenNodeLabel: 'Character',
    filterPattern: '[a-zA-Z0-9]',
    relationshipType: 'contains',
    properties: [],
    structure: 'flat',
    nextRelationshipType: 'next'
  },
  createNodeWithLookupConfig: {
    nodeLabel: '',
    attributeMappings: [],
    lookupLabel: '',
    lookupPropertyKey: '',
    lookupPropertyValue: '',
    relationshipType: 'relatedTo',
    direction: 'outgoing',
    mustResolve: true,
    inheritProperties: true
  },

  updateNodeConfig: {
    targetAlias: 'current',
    properties: [],
    labels: []
  },
  deleteNodeConfig: {
    targetAlias: 'current',
    propertyMatch: []
  },
  cloneNodeConfig: {
    targetAlias: 'current',
    modifications: [],
    newLabels: [],
    relationshipType: '',
    relationshipDirection: 'outgoing',
    relationshipTargetAlias: 'original'
  },
  mergeNodesConfig: {
    targetAlias: 'current',
    sourceAlias: 'parent',
    mergeStrategy: 'union'
  },
  updateRelationshipConfig: {
    fromAlias: 'current',
    toAlias: 'parent',
    relationshipType: '',
    properties: []
  },
  deleteRelationshipConfig: {
    fromAlias: 'current',
    toAlias: 'parent',
    relationshipType: ''
  },
  reverseRelationshipConfig: {
    fromAlias: 'current',
    toAlias: 'parent',
    relationshipType: ''
  },
  copyPropertyConfig: {
    sourceProperty: '',
    targetProperty: '',
    sourceNodeId: ''
  },
  formatPropertyConfig: {
    propertyKey: '',
    format: 'text',
    formatString: ''
  },
  splitPropertyConfig: {
    sourceProperty: '',
    separator: ' ',
    targetProperties: []
  },
  mergePropertiesConfig: {
    sourceProperties: [],
    targetProperty: 'merged',
    mergeStrategy: 'object'
  }
}

const recordToEntries = (record: Record<string, unknown> | undefined): Array<{ key: string; value: string }> => {
  if (!record) return []
  return Object.entries(record).map(([key, value]) => ({ key, value: String(value) }))
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

  setCreateRelationshipConfig: (config) => set((state) => ({ createRelationshipConfig: { ...state.createRelationshipConfig, ...config } })),
  setSetPropertyConfig: (config) => set((state) => ({ setPropertyConfig: { ...state.setPropertyConfig, ...config } })),




  setDeferRelationshipConfig: (config) => set((state) => ({ deferRelationshipConfig: { ...state.deferRelationshipConfig, ...config } })),
  setSkipConfig: (config) => set((state) => ({ skipConfig: { ...state.skipConfig, ...config } })),
  setCreateNodeCompleteConfig: (config) => set((state) => ({ createNodeCompleteConfig: { ...state.createNodeCompleteConfig, ...config } })),
  setExtractAndNormalizeAttributesConfig: (config) => set((state) => ({ extractAndNormalizeAttributesConfig: { ...state.extractAndNormalizeAttributesConfig, ...config } })),
  setCreateAnnotationNodesConfig: (config) => set((state) => ({ createAnnotationNodesConfig: { ...state.createAnnotationNodesConfig, ...config } })),
  setCreateReferenceChainConfig: (config) => set((state) => ({ createReferenceChainConfig: { ...state.createReferenceChainConfig, ...config } })),
  setMergeChildrenTextConfig: (config) => set((state) => ({ mergeChildrenTextConfig: { ...state.mergeChildrenTextConfig, ...config } })),
  setExtractAndComputePropertyConfig: (config) => set((state) => ({ extractAndComputePropertyConfig: { ...state.extractAndComputePropertyConfig, ...config } })),
  setCreateTextNodeConfig: (config) => set((state) => ({ createTextNodeConfig: { ...state.createTextNodeConfig, ...config } })),
  setCreateTokenNodesConfig: (config) => set((state) => ({ createTokenNodesConfig: { ...state.createTokenNodesConfig, ...config } })),
  setCreateNodeWithLookupConfig: (config) => set((state) => ({ createNodeWithLookupConfig: { ...state.createNodeWithLookupConfig, ...config } })),

  setUpdateNodeConfig: (config) => set((state) => ({ updateNodeConfig: { ...state.updateNodeConfig, ...config } })),
  setDeleteNodeConfig: (config) => set((state) => ({ deleteNodeConfig: { ...state.deleteNodeConfig, ...config } })),
  setCloneNodeConfig: (config) => set((state) => ({ cloneNodeConfig: { ...state.cloneNodeConfig, ...config } })),
  setMergeNodesConfig: (config) => set((state) => ({ mergeNodesConfig: { ...state.mergeNodesConfig, ...config } })),
  setUpdateRelationshipConfig: (config) => set((state) => ({ updateRelationshipConfig: { ...state.updateRelationshipConfig, ...config } })),
  setDeleteRelationshipConfig: (config) => set((state) => ({ deleteRelationshipConfig: { ...state.deleteRelationshipConfig, ...config } })),
  setReverseRelationshipConfig: (config) => set((state) => ({ reverseRelationshipConfig: { ...state.reverseRelationshipConfig, ...config } })),
  setCopyPropertyConfig: (config) => set((state) => ({ copyPropertyConfig: { ...state.copyPropertyConfig, ...config } })),
  setFormatPropertyConfig: (config) => set((state) => ({ formatPropertyConfig: { ...state.formatPropertyConfig, ...config } })),
  setSplitPropertyConfig: (config) => set((state) => ({ splitPropertyConfig: { ...state.splitPropertyConfig, ...config } })),
  setMergePropertiesConfig: (config) => set((state) => ({ mergePropertiesConfig: { ...state.mergePropertiesConfig, ...config } })),

  loadFromActionNode: (actionNode) => {
    if (!actionNode) {
      set({ ...initialState })
      return
    }

    const state = get()

    // Set basic info
    set({
      actionNodeId: actionNode.id,
      actionLabel: actionNode.label || ''
    })

    // Load group config if it's a group
    if (actionNode.type === 'action:group' || actionNode.isGroup) {
      set({
        groupLabel: actionNode.label || 'Action Group',
        groupEnabled: actionNode.enabled !== false
      })
    }

    // Load action-specific configs based on type
    const config = actionNode.config || {}

    switch (actionNode.type) {
      case 'action:create-relationship':
        set({
          createRelationshipConfig: {
            relationshipType: (config.relationshipType as string) || state.createRelationshipConfig.relationshipType,
            fromNode: (config.fromNode as string) || state.createRelationshipConfig.fromNode,
            toNode: (config.toNode as string) || state.createRelationshipConfig.toNode,
            properties: (config.properties as Array<{ key: string; value: string }>) || state.createRelationshipConfig.properties
          }
        })
        break
      case 'action:set-property':
        set({
          setPropertyConfig: {
            propertyKey: (config.propertyKey as string) || state.setPropertyConfig.propertyKey,
            propertyValue: (config.propertyValue as string) || state.setPropertyConfig.propertyValue,
            valueSource: (config.valueSource as 'static' | 'attribute') || state.setPropertyConfig.valueSource
          }
        })
        break
      case 'action:copy-property':
        set({
          copyPropertyConfig: {
            sourceProperty: (config.sourceProperty as string) || state.copyPropertyConfig.sourceProperty,
            targetProperty: (config.targetProperty as string) || state.copyPropertyConfig.targetProperty,
            sourceNodeId: (config.sourceNodeId as string) || state.copyPropertyConfig.sourceNodeId
          }
        })
        break
      case 'action:format-property':
        set({
          formatPropertyConfig: {
            propertyKey: (config.propertyKey as string) || state.formatPropertyConfig.propertyKey,
            format: (config.format as 'date' | 'number' | 'currency' | 'percentage' | 'text') || state.formatPropertyConfig.format,
            formatString: (config.formatString as string) || state.formatPropertyConfig.formatString
          }
        })
        break
      case 'action:split-property':
        set({
          splitPropertyConfig: {
            sourceProperty: (config.sourceProperty as string) || state.splitPropertyConfig.sourceProperty,
            separator: (config.separator as string) || state.splitPropertyConfig.separator,
            targetProperties: (config.targetProperties as string[]) || state.splitPropertyConfig.targetProperties
          }
        })
        break
      case 'action:reverse-relationship':
        set({
          reverseRelationshipConfig: {
            fromAlias: (config.fromAlias as any) || state.reverseRelationshipConfig.fromAlias,
            fromLookup: (config.fromLookup as any) || state.reverseRelationshipConfig.fromLookup,
            toAlias: (config.toAlias as any) || state.reverseRelationshipConfig.toAlias,
            toLookup: (config.toLookup as any) || state.reverseRelationshipConfig.toLookup,
            relationshipType: (config.relationshipType as string) || state.reverseRelationshipConfig.relationshipType
          }
        })
        break
      case 'action:update-relationship':
        set({
          updateRelationshipConfig: {
            fromAlias: (config.fromAlias as any) || state.updateRelationshipConfig.fromAlias,
            fromLookup: (config.fromLookup as any) || state.updateRelationshipConfig.fromLookup,
            toAlias: (config.toAlias as any) || state.updateRelationshipConfig.toAlias,
            toLookup: (config.toLookup as any) || state.updateRelationshipConfig.toLookup,
            relationshipType: (config.relationshipType as string) || state.updateRelationshipConfig.relationshipType,
            newRelationshipType: (config.newRelationshipType as string) || state.updateRelationshipConfig.newRelationshipType,
            properties: (config.properties as any) || state.updateRelationshipConfig.properties
          }
        })
        break
      case 'action:delete-relationship':
        set({
          deleteRelationshipConfig: {
            fromAlias: (config.fromAlias as any) || state.deleteRelationshipConfig.fromAlias,
            fromLookup: (config.fromLookup as any) || state.deleteRelationshipConfig.fromLookup,
            toAlias: (config.toAlias as any) || state.deleteRelationshipConfig.toAlias,
            toLookup: (config.toLookup as any) || state.deleteRelationshipConfig.toLookup,
            relationshipType: (config.relationshipType as string) || state.deleteRelationshipConfig.relationshipType,
            propertyMatch: (config.propertyMatch as any) || state.deleteRelationshipConfig.propertyMatch
          }
        })
        break
      case 'action:merge-properties':
        set({
          mergePropertiesConfig: {
            sourceProperties: (config.sourceProperties as string[]) || state.mergePropertiesConfig.sourceProperties,
            targetProperty: (config.targetProperty as string) || state.mergePropertiesConfig.targetProperty,
            mergeStrategy: (config.mergeStrategy as 'concat' | 'object' | 'array') || state.mergePropertiesConfig.mergeStrategy
          }
        })
        break
      case 'action:defer-relationship':
        set({
          deferRelationshipConfig: {
            relationshipType: (config.relationshipType as string) || state.deferRelationshipConfig.relationshipType,
            targetTag: (config.targetTag as string) || state.deferRelationshipConfig.targetTag,
            targetAttributeName: (config.targetAttributeName as string) || state.deferRelationshipConfig.targetAttributeName,
            targetAttributeValue: (config.targetAttributeValue as string) || state.deferRelationshipConfig.targetAttributeValue,
            searchScope: (config.searchScope as 'children' | 'descendants' | 'global') || state.deferRelationshipConfig.searchScope,
            condition: (config.condition as 'always' | 'hasAttribute' | 'hasText') || state.deferRelationshipConfig.condition
          }
        })
        break
      case 'action:skip':
        set({
          skipConfig: {
            skipMainNode: (config.skipMainNode as boolean) ?? state.skipConfig.skipMainNode,
            skipChildren: (config.skipChildren as boolean) ?? state.skipConfig.skipChildren,
            skipChildrenMode: (config.skipChildrenMode as 'all' | 'selected') || state.skipConfig.skipChildrenMode,
            skipChildrenTags: (config.skipChildrenTags as string[]) || state.skipConfig.skipChildrenTags
          }
        })
        break
      case 'action:create-node-complete':
        set({
          createNodeCompleteConfig: {
            nodeLabel: (config.nodeLabel as string) || state.createNodeCompleteConfig.nodeLabel,
            attributeMappings: (config.attributeMappings as Array<{
              attributeName: string
              propertyKey: string
              transforms?: TextTransform[]
              defaultValue?: string
            }>) || state.createNodeCompleteConfig.attributeMappings,
            parentRelationship: (config.parentRelationship as string) || state.createNodeCompleteConfig.parentRelationship,
            uniqueId: (config.uniqueId as string) || state.createNodeCompleteConfig.uniqueId,
            relationship: (config.relationship as {
              mode: 'standalone' | 'connected' | 'existing' | 'deferred'
              type: string
              targetNodeId?: string
              targetNodeLabel?: string
              direction: 'outgoing' | 'incoming'
            }) || state.createNodeCompleteConfig.relationship
          }
        })
        break
      case 'action:extract-and-normalize-attributes':
        set({
          extractAndNormalizeAttributesConfig: {
            attributeMappings: (config.attributeMappings as Array<{
              attributeName: string
              propertyKey: string
              transforms: TextTransform[]
              defaultValue?: string
            }>) || state.extractAndNormalizeAttributesConfig.attributeMappings,
            removeOriginal: (config.removeOriginal as boolean) ?? state.extractAndNormalizeAttributesConfig.removeOriginal
          }
        })
        break
      case 'action:create-annotation-nodes':
        set({
          createAnnotationNodesConfig: {
            referenceAttribute: (config.referenceAttribute as string) || state.createAnnotationNodesConfig.referenceAttribute,
            relationshipType: (config.relationshipType as string) || state.createAnnotationNodesConfig.relationshipType
          }
        })
        break
      case 'action:create-reference-chain':
        set({
          createReferenceChainConfig: {
            referenceAttribute: (config.referenceAttribute as string) || state.createReferenceChainConfig.referenceAttribute,
            targetNodeLabel: (config.targetNodeLabel as string) || state.createReferenceChainConfig.targetNodeLabel,
            relationshipType: (config.relationshipType as string) || state.createReferenceChainConfig.relationshipType,
            resolveStrategy: (config.resolveStrategy as 'id' | 'xpath') || state.createReferenceChainConfig.resolveStrategy,
            createTargetIfMissing: (config.createTargetIfMissing as boolean) ?? state.createReferenceChainConfig.createTargetIfMissing
          }
        })
        break
      case 'action:merge-children-text':
        set({
          mergeChildrenTextConfig: {
            propertyKey: (config.propertyKey as string) || state.mergeChildrenTextConfig.propertyKey,
            separator: (config.separator as string) || state.mergeChildrenTextConfig.separator,
            filterByTag: (config.filterByTag as string[]) || state.mergeChildrenTextConfig.filterByTag,
            excludeTags: (config.excludeTags as string[]) || state.mergeChildrenTextConfig.excludeTags,
            transforms: (config.transforms as TextTransform[]) || state.mergeChildrenTextConfig.transforms
          }
        })
        break
      case 'action:extract-and-compute-property':
        set({
          extractAndComputePropertyConfig: {
            propertyKey: (config.propertyKey as string) || state.extractAndComputePropertyConfig.propertyKey,
            sources: (config.sources as Array<{
              type: 'textContent' | 'attribute' | 'static'
              attributeName?: string
              staticValue?: string
            }>) || state.extractAndComputePropertyConfig.sources,
            computation: (config.computation as 'concat' | 'sum' | 'join') || state.extractAndComputePropertyConfig.computation,
            separator: (config.separator as string) || state.extractAndComputePropertyConfig.separator
          }
        })
        break
      case 'action:create-text-node':
        set({
          createTextNodeConfig: {
            nodeLabel: (config.nodeLabel as string) || state.createTextNodeConfig.nodeLabel,
            textSource: (config.textSource as 'textContent' | 'attribute') || state.createTextNodeConfig.textSource,
            attributeName: (config.attributeName as string) || state.createTextNodeConfig.attributeName,
            transforms: (config.transforms as TextTransform[]) || state.createTextNodeConfig.transforms,
            propertyKey: (config.propertyKey as string) || state.createTextNodeConfig.propertyKey,
            parentRelationship: (config.parentRelationship as string) || state.createTextNodeConfig.parentRelationship,
            inheritProperties: (config.inheritProperties as boolean) ?? state.createTextNodeConfig.inheritProperties,
            propertyMappings: (config.propertyMappings as Array<{ key: string; value: string }>) || state.createTextNodeConfig.propertyMappings
          }
        })
        break
      case 'action:create-token-nodes':
        set({
          createTokenNodesConfig: {
            parentNodeLabel: (config.parentNodeLabel as string) || state.createTokenNodesConfig.parentNodeLabel,
            textSource: (config.textSource as 'textContent' | 'attribute') || state.createTokenNodesConfig.textSource,
            attributeName: (config.attributeName as string) || state.createTokenNodesConfig.attributeName,
            transforms: (config.transforms as TextTransform[]) || state.createTokenNodesConfig.transforms,
            splitBy: (config.splitBy as string) || state.createTokenNodesConfig.splitBy,
            tokenNodeLabel: (config.tokenNodeLabel as string) || state.createTokenNodesConfig.tokenNodeLabel,
            filterPattern: (config.filterPattern as string) || state.createTokenNodesConfig.filterPattern,
            relationshipType: (config.relationshipType as string) || state.createTokenNodesConfig.relationshipType,
            properties: (config.properties as any[]) || state.createTokenNodesConfig.properties,
            structure: (config.structure as 'flat' | 'chained') || state.createTokenNodesConfig.structure,
            nextRelationshipType: (config.nextRelationshipType as string) || state.createTokenNodesConfig.nextRelationshipType
          }
        })
        break
      case 'action:create-node-with-lookup':
        set({
          createNodeWithLookupConfig: {
            nodeLabel: (config.nodeLabel as string) || state.createNodeWithLookupConfig.nodeLabel,
            attributeMappings: (config.attributeMappings as any[]) || state.createNodeWithLookupConfig.attributeMappings,
            lookupLabel: (config.lookupLabel as string) || state.createNodeWithLookupConfig.lookupLabel,
            lookupPropertyKey: (config.lookupPropertyKey as string) || state.createNodeWithLookupConfig.lookupPropertyKey,
            lookupPropertyValue: (config.lookupPropertyValue as string) || state.createNodeWithLookupConfig.lookupPropertyValue,
            relationshipType: (config.relationshipType as string) || state.createNodeWithLookupConfig.relationshipType,
            direction: (config.direction as 'outgoing' | 'incoming') || state.createNodeWithLookupConfig.direction,
            mustResolve: (config.mustResolve as boolean) ?? state.createNodeWithLookupConfig.mustResolve,
            inheritProperties: (config.inheritProperties as boolean) ?? state.createNodeWithLookupConfig.inheritProperties
          }
        })
        break
      case 'action:update-node':
        set({
          updateNodeConfig: {
            targetAlias: (config.targetAlias as any) || state.updateNodeConfig.targetAlias,
            targetLookup: (config.targetLookup as any) || state.updateNodeConfig.targetLookup,
            properties: Array.isArray(config.properties) ? config.properties : recordToEntries(config.properties as Record<string, unknown>),
            labels: (config.labels as string[]) || state.updateNodeConfig.labels
          }
        })
        break
      case 'action:delete-node':
        const condition = (config.condition as any) || {}
        set({
          deleteNodeConfig: {
            targetAlias: (config.targetAlias as any) || state.deleteNodeConfig.targetAlias,
            targetLookup: (config.targetLookup as any) || state.deleteNodeConfig.targetLookup,
            propertyMatch: Array.isArray(condition.propertyMatch) ? condition.propertyMatch : recordToEntries(condition.propertyMatch as Record<string, unknown>)
          }
        })
        break
      case 'action:clone-node':
        set({
          cloneNodeConfig: {
            targetAlias: (config.targetAlias as any) || state.cloneNodeConfig.targetAlias,
            targetLookup: (config.targetLookup as any) || state.cloneNodeConfig.targetLookup,
            modifications: Array.isArray(config.modifications) ? config.modifications : recordToEntries(config.modifications as Record<string, unknown>),
            newLabels: (config.newLabels as string[]) || state.cloneNodeConfig.newLabels,
            relationshipType: (config.relationshipType as string) || state.cloneNodeConfig.relationshipType,
            relationshipDirection: (config.relationshipDirection as 'outgoing' | 'incoming') || state.cloneNodeConfig.relationshipDirection,
            relationshipTargetAlias: (config.relationshipTargetAlias as any) || state.cloneNodeConfig.relationshipTargetAlias,
            relationshipTargetLookup: (config.relationshipTargetLookup as any) || state.cloneNodeConfig.relationshipTargetLookup
          }
        })
        break
      case 'action:merge-nodes':
        set({
          mergeNodesConfig: {
            targetAlias: (config.targetAlias as any) || state.mergeNodesConfig.targetAlias,
            targetLookup: (config.targetLookup as any) || state.mergeNodesConfig.targetLookup,
            sourceAlias: (config.sourceAlias as any) || state.mergeNodesConfig.sourceAlias,
            sourceLookup: (config.sourceLookup as any) || state.mergeNodesConfig.sourceLookup,
            mergeStrategy: (config.mergeStrategy as 'union' | 'preferSource' | 'preferTarget') || state.mergeNodesConfig.mergeStrategy
          }
        })
        break
    }
  },

  getActionNodeConfig: (actionType) => {
    const state = get()
    const config: Record<string, unknown> = {}

    switch (actionType) {



      case 'action:defer-relationship':
        config.relationshipType = state.deferRelationshipConfig.relationshipType
        config.targetTag = state.deferRelationshipConfig.targetTag
        config.targetAttributeName = state.deferRelationshipConfig.targetAttributeName
        config.targetAttributeValue = state.deferRelationshipConfig.targetAttributeValue
        config.searchScope = state.deferRelationshipConfig.searchScope
        config.condition = state.deferRelationshipConfig.condition
        break
      case 'action:skip':
        config.skipMainNode = state.skipConfig.skipMainNode
        config.skipChildren = state.skipConfig.skipChildren
        config.skipChildrenMode = state.skipConfig.skipChildrenMode
        config.skipChildrenTags = state.skipConfig.skipChildrenTags
        break
      case 'action:extract-and-normalize-attributes':
        config.attributeMappings = state.extractAndNormalizeAttributesConfig.attributeMappings
        config.removeOriginal = state.extractAndNormalizeAttributesConfig.removeOriginal
        break
      case 'action:create-annotation-nodes':
        config.referenceAttribute = state.createAnnotationNodesConfig.referenceAttribute
        config.relationshipType = state.createAnnotationNodesConfig.relationshipType
        break
      case 'action:create-reference-chain':
        config.referenceAttribute = state.createReferenceChainConfig.referenceAttribute
        config.targetNodeLabel = state.createReferenceChainConfig.targetNodeLabel
        config.relationshipType = state.createReferenceChainConfig.relationshipType
        config.resolveStrategy = state.createReferenceChainConfig.resolveStrategy
        config.createTargetIfMissing = state.createReferenceChainConfig.createTargetIfMissing
        break
      case 'action:merge-children-text':
        config.propertyKey = state.mergeChildrenTextConfig.propertyKey
        config.separator = state.mergeChildrenTextConfig.separator
        config.filterByTag = state.mergeChildrenTextConfig.filterByTag
        config.excludeTags = state.mergeChildrenTextConfig.excludeTags
        config.transforms = state.mergeChildrenTextConfig.transforms
        break
      case 'action:extract-and-compute-property':
        config.propertyKey = state.extractAndComputePropertyConfig.propertyKey
        config.sources = state.extractAndComputePropertyConfig.sources
        config.computation = state.extractAndComputePropertyConfig.computation
        config.separator = state.extractAndComputePropertyConfig.separator
        break
      case 'action:create-text-node':
        config.nodeLabel = state.createTextNodeConfig.nodeLabel
        config.textSource = state.createTextNodeConfig.textSource
        config.attributeName = state.createTextNodeConfig.attributeName
        config.transforms = state.createTextNodeConfig.transforms
        config.propertyKey = state.createTextNodeConfig.propertyKey
        config.parentRelationship = state.createTextNodeConfig.parentRelationship
        break
      case 'action:create-token-nodes':
        config.parentNodeLabel = state.createTokenNodesConfig.parentNodeLabel
        config.textSource = state.createTokenNodesConfig.textSource
        config.attributeName = state.createTokenNodesConfig.attributeName
        config.transforms = state.createTokenNodesConfig.transforms
        config.splitBy = state.createTokenNodesConfig.splitBy
        config.tokenNodeLabel = state.createTokenNodesConfig.tokenNodeLabel
        config.filterPattern = state.createTokenNodesConfig.filterPattern
        config.relationshipType = state.createTokenNodesConfig.relationshipType
        config.properties = state.createTokenNodesConfig.properties
        config.structure = state.createTokenNodesConfig.structure
        config.nextRelationshipType = state.createTokenNodesConfig.nextRelationshipType
        break
      case 'action:create-node-with-lookup':
        config.nodeLabel = state.createNodeWithLookupConfig.nodeLabel
        config.attributeMappings = state.createNodeWithLookupConfig.attributeMappings
        config.lookupLabel = state.createNodeWithLookupConfig.lookupLabel
        config.lookupPropertyKey = state.createNodeWithLookupConfig.lookupPropertyKey
        config.lookupPropertyValue = state.createNodeWithLookupConfig.lookupPropertyValue
        config.relationshipType = state.createNodeWithLookupConfig.relationshipType
        config.direction = state.createNodeWithLookupConfig.direction
        break
      case 'action:update-node':
        config.targetAlias = state.updateNodeConfig.targetAlias
        config.targetLookup = state.updateNodeConfig.targetLookup
        config.properties = state.updateNodeConfig.properties
        config.labels = state.updateNodeConfig.labels
        break
      case 'action:delete-node':
        config.targetAlias = state.deleteNodeConfig.targetAlias
        config.targetLookup = state.deleteNodeConfig.targetLookup
        config.condition = {
          propertyMatch: state.deleteNodeConfig.propertyMatch
        }
        break
      case 'action:clone-node':
        config.targetAlias = state.cloneNodeConfig.targetAlias
        config.targetLookup = state.cloneNodeConfig.targetLookup
        config.modifications = state.cloneNodeConfig.modifications
        config.newLabels = state.cloneNodeConfig.newLabels
        config.relationshipType = state.cloneNodeConfig.relationshipType
        config.relationshipDirection = state.cloneNodeConfig.relationshipDirection
        config.relationshipTargetAlias = state.cloneNodeConfig.relationshipTargetAlias
        config.relationshipTargetLookup = state.cloneNodeConfig.relationshipTargetLookup
        break
      case 'action:merge-nodes':
        config.targetAlias = state.mergeNodesConfig.targetAlias
        config.targetLookup = state.mergeNodesConfig.targetLookup
        config.sourceAlias = state.mergeNodesConfig.sourceAlias
        config.sourceLookup = state.mergeNodesConfig.sourceLookup
        config.mergeStrategy = state.mergeNodesConfig.mergeStrategy
        break
    }

    return config
  }
}))

// Helper function to sync store state to action node
export const syncActionConfigurationToNode = (
  actionNodeId: string | null,
  actionType: string,
  updateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
) => {
  if (!actionNodeId) return

  const config = useActionConfigurationStore.getState().getActionNodeConfig(actionType)
  updateActionNode(actionNodeId, { config })
}

