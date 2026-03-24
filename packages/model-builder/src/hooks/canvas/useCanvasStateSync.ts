import { useMemo, useEffect, useRef } from 'react'
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
  const lastProcessedSelectionRef = useRef<string | null>(null)

  const {
    nodes: storeNodes,
    relationships: storeRelationships,
    selectNode,
    selectRelationship,
    selectedNode,
    selectedRelationship,
    hideUnconnectedNodes,
    rootNodeId
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

  const {
    nodes: toolNodes,
    edges: toolEdges,
    selectToolNode,
    selectedToolNodeId,
    deleteToolNode
  } = (function() {
    const store = useToolCanvasStore()
    return {
      nodes: store.nodes,
      edges: store.edges,
      selectToolNode: store.selectNode,
      selectedToolNodeId: store.selectedNodeId,
      deleteToolNode: store.deleteNode
    }
  })()

  const {
    nodes: actionNodes,
    edges: actionEdges,
    selectActionNode,
    selectedActionNodeId,
    deleteActionNode,
    updateActionNode,
    addActionNode
  } = (function() {
    const store = useActionCanvasStore()
    return {
      nodes: store.nodes,
      edges: store.edges,
      selectActionNode: store.selectNode,
      selectedActionNodeId: store.selectedNodeId,
      deleteActionNode: store.deleteNode,
      updateActionNode: store.updateNode,
      addActionNode: store.addNode
    }
  })()

  // Convert store nodes to ReactFlow nodes
  const reactFlowNodes: Node[] = useMemo(() => {
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
            onSelect: () => {},
            onDelete: () => handleDeleteNode(node.id)
          }
        }))

      const workflowNodes = wfNodes.map((wn) => ({
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

      const toolNodesFlow = toolNodes.map((tn) => ({
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

      const actionNodesFlow = actionNodes
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

      return [...baseNodes, ...workflowNodes, ...toolNodesFlow, ...actionNodesFlow]
    } catch (e) {
      console.error('[DEBUG] Error calculating reactFlowNodes:', e)
      return []
    }
  }, [storeNodes, visibleNodeIds, stepsByNodeId, handleDeleteNode, wfNodes, selectNode, selectWfNode, selectRelationship, deleteWfNode, selectedNode, selectedWfNodeId, toolNodes, selectedToolNodeId, selectToolNode, deleteToolNode, actionNodes, selectedActionNodeId, selectActionNode, deleteActionNode, updateActionNode, addActionNode, onSwitchTab, rootNodeId])

  // Convert store relationships to ReactFlow edges
  const reactFlowEdges: Edge[] = useMemo(() => {
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
              onSelect: () => {
                if (rel.id === selectedRelationship) return
                isUpdatingSelectionRef.current = true
                selectRelationship(rel.id)
                selectWfNode(null)
                setTimeout(() => { isUpdatingSelectionRef.current = false }, 100)
              },
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
            onSelect: () => {
              if (rel.id === selectedRelationship) return
              isUpdatingSelectionRef.current = true
              selectRelationship(rel.id)
              selectWfNode(null)
              setTimeout(() => { isUpdatingSelectionRef.current = false }, 100)
            },
            onDelete: () => handleDeleteRelationship(rel.id)
          }
        }))
    })()

    const workflowEdges: Edge[] = wfEdges
      .filter((e) => e.source && e.target)
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'default',
        label: '',
        style: { strokeDasharray: '4 4', stroke: '#f59e0b' }
      }))

    const attachEdges: Edge[] = wfNodes
      .filter((n) => n.targetNodeId)
      .map((n) => ({
        id: `${n.id}__attach`,
        source: n.id,
        target: n.targetNodeId as string,
        type: 'default',
        label: '',
        style: { strokeDasharray: '4 4', stroke: '#f59e0b' }
      }))

    const toolEdgesFlow: Edge[] = toolEdges.map((e) => ({
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

    const actionEdgesFlow: Edge[] = actionEdges.map((e) => ({
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

    return [...relEdges, ...workflowEdges, ...attachEdges, ...toolEdgesFlow, ...actionEdgesFlow]
  }, [storeRelationships, selectedRelationship, selectRelationship, handleDeleteRelationship, visibleNodeIds, hideUnconnectedNodes, wfEdges, wfNodes, selectWfNode, toolEdges, actionEdges, handleDeleteEdge])

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges)

  // Signatures for sync
  const reactFlowNodesSig = useMemo(() => {
    return reactFlowNodes
      .map((n) => {
        const data = (n.data as any) || {}
        return `${n.id}:${n.position.x}:${n.position.y}:${data.label || ''}:${data.type || ''}:${data.workflowCount || 0}:${n.type || ''}:${n.selected ? '1' : '0'}:${data.isRoot ? '1' : '0'}:${data._version || ''}:${data.children?.length ?? 0}`
      })
      .sort()
      .join('|')
  }, [reactFlowNodes])

  const currentNodesSig = useMemo(() => {
    return nodes
      .map((n) => {
        const data = (n.data as any) || {}
        return `${n.id}:${n.position.x}:${n.position.y}:${data.label || ''}:${data.type || ''}:${data.workflowCount || 0}:${n.type || ''}:${n.selected ? '1' : '0'}:${data.isRoot ? '1' : '0'}:${data._version || ''}:${data.children?.length ?? 0}`
      })
      .sort()
      .join('|')
  }, [nodes])

  const reactFlowEdgesSig = useMemo(() => {
    return reactFlowEdges
      .map((e) => {
        const data = (e.data as any) || {}
        const marker = e.markerEnd as any
        return `${e.id}:${e.source}:${e.target}:${e.label || ''}:${data.type || ''}:${data.cardinality || ''}:${e.selected ? '1' : '0'}:${marker?.color || ''}`
      })
      .sort()
      .join('|')
  }, [reactFlowEdges])

  const currentEdgesSig = useMemo(() => {
    return edges
      .map((e) => {
        const data = (e.data as any) || {}
        const marker = e.markerEnd as any
        return `${e.id}:${e.source}:${e.target}:${e.label || ''}:${data.type || ''}:${data.cardinality || ''}:${e.selected ? '1' : '0'}:${marker?.color || ''}`
      })
      .sort()
      .join('|')
  }, [edges])

  // Sync effect for nodes
  useEffect(() => {
    if (isDraggingRef.current) return
    if (reactFlowNodesSig === currentNodesSig) return

    isUpdatingSelectionRef.current = true
    setNodes(reactFlowNodes)
    const timer = setTimeout(() => { isUpdatingSelectionRef.current = false }, 150)
    return () => clearTimeout(timer)
  }, [reactFlowNodes, reactFlowNodesSig, currentNodesSig, setNodes])

  // Sync effect for edges
  useEffect(() => {
    if (isDraggingRef.current) return
    const selectedRelationshipChanged = lastProcessedSelectionRef.current !== selectedRelationship

    if (selectedRelationshipChanged) {
      isUpdatingSelectionRef.current = true
      setEdges(reactFlowEdges)
      lastProcessedSelectionRef.current = selectedRelationship
      setTimeout(() => { isUpdatingSelectionRef.current = false }, 150)
      return
    }

    if (reactFlowEdgesSig !== currentEdgesSig) {
      setEdges(reactFlowEdges)
      lastProcessedSelectionRef.current = selectedRelationship
    }
  }, [reactFlowEdges, reactFlowEdgesSig, currentEdgesSig, setEdges, selectedRelationship])

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    isUpdatingSelectionRef,
    isDraggingRef,
    reactFlowNodes,
    reactFlowEdges
  }
}
