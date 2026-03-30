import { useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useWorkflowStore } from '../../stores/workflowStore'
import { useWorkflowCanvasStore } from '../../stores/workflowCanvasStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'
import { useCanvasVisibility } from './useCanvasVisibility'
import { labelFromType } from '../../utils/canvasUtils'
import type { Node as BuilderNode, Relationship } from '../../types'

function calculateStoreNodesSig(nodes: BuilderNode[], visibleNodeIds: Set<string>, wfNodes: any[], toolNodes: any[], actionNodes: any[], rootNodeId: string | null, isWorkflowVisible: boolean) {
  const storePart = nodes
    .filter(n => visibleNodeIds.has(n.id))
    .map(n => `${n.id}:${n.position.x}:${n.position.y}:${n.label}:${n.type}`)
    .sort()
    .join('|')
  
  const extraPart = !isWorkflowVisible ? 'hidden' : [...wfNodes, ...toolNodes, ...actionNodes]
    .map(n => {
      // Include label and a simple version/config marker to trigger re-renders on config/output changes
      const configStr = n.config ? JSON.stringify(n.config).length : '0'
      const outputsStr = n.outputs ? n.outputs.length : '0'
      return `${n.id}:${n.label}:${configStr}:${outputsStr}`
    })
    .sort()
    .join('|')

  return `${storePart}#${extraPart}#${rootNodeId || ''}#${isWorkflowVisible}`
}

function calculateStoreRelationshipsSig(rels: Relationship[], visibleNodeIds: Set<string>, selectedRelId: string | null, wfEdges: any[], toolEdges: any[], actionEdges: any[], isWorkflowVisible: boolean) {
  const storePart = rels
    .filter(r => visibleNodeIds.has(r.from) && visibleNodeIds.has(r.to))
    .map(r => `${r.id}:${r.from}:${r.to}:${r.type}:${r.id === selectedRelId ? '1' : '0'}`)
    .sort()
    .join('|')

  const extraPart = !isWorkflowVisible ? 'hidden' : [...wfEdges, ...toolEdges, ...actionEdges]
    .map(e => e.id)
    .sort()
    .join('|')

  return `${storePart}#${extraPart}#${isWorkflowVisible}`
}

interface UseCanvasStateSyncProps {
  handleDeleteNode: (id: string, type?: 'model' | 'tool' | 'action') => void
  handleDeleteRelationship: (id: string) => void
  handleDeleteEdge: (id: string, type: 'tool' | 'action') => void
  onSwitchTab?: (tab: 'nodes' | 'relationships' | 'tools' | 'actions') => void
}

