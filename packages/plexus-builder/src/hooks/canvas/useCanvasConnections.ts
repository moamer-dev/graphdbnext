import { useCallback } from 'react'
import { Connection, Edge } from 'reactflow'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useWorkflowStore } from '../../stores/workflowStore'
import { useWorkflowCanvasStore } from '../../stores/workflowCanvasStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'
import {
  isMainNodeId,
  isWorkflowNodeId,
  isToolNodeId,
  isActionNodeId,
  isActionGroupNodeId,
  mapDragTypeToStep
} from '../../utils/canvasUtils'

interface UseCanvasConnectionsProps {
  edges: Edge[]
  setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void
}

export function useCanvasConnections({
  edges,
  setEdges
}: UseCanvasConnectionsProps) {
  const { addRelationship } = useModelBuilderStore()
  const { addStep: addWorkflowStep } = useWorkflowStore()
  const { nodes: wfNodes, addEdge: addWfEdge, updateNode: updateWfNode } = useWorkflowCanvasStore()
  const { nodes: toolNodes, addEdge: addToolEdge, updateNode: updateToolNode } = useToolCanvasStore()
  const { 
    edges: actionEdges, 
    addEdge: addActionEdge, 
    deleteEdge: deleteActionEdge,
    nodes: actionNodes 
  } = useActionCanvasStore()

  const isValidConnection = useCallback((connection: Connection): boolean => {
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
      return false
    }

    const sourceIsMain = isMainNodeId(connection.source)
    const targetIsMain = isMainNodeId(connection.target)
    const sourceIsTool = isToolNodeId(connection.source)
    const targetIsTool = isToolNodeId(connection.target)
    const targetIsAction = isActionNodeId(connection.target)
    const targetIsActionGroup = isActionGroupNodeId(connection.target, actionNodes)

    // Main node to Main node
    if (sourceIsMain && targetIsMain) {
      return connection.sourceHandle === 'relation-out' && connection.targetHandle === 'relation-in'
    }

    // Main node to Tool
    if (sourceIsMain && targetIsTool) {
      return connection.sourceHandle === 'tools' && connection.targetHandle?.startsWith('input')
    }

    // Tool output to Action Group
    if (sourceIsTool && targetIsActionGroup) {
      if (connection.targetHandle !== 'input') return false

      const sourceTool = toolNodes.find(t => t.id === connection.source)
      if (sourceTool?.type === 'tool:if') {
        const validIfElseHandles = ['true', 'false']
        if (connection.sourceHandle && !validIfElseHandles.includes(connection.sourceHandle)) return false

        const existingStoreEdge = actionEdges.find(e =>
          e.source === connection.source && e.target === connection.target
        )
        const existingReactFlowEdge = edges.find(e =>
          e.source === connection.source && e.target === connection.target
        )

        if (existingStoreEdge || existingReactFlowEdge) return false
      }
      return true
    }

    // Tool output to Action
    const targetIsRegularAction = targetIsAction && !targetIsActionGroup
    if (sourceIsTool && targetIsRegularAction) {
      return connection.targetHandle === 'input'
    }

    // Tool output to Tool input
    if (sourceIsTool && targetIsTool) {
      return connection.targetHandle?.startsWith('input')
    }

    return false
  }, [toolNodes, actionEdges, edges, actionNodes])

  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return
    if (!isValidConnection(params)) return

    const sourceIsMain = isMainNodeId(params.source)
    const targetIsMain = isMainNodeId(params.target)
    const sourceIsTool = isToolNodeId(params.source)
    const targetIsTool = isToolNodeId(params.target)
    const targetIsActionGroup = isActionGroupNodeId(params.target, actionNodes)
    const sourceIsWf = isWorkflowNodeId(params.source)
    const targetIsWf = isWorkflowNodeId(params.target)

    if (sourceIsMain && targetIsMain) {
      addRelationship({
        type: 'RELATES_TO',
        from: params.source,
        to: params.target
      })
      return
    }

    if (sourceIsMain && targetIsTool) {
      updateToolNode(params.target, { targetNodeId: params.source })
      addToolEdge({
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle || undefined,
        targetHandle: params.targetHandle || undefined
      })
      return
    }

    const targetIsRegularAction = isActionNodeId(params.target) && !targetIsActionGroup
    if (sourceIsTool && targetIsRegularAction) {
      addActionEdge({
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle || undefined,
        targetHandle: params.targetHandle || undefined
      })
      return
    }

    if (sourceIsTool && targetIsActionGroup) {
      const sourceTool = toolNodes.find(t => t.id === params.source)
      if (sourceTool?.type === 'tool:if') {
        const existingStoreEdges = actionEdges.filter(e =>
          e.source === params.source && e.target === params.target
        )
        existingStoreEdges.forEach(edge => deleteActionEdge(edge.id))

        const existingReactFlowEdges = edges.filter(e =>
          e.source === params.source && e.target === params.target
        )
        if (existingReactFlowEdges.length > 0) {
          setEdges(eds => eds.filter(e => !(e.source === params.source && e.target === params.target)))
        }
      }

      addActionEdge({
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle || undefined,
        targetHandle: params.targetHandle || undefined
      })
      return
    }

    if (sourceIsTool && targetIsTool) {
      addToolEdge({
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle || undefined,
        targetHandle: params.targetHandle || undefined
      })
      return
    }

    if (sourceIsWf !== targetIsWf && !sourceIsMain && !targetIsMain) {
      const wfId = sourceIsWf ? params.source : params.target
      const modelId = sourceIsWf ? params.target : params.source
      const wfNode = wfNodes.find((n) => n.id === wfId)
      if (!wfNode) return
      const step = mapDragTypeToStep(wfNode.type)
      if (!step) return
      addWfEdge({ source: wfId, target: modelId })
      updateWfNode(wfId, { targetNodeId: modelId })
      addWorkflowStep(modelId, step)
    }
  }, [addRelationship, addWfEdge, wfNodes, updateWfNode, addWorkflowStep, toolNodes, updateToolNode, addToolEdge, addActionEdge, deleteActionEdge, actionEdges, edges, setEdges, isValidConnection, actionNodes])

  return {
    isValidConnection,
    onConnect
  }
}
