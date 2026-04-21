'use client'

import { useMemo, useCallback, useEffect } from 'react'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useXmlImportWizardStore } from '../../stores/xmlImportWizardStore'
import { useActionConfigurationStore } from '../../stores/actionConfigurationStore'
import { useActionTestExecution } from './useActionTestExecution'
import { workflowRegistry } from '../../registry'
import { convertBuilderToSchemaJson } from '../../utils/schemaJsonConverter'
import { executeWorkflow as executeWorkflowExecutor } from '../../services/workflow/workflowExecutor'

export function useActionConfiguration(actionNodeId: string | null, xmlContent?: string) {
  const actionNodes = useActionCanvasStore((state) => state.nodes)
  const actionEdges = useActionCanvasStore((state) => state.edges)
  const updateActionNode = useActionCanvasStore((state) => state.updateNode)
  const deleteActionEdge = useActionCanvasStore((state) => state.deleteEdge)
  
  const toolNodes = useToolCanvasStore((state) => state.nodes)
  const toolEdges = useToolCanvasStore((state) => state.edges)
  
  const nodes = useModelBuilderStore((state) => state.nodes)
  const relationships = useModelBuilderStore((state) => state.relationships)
  const rootNodeId = useModelBuilderStore((state) => state.rootNodeId)
  const xmlFileFromWizard = useXmlImportWizardStore((state) => state.selectedFile)

  const actionNode = useMemo(() => 
    actionNodeId ? actionNodes.find((n) => n.id === actionNodeId) || null : null
  , [actionNodes, actionNodeId])

  // Context Discovery: Find connected API tool
  const connectedApiTool = useMemo(() => {
    if (!actionNodeId) return null
    const incomingEdges = actionEdges.filter(edge => edge.target === actionNodeId)
    for (const edge of incomingEdges) {
      const toolNode = toolNodes.find(t => t.id === edge.source)
      if (toolNode) {
        const toolDefinition = workflowRegistry.getTool(toolNode.type)
        if (toolDefinition?.metadata.isApiTool) {
          return toolNode
        }
      }
    }
    return null
  }, [actionNodeId, actionEdges, toolNodes])

  const apiResponse = useMemo(() => {
    if (!connectedApiTool) return null
    return (connectedApiTool.config?.executedResponse as unknown) || null
  }, [connectedApiTool])

  // Action Configuration Store state
  const {
    showApiResponseModal,
    setShowApiResponseModal,
    actionLabel,
    setActionLabel,
    loadFromActionNode,
    selectedGroupId,
    setSelectedGroupId,
    config,
    updateConfig,
    groupLabel,
    setGroupLabel,
    groupEnabled,
    setGroupEnabled
  } = useActionConfigurationStore()

  // Metadata & Definition
  const actionDefinition = useMemo(() => {
    return actionNode ? workflowRegistry.getAction(actionNode.type) : null
  }, [actionNode])

  const actionGroups = useMemo(() => {
    return actionNodes.filter(an =>
      (an.type === 'action:group' || an.isGroup === true) &&
      an.id !== actionNodeId
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

  // Initialization effects
  useEffect(() => {
    loadFromActionNode(actionNode || null)
  }, [actionNode, loadFromActionNode])

  useEffect(() => {
    setSelectedGroupId(currentGroupId || 'none')
  }, [currentGroupId, setSelectedGroupId])

  // Group Management
  const handleMoveToGroup = useCallback((groupId: string) => {
    if (!actionNodeId || !actionNode) return

    if (groupId === 'none') {
      if (currentGroupId) {
        const currentGroup = actionNodes.find(an => an.id === currentGroupId)
        if (currentGroup) {
          const updatedChildren = (currentGroup.children || []).filter(id => id !== actionNodeId)
          updateActionNode(currentGroupId, { children: updatedChildren })
        }
      }
      setSelectedGroupId('none')
      return
    }

    const toolConnections = actionEdges.filter(edge =>
      edge.target === actionNodeId && toolNodes.some(tool => tool.id === edge.source)
    )

    if (toolConnections.length > 0) {
      toolConnections.forEach(edge => deleteActionEdge(edge.id))
    }

    if (currentGroupId && currentGroupId !== groupId) {
      const currentGroup = actionNodes.find(an => an.id === currentGroupId)
      if (currentGroup) {
        const updatedChildren = (currentGroup.children || []).filter(id => id !== actionNodeId)
        updateActionNode(currentGroupId, { children: updatedChildren })
      }
    }

    const targetGroup = actionNodes.find(an => an.id === groupId)
    if (targetGroup) {
      const currentChildren = targetGroup.children || []
      if (!currentChildren.includes(actionNodeId)) {
        const updatedChildren = [...currentChildren, actionNodeId]
        updateActionNode(groupId, { children: updatedChildren })
      }
    }
    setSelectedGroupId(groupId)
  }, [actionNodeId, actionNode, currentGroupId, actionNodes, updateActionNode, actionEdges, toolNodes, deleteActionEdge, setSelectedGroupId])

  // Test Execution
  const testExecution = useActionTestExecution()
  
  const handleExecuteTest = useCallback(async () => {
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

    const executeWorkflow = async (): Promise<Array<Record<string, unknown>>> => {
      // Use live xmlContent if available, otherwise read from file
      const currentXml = xmlContent || (xmlFileToUse ? await xmlFileToUse.text() : '')
      
      const schemaJson = convertBuilderToSchemaJson(nodes, relationships)
      const graph = await executeWorkflowExecutor({
        xmlContent: currentXml,
        schemaJson,
        nodes,
        relationships,
        toolNodes,
        toolEdges,
        actionNodes,
        actionEdges,
        startNodeId: rootNodeId || undefined
      })
      return graph.map(item => ({ ...item } as Record<string, unknown>))
    }

    await testExecution.handleExecuteTest(executeWorkflow)
  }, [xmlFileFromWizard, testExecution, nodes, relationships, toolNodes, toolEdges, actionNodes, actionEdges, rootNodeId])

  return {
    actionNode,
    actionDefinition,
    config,
    updateConfig,
    actionLabel,
    setActionLabel,
    connectedApiTool,
    apiResponse,
    showApiResponseModal,
    setShowApiResponseModal,
    actionGroups,
    selectedGroupId,
    currentGroupId,
    groupLabel,
    setGroupLabel,
    groupEnabled,
    setGroupEnabled,
    handleMoveToGroup,
    handleExecuteTest,
    testExecution,
    updateActionNode,
    toolNodes,
    actionEdges
  }
}
