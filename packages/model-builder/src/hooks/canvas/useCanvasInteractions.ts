import { useCallback } from 'react'
import { 
  Node, 
  Edge, 
  NodeChange, 
  EdgeChange, 
  useReactFlow 
} from 'reactflow'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useWorkflowStore } from '../../stores/workflowStore'
import { useWorkflowCanvasStore } from '../../stores/workflowCanvasStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'
import { 
  labelFromType, 
  mapDragTypeToStep 
} from '../../utils/canvasUtils'

interface UseCanvasInteractionsProps {
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  isDraggingRef: React.MutableRefObject<boolean>
  snapToGrid: boolean
}

export function useCanvasInteractions({
  onNodesChange,
  onEdgesChange,
  setEdges,
  isDraggingRef,
  snapToGrid
}: UseCanvasInteractionsProps) {
  const reactFlowInstance = useReactFlow()
  
  const { setNodePosition } = useModelBuilderStore()
  const { addStep: addWorkflowStep } = useWorkflowStore()
  const { addNode: addWfNode, updateNode: updateWfNode } = useWorkflowCanvasStore()
  const { nodes: toolNodes, addNode: addToolNode, updateNode: updateToolNode } = useToolCanvasStore()
  const { 
    nodes: actionNodes, 
    edges: actionEdges, 
    addNode: addActionNode, 
    updateNode: updateActionNode, 
    deleteEdge: deleteActionEdge 
  } = useActionCanvasStore()

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    const filteredChanges = changes.filter((change) => change.type !== 'remove' && change.type !== 'select')
    onNodesChange(filteredChanges)

    filteredChanges.forEach((change) => {
      if (change.type === 'position') {
        isDraggingRef.current = change.dragging ?? isDraggingRef.current
        
        if (change.dragging === false && change.position && change.id) {
          let finalPosition = change.position
          if (snapToGrid) {
            const gridSize = 20
            finalPosition = {
              x: Math.round(change.position.x / gridSize) * gridSize,
              y: Math.round(change.position.y / gridSize) * gridSize
            }
          }

          if (change.id.startsWith('wfn_')) {
            updateWfNode(change.id, { position: finalPosition })
          } else if (change.id.startsWith('tool_')) {
            updateToolNode(change.id, { position: finalPosition })
          } else if (change.id.startsWith('action_')) {
            updateActionNode(change.id, { position: finalPosition })
          } else {
            setNodePosition(change.id, finalPosition)
          }
        }
      }
    })
  }, [onNodesChange, setNodePosition, updateWfNode, updateToolNode, updateActionNode, snapToGrid, isDraggingRef])

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes)

    setEdges((currentEdges) => {
      const ifElseToolIds = new Set(toolNodes.filter(t => t.type === 'tool:if').map(t => t.id))
      const actionGroupIds = new Set(actionNodes.filter(a => a.type === 'action:group' || a.isGroup).map(a => a.id))

      const edgeGroups = new Map<string, Edge[]>()
      currentEdges.forEach(edge => {
        if (ifElseToolIds.has(edge.source) && actionGroupIds.has(edge.target)) {
          const key = `${edge.source}->${edge.target}`
          if (!edgeGroups.has(key)) edgeGroups.set(key, [])
          edgeGroups.get(key)!.push(edge)
        }
      })

      const addedEdgeIds = new Set(
        changes.filter(c => c.type === 'add').map(c => (c as any).item.id)
      )

      const edgesToRemove = new Set<string>()
      edgeGroups.forEach((groupEdges) => {
        if (groupEdges.length > 1) {
          const newlyAddedEdge = groupEdges.find(e => addedEdgeIds.has(e.id))
          const edgeToKeep = newlyAddedEdge || groupEdges[groupEdges.length - 1]

          groupEdges.forEach(edge => {
            if (edge.id !== edgeToKeep.id) {
              edgesToRemove.add(edge.id)
              const storeEdge = actionEdges.find(e =>
                e.source === edge.source && e.target === edge.target && e.sourceHandle === edge.sourceHandle
              )
              if (storeEdge) deleteActionEdge(storeEdge.id)
            }
          })
        }
      })

      return edgesToRemove.size > 0 ? currentEdges.filter(e => !edgesToRemove.has(e.id)) : currentEdges
    })
  }, [onEdgesChange, setEdges, toolNodes, actionNodes, actionEdges, deleteActionEdge])

  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.id.startsWith('wfn_')) {
      updateWfNode(node.id, { position: node.position })
    } else if (node.id.startsWith('tool_')) {
      updateToolNode(node.id, { position: node.position })
    } else if (node.id.startsWith('action_')) {
      updateActionNode(node.id, { position: node.position })
    } else {
      setNodePosition(node.id, node.position)
    }
  }, [setNodePosition, updateWfNode, updateToolNode, updateActionNode])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const type =
      event.dataTransfer.getData('application/workflow-step-type') ||
      event.dataTransfer.getData('application/workflow-node-type') ||
      event.dataTransfer.getData('application/tool-type') ||
      event.dataTransfer.getData('application/action-type') ||
      event.dataTransfer.getData('text/plain')
    
    if (!type) return

    const screenPoint = { x: event.clientX, y: event.clientY }
    const flowPoint = reactFlowInstance.screenToFlowPosition(screenPoint)

    if (type.startsWith('tool:')) {
      let outputs: Array<{ id: string; label: string }> = [{ id: 'output', label: 'Output' }]
      if (type === 'tool:if') {
        outputs = [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }]
      } else if (type === 'tool:switch') {
        outputs = [{ id: 'default', label: 'Default' }]
      }
      addToolNode({
        type: type as any,
        label: labelFromType(type),
        position: flowPoint,
        config: {},
        inputs: 1,
        outputs
      })
      return
    }

    if (type.startsWith('action:')) {
      const dropTarget = reactFlowInstance.getNodes().find(n => {
        if (n.type !== 'actionGroup') return false
        const bounds = {
          x: n.position.x,
          y: n.position.y,
          width: (n.width || 150) + 20,
          height: (n.height || 100) + 20
        }
        return (
          flowPoint.x >= bounds.x && flowPoint.x <= bounds.x + bounds.width &&
          flowPoint.y >= bounds.y && flowPoint.y <= bounds.y + bounds.height
        )
      })

      if (type === 'action:group') {
        addActionNode({
          type: 'action:group',
          label: 'Action Group',
          config: {},
          position: flowPoint,
          isGroup: true,
          children: [],
          isExpanded: true,
          enabled: true
        })
        return
      }

      if (dropTarget && type !== 'action:group') {
        const groupActionNode = actionNodes.find(a => a.id === dropTarget.id)
        if (groupActionNode && (groupActionNode.type === 'action:group' || groupActionNode.isGroup)) {
          const newActionId = addActionNode({
            type: type as any,
            label: labelFromType(type),
            position: { x: 0, y: 0 },
            config: {}
          })
          updateActionNode(dropTarget.id, {
            children: [...(groupActionNode.children || []), newActionId]
          })
          return
        }
      }

      addActionNode({
        type: type as any,
        label: labelFromType(type),
        position: flowPoint,
        config: {}
      })
      return
    }

    const step = mapDragTypeToStep(type)
    if (!step) return
    addWfNode({
      kind: step.kind === 'action' ? 'action' : 'condition',
      type: type as any,
      label: labelFromType(type),
      position: flowPoint,
      config: step.config,
      targetNodeId: undefined
    })
  }, [reactFlowInstance, addWfNode, addToolNode, addActionNode, actionNodes, updateActionNode])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  return {
    handleNodesChange,
    handleEdgesChange,
    onNodeDragStop,
    handleDrop,
    handleDragOver
  }
}
