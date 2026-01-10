'use client'

import { useState, useEffect, useMemo } from 'react'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useXmlImportWizardStore } from '../../stores/xmlImportWizardStore'
import { useActionConfigurationStore } from '../../stores/actionConfigurationStore'
import { useActionTestExecution } from '../../hooks'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { X, Play, CheckCircle2, XCircle } from 'lucide-react'
import { JsonFieldSelector } from '../viewer/JsonFieldSelector'
import { ApiResponseModal } from '../dialogs/ApiResponseModal'
import { GraphResultModal } from '../dialogs/GraphResultModal'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { HelpTooltip } from '../shared/HelpTooltip'
import { executeWorkflow as executeWorkflowExecutor } from '../../services/workflowExecutor'
import { convertBuilderToSchemaJson } from '../../utils/schemaJsonConverter'
import { ActionConfigurationHeader } from './ActionConfigurationSidebar/ActionConfigurationHeader'
import { ActionExtractTextConfiguration } from './ActionConfigurationSidebar/ActionExtractTextConfiguration'
import { ActionCreateNodeConfiguration } from './ActionConfigurationSidebar/ActionCreateNodeConfiguration'
import { ActionCreateRelationshipConfiguration } from './ActionConfigurationSidebar/ActionCreateRelationshipConfiguration'
import { ActionSetPropertyConfiguration } from './ActionConfigurationSidebar/ActionSetPropertyConfiguration'
import { ActionCreateAnnotationConfiguration } from './ActionConfigurationSidebar/ActionCreateAnnotationConfiguration'
import { ActionCreateReferenceConfiguration } from './ActionConfigurationSidebar/ActionCreateReferenceConfiguration'
import { ActionExtractXmlContentConfiguration } from './ActionConfigurationSidebar/ActionExtractXmlContentConfiguration'
import { ActionCreateNodeTextConfiguration } from './ActionConfigurationSidebar/ActionCreateNodeTextConfiguration'
import { ActionCreateNodeTokensConfiguration } from './ActionConfigurationSidebar/ActionCreateNodeTokensConfiguration'
import { ActionProcessChildrenConfiguration } from './ActionConfigurationSidebar/ActionProcessChildrenConfiguration'
import { ActionExtractPropertyConfiguration } from './ActionConfigurationSidebar/ActionExtractPropertyConfiguration'
import { ActionDeferRelationshipConfiguration } from './ActionConfigurationSidebar/ActionDeferRelationshipConfiguration'
import { ActionSkipConfiguration } from './ActionConfigurationSidebar/ActionSkipConfiguration'
import { ActionTransformTextConfiguration } from './ActionConfigurationSidebar/ActionTransformTextConfiguration'
import { ActionCreateTextNodeConfiguration } from './ActionConfigurationSidebar/ActionCreateTextNodeConfiguration'
import { ActionCreateTokenNodesConfiguration } from './ActionConfigurationSidebar/ActionCreateTokenNodesConfiguration'
import { ActionCreateNodeWithAttributesConfiguration } from './ActionConfigurationSidebar/ActionCreateNodeWithAttributesConfiguration'
import { ActionCreateNodeCompleteConfiguration } from './ActionConfigurationSidebar/ActionCreateNodeCompleteConfiguration'
import { ActionExtractAndNormalizeAttributesConfiguration } from './ActionConfigurationSidebar/ActionExtractAndNormalizeAttributesConfiguration'
import { ActionCreateAnnotationNodesConfiguration } from './ActionConfigurationSidebar/ActionCreateAnnotationNodesConfiguration'
import { ActionCreateReferenceChainConfiguration } from './ActionConfigurationSidebar/ActionCreateReferenceChainConfiguration'
import { ActionMergeChildrenTextConfiguration } from './ActionConfigurationSidebar/ActionMergeChildrenTextConfiguration'
import { ActionCreateConditionalNodeConfiguration } from './ActionConfigurationSidebar/ActionCreateConditionalNodeConfiguration'
import { ActionExtractAndComputePropertyConfiguration } from './ActionConfigurationSidebar/ActionExtractAndComputePropertyConfiguration'
import { ActionCreateNodeWithFilteredChildrenConfiguration } from './ActionConfigurationSidebar/ActionCreateNodeWithFilteredChildrenConfiguration'
import { ActionNormalizeAndDeduplicateConfiguration } from './ActionConfigurationSidebar/ActionNormalizeAndDeduplicateConfiguration'
import { ActionCreateHierarchicalNodesConfiguration } from './ActionConfigurationSidebar/ActionCreateHierarchicalNodesConfiguration'
import { ActionGroupConfiguration } from './ActionConfigurationSidebar/ActionGroupConfiguration'
import { ActionCopyPropertyConfiguration } from './ActionConfigurationSidebar/ActionCopyPropertyConfiguration'
import { ActionMergePropertiesConfiguration } from './ActionConfigurationSidebar/ActionMergePropertiesConfiguration'
import { ActionSplitPropertyConfiguration } from './ActionConfigurationSidebar/ActionSplitPropertyConfiguration'
import { ActionFormatPropertyConfiguration } from './ActionConfigurationSidebar/ActionFormatPropertyConfiguration'
import { ActionUpdateRelationshipConfiguration } from './ActionConfigurationSidebar/ActionUpdateRelationshipConfiguration'
import { ActionDeleteRelationshipConfiguration } from './ActionConfigurationSidebar/ActionDeleteRelationshipConfiguration'
import { ActionReverseRelationshipConfiguration } from './ActionConfigurationSidebar/ActionReverseRelationshipConfiguration'
import { ActionUpdateNodeConfiguration } from './ActionConfigurationSidebar/ActionUpdateNodeConfiguration'
import { ActionDeleteNodeConfiguration } from './ActionConfigurationSidebar/ActionDeleteNodeConfiguration'
import { ActionCloneNodeConfiguration } from './ActionConfigurationSidebar/ActionCloneNodeConfiguration'
import { ActionMergeNodesConfiguration } from './ActionConfigurationSidebar/ActionMergeNodesConfiguration'
import { ActionValidateNodeConfiguration } from './ActionConfigurationSidebar/ActionValidateNodeConfiguration'
import { ActionValidateRelationshipConfiguration } from './ActionConfigurationSidebar/ActionValidateRelationshipConfiguration'
import { ActionReportErrorConfiguration } from './ActionConfigurationSidebar/ActionReportErrorConfiguration'
import { ActionAddMetadataConfiguration } from './ActionConfigurationSidebar/ActionAddMetadataConfiguration'
import { ActionTagNodeConfiguration } from './ActionConfigurationSidebar/ActionTagNodeConfiguration'
import { ActionSetTimestampConfiguration } from './ActionConfigurationSidebar/ActionSetTimestampConfiguration'

