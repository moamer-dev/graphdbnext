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
  extractTextConfig: {
    extractionMode: 'text' | 'tail' | 'xmlContent'
    createNodes: boolean
    nodeType: 'Character' | 'Sign'
  }
  createAnnotationConfig: {
    annotationTypes: string[]
    targetAttributes: string[]
    mimeType: 'text/plain' | 'text/xml'
  }
  createReferenceConfig: {
    referenceAttribute: string
    relationshipType: string
    resolveStrategy: 'id' | 'xpath'
  }
  extractXmlContentConfig: {
    includeAttributes: boolean
    includeChildren: boolean
    format: 'full' | 'minimal'
  }

  processChildrenConfig: {
    filterByTag: string[]
    excludeTags: string[]
    recursive: boolean
  }
  extractPropertyConfig: {
    sourceAttribute: string
    targetPropertyKey: string
    defaultValue: string
  }
  transformTextConfig: {
    transforms: TextTransform[]
    targetProperty: string
    updateInPlace: boolean
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
  normalizeAndDeduplicateConfig: {
    sourceProperty: string
    targetProperty: string
    transforms: TextTransform[]
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
  setExtractTextConfig: (config: Partial<ActionConfigurationState['extractTextConfig']>) => void
  setCreateAnnotationConfig: (config: Partial<ActionConfigurationState['createAnnotationConfig']>) => void
  setCreateReferenceConfig: (config: Partial<ActionConfigurationState['createReferenceConfig']>) => void
  setExtractXmlContentConfig: (config: Partial<ActionConfigurationState['extractXmlContentConfig']>) => void
  setProcessChildrenConfig: (config: Partial<ActionConfigurationState['processChildrenConfig']>) => void
  setExtractPropertyConfig: (config: Partial<ActionConfigurationState['extractPropertyConfig']>) => void
  setTransformTextConfig: (config: Partial<ActionConfigurationState['transformTextConfig']>) => void
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
  setNormalizeAndDeduplicateConfig: (config: Partial<ActionConfigurationState['normalizeAndDeduplicateConfig']>) => void

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
  setExtractTextConfig: never
  setCreateAnnotationConfig: never
  setCreateReferenceConfig: never
  setExtractXmlContentConfig: never
  setProcessChildrenConfig: never
  setExtractPropertyConfig: never
  setTransformTextConfig: never
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
  extractTextConfig: {
    extractionMode: 'text',
    createNodes: false,
    nodeType: 'Character'
  },
  createAnnotationConfig: {
    annotationTypes: [],
    targetAttributes: [],
    mimeType: 'text/plain'
  },
  createReferenceConfig: {
    referenceAttribute: 'corresp',
    relationshipType: 'refersTo',
    resolveStrategy: 'id'
  },
  extractXmlContentConfig: {
    includeAttributes: true,
    includeChildren: true,
    format: 'full'
  },

  processChildrenConfig: {
    filterByTag: [],
    excludeTags: [],
    recursive: true
  },
  extractPropertyConfig: {
    sourceAttribute: '',
    targetPropertyKey: '',
    defaultValue: ''
  },
  transformTextConfig: {
    transforms: [],
    targetProperty: '',
    updateInPlace: false
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
    attributeMappings: []
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
  normalizeAndDeduplicateConfig: {
    sourceProperty: '',
    targetProperty: '',
    transforms: []
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
  setExtractTextConfig: (config) => set((state) => ({ extractTextConfig: { ...state.extractTextConfig, ...config } })),
  setCreateAnnotationConfig: (config) => set((state) => ({ createAnnotationConfig: { ...state.createAnnotationConfig, ...config } })),
  setCreateReferenceConfig: (config) => set((state) => ({ createReferenceConfig: { ...state.createReferenceConfig, ...config } })),
  setExtractXmlContentConfig: (config) => set((state) => ({ extractXmlContentConfig: { ...state.extractXmlContentConfig, ...config } })),
  setProcessChildrenConfig: (config) => set((state) => ({ processChildrenConfig: { ...state.processChildrenConfig, ...config } })),
  setExtractPropertyConfig: (config) => set((state) => ({ extractPropertyConfig: { ...state.extractPropertyConfig, ...config } })),
  setTransformTextConfig: (config) => set((state) => ({ transformTextConfig: { ...state.transformTextConfig, ...config } })),
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
  setNormalizeAndDeduplicateConfig: (config) => set((state) => ({ normalizeAndDeduplicateConfig: { ...state.normalizeAndDeduplicateConfig, ...config } })),

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
      case 'action:extract-text':
        set({
          extractTextConfig: {
            extractionMode: (config.extractionMode as 'text' | 'tail' | 'xmlContent') || state.extractTextConfig.extractionMode,
            createNodes: (config.createNodes as boolean) ?? state.extractTextConfig.createNodes,
            nodeType: (config.nodeType as 'Character' | 'Sign') || state.extractTextConfig.nodeType
          }
        })
        break
      case 'action:create-annotation':
        set({
          createAnnotationConfig: {
            annotationTypes: (config.annotationTypes as string[]) || state.createAnnotationConfig.annotationTypes,
            targetAttributes: (config.targetAttributes as string[]) || state.createAnnotationConfig.targetAttributes,
            mimeType: (config.mimeType as 'text/plain' | 'text/xml') || state.createAnnotationConfig.mimeType
          }
        })
        break
      case 'action:create-reference':
        set({
          createReferenceConfig: {
            referenceAttribute: (config.referenceAttribute as string) || state.createReferenceConfig.referenceAttribute,
            relationshipType: (config.relationshipType as string) || state.createReferenceConfig.relationshipType,
            resolveStrategy: (config.resolveStrategy as 'id' | 'xpath') || state.createReferenceConfig.resolveStrategy
          }
        })
        break
      case 'action:extract-xml-content':
        set({
          extractXmlContentConfig: {
            includeAttributes: (config.includeAttributes as boolean) ?? state.extractXmlContentConfig.includeAttributes,
            includeChildren: (config.includeChildren as boolean) ?? state.extractXmlContentConfig.includeChildren,
            format: (config.format as 'full' | 'minimal') || state.extractXmlContentConfig.format
          }
        })
        break
      case 'action:process-children':
        set({
          processChildrenConfig: {
            filterByTag: (config.filterByTag as string[]) || state.processChildrenConfig.filterByTag,
            excludeTags: (config.excludeTags as string[]) || state.processChildrenConfig.excludeTags,
            recursive: (config.recursive as boolean) ?? state.processChildrenConfig.recursive
          }
        })
        break
      case 'action:extract-property':
        set({
          extractPropertyConfig: {
            sourceAttribute: (config.sourceAttribute as string) || state.extractPropertyConfig.sourceAttribute,
            targetPropertyKey: (config.targetPropertyKey as string) || state.extractPropertyConfig.targetPropertyKey,
            defaultValue: (config.defaultValue as string) ?? state.extractPropertyConfig.defaultValue
          }
        })
        break
      case 'action:transform-text':
        if (config.transforms) {
          set({
            transformTextConfig: {
              transforms: (config.transforms as TextTransform[]) || state.transformTextConfig.transforms,
              targetProperty: (config.targetProperty as string) || state.transformTextConfig.targetProperty,
              updateInPlace: (config.updateInPlace as boolean) ?? state.transformTextConfig.updateInPlace
            }
          })
        } else if (config.transformType) {
          // Backward compatibility
          const singleTransform: TextTransform = {
            type: config.transformType as TextTransform['type'],
            replaceFrom: config.replaceFrom as string | undefined,
            replaceTo: config.replaceTo as string | undefined,
            regexPattern: config.regexPattern as string | undefined,
            regexReplacement: config.regexReplacement as string | undefined
          }
          set({
            transformTextConfig: {
              transforms: [singleTransform],
              targetProperty: (config.targetProperty as string) || state.transformTextConfig.targetProperty,
              updateInPlace: (config.updateInPlace as boolean) ?? state.transformTextConfig.updateInPlace
            }
          })
        }
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
            }>) || state.extractAndNormalizeAttributesConfig.attributeMappings
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
      case 'action:normalize-and-deduplicate':
        set({
          normalizeAndDeduplicateConfig: {
            sourceProperty: (config.sourceProperty as string) || state.normalizeAndDeduplicateConfig.sourceProperty,
            targetProperty: (config.targetProperty as string) || state.normalizeAndDeduplicateConfig.targetProperty,
            transforms: (config.transforms as TextTransform[]) || state.normalizeAndDeduplicateConfig.transforms
          }
        })
        break
    }
  },

  getActionNodeConfig: (actionType) => {
    const state = get()
    const config: Record<string, unknown> = {}

    switch (actionType) {
      case 'action:process-children':
        config.filterByTag = state.processChildrenConfig.filterByTag
        config.excludeTags = state.processChildrenConfig.excludeTags
        config.recursive = state.processChildrenConfig.recursive
        break
      case 'action:extract-property':
        config.sourceAttribute = state.extractPropertyConfig.sourceAttribute
        config.targetPropertyKey = state.extractPropertyConfig.targetPropertyKey
        config.defaultValue = state.extractPropertyConfig.defaultValue
        break
      case 'action:transform-text':
        config.transforms = state.transformTextConfig.transforms
        config.targetProperty = state.transformTextConfig.targetProperty
        config.updateInPlace = state.transformTextConfig.updateInPlace
        break
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
      case 'action:normalize-and-deduplicate':
        config.sourceProperty = state.normalizeAndDeduplicateConfig.sourceProperty
        config.targetProperty = state.normalizeAndDeduplicateConfig.targetProperty
        config.transforms = state.normalizeAndDeduplicateConfig.transforms
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