export function useCanvasStateSync({
  handleDeleteNode,
  handleDeleteRelationship,
  handleDeleteEdge,
  onSwitchTab
}: UseCanvasStateSyncProps) {
  const isUpdatingSelectionRef = useRef(false)
  const isDraggingRef = useRef(false)
  const lastProcessedNodesSigRef = useRef<string | null>(null)
  const lastProcessedEdgesSigRef = useRef<string | null>(null)
  const lastProcessedSelectionRef = useRef<string | null>(null)

  const {
    nodes: storeNodes,
    relationships: storeRelationships,
    selectNode,
    selectRelationship,
    selectedNode,
    selectedRelationship,
    hideUnconnectedNodes,
    rootNodeId,
    isWorkflowVisible
  } = useModelBuilderStore()

  const { visibleNodeIds } = useCanvasVisibility()
  const stepsByNodeId = useWorkflowStore((state) => state.stepsByNodeId)

  const {
    nodes: wfNodes,
    edges: wfEdges,
    selectNode: selectWfNode,
    selectedNodeId: selectedWfNodeId,
    deleteNode: deleteWfNode
  } = useWorkflowCanvasStore()

  const toolStore = useToolCanvasStore()
  const {
    nodes: toolNodes,
    edges: toolEdges,
    selectNode: selectToolNode,
    selectedNodeId: selectedToolNodeId,
    deleteNode: deleteToolNode
  } = toolStore

  const actionStore = useActionCanvasStore()
  const {
    nodes: actionNodes,
    edges: actionEdges,
    selectNode: selectActionNode,
    selectedNodeId: selectedActionNodeId,
    deleteNode: deleteActionNode,
    updateNode: updateActionNode,
    addNode: addActionNode
  } = actionStore

  const handleSelectRelationshipRef = useCallback((id: string) => {
    if (id === selectedRelationship) return
    isUpdatingSelectionRef.current = true
    selectRelationship(id)
    selectWfNode(null)
    setTimeout(() => { isUpdatingSelectionRef.current = false }, 100)
  }, [selectedRelationship, selectRelationship, selectWfNode, isUpdatingSelectionRef])

  // Convert store nodes to ReactFlow nodes
  const dataNodes = useMemo(() => {
    try {
      const baseNodes = storeNodes
        .filter((node: BuilderNode) => visibleNodeIds.has(node.id))
        .map((node: BuilderNode) => ({
          id: node.id,
          type: 'custom',
          position: node.position,
          selected: node.id === selectedNode,
          data: {
            label: node.label,
            type: node.type,
            properties: node.properties,
            workflowCount: (stepsByNodeId[node.id] || []).length,
            isRoot: node.id === rootNodeId,
            onSelect: () => { // Intentionally empty
            },
            onDelete: () => handleDeleteNode(node.id)
          }
        }))

      const workflowNodes = !isWorkflowVisible ? [] : wfNodes.map((wn) => ({
        id: wn.id,
        type: 'workflow',
        position: wn.position,
        selected: wn.id === selectedWfNodeId,
        data: {
          label: wn.label || labelFromType(wn.type),
          type: wn.type,
          targetNodeId: wn.targetNodeId,
          onSelect: () => {
            selectWfNode(wn.id)
            selectNode(null)
            selectRelationship(null)
          },
          onDelete: () => {
            deleteWfNode(wn.id)
            selectWfNode(null)
          }
        }
      }))

      const toolNodesFlow = !isWorkflowVisible ? [] : toolNodes.map((tn) => ({
        id: tn.id,
        type: 'tool',
        position: tn.position,
        selected: tn.id === selectedToolNodeId,
        data: {
          subtitle: labelFromType(tn.type),
          label: tn.label,
          type: tn.type,
          onSelect: () => {
            selectToolNode(tn.id)
            selectNode(null)
            selectRelationship(null)
            selectWfNode(null)
            selectActionNode(null)
          },
          onDelete: () => deleteToolNode(tn.id),
          inputs: tn.inputs,
          outputs: tn.outputs
        }
      }))

      // Collect all action IDs that are children of groups
      const actionsInGroups = new Set<string>()
      actionNodes.forEach(an => {
        if ((an.type === 'action:group' || an.isGroup === true) && an.children && Array.isArray(an.children)) {
          an.children.forEach(childId => {
            if (childId && typeof childId === 'string') {
              actionsInGroups.add(childId)
            }
          })
        }
      })

      const actionNodesFlow = !isWorkflowVisible ? [] : actionNodes
        .filter(an => !actionsInGroups.has(an.id))
        .map((an) => {
          const isGroup = an.type === 'action:group' || an.isGroup === true
          const childActions = an.children?.length ? (an.children
            .map(childId => {
              const child = actionNodes.find(n => n.id === childId)
              return child ? { id: child.id, label: child.label, type: child.type } : null
            })
            .filter(Boolean) as Array<{ id: string; label: string; type: string }>) : undefined

          if (isGroup) {
            const childrenIds = an.children?.join(',') || 'empty'
            const childrenLabels = childActions?.map(c => c.label).join(',') || 'empty'
            const groupVersion = `${an.label || 'Action Group'}-${childrenIds}-${childrenLabels}-${JSON.stringify(an.config)}`
            return {
              id: an.id,
              type: 'actionGroup',
              position: an.position || { x: 0, y: 0 },
              selected: an.id === selectedActionNodeId,
              draggable: true,
              data: {
                label: an.label || 'Action Group',
                type: an.type,
                actionCount: an.children?.length ?? 0,
                isExpanded: an.isExpanded ?? false,
                children: childActions,
                _version: groupVersion,
                onSelect: () => {
                  selectActionNode(an.id)
                  selectNode(null)
                  selectRelationship(null)
                  selectWfNode(null)
                  selectToolNode(null)
                },
                onDelete: () => deleteActionNode(an.id),
                onToggleExpand: () => {
                  updateActionNode(an.id, { isExpanded: !(an.isExpanded ?? false) })
                },
                onAddAction: (actionTypes?: any[]) => {
                  if (!actionTypes || actionTypes.length === 0) return
                  const existingChildren = an.children || []
                  const newActionIds: string[] = []
                  actionTypes.forEach(actionType => {
                    const existingAction = actionNodes.find(a =>
                      existingChildren.includes(a.id) && a.type === actionType
                    )
                    if (existingAction) return
                    const label = labelFromType(actionType)
                    const newActionId = addActionNode({
                      type: actionType,
                      label,
                      config: {},
                      position: { x: 0, y: 0 }
                    })
                    newActionIds.push(newActionId)
                  })
                  if (newActionIds.length > 0) {
                    updateActionNode(an.id, { children: [...existingChildren, ...newActionIds] })
                  }
                },
                onSelectChildAction: (childActionId: string) => {
                  selectActionNode(childActionId)
                  selectNode(null)
                  selectRelationship(null)
                  selectWfNode(null)
                  selectToolNode(null)
                  onSwitchTab?.('actions')
                },
                onRemoveChildAction: (childActionId: string) => {
                  const currentChildren = an.children || []
                  const newChildren = currentChildren.filter(id => id !== childActionId)
                  updateActionNode(an.id, { children: newChildren })
                }
              }
            }
          }

          const actionVersion = `${an.label}-${JSON.stringify(an.config)}`
          return {
            id: an.id,
            type: 'action',
            position: an.position || { x: 0, y: 0 },
            selected: an.id === selectedActionNodeId,
            data: {
              label: an.label,
              type: an.type,
              subtitle: labelFromType(an.type),
              _version: actionVersion,
              onSelect: () => {
                selectActionNode(an.id)
                selectNode(null)
                selectRelationship(null)
                selectWfNode(null)
                selectToolNode(null)
              },
              onDelete: () => deleteActionNode(an.id)
            }
          }
        })

      // 1. Calculate signature from UNTAINTED data (before adding callbacks)
      const sig = calculateStoreNodesSig(storeNodes, visibleNodeIds, wfNodes, toolNodes, actionNodes, rootNodeId, isWorkflowVisible || false)

      // 2. Build the tainted objects with callbacks
      const finalNodes = [...baseNodes, ...workflowNodes, ...toolNodesFlow, ...actionNodesFlow] as Node[]

      return { nodes: finalNodes, sig }
    } catch (e) {
      console.error('[DEBUG] Error calculating rfNodes:', e)
      return { nodes: [], sig: '' }
    }
  }, [storeNodes, visibleNodeIds, stepsByNodeId, handleDeleteNode, wfNodes, selectNode, selectWfNode, selectRelationship, deleteWfNode, selectedNode, selectedWfNodeId, toolNodes, selectedToolNodeId, selectToolNode, deleteToolNode, actionNodes, selectedActionNodeId, selectActionNode, deleteActionNode, updateActionNode, addActionNode, onSwitchTab, rootNodeId, isWorkflowVisible])

  const rfNodes = dataNodes.nodes
  const reactFlowNodesSig = dataNodes.sig

  // Convert store relationships to ReactFlow edges
  const dataEdges = useMemo(() => {
    const relEdges: Edge[] = (() => {
      if (!storeRelationships || storeRelationships.length === 0) {
        return []
      }
      if (hideUnconnectedNodes && selectedRelationship) {
        const rel = storeRelationships.find((r: Relationship) => r.id === selectedRelationship)
        if (rel) {
          return [{
            id: rel.id,
            source: rel.from,
            target: rel.to,
            type: 'custom',
            label: rel.type || '',
            selected: true,
            interactive: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#3b82f6'
            },
            data: {
              type: rel.type,
              cardinality: rel.cardinality,
              onSelect: () => handleSelectRelationshipRef(rel.id),
              onDelete: () => handleDeleteRelationship(rel.id)
            }
          }]
        }
      }
      return storeRelationships
        .filter((rel: Relationship) => visibleNodeIds.has(rel.from) && visibleNodeIds.has(rel.to))
        .map((rel: Relationship) => ({
          id: rel.id,
          source: rel.from,
          target: rel.to,
          type: 'custom',
          label: rel.type || '',
          selected: rel.id === selectedRelationship,
          interactive: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: rel.id === selectedRelationship ? '#3b82f6' : '#94a3b8'
          },
          data: {
            type: rel.type,
            cardinality: rel.cardinality,
            onSelect: () => handleSelectRelationshipRef(rel.id),
            onDelete: () => handleDeleteRelationship(rel.id)
          }
        }))
    })()

    const workflowEdges: Edge[] = !isWorkflowVisible ? [] : wfEdges
      .filter((e) => e.source && e.target)
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'default',
        label: '',
        style: { strokeDasharray: '4 4', stroke: '#f59e0b' }
      }))

    const attachEdges: Edge[] = !isWorkflowVisible ? [] : wfNodes
      .filter((n) => n.targetNodeId)
      .map((n) => ({
        id: `${n.id}__attach`,
        source: n.id,
        target: n.targetNodeId as string,
        type: 'default',
        label: '',
        style: { strokeDasharray: '4 4', stroke: '#f59e0b' }
      }))

    const toolEdgesFlow: Edge[] = !isWorkflowVisible ? [] : toolEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'toolAction',
      label: '',
      style: { strokeDasharray: '5 5', stroke: '#f59e0b', strokeWidth: 2 },
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      interactive: true,
      data: {
        onDelete: () => handleDeleteEdge(e.id, 'tool')
      }
    }))

    const actionEdgesFlow: Edge[] = !isWorkflowVisible ? [] : actionEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'toolAction',
      label: '',
      style: { strokeDasharray: '3 3', stroke: '#10b981', strokeWidth: 2 },
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      interactive: true,
      data: {
        onDelete: () => handleDeleteEdge(e.id, 'action')
      }
    }))

    // 1. Calculate signature from UNTAINTED data (before adding callbacks)
    const sig = calculateStoreRelationshipsSig(storeRelationships, visibleNodeIds, selectedRelationship, wfEdges, toolEdges, actionEdges, isWorkflowVisible || false)

    // 2. Build the tainted objects with callbacks
    const finalEdges = [...relEdges, ...workflowEdges, ...attachEdges, ...toolEdgesFlow, ...actionEdgesFlow] as Edge[]

    return { edges: finalEdges, sig }
  }, [storeRelationships, selectedRelationship, handleSelectRelationshipRef, handleDeleteRelationship, visibleNodeIds, hideUnconnectedNodes, wfEdges, wfNodes, toolEdges, actionEdges, handleDeleteEdge, isWorkflowVisible])

  const rfEdges = dataEdges.edges
  const reactFlowEdgesSig = dataEdges.sig

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges)

  // Sync effect for nodes
  useEffect(() => {
    if (isDraggingRef.current) return
    if (reactFlowNodesSig === lastProcessedNodesSigRef.current) return

    isUpdatingSelectionRef.current = true
    setNodes(rfNodes)
    lastProcessedNodesSigRef.current = reactFlowNodesSig
    const timer = setTimeout(() => { isUpdatingSelectionRef.current = false }, 150)
    return () => clearTimeout(timer)
  }, [rfNodes, reactFlowNodesSig, setNodes])

  // Sync effect for edges
  useEffect(() => {
    if (isDraggingRef.current) return
    const sigMatches = reactFlowEdgesSig === lastProcessedEdgesSigRef.current
    const selectedRelationshipChanged = lastProcessedSelectionRef.current !== selectedRelationship

    if (selectedRelationshipChanged) {
      isUpdatingSelectionRef.current = true
      setEdges(rfEdges)
      lastProcessedSelectionRef.current = selectedRelationship
      lastProcessedEdgesSigRef.current = reactFlowEdgesSig
      setTimeout(() => { isUpdatingSelectionRef.current = false }, 150)
      return
    }

    if (!sigMatches) {
      setEdges(rfEdges)
      lastProcessedEdgesSigRef.current = reactFlowEdgesSig
    }
  }, [rfEdges, reactFlowEdgesSig, setEdges, selectedRelationship])

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    isUpdatingSelectionRef,
    isDraggingRef,
    rfNodes,
    rfEdges
  }
}
