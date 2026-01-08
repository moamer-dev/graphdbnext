import { useState } from 'react'
import { useAISettings } from '../../ai/config'
import { createChatModel } from '../../ai/models/factory'
import { generateWorkflow, explainWorkflow, type WorkflowSuggestion } from '../../ai/agents/WorkflowGenerationAgent'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'
import { toast } from '../../utils/toast'
import { WorkflowApplicationService } from '../../services/workflowApplicationService'

export function useWorkflowGeneration() {
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<WorkflowSuggestion | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { settings, isReady } = useAISettings()
  const store = useModelBuilderStore()
  const toolCanvasStore = useToolCanvasStore()
  const actionCanvasStore = useActionCanvasStore()

  const handleGenerateWorkflow = async () => {
    if (!description.trim() || !isReady || !settings.enabled) return

    setIsLoading(true)
    setError(null)
    setSuggestion(null)

    try {
      const model = createChatModel(settings.model)
      const schema = {
        nodes: store.nodes,
        relationships: store.relationships,
      }
      const result = await generateWorkflow(model, settings, description, schema)
      setSuggestion(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate workflow')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyWorkflow = () => {
    if (!suggestion) return

    try {
      const targetNode = WorkflowApplicationService.findTargetNodeFromWorkflow(
        store.nodes,
        suggestion.actionNodes
      )
      
      if (!targetNode) {
        setError('No target node found. Please create at least one node in your schema first.')
        return
      }
      
      const targetNodeId = targetNode.id

      const toolIdMap = new Map<string, string>()
      const actionIdMap = new Map<string, string>()

      suggestion.toolNodes.forEach((toolNode, index) => {
        const position = WorkflowApplicationService.calculateNodePosition(
          targetNode,
          index,
          toolNode.position
        )

        const outputs = WorkflowApplicationService.calculateToolOutputs(toolNode.type, toolNode.config)

        const newId = toolCanvasStore.addNode({
          type: toolNode.type as any,
          position,
          config: toolNode.config || {},
          label: toolNode.label || toolNode.type,
          targetNodeId: index === 0 ? targetNodeId : undefined,
          outputs,
        })
        toolIdMap.set(toolNode.id, newId)
      })

      suggestion.actionNodes.forEach(actionNode => {
        const newId = actionCanvasStore.addNode({
          type: actionNode.type as any,
          position: actionNode.position,
          config: actionNode.config || {},
          label: actionNode.label || actionNode.type,
        })
        actionIdMap.set(actionNode.id, newId)
      })

      if (suggestion.toolNodes.length > 0 && targetNodeId) {
        const firstToolId = toolIdMap.get(suggestion.toolNodes[0].id)
        if (firstToolId) {
          toolCanvasStore.addEdge({
            source: targetNodeId,
            target: firstToolId,
            sourceHandle: 'tools',
            targetHandle: 'input-0',
          })
        }
      }

      suggestion.edges.forEach(edge => {
        const sourceId = toolIdMap.get(edge.from) || actionIdMap.get(edge.from)
        const targetId = toolIdMap.get(edge.to) || actionIdMap.get(edge.to)

        if (sourceId && targetId) {
          if (toolIdMap.has(edge.from) && toolIdMap.has(edge.to)) {
            toolCanvasStore.addEdge({
              source: sourceId,
              target: targetId,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle,
            })
          } else {
            actionCanvasStore.addEdge({
              source: sourceId,
              target: targetId,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle,
            })
          }
        }
      })

      toast.success(`Workflow applied: ${suggestion.toolNodes.length} tools, ${suggestion.actionNodes.length} actions, ${suggestion.edges.length} edges`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply workflow')
    }
  }

  const handleExplainWorkflow = async () => {
    if (!suggestion || !isReady || !settings.enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const model = createChatModel(settings.model)
      const workflow = {
        toolNodes: suggestion.toolNodes.map(n => ({
          type: n.type,
          label: n.label,
          config: n.config,
        })),
        actionNodes: suggestion.actionNodes.map(n => ({
          type: n.type,
          label: n.label,
          config: n.config,
        })),
        edges: suggestion.edges.map(e => ({
          from: e.from,
          to: e.to,
        })),
      }
      const explanation = await explainWorkflow(model, settings, workflow)
      setSuggestion({
        ...suggestion,
        explanation,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to explain workflow')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setSuggestion(null)
    setDescription('')
    setError(null)
  }

  return {
    description,
    setDescription,
    isLoading,
    suggestion,
    error,
    isReady,
    settings,
    handleGenerateWorkflow,
    handleApplyWorkflow,
    handleExplainWorkflow,
    handleClear
  }
}