interface ActionConfigurationSidebarProps {
  actionNodeId: string | null
  onClose: () => void
  className?: string
}

export function ActionConfigurationSidebar({
  actionNodeId,
  onClose,
  className
}: ActionConfigurationSidebarProps) {
  const actionNodes = useActionCanvasStore((state) => state.nodes)
  const actionEdges = useActionCanvasStore((state) => state.edges)
  const actionNode = actionNodeId ? actionNodes.find((n) => n.id === actionNodeId) : null
  const updateActionNode = useActionCanvasStore((state) => state.updateNode)
  const deleteActionEdge = useActionCanvasStore((state) => state.deleteEdge)
  const toolNodes = useToolCanvasStore((state) => state.nodes)
  const toolEdges = useToolCanvasStore((state) => state.edges)
  const nodes = useModelBuilderStore((state) => state.nodes)
  const relationships = useModelBuilderStore((state) => state.relationships)
  const rootNodeId = useModelBuilderStore((state) => state.rootNodeId)
  const xmlFileFromWizard = useXmlImportWizardStore((state) => state.selectedFile)

  // Find connected API tool
  const connectedApiTool = useMemo(() => {
    if (!actionNodeId) return null

    // Find edges where this action is the target
    const incomingEdges = actionEdges.filter(edge => edge.target === actionNodeId)

    // Debug logging (can be removed later)
    if (incomingEdges.length > 0) {
      console.log('[ActionConfig] Found incoming edges:', incomingEdges)
      console.log('[ActionConfig] Action node ID:', actionNodeId)
      console.log('[ActionConfig] Available tool nodes:', toolNodes.map(t => ({ id: t.id, type: t.type })))
    }

    for (const edge of incomingEdges) {
      // Check if source is an API tool
      const toolNode = toolNodes.find(t => t.id === edge.source)
      if (toolNode) {
        console.log('[ActionConfig] Found tool node:', { id: toolNode.id, type: toolNode.type, label: toolNode.label })
        if (
          toolNode.type === 'tool:fetch-api' ||
          toolNode.type === 'tool:fetch-orcid' ||
          toolNode.type === 'tool:fetch-geonames' ||
          toolNode.type === 'tool:fetch-europeana' ||
          toolNode.type === 'tool:fetch-getty' ||
          toolNode.type === 'tool:http'
        ) {
          console.log('[ActionConfig] Connected API tool found:', toolNode.label)
          return toolNode
        }
      } else {
        console.log('[ActionConfig] Tool node not found for edge source:', edge.source)
      }
    }

    return null
  }, [actionNodeId, actionEdges, toolNodes])

  // Get API response from connected tool
  const apiResponse = useMemo(() => {
    if (!connectedApiTool) return null
    return (connectedApiTool.config?.executedResponse as unknown) || null
  }, [connectedApiTool])

  const showApiResponseModal = useActionConfigurationStore((state) => state.showApiResponseModal)
  const setShowApiResponseModal = useActionConfigurationStore((state) => state.setShowApiResponseModal)

  const actionLabel = useActionConfigurationStore((state) => state.actionLabel)
  const setActionLabel = useActionConfigurationStore((state) => state.setActionLabel)
  const loadFromActionNode = useActionConfigurationStore((state) => state.loadFromActionNode)

  // Get all action groups and find which group this action belongs to
  const actionGroups = useMemo(() => {
    return actionNodes.filter(an =>
      (an.type === 'action:group' || an.isGroup === true) &&
      an.id !== actionNodeId // Exclude current action if it's a group
    )
  }, [actionNodes, actionNodeId])

  const currentGroupId = useMemo(() => {
    if (!actionNodeId) return null
    const group = actionNodes.find(an =>
      (an.type === 'action:group' || an.isGroup === true) &&
      an.children?.includes(actionNodeId)
    )
    return group?.id || null
  }, [actionNodes, actionNodeId])

  const selectedGroupId = useActionConfigurationStore((state) => state.selectedGroupId)
  const setSelectedGroupId = useActionConfigurationStore((state) => state.setSelectedGroupId)

  useEffect(() => {
    setSelectedGroupId(currentGroupId || 'none')
  }, [currentGroupId, setSelectedGroupId])

  // Handle moving action to group
  const handleMoveToGroup = (groupId: string) => {
    if (!actionNodeId || !actionNode) return

    // If selecting "none", remove from current group
    if (groupId === 'none') {
      if (currentGroupId) {
        const currentGroup = actionNodes.find(an => an.id === currentGroupId)
        if (currentGroup) {
          const updatedChildren = (currentGroup.children || []).filter(id => id !== actionNodeId)
          updateActionNode(currentGroupId, {
            children: updatedChildren
          })
        }
      }
      setSelectedGroupId('none')
      return
    }

    // Check if action is connected to any tools
    const toolConnections = actionEdges.filter(edge =>
      edge.target === actionNodeId && toolNodes.some(tool => tool.id === edge.source)
    )

    // Delete tool connections before moving to group
    if (toolConnections.length > 0) {
      toolConnections.forEach(edge => {
        deleteActionEdge(edge.id)
      })
    }

    // Remove from current group if in one
    if (currentGroupId && currentGroupId !== groupId) {
      const currentGroup = actionNodes.find(an => an.id === currentGroupId)
      if (currentGroup) {
        const updatedChildren = (currentGroup.children || []).filter(id => id !== actionNodeId)
        updateActionNode(currentGroupId, {
          children: updatedChildren
        })
      }
    }

    // Add to new group
    const targetGroup = actionNodes.find(an => an.id === groupId)
    if (targetGroup) {
      const currentChildren = targetGroup.children || []
      if (!currentChildren.includes(actionNodeId)) {
        const updatedChildren = [...currentChildren, actionNodeId]
        updateActionNode(groupId, {
          children: updatedChildren
        })
      }
    }

    setSelectedGroupId(groupId)
  }

  const groupLabel = useActionConfigurationStore((state) => state.groupLabel)
  const setGroupLabel = useActionConfigurationStore((state) => state.setGroupLabel)
  const groupEnabled = useActionConfigurationStore((state) => state.groupEnabled)
  const setGroupEnabled = useActionConfigurationStore((state) => state.setGroupEnabled)

  // Test execution hook
  const testExecution = useActionTestExecution()
  const testResult = testExecution.testResult
  const isExecuting = testExecution.isExecuting
  const graphResult = testExecution.graphResult
  const showGraphModal = testExecution.showGraphModal
  const setShowGraphModal = testExecution.setShowGraphModal

  // Get the main node this action might be connected to (via tool)
  // For now, actions are standalone, but we can extend this later

  // Action-specific configs (from store)
  const createNodeConfig = useActionConfigurationStore((state) => state.createNodeConfig)
  const setCreateNodeConfig = useActionConfigurationStore((state) => state.setCreateNodeConfig)
  const createRelationshipConfig = useActionConfigurationStore((state) => state.createRelationshipConfig)
  const setCreateRelationshipConfig = useActionConfigurationStore((state) => state.setCreateRelationshipConfig)
  const setPropertyConfig = useActionConfigurationStore((state) => state.setPropertyConfig)
  const setSetPropertyConfig = useActionConfigurationStore((state) => state.setSetPropertyConfig)
  const extractTextConfig = useActionConfigurationStore((state) => state.extractTextConfig)
  const setExtractTextConfig = useActionConfigurationStore((state) => state.setExtractTextConfig)
  const createAnnotationConfig = useActionConfigurationStore((state) => state.createAnnotationConfig)
  const setCreateAnnotationConfig = useActionConfigurationStore((state) => state.setCreateAnnotationConfig)
  const createReferenceConfig = useActionConfigurationStore((state) => state.createReferenceConfig)
  const setCreateReferenceConfig = useActionConfigurationStore((state) => state.setCreateReferenceConfig)
  const extractXmlContentConfig = useActionConfigurationStore((state) => state.extractXmlContentConfig)
  const setExtractXmlContentConfig = useActionConfigurationStore((state) => state.setExtractXmlContentConfig)
  const createNodeTextConfig = useActionConfigurationStore((state) => state.createNodeTextConfig)
  const setCreateNodeTextConfig = useActionConfigurationStore((state) => state.setCreateNodeTextConfig)
  const createNodeTokensConfig = useActionConfigurationStore((state) => state.createNodeTokensConfig)
  const setCreateNodeTokensConfig = useActionConfigurationStore((state) => state.setCreateNodeTokensConfig)
  const processChildrenConfig = useActionConfigurationStore((state) => state.processChildrenConfig)
  const setProcessChildrenConfig = useActionConfigurationStore((state) => state.setProcessChildrenConfig)
  const extractPropertyConfig = useActionConfigurationStore((state) => state.extractPropertyConfig)
  const setExtractPropertyConfig = useActionConfigurationStore((state) => state.setExtractPropertyConfig)
  const transformTextConfig = useActionConfigurationStore((state) => state.transformTextConfig)
  const setTransformTextConfig = useActionConfigurationStore((state) => state.setTransformTextConfig)
  const deferRelationshipConfig = useActionConfigurationStore((state) => state.deferRelationshipConfig)
  const setDeferRelationshipConfig = useActionConfigurationStore((state) => state.setDeferRelationshipConfig)
  const skipConfig = useActionConfigurationStore((state) => state.skipConfig)
  const setSkipConfig = useActionConfigurationStore((state) => state.setSkipConfig)

  const createTextNodeConfig = useActionConfigurationStore((state) => state.createTextNodeConfig)
  const setCreateTextNodeConfig = useActionConfigurationStore((state) => state.setCreateTextNodeConfig)
  const createTokenNodesConfig = useActionConfigurationStore((state) => state.createTokenNodesConfig)
  const setCreateTokenNodesConfig = useActionConfigurationStore((state) => state.setCreateTokenNodesConfig)
  const createNodeWithAttributesConfig = useActionConfigurationStore((state) => state.createNodeWithAttributesConfig)
  const setCreateNodeWithAttributesConfig = useActionConfigurationStore((state) => state.setCreateNodeWithAttributesConfig)
  const createNodeCompleteConfig = useActionConfigurationStore((state) => state.createNodeCompleteConfig)
  const setCreateNodeCompleteConfig = useActionConfigurationStore((state) => state.setCreateNodeCompleteConfig)
  const extractAndNormalizeAttributesConfig = useActionConfigurationStore((state) => state.extractAndNormalizeAttributesConfig)
  const setExtractAndNormalizeAttributesConfig = useActionConfigurationStore((state) => state.setExtractAndNormalizeAttributesConfig)
  const createAnnotationNodesConfig = useActionConfigurationStore((state) => state.createAnnotationNodesConfig)
  const setCreateAnnotationNodesConfig = useActionConfigurationStore((state) => state.setCreateAnnotationNodesConfig)
  const createReferenceChainConfig = useActionConfigurationStore((state) => state.createReferenceChainConfig)
  const setCreateReferenceChainConfig = useActionConfigurationStore((state) => state.setCreateReferenceChainConfig)
  const mergeChildrenTextConfig = useActionConfigurationStore((state) => state.mergeChildrenTextConfig)
  const setMergeChildrenTextConfig = useActionConfigurationStore((state) => state.setMergeChildrenTextConfig)
  const createConditionalNodeConfig = useActionConfigurationStore((state) => state.createConditionalNodeConfig)
  const setCreateConditionalNodeConfig = useActionConfigurationStore((state) => state.setCreateConditionalNodeConfig)
  const extractAndComputePropertyConfig = useActionConfigurationStore((state) => state.extractAndComputePropertyConfig)
  const setExtractAndComputePropertyConfig = useActionConfigurationStore((state) => state.setExtractAndComputePropertyConfig)
  const createNodeWithFilteredChildrenConfig = useActionConfigurationStore((state) => state.createNodeWithFilteredChildrenConfig)
  const setCreateNodeWithFilteredChildrenConfig = useActionConfigurationStore((state) => state.setCreateNodeWithFilteredChildrenConfig)
  const normalizeAndDeduplicateConfig = useActionConfigurationStore((state) => state.normalizeAndDeduplicateConfig)
  const setNormalizeAndDeduplicateConfig = useActionConfigurationStore((state) => state.setNormalizeAndDeduplicateConfig)
  const createHierarchicalNodesConfig = useActionConfigurationStore((state) => state.createHierarchicalNodesConfig)
  const setCreateHierarchicalNodesConfig = useActionConfigurationStore((state) => state.setCreateHierarchicalNodesConfig)

  useEffect(() => {
    loadFromActionNode(actionNode || null)
  }, [actionNode, loadFromActionNode])

  const handleExecuteTest = async () => {
    // Get XML file from wizard store
    const xmlFileToUse = xmlFileFromWizard

    if (!xmlFileToUse) {
      testExecution.setTestResult({
        success: false,
        output: 'Error',
        details: 'No XML file selected. Please upload an XML file in the XML Import Wizard first.'
      })
      testExecution.setIsExecuting(false)
      return
    }

    // Create workflow execution function
    const executeWorkflow = async (): Promise<Array<Record<string, unknown>>> => {
      // Read XML content
      const xmlContent = await xmlFileToUse.text()

      // Convert builder nodes/relationships to schema JSON
      const schemaJson = convertBuilderToSchemaJson(nodes, relationships)

      // Execute workflow
      const graph = await executeWorkflowExecutor({
        xmlContent,
        schemaJson,
        nodes,
        relationships,
        toolNodes,
        toolEdges,
        actionNodes,
        actionEdges,
        startNodeId: rootNodeId || undefined
      })

      // Convert to record array for display
      return graph.map(item => ({ ...item } as Record<string, unknown>))
    }

    // Use hook's test execution handler
    await testExecution.handleExecuteTest(executeWorkflow)
  }

  if (!actionNodeId || !actionNode) {
    return null
  }

  return (
    <div className={`${className} flex flex-col h-full border-l bg-background`}>
      <ActionConfigurationHeader
        actionNode={actionNode}
        actionLabel={actionLabel}
        selectedGroupId={selectedGroupId}
        actionGroups={actionGroups}
        toolNodes={toolNodes}
        actionEdges={actionEdges}
        actionNodeId={actionNodeId}
        onActionLabelChange={setActionLabel}
        onUpdateActionNode={updateActionNode}
        onMoveToGroup={handleMoveToGroup}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* API Tool Connection Banner - Show for all action types */}
        {connectedApiTool && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                Connected to API Tool: {connectedApiTool.label}
              </div>
              {apiResponse && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowApiResponseModal(true)}
                  className="h-6 px-2 text-xs"
                >
                  View Response
                </Button>
              )}
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400">
              {apiResponse
                ? 'You can use JSON fields from the API response in the action configuration below.'
                : 'Execute the API tool to see the response data and use its fields in this action.'}
            </div>
          </div>
        )}

        {actionNode.type === 'action:create-node' && (
          <ActionCreateNodeConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            createNodeConfig={createNodeConfig}
            onCreateNodeConfigChange={setCreateNodeConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:create-relationship' && (
          <ActionCreateRelationshipConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            createRelationshipConfig={createRelationshipConfig}
            onCreateRelationshipConfigChange={setCreateRelationshipConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:set-property' && (
          <ActionSetPropertyConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            setPropertyConfig={setPropertyConfig}
            apiResponse={apiResponse}
            onSetPropertyConfigChange={setSetPropertyConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:extract-text' && (
          <ActionExtractTextConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            extractTextConfig={extractTextConfig}
            onExtractTextConfigChange={setExtractTextConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:create-annotation' && (
          <ActionCreateAnnotationConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            createAnnotationConfig={createAnnotationConfig}
            onCreateAnnotationConfigChange={setCreateAnnotationConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:create-reference' && (
          <ActionCreateReferenceConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            createReferenceConfig={createReferenceConfig}
            onCreateReferenceConfigChange={setCreateReferenceConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:extract-xml-content' && (
          <ActionExtractXmlContentConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            extractXmlContentConfig={extractXmlContentConfig}
            onExtractXmlContentConfigChange={setExtractXmlContentConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:create-node-text' && (
          <ActionCreateNodeTextConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            createNodeTextConfig={createNodeTextConfig}
            onCreateNodeTextConfigChange={setCreateNodeTextConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:create-node-tokens' && (
          <ActionCreateNodeTokensConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            createNodeTokensConfig={createNodeTokensConfig}
            onCreateNodeTokensConfigChange={setCreateNodeTokensConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:process-children' && (
          <ActionProcessChildrenConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            processChildrenConfig={processChildrenConfig}
            onProcessChildrenConfigChange={setProcessChildrenConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:extract-property' && (
          <ActionExtractPropertyConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            extractPropertyConfig={extractPropertyConfig}
            onExtractPropertyConfigChange={setExtractPropertyConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:transform-text' && (
          <ActionTransformTextConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            transformTextConfig={transformTextConfig}
            onTransformTextConfigChange={setTransformTextConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:defer-relationship' && (
          <ActionDeferRelationshipConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            deferRelationshipConfig={deferRelationshipConfig}
            onDeferRelationshipConfigChange={setDeferRelationshipConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:skip' && (
          <ActionSkipConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            skipConfig={skipConfig}
            onSkipConfigChange={setSkipConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:create-text-node' && (
          <ActionCreateTextNodeConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            createTextNodeConfig={createTextNodeConfig}
            onCreateTextNodeConfigChange={setCreateTextNodeConfig}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {actionNode.type === 'action:create-token-nodes' && (
          <ActionCreateTokenNodesConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            createTokenNodesConfig={createTokenNodesConfig}
            onCreateTokenNodesConfigChange={setCreateTokenNodesConfig}
            onUpdateActionNode={updateActionNode}

          />
        )}

        {actionNode.type === 'action:create-node-with-attributes' && (<ActionCreateNodeWithAttributesConfiguration
          actionNodeId={actionNodeId!}
          actionNode={actionNode}
          createNodeWithAttributesConfig={createNodeWithAttributesConfig} onCreateNodeWithAttributesConfigChange={setCreateNodeWithAttributesConfig} onUpdateActionNode={updateActionNode} />)}
        {actionNode.type === 'action:create-node-complete' && (<ActionCreateNodeCompleteConfiguration actionNodeId={actionNodeId!} actionNode={actionNode} createNodeCompleteConfig={createNodeCompleteConfig} onCreateNodeCompleteConfigChange={setCreateNodeCompleteConfig} onUpdateActionNode={updateActionNode} />)}
        {actionNode.type === 'action:extract-and-normalize-attributes' && (<ActionExtractAndNormalizeAttributesConfiguration actionNodeId={actionNodeId!} actionNode={actionNode} extractAndNormalizeAttributesConfig={extractAndNormalizeAttributesConfig} onExtractAndNormalizeAttributesConfigChange={setExtractAndNormalizeAttributesConfig} onUpdateActionNode={updateActionNode} />)}
        {actionNode.type === 'action:create-annotation-nodes' && (<ActionCreateAnnotationNodesConfiguration actionNodeId={actionNodeId!} actionNode={actionNode} createAnnotationNodesConfig={createAnnotationNodesConfig} onCreateAnnotationNodesConfigChange={setCreateAnnotationNodesConfig} onUpdateActionNode={updateActionNode} />)}
        {actionNode.type === 'action:create-reference-chain' && (<ActionCreateReferenceChainConfiguration actionNodeId={actionNodeId!} actionNode={actionNode} createReferenceChainConfig={createReferenceChainConfig} onCreateReferenceChainConfigChange={setCreateReferenceChainConfig} onUpdateActionNode={updateActionNode} />)}
        {actionNode.type === 'action:merge-children-text' && (<ActionMergeChildrenTextConfiguration actionNodeId={actionNodeId!} actionNode={actionNode} mergeChildrenTextConfig={mergeChildrenTextConfig} onMergeChildrenTextConfigChange={setMergeChildrenTextConfig} onUpdateActionNode={updateActionNode} />)}
        {actionNode.type === 'action:create-conditional-node' && (<ActionCreateConditionalNodeConfiguration actionNodeId={actionNodeId!} actionNode={actionNode} createConditionalNodeConfig={createConditionalNodeConfig} onCreateConditionalNodeConfigChange={setCreateConditionalNodeConfig} onUpdateActionNode={updateActionNode} />)}
        {actionNode.type === 'action:extract-and-compute-property' && (<ActionExtractAndComputePropertyConfiguration actionNodeId={actionNodeId!} actionNode={actionNode} extractAndComputePropertyConfig={extractAndComputePropertyConfig} onExtractAndComputePropertyConfigChange={setExtractAndComputePropertyConfig} onUpdateActionNode={updateActionNode} />)}
        {actionNode.type === 'action:create-node-with-filtered-children' && (<ActionCreateNodeWithFilteredChildrenConfiguration actionNodeId={actionNodeId!} actionNode={actionNode} createNodeWithFilteredChildrenConfig={createNodeWithFilteredChildrenConfig} onCreateNodeWithFilteredChildrenConfigChange={setCreateNodeWithFilteredChildrenConfig} onUpdateActionNode={updateActionNode} />)}
        {actionNode.type === 'action:normalize-and-deduplicate' && (<ActionNormalizeAndDeduplicateConfiguration actionNodeId={actionNodeId!} actionNode={actionNode} normalizeAndDeduplicateConfig={normalizeAndDeduplicateConfig} onNormalizeAndDeduplicateConfigChange={setNormalizeAndDeduplicateConfig} onUpdateActionNode={updateActionNode} />)}
        {actionNode.type === 'action:create-hierarchical-nodes' && (<ActionCreateHierarchicalNodesConfiguration actionNodeId={actionNodeId!} actionNode={actionNode} createHierarchicalNodesConfig={createHierarchicalNodesConfig} onCreateHierarchicalNodesConfigChange={setCreateHierarchicalNodesConfig} onUpdateActionNode={updateActionNode} />)}
        {/* Action Group Configuration */}
        {(actionNode?.type === 'action:group' || actionNode?.isGroup) && (
          <ActionGroupConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            groupLabel={groupLabel}
            groupEnabled={groupEnabled}
            onGroupLabelChange={setGroupLabel}
            onGroupEnabledChange={setGroupEnabled}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Copy Property Action Configuration */}
        {actionNode?.type === 'action:copy-property' && (
          <ActionCopyPropertyConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            apiResponse={apiResponse}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Merge Properties Action Configuration */}
        {actionNode?.type === 'action:merge-properties' && (
          <ActionMergePropertiesConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Split Property Action Configuration */}
        {actionNode?.type === 'action:split-property' && (
          <ActionSplitPropertyConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Format Property Action Configuration */}
        {actionNode?.type === 'action:format-property' && (
          <ActionFormatPropertyConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Update Relationship Action Configuration */}
        {actionNode?.type === 'action:update-relationship' && (
          <ActionUpdateRelationshipConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Delete Relationship Action Configuration */}
        {actionNode?.type === 'action:delete-relationship' && (
          <ActionDeleteRelationshipConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Reverse Relationship Action Configuration */}
        {actionNode?.type === 'action:reverse-relationship' && (
          <ActionReverseRelationshipConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Update Node Action Configuration */}
        {actionNode?.type === 'action:update-node' && (
          <ActionUpdateNodeConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Delete Node Action Configuration */}
        {actionNode?.type === 'action:delete-node' && (
          <ActionDeleteNodeConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Clone Node Action Configuration */}
        {actionNode?.type === 'action:clone-node' && (
          <ActionCloneNodeConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Merge Nodes Action Configuration */}
        {actionNode?.type === 'action:merge-nodes' && (
          <ActionMergeNodesConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Validate Node Action Configuration */}
        {actionNode?.type === 'action:validate-node' && (
          <ActionValidateNodeConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Validate Relationship Action Configuration */}
        {actionNode?.type === 'action:validate-relationship' && (
          <ActionValidateRelationshipConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Report Error Action Configuration */}
        {actionNode?.type === 'action:report-error' && (
          <ActionReportErrorConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            apiResponse={apiResponse}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Add Metadata Action Configuration */}
        {actionNode?.type === 'action:add-metadata' && (
          <ActionAddMetadataConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Tag Node Action Configuration */}
        {actionNode?.type === 'action:tag-node' && (
          <ActionTagNodeConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            apiResponse={apiResponse}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Set Timestamp Action Configuration */}
        {actionNode?.type === 'action:set-timestamp' && (
          <ActionSetTimestampConfiguration
            actionNodeId={actionNodeId!}
            actionNode={actionNode}
            onUpdateActionNode={updateActionNode}
          />
        )}

        {/* Test Execution Section */}
        <div className="mt-6 pt-4 border-t">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Test Execution</Label>
              <Button
                size="sm"
                onClick={handleExecuteTest}
                disabled={isExecuting}
                className="h-7 px-3 text-xs"
              >
                <Play className="h-3 w-3 mr-1" />
                {isExecuting ? 'Executing...' : 'Execute Test'}
              </Button>
            </div>

            {testResult && (
              <div className={`p-3 rounded border-2 ${testResult.success
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`text-xs font-semibold ${testResult.success
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                    }`}>
                    Result: {testResult.output.toUpperCase()}
                  </span>
                </div>
                {testResult.details && (
                  <div className="text-[10px] text-muted-foreground font-mono bg-background/50 p-2 rounded mt-2 whitespace-pre-wrap">
                    {testResult.details}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Response Modal */}
      {apiResponse && (
        <ApiResponseModal
          open={showApiResponseModal}
          onOpenChange={setShowApiResponseModal}
          data={apiResponse}
          title={`API Response from ${connectedApiTool?.label || 'API Tool'}`}
          onFieldSelect={(path) => {
            const expression = `{{ $json.${path} }}`
            navigator.clipboard.writeText(expression)
          }}
        />
      )}

      {/* Graph Result Modal */}
      {graphResult && (
        <GraphResultModal
          open={showGraphModal}
          onOpenChange={setShowGraphModal}
          graph={graphResult}
          title="Test Execution Result"
        />
      )}
    </div>
  )
}

