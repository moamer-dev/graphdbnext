import { useCallback } from 'react'
import { Node, Edge } from 'reactflow'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useWorkflowCanvasStore } from '../../stores/workflowCanvasStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'
import {
  isMainNodeId,
  isWorkflowNodeId,
  isToolNodeId,
  isActionNodeId
} from '../../utils/canvasUtils'

interface UseCanvasSelectionProps {
  isUpdatingSelectionRef: React.MutableRefObject<boolean>
  onSwitchTab?: (tab: 'nodes' | 'relationships' | 'tools' | 'actions') => void
}

export function useCanvasSelection({
  isUpdatingSelectionRef,
  onSwitchTab
}: UseCanvasSelectionProps) {
  const {
    selectNode,
    selectRelationship,
    selectedNode,
    selectedRelationship,
    relationships: storeRelationships
  } = useModelBuilderStore()

  const { selectNode: selectWfNode, selectedNodeId: selectedWfNodeId } = useWorkflowCanvasStore()
  const { selectNode: selectToolNode, selectedNodeId: selectedToolNodeId } = useToolCanvasStore()
  const { selectNode: selectActionNode, selectedNodeId: selectedActionNodeId } = useActionCanvasStore()

  const onNodeClick = useCallback((_e: React.MouseEvent, node: Node) => {
    const isWf = isWorkflowNodeId(node.id)
    const isTool = isToolNodeId(node.id)
    const isAction = isActionNodeId(node.id)
    const isMain = isMainNodeId(node.id)

    // Ignore if already selected
    if (isMain && node.id === selectedNode) return
    if (isWf && node.id === selectedWfNodeId) return
    if (isTool && node.id === selectedToolNodeId) return
    if (isAction && node.id === selectedActionNodeId) return

    // Mark that we're programmatically updating selection
    isUpdatingSelectionRef.current = true

    if (isTool) {
      selectToolNode(node.id)
      selectNode(null)
      selectRelationship(null)
      selectWfNode(null)
      selectActionNode(null)
      onSwitchTab?.('tools')
    } else if (isAction) {
      selectActionNode(node.id)
      selectNode(null)
      selectRelationship(null)
      selectWfNode(null)
      selectToolNode(null)
      onSwitchTab?.('actions')
    } else if (isWf) {
      selectWfNode(node.id)
      selectNode(null)
      selectRelationship(null)
      selectToolNode(null)
      selectActionNode(null)
    } else {
      selectNode(node.id)
      selectWfNode(null)
      selectRelationship(null)
      selectToolNode(null)
      selectActionNode(null)
      onSwitchTab?.('nodes')
    }

    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingSelectionRef.current = false
    }, 100)
  }, [selectNode, selectWfNode, selectRelationship, selectToolNode, selectActionNode, selectedNode, selectedWfNodeId, selectedToolNodeId, selectedActionNodeId, onSwitchTab, isUpdatingSelectionRef])

  const onEdgeClick = useCallback((_e: React.MouseEvent, edge: Edge) => {
    if (edge.id.includes('__attach') || edge.id.startsWith('wfn_')) {
      return
    }

    const isRelationshipEdge = storeRelationships.some((r) => r.id === edge.id)
    if (isRelationshipEdge) {
      if (edge.id === selectedRelationship) return
      
      isUpdatingSelectionRef.current = true
      selectRelationship(edge.id)
      selectWfNode(null)
      onSwitchTab?.('relationships')
      setTimeout(() => {
        isUpdatingSelectionRef.current = false
      }, 100)
    }
  }, [selectRelationship, selectWfNode, selectedRelationship, storeRelationships, onSwitchTab, isUpdatingSelectionRef])

  const onPaneClick = useCallback(() => {
    isUpdatingSelectionRef.current = true
    selectRelationship(null)
    selectNode(null)
    selectWfNode(null)
    setTimeout(() => {
      isUpdatingSelectionRef.current = false
    }, 100)
  }, [selectRelationship, selectNode, selectWfNode, isUpdatingSelectionRef])

  const onSelectionChange = useCallback((params: { nodes: Node[], edges: Edge[] }) => {
    if (isUpdatingSelectionRef.current) return

    const firstEdge = params.edges[0]
    if (firstEdge) {
      const isRelationshipEdge = !firstEdge.id.includes('__attach') &&
        !firstEdge.id.startsWith('wfn_') &&
        storeRelationships.some((r) => r.id === firstEdge.id)
      
      const shouldProcessEdge = isRelationshipEdge && (firstEdge.id === selectedRelationship || !selectedNode)
      
      if (shouldProcessEdge && firstEdge.id !== selectedRelationship) {
        isUpdatingSelectionRef.current = true
        selectRelationship(firstEdge.id)
        selectWfNode(null)
        onSwitchTab?.('relationships')
        setTimeout(() => { isUpdatingSelectionRef.current = false }, 100)
        return
      }
    }

    const firstNode = params.nodes[0]
    if (firstNode && !firstEdge) {
      if (selectedRelationship && !params.edges.length) return
      
      if (!isWorkflowNodeId(firstNode.id) && firstNode.id === selectedNode) return
      if (isWorkflowNodeId(firstNode.id) && firstNode.id === selectedWfNodeId) return

      isUpdatingSelectionRef.current = true
      if (isWorkflowNodeId(firstNode.id)) {
        selectWfNode(firstNode.id)
        selectNode(null)
        selectRelationship(null)
      } else {
        selectNode(firstNode.id)
        selectWfNode(null)
        selectRelationship(null)
        onSwitchTab?.('nodes')
      }
      setTimeout(() => { isUpdatingSelectionRef.current = false }, 100)
    }
  }, [selectNode, selectRelationship, selectWfNode, selectedNode, selectedWfNodeId, selectedRelationship, storeRelationships, onSwitchTab, isUpdatingSelectionRef])

  return {
    onNodeClick,
    onEdgeClick,
    onPaneClick,
    onSelectionChange
  }
}
