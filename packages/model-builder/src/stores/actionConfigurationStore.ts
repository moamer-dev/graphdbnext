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
    targetNodeLabel: string
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
  createNodeWithAttributesConfig: {
    nodeLabel: string
    attributeMappings: Array<{
      attributeName: string
      propertyKey: string
      defaultValue: string
    }>
    parentRelationship: string
  }

  updateNodeConfig: {
    properties: Record<string, unknown>
    labels: string[]
  }
  deleteNodeConfig: {
    condition: {
      propertyMatch?: Record<string, unknown>
    }
  }
  cloneNodeConfig: {
    modifications: Record<string, unknown>
    newLabels?: string[]
  }
  mergeNodesConfig: {
    targetNodeIds: number[]
    mergeStrategy: 'union' | 'preferSource' | 'preferTarget'
  }
  validateNodeConfig: {
    schema?: Record<string, unknown>
    requiredProperties: string[]
  }
  reportErrorConfig: {
    errorMessage: string
    errorCode: string
    severity: 'error' | 'warning' | 'info'
  }
  addMetadataConfig: {
    metadata: Record<string, unknown>
  }
  tagNodeConfig: {
    tags: string[]
  }
  setTimestampConfig: {
    timestampType: 'created' | 'modified' | 'both'
  }
  createConditionalNodeConfig: {
    conditions: Array<{
      type: 'hasAttribute' | 'hasText' | 'hasChildren'
      attributeName?: string
      attributeValue?: string
      minTextLength?: number
      childTag?: string
    }>
    operator: 'AND' | 'OR'
    nodeLabel: string
    parentRelationship: string
  }
  createHierarchicalNodesConfig: {
    parentNodeLabel: string
    childNodeLabel: string
    parentRelationship: string
    childRelationship: string
    filterByTag: string[]
    recursive: boolean
  }
  createNodeWithFilteredChildrenConfig: {
    nodeLabel: string
    filterByTag: string[]
    excludeTags: string[]
    recursive: boolean
    parentRelationship: string
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
  setCreateNodeWithAttributesConfig: (config: Partial<ActionConfigurationState['createNodeWithAttributesConfig']>) => void

  setUpdateNodeConfig: (config: Partial<ActionConfigurationState['updateNodeConfig']>) => void
  setDeleteNodeConfig: (config: Partial<ActionConfigurationState['deleteNodeConfig']>) => void
  setCloneNodeConfig: (config: Partial<ActionConfigurationState['cloneNodeConfig']>) => void
  setMergeNodesConfig: (config: Partial<ActionConfigurationState['mergeNodesConfig']>) => void
  setValidateNodeConfig: (config: Partial<ActionConfigurationState['validateNodeConfig']>) => void
  setReportErrorConfig: (config: Partial<ActionConfigurationState['reportErrorConfig']>) => void
  setAddMetadataConfig: (config: Partial<ActionConfigurationState['addMetadataConfig']>) => void
  setTagNodeConfig: (config: Partial<ActionConfigurationState['tagNodeConfig']>) => void
  setSetTimestampConfig: (config: Partial<ActionConfigurationState['setTimestampConfig']>) => void
  setCreateConditionalNodeConfig: (config: Partial<ActionConfigurationState['createConditionalNodeConfig']>) => void
  setCreateHierarchicalNodesConfig: (config: Partial<ActionConfigurationState['createHierarchicalNodesConfig']>) => void
  setCreateNodeWithFilteredChildrenConfig: (config: Partial<ActionConfigurationState['createNodeWithFilteredChildrenConfig']>) => void

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
  setCreateNodeWithAttributesConfig: never
  setNormalizeAndDeduplicateConfig: never
  setUpdateNodeConfig: never
  setDeleteNodeConfig: never
  setCloneNodeConfig: never
  setMergeNodesConfig: never
  setValidateNodeConfig: never
  setReportErrorConfig: never
  setAddMetadataConfig: never
  setTagNodeConfig: never
  setSetTimestampConfig: never
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
    targetNodeLabel: '',
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
    parentRelationship: 'contains'
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
  createNodeWithAttributesConfig: {
    nodeLabel: '',
    attributeMappings: [],
    parentRelationship: 'contains'
  },

  updateNodeConfig: {
    properties: {},
    labels: []
  },
  deleteNodeConfig: {
    condition: {}
  },
  cloneNodeConfig: {
    modifications: {},
    newLabels: []
  },
  mergeNodesConfig: {
    targetNodeIds: [],
    mergeStrategy: 'union'
  },
  validateNodeConfig: {
    requiredProperties: []
  },
  reportErrorConfig: {
    errorMessage: 'Validation error',
    errorCode: 'ERROR',
    severity: 'error'
  },
  addMetadataConfig: {
    metadata: {}
  },
  tagNodeConfig: {
    tags: []
  },
  setTimestampConfig: {
    timestampType: 'both'
  },
  createConditionalNodeConfig: {
    conditions: [],
    operator: 'AND',
    nodeLabel: '',
    parentRelationship: 'contains'
  },
  createHierarchicalNodesConfig: {
    parentNodeLabel: '',
    childNodeLabel: '',
    parentRelationship: 'contains',
    childRelationship: 'contains',
    filterByTag: [],
    recursive: true
  },
  createNodeWithFilteredChildrenConfig: {
    nodeLabel: '',
    filterByTag: [],
    excludeTags: [],
    recursive: false,
    parentRelationship: 'contains'
  }
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
  setCreateNodeWithAttributesConfig: (config) => set((state) => ({ createNodeWithAttributesConfig: { ...state.createNodeWithAttributesConfig, ...config } })),

  setUpdateNodeConfig: (config) => set((state) => ({ updateNodeConfig: { ...state.updateNodeConfig, ...config } })),
  setDeleteNodeConfig: (config) => set((state) => ({ deleteNodeConfig: { ...state.deleteNodeConfig, ...config } })),
  setCloneNodeConfig: (config) => set((state) => ({ cloneNodeConfig: { ...state.cloneNodeConfig, ...config } })),
  setMergeNodesConfig: (config) => set((state) => ({ mergeNodesConfig: { ...state.mergeNodesConfig, ...config } })),
  setValidateNodeConfig: (config) => set((state) => ({ validateNodeConfig: { ...state.validateNodeConfig, ...config } })),
  setReportErrorConfig: (config) => set((state) => ({ reportErrorConfig: { ...state.reportErrorConfig, ...config } })),
  setAddMetadataConfig: (config) => set((state) => ({ addMetadataConfig: { ...state.addMetadataConfig, ...config } })),
  setTagNodeConfig: (config) => set((state) => ({ tagNodeConfig: { ...state.tagNodeConfig, ...config } })),
  setSetTimestampConfig: (config) => set((state) => ({ setTimestampConfig: { ...state.setTimestampConfig, ...config } })),
  setCreateConditionalNodeConfig: (config) => set((state) => ({ createConditionalNodeConfig: { ...state.createConditionalNodeConfig, ...config } })),
  setCreateHierarchicalNodesConfig: (config) => set((state) => ({ createHierarchicalNodesConfig: { ...state.createHierarchicalNodesConfig, ...config } })),
  setCreateNodeWithFilteredChildrenConfig: (config) => set((state) => ({ createNodeWithFilteredChildrenConfig: { ...state.createNodeWithFilteredChildrenConfig, ...config } })),

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




      case 'action:defer-relationship':
        set({
          deferRelationshipConfig: {
            relationshipType: (config.relationshipType as string) || state.deferRelationshipConfig.relationshipType,
            targetNodeLabel: (config.targetNodeLabel as string) || state.deferRelationshipConfig.targetNodeLabel,
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
            parentRelationship: (config.parentRelationship as string) || state.createTextNodeConfig.parentRelationship
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
      case 'action:update-node':
        set({
          updateNodeConfig: {
            properties: (config.properties as Record<string, unknown>) || state.updateNodeConfig.properties,
            labels: (config.labels as string[]) || state.updateNodeConfig.labels
          }
        })
        break
      case 'action:delete-node':
        set({
          deleteNodeConfig: {
            condition: (config.condition as any) || state.deleteNodeConfig.condition
          }
        })
        break
      case 'action:clone-node':
        set({
          cloneNodeConfig: {
            modifications: (config.modifications as Record<string, unknown>) || state.cloneNodeConfig.modifications,
            newLabels: (config.newLabels as string[]) || state.cloneNodeConfig.newLabels
          }
        })
        break
      case 'action:merge-nodes':
        set({
          mergeNodesConfig: {
            targetNodeIds: (config.targetNodeIds as number[]) || state.mergeNodesConfig.targetNodeIds,
            mergeStrategy: (config.mergeStrategy as 'union' | 'preferSource' | 'preferTarget') || state.mergeNodesConfig.mergeStrategy
          }
        })
        break
      case 'action:validate-node':
        set({
          validateNodeConfig: {
            schema: (config.schema as Record<string, unknown>) || state.validateNodeConfig.schema,
            requiredProperties: (config.requiredProperties as string[]) || state.validateNodeConfig.requiredProperties
          }
        })
        break
      case 'action:report-error':
        set({
          reportErrorConfig: {
            errorMessage: (config.errorMessage as string) || state.reportErrorConfig.errorMessage,
            errorCode: (config.errorCode as string) || state.reportErrorConfig.errorCode,
            severity: (config.severity as 'error' | 'warning' | 'info') || state.reportErrorConfig.severity
          }
        })
        break
      case 'action:add-metadata':
        set({
          addMetadataConfig: {
            metadata: (config.metadata as Record<string, unknown>) || state.addMetadataConfig.metadata
          }
        })
        break
      case 'action:tag-node':
        set({
          tagNodeConfig: {
            tags: (config.tags as string[]) || state.tagNodeConfig.tags
          }
        })
        break
      case 'action:set-timestamp':
        set({
          setTimestampConfig: {
            timestampType: (config.timestampType as 'created' | 'modified' | 'both') || state.setTimestampConfig.timestampType
          }
        })
        break
      case 'action:create-conditional-node':
        set({
          createConditionalNodeConfig: {
            conditions: (config.conditions as any[]) || state.createConditionalNodeConfig.conditions,
            operator: (config.operator as 'AND' | 'OR') || state.createConditionalNodeConfig.operator,
            nodeLabel: (config.nodeLabel as string) || state.createConditionalNodeConfig.nodeLabel,
            parentRelationship: (config.parentRelationship as string) || state.createConditionalNodeConfig.parentRelationship
          }
        })
        break
      case 'action:create-hierarchical-nodes':
        set({
          createHierarchicalNodesConfig: {
            parentNodeLabel: (config.parentNodeLabel as string) || state.createHierarchicalNodesConfig.parentNodeLabel,
            childNodeLabel: (config.childNodeLabel as string) || state.createHierarchicalNodesConfig.childNodeLabel,
            parentRelationship: (config.parentRelationship as string) || state.createHierarchicalNodesConfig.parentRelationship,
            childRelationship: (config.childRelationship as string) || state.createHierarchicalNodesConfig.childRelationship,
            filterByTag: (config.filterByTag as string[]) || state.createHierarchicalNodesConfig.filterByTag,
            recursive: config.recursive !== undefined ? (config.recursive as boolean) : state.createHierarchicalNodesConfig.recursive
          }
        })
        break
      case 'action:create-node-with-filtered-children':
        set({
          createNodeWithFilteredChildrenConfig: {
            nodeLabel: (config.nodeLabel as string) || state.createNodeWithFilteredChildrenConfig.nodeLabel,
            filterByTag: (config.filterByTag as string[]) || state.createNodeWithFilteredChildrenConfig.filterByTag,
            excludeTags: (config.excludeTags as string[]) || state.createNodeWithFilteredChildrenConfig.excludeTags,
            recursive: config.recursive !== undefined ? (config.recursive as boolean) : state.createNodeWithFilteredChildrenConfig.recursive,
            parentRelationship: (config.parentRelationship as string) || state.createNodeWithFilteredChildrenConfig.parentRelationship
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
        config.targetNodeLabel = state.deferRelationshipConfig.targetNodeLabel
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
      case 'action:create-node-with-attributes':
        config.nodeLabel = state.createNodeWithAttributesConfig.nodeLabel
        config.attributeMappings = state.createNodeWithAttributesConfig.attributeMappings
        config.parentRelationship = state.createNodeWithAttributesConfig.parentRelationship
        break

      case 'action:update-node':
        config.properties = state.updateNodeConfig.properties
        config.labels = state.updateNodeConfig.labels
        break
      case 'action:delete-node':
        config.condition = state.deleteNodeConfig.condition
        break
      case 'action:clone-node':
        config.modifications = state.cloneNodeConfig.modifications
        config.newLabels = state.cloneNodeConfig.newLabels
        break
      case 'action:merge-nodes':
        config.targetNodeIds = state.mergeNodesConfig.targetNodeIds
        config.mergeStrategy = state.mergeNodesConfig.mergeStrategy
        break
      case 'action:validate-node':
        config.schema = state.validateNodeConfig.schema
        config.requiredProperties = state.validateNodeConfig.requiredProperties
        break
      case 'action:report-error':
        config.errorMessage = state.reportErrorConfig.errorMessage
        config.errorCode = state.reportErrorConfig.errorCode
        config.severity = state.reportErrorConfig.severity
        break
      case 'action:add-metadata':
        config.metadata = state.addMetadataConfig.metadata
        break
      case 'action:tag-node':
        config.tags = state.tagNodeConfig.tags
        break
      case 'action:set-timestamp':
        config.timestampType = state.setTimestampConfig.timestampType
        break
      case 'action:create-conditional-node':
        config.conditions = state.createConditionalNodeConfig.conditions
        config.operator = state.createConditionalNodeConfig.operator
        config.nodeLabel = state.createConditionalNodeConfig.nodeLabel
        config.parentRelationship = state.createConditionalNodeConfig.parentRelationship
        break
      case 'action:create-hierarchical-nodes':
        config.parentNodeLabel = state.createHierarchicalNodesConfig.parentNodeLabel
        config.childNodeLabel = state.createHierarchicalNodesConfig.childNodeLabel
        config.parentRelationship = state.createHierarchicalNodesConfig.parentRelationship
        config.childRelationship = state.createHierarchicalNodesConfig.childRelationship
        config.filterByTag = state.createHierarchicalNodesConfig.filterByTag
        config.recursive = state.createHierarchicalNodesConfig.recursive
        break
      case 'action:create-node-with-filtered-children':
        config.nodeLabel = state.createNodeWithFilteredChildrenConfig.nodeLabel
        config.filterByTag = state.createNodeWithFilteredChildrenConfig.filterByTag
        config.excludeTags = state.createNodeWithFilteredChildrenConfig.excludeTags
        config.recursive = state.createNodeWithFilteredChildrenConfig.recursive
        config.parentRelationship = state.createNodeWithFilteredChildrenConfig.parentRelationship
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

