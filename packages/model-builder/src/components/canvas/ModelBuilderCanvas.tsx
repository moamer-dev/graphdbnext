'use client'

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react'
import { useCanvasNodeManagement, useCanvasEdgeManagement, useCanvasVisibility } from '../../hooks'
import ReactFlow, {
  Background,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  MarkerType,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  type NodeChange,
  type EdgeChange,
  Handle,
  Position,
  BackgroundVariant
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { CustomNode } from '../nodes/CustomNode'
import { CustomEdge } from './CustomEdge'
import { ToolActionEdge } from '../dialogs/ToolActionEdge'
import { ToolNode } from '../nodes/ToolNode'
import { ActionNode } from '../nodes/ActionNode'
import { ActionGroupNode } from '../nodes/ActionGroupNode'
import { CanvasToolbar } from './CanvasToolbar'
import { ConfirmDialog } from '../dialogs/ConfirmDialog'
import { EnhancedMiniMap } from './EnhancedMiniMap'
import type { Node as BuilderNode, Relationship } from '../../types'
import { useWorkflowStore } from '../../stores/workflowStore'
import { useWorkflowCanvasStore } from '../../stores/workflowCanvasStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'

interface WorkflowBlockProps {
  data: {
    label: string
    type: string
    onSelect?: () => void
    onDelete?: () => void
  }
  selected?: boolean
}

const WorkflowBlock = ({ data, selected }: WorkflowBlockProps) => (
  <div
    className={`px-2 py-1 rounded border shadow-sm text-[11px] bg-amber-50 border-amber-200 ${selected ? 'border-amber-500' : ''}`}
    onClick={() => {
      // Don't stop propagation - let ReactFlow handle the click
      // This allows onNodeClick to properly identify and select workflow/tool nodes
      console.log('[wf-node] click', data)
    }}
  >
    <div className="flex items-center gap-1">
      <div className="font-semibold truncate flex-1">{data.label}</div>
      <button
        className="text-red-500 text-[10px]"
        onClick={(e) => {
          e.stopPropagation()
          console.log('[wf-node] delete', data)
          data.onDelete?.()
        }}
        title="Delete workflow block"
      >
        ×
      </button>
    </div>
    <div className="text-[10px] text-amber-700 truncate">{data.type}</div>
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
  </div>
)

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  workflow: WorkflowBlock,
  tool: ToolNode,
  action: ActionNode,
  actionGroup: ActionGroupNode
}

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
  toolAction: ToolActionEdge
}

const labelFromType = (type: string) => {
  if (type === 'tool:if') return 'If / Else'
  if (type === 'tool:switch') return 'Switch'
  if (type === 'tool:loop') return 'Loop'
  if (type === 'tool:merge') return 'Merge'
  if (type === 'tool:filter') return 'Filter'
  if (type === 'tool:delay') return 'Delay'
  if (type === 'tool:transform') return 'Transform'
  if (type === 'tool:lookup') return 'Lookup'
  if (type === 'tool:traverse') return 'Traverse'
  if (type === 'tool:aggregate') return 'Aggregate'
  if (type === 'tool:sort') return 'Sort'
  if (type === 'tool:limit') return 'Limit'
  if (type === 'tool:collect') return 'Collect'
  if (type === 'tool:split') return 'Split'
  if (type === 'tool:validate') return 'Validate'
  if (type === 'tool:map') return 'Map'
  if (type === 'tool:reduce') return 'Reduce'
  if (type === 'tool:partition') return 'Partition'
  if (type === 'tool:distinct') return 'Distinct'
  if (type === 'tool:window') return 'Window'
  if (type === 'tool:join') return 'Join'
  if (type === 'tool:union') return 'Union'
  if (type === 'tool:intersect') return 'Intersect'
  if (type === 'tool:diff') return 'Diff'
  if (type === 'tool:exists') return 'Exists'
  if (type === 'tool:range') return 'Range'
  if (type === 'tool:batch') return 'Batch'
  if (type === 'tool:fetch-api') return 'Fetch API'
  if (type === 'tool:fetch-orcid') return 'Fetch ORCID'
  if (type === 'tool:fetch-geonames') return 'Fetch GeoNames'
  if (type === 'tool:fetch-europeana') return 'Fetch Europeana'
  if (type === 'tool:fetch-getty') return 'Fetch Getty'
  if (type === 'tool:http') return 'HTTP Request'
  if (type === 'action:group') return 'Action Group'
  if (type === 'action:create-node') return 'Create Node'
  if (type === 'action:create-relationship') return 'Create Relationship'
  if (type === 'action:set-property') return 'Set Property'
  if (type === 'action:skip') return 'Skip'
  if (type === 'action:create-node-text') return 'Create Node (Text)'
  if (type === 'action:create-node-tokens') return 'Create Node (Tokens)'
  if (type === 'action:create-text-node') return 'Create Text Node'
  if (type === 'action:create-token-nodes') return 'Create Token Nodes'
  if (type === 'action:create-node-with-attributes') return 'Create Node (Attributes)'
  if (type === 'action:create-node-complete') return 'Create Node Complete'
  if (type === 'action:extract-and-normalize-attributes') return 'Extract & Normalize Attributes'
  if (type === 'action:create-annotation-nodes') return 'Create Annotation Nodes'
  if (type === 'action:create-reference-chain') return 'Create Reference Chain'
  if (type === 'action:merge-children-text') return 'Merge Children Text'
  if (type === 'action:create-conditional-node') return 'Create Conditional Node'
  if (type === 'action:extract-and-compute-property') return 'Extract & Compute Property'
  if (type === 'action:create-node-with-filtered-children') return 'Create Node (Filtered Children)'
  if (type === 'action:normalize-and-deduplicate') return 'Normalize & Deduplicate'
  if (type === 'action:create-hierarchical-nodes') return 'Create Hierarchical Nodes'
  return type
}

interface ModelBuilderCanvasProps {
  className?: string
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
  onRegisterFocusApi?: (fn: (id: string) => void) => void
  onRegisterFocusRelationshipApi?: (fn: (fromId: string, toId: string) => void) => void
  onSwitchTab?: (tab: 'nodes' | 'relationships' | 'tools' | 'actions') => void
}

function ModelBuilderCanvasInner ({ className, sidebarOpen = true, onToggleSidebar, onRegisterFocusApi, onRegisterFocusRelationshipApi, onSwitchTab }: ModelBuilderCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const isUpdatingSelectionRef = useRef(false)
  const [showGrid, setShowGrid] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  
  const nodeManagement = useCanvasNodeManagement()
  const edgeManagement = useCanvasEdgeManagement()
  const { visibleNodeIds } = useCanvasVisibility()
  const {
    nodes: storeNodes,
    relationships: storeRelationships,
    addRelationship,
    selectNode,
    selectRelationship,
    setNodePosition,
    deleteNode,
    deleteRelationship,
    selectedNode,
    selectedRelationship,
    hideUnconnectedNodes,
    rootNodeId
  } = useModelBuilderStore()
  const addWorkflowStep = useWorkflowStore((state) => state.addStep)
  const stepsByNodeId = useWorkflowStore((state) => state.stepsByNodeId)
  const {
    nodes: wfNodes,
    edges: wfEdges,
    addNode: addWfNode,
    addEdge: addWfEdge,
    updateNode: updateWfNode,
    selectNode: selectWfNode,
    selectedNodeId: selectedWfNodeId,
    deleteNode: deleteWfNode
  } = useWorkflowCanvasStore()
  const {
    nodes: toolNodes,
    edges: toolEdges,
    addNode: addToolNode,
    addEdge: addToolEdge,
    deleteEdge: deleteToolEdge,
    updateNode: updateToolNode,
    deleteNode: deleteToolNode,
    selectNode: selectToolNode,
    selectedNodeId: selectedToolNodeId
  } = useToolCanvasStore()
  const {
    nodes: actionNodes,
    edges: actionEdges,
    addNode: addActionNode,
    addEdge: addActionEdge,
    deleteEdge: deleteActionEdge,
    updateNode: updateActionNode,
    deleteNode: deleteActionNode,
    selectNode: selectActionNode,
    selectedNodeId: selectedActionNodeId
  } = useActionCanvasStore()
  const reactFlowInstance = useReactFlow()

  const handleDeleteNode = nodeManagement.handleDeleteNode
  const handleConfirmDeleteNode = nodeManagement.handleConfirmDeleteNode
  const handleDeleteRelationship = edgeManagement.handleDeleteRelationship
  const handleConfirmDeleteRelationship = edgeManagement.handleConfirmDeleteRelationship
  const handleDeleteEdge = edgeManagement.handleDeleteEdge
  const handleConfirmDeleteEdge = edgeManagement.handleConfirmDeleteEdge

  // Convert store nodes to ReactFlow nodes
  const reactFlowNodes: Node[] = useMemo(() => {
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
          onSelect: () => {
            // No-op - selection is handled by ReactFlow's onNodeClick
            // This prevents double-selection calls
          },
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
          console.log('[wf-node] select', wn.id)
          selectWfNode(wn.id)
          selectNode(null)
          selectRelationship(null)
        },
        onDelete: () => {
          console.log('[wf-node] delete', wn.id)
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
      .filter(an => {
        // Exclude actions that are children of groups
        const isInGroup = actionsInGroups.has(an.id)
        if (isInGroup) {
          return false
        }
        return true
      })
      .map((an) => {
        const isGroup = an.type === 'action:group' || an.isGroup === true
        // Create a fresh array reference to ensure ReactFlow detects changes
        const childActions = an.children?.length ? an.children.map(childId => {
          const child = actionNodes.find(n => n.id === childId)
          return child ? { id: child.id, label: child.label, type: child.type } : null
        }).filter(Boolean) as Array<{ id: string; label: string; type: string }> | undefined : undefined

      if (isGroup) {
        // Create a version key based on label, children IDs, child labels, and config to force ReactFlow to update
        // Include child labels so updates to child action labels trigger a re-render
        const childrenIds = an.children?.join(',') || 'empty'
        const childrenLabels = childActions?.map(c => c.label).join(',') || 'empty'
        const groupVersion = `${an.label || 'Action Group'}-${childrenIds}-${childrenLabels}-${JSON.stringify(an.config)}`
        return {
          id: an.id,
          type: 'actionGroup',
          position: an.position,
          selected: an.id === selectedActionNodeId,
          draggable: true, // Allow dragging the group node
          data: {
            label: an.label || 'Action Group',
            type: an.type,
            actionCount: an.children?.length ?? 0,
            isExpanded: an.isExpanded ?? false,
            children: childActions,
            _version: groupVersion, // Force ReactFlow to detect changes when label, children, or config changes
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
            onAddAction: (actionTypes?: import('../../stores/actionCanvasStore').ActionNodeType[]) => {
              if (!actionTypes || actionTypes.length === 0) return
              
              console.log('[DEBUG] onAddAction called:', { groupId: an.id, groupLabel: an.label, actionTypes, currentChildren: an.children })
              
              const existingChildren = an.children || []
              const newActionIds: string[] = []
              
              actionTypes.forEach((actionType: import('../../stores/actionCanvasStore').ActionNodeType) => {
                // Check if an action of this type already exists in the group
                const existingAction = actionNodes.find(a => 
                  existingChildren.includes(a.id) && a.type === actionType
                )
                
                if (existingAction) {
                  return // Skip adding duplicate
                }
                
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
                const updatedChildren = [...existingChildren, ...newActionIds]
                updateActionNode(an.id, {
                  children: updatedChildren
                })
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
              updateActionNode(an.id, {
                children: newChildren
              })
              // Optionally delete the action node itself if it's not used elsewhere
              // For now, we'll just remove it from the group
            },
            onMoveActionUp: (actionId: string) => {
              const currentChildren = an.children || []
              const index = currentChildren.indexOf(actionId)
              if (index <= 0) return // Already at top or not found
              
              const newChildren = [...currentChildren]
              const [removed] = newChildren.splice(index, 1)
              newChildren.splice(index - 1, 0, removed)
              
              updateActionNode(an.id, {
                children: newChildren
              })
            },
            onMoveActionDown: (actionId: string) => {
              const currentChildren = an.children || []
              const index = currentChildren.indexOf(actionId)
              if (index === -1 || index >= currentChildren.length - 1) return // Already at bottom or not found
              
              const newChildren = [...currentChildren]
              const [removed] = newChildren.splice(index, 1)
              newChildren.splice(index + 1, 0, removed)
              
              updateActionNode(an.id, {
                children: newChildren
              })
            }
          }
        }
      }

        // Create a version string based on label and config to force ReactFlow updates
        const actionVersion = `${an.label}-${JSON.stringify(an.config)}`
        
        return {
          id: an.id,
          type: 'action',
          position: an.position,
          selected: an.id === selectedActionNodeId,
          data: {
            label: an.label,
            type: an.type,
            subtitle: labelFromType(an.type),
            _version: actionVersion, // Force ReactFlow to detect changes when label or config changes
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

    const allNodes = [...baseNodes, ...workflowNodes, ...toolNodesFlow, ...actionNodesFlow]
    
    return allNodes
    }, [storeNodes, visibleNodeIds, stepsByNodeId, handleDeleteNode, wfNodes, selectNode, selectWfNode, selectRelationship, deleteWfNode, selectedNode, selectedWfNodeId, toolNodes, selectedToolNodeId, selectToolNode, deleteToolNode, actionNodes, selectedActionNodeId, selectActionNode, deleteActionNode, updateActionNode, addActionNode, onSwitchTab, rootNodeId])

  // Convert store relationships to ReactFlow edges (only show edges between visible nodes)
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
                // selectRelationship already clears selectedNode
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
              // Use the same mechanism as onEdgeClick
              if (rel.id === selectedRelationship) return
              isUpdatingSelectionRef.current = true
              selectRelationship(rel.id)
              // selectRelationship already clears selectedNode
              selectWfNode(null)
              setTimeout(() => { isUpdatingSelectionRef.current = false }, 100)
            },
            onDelete: () => deleteRelationship(rel.id)
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

    // Connect workflow nodes to their target model node if not already wired
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
  }, [storeRelationships, selectedRelationship, selectRelationship, handleDeleteRelationship, deleteRelationship, visibleNodeIds, hideUnconnectedNodes, wfEdges, wfNodes, selectWfNode, toolEdges, actionEdges, handleDeleteEdge])

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges)

  // Filter edges to prevent multiple connections from if/else tools to action groups
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes)
    
    // After edges change, check for and remove invalid connections
    // (if/else tool to action group should only have one connection)
    setEdges((currentEdges) => {
      const ifElseToolIds = new Set(
        toolNodes
          .filter(t => t.type === 'tool:if')
          .map(t => t.id)
      )
      const actionGroupIds = new Set(
        actionNodes
          .filter(a => a.type === 'action:group' || a.isGroup)
          .map(a => a.id)
      )
      
      // Group edges by (source, target) for if/else -> action group connections
      const edgeGroups = new Map<string, Edge[]>()
      
      currentEdges.forEach(edge => {
        if (ifElseToolIds.has(edge.source) && actionGroupIds.has(edge.target)) {
          const key = `${edge.source}->${edge.target}`
          if (!edgeGroups.has(key)) {
            edgeGroups.set(key, [])
          }
          edgeGroups.get(key)!.push(edge)
        }
      })
      
      // For each group, if there are multiple edges, keep only the most recent one
      // Check which edge was just added in the changes
      const addedEdgeIds = new Set(
        changes
          .filter(change => change.type === 'add')
          .map(change => (change as { type: 'add'; item: Edge }).item.id)
      )
      
      const edgesToRemove = new Set<string>()
      edgeGroups.forEach((groupEdges) => {
        if (groupEdges.length > 1) {
          // Find the edge that was just added (most recent)
          const newlyAddedEdge = groupEdges.find(e => addedEdgeIds.has(e.id))
          const edgeToKeep = newlyAddedEdge || groupEdges[groupEdges.length - 1] // Fallback to last one
          
          groupEdges.forEach(edge => {
            if (edge.id !== edgeToKeep.id) {
              edgesToRemove.add(edge.id)
              // Also remove from store if it's an action edge
              const storeEdge = actionEdges.find(e => 
                e.source === edge.source && 
                e.target === edge.target &&
                e.sourceHandle === edge.sourceHandle
              )
              if (storeEdge) {
                deleteActionEdge(storeEdge.id)
              }
            }
          })
        }
      })
      
      if (edgesToRemove.size > 0) {
        return currentEdges.filter(e => !edgesToRemove.has(e.id))
      }
      return currentEdges
    })
  }, [onEdgesChange, setEdges, toolNodes, actionNodes, actionEdges, deleteActionEdge])

  // Handle ReactFlow node changes, but filter out removals (we handle those through store)
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    // ignore select changes to avoid loops; handle selection via explicit click handlers
    const filteredChanges = changes.filter((change) => change.type !== 'remove' && change.type !== 'select')
    onNodesChange(filteredChanges)

    filteredChanges.forEach((change) => {
      if (change.type === 'position') {
        if (change.dragging) {
          isDraggingRef.current = true
        } else {
          isDraggingRef.current = false
        }
        if (change.dragging === false && change.position && change.id) {
          // Apply snap to grid if enabled
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
  }, [onNodesChange, setNodePosition, updateWfNode, updateToolNode, updateActionNode, snapToGrid])

  // Sync ReactFlow nodes with store

  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.id.startsWith('wfn_')) {
      updateWfNode(node.id, { position: node.position })
      return
    }
    if (node.id.startsWith('tool_')) {
      updateToolNode(node.id, { position: node.position })
      return
    }
    if (node.id.startsWith('action_')) {
      updateActionNode(node.id, { position: node.position })
      return
    }
    setNodePosition(node.id, node.position)
  }, [setNodePosition, updateWfNode, updateToolNode, updateActionNode])

  // Helper function to map drag type to workflow step
  const mapDragTypeToStep = (type: string): Omit<import('../../stores/workflowStore').WorkflowStep, 'id'> | null => {
    if (type === 'tool:if' || type === 'tool:switch' || type === 'tool:loop' || type === 'tool:filter') {
      return { kind: 'condition', type: 'has-children', guard: 'always', config: {} }
    }
    if (type === 'action:create-node') {
      return { kind: 'action', type: 'create-node', guard: 'always', config: { parentRelationship: 'contains' } }
    }
    if (type === 'action:create-relationship') {
      return { kind: 'action', type: 'create-relationship', guard: 'always', config: { relationshipType: 'relatedTo' } }
    }
    if (type === 'action:set-property') {
      return { kind: 'action', type: 'set-property', guard: 'always', config: { propertyKey: '', value: '' } }
    }
    if (type === 'action:skip') {
      return { kind: 'action', type: 'skip', guard: 'always', config: {} }
    }
    if (type === 'action:create-node-text') {
      return { kind: 'action', type: 'create-node-text', guard: 'always', config: {} }
    }
    if (type === 'action:create-node-tokens') {
      return { kind: 'action', type: 'create-node-tokens', guard: 'always', config: {} }
    }
    return null
  }

  // Helper functions to identify node types
  const isWorkflowNodeId = (id?: string) => Boolean(id && id.startsWith('wfn_'))
  const isToolNodeId = (id?: string) => Boolean(id && id.startsWith('tool_'))
  const isActionNodeId = (id?: string) => Boolean(id && id.startsWith('action_'))
  const isActionGroupNodeId = (id?: string) => {
    if (!id || !id.startsWith('action_')) {
      return false
    }
    const actionNode = actionNodes.find(n => n.id === id)
    return actionNode?.type === 'action:group' || actionNode?.isGroup === true
  }
  const isMainNodeId = (id?: string) => Boolean(id && !id.startsWith('wfn_') && !id.startsWith('tool_') && !id.startsWith('action_'))

  // Connection validation
  const isValidConnection = useCallback((connection: Connection): boolean => {
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
      return false
    }

    const sourceIsMain = isMainNodeId(connection.source)
    const targetIsMain = isMainNodeId(connection.target)
    const sourceIsTool = isToolNodeId(connection.source)
    const targetIsTool = isToolNodeId(connection.target)
    const sourceIsAction = isActionNodeId(connection.source)
    const targetIsAction = isActionNodeId(connection.target)
    const targetIsActionGroup = isActionGroupNodeId(connection.target)

    // Main node to Main node - only via relation handles
    if (sourceIsMain && targetIsMain) {
      return connection.sourceHandle === 'relation-out' && connection.targetHandle === 'relation-in'
    }

    // Main node Tools point to Tool input (tool groups are not connectable)
    if (sourceIsMain && targetIsTool) {
      return connection.sourceHandle === 'tools' && connection.targetHandle?.startsWith('input')
    }

    // Tool output to Action Group input - CHECK THIS FIRST before regular actions
    // because action groups also match isActionNodeId
    if (sourceIsTool && targetIsActionGroup) {
      if (connection.targetHandle !== 'input') {
        return false
      }
      
      const sourceTool = toolNodes.find(t => t.id === connection.source)
      
      // For if/else tools, ensure only one connection to the same action group
      if (sourceTool?.type === 'tool:if') {
        const validIfElseHandles = ['true', 'false']
        if (connection.sourceHandle && !validIfElseHandles.includes(connection.sourceHandle)) {
          return false
        }
        
        // Check if there's already ANY connection from this tool to this action group
        // Check both store edges and ReactFlow edges to catch any pending connections
        const existingStoreEdge = actionEdges.find(e => 
          e.source === connection.source && 
          e.target === connection.target
        )
        
        // Check ReactFlow edges for any connection from same source to same target
        const existingReactFlowEdge = edges.find(e => 
          e.source === connection.source && 
          e.target === connection.target
        )
        
        // For if/else tools, REJECT if there's ANY existing connection (regardless of handle)
        // This prevents connecting to both true and false outputs simultaneously
        if (existingStoreEdge || existingReactFlowEdge) {
          return false
        }
      }
      
      return true
    }

    // Tool output to Action input (non-group actions)
    // This must come AFTER the action group check
    const targetIsRegularAction = targetIsAction && !targetIsActionGroup
    if (sourceIsTool && targetIsRegularAction) {
      return connection.targetHandle === 'input'
    }

    // Tool groups are not connectable - connections go to individual tools inside groups

    // Tool output to Tool input (tool chaining)
    if (sourceIsTool && targetIsTool) {
      return connection.targetHandle?.startsWith('input')
    }

    // All other connections are invalid
    return false
  }, [toolNodes, actionEdges, edges])

  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return

    // Validate connection
    if (!isValidConnection(params)) {
      return
    }

    const sourceIsMain = isMainNodeId(params.source)
    const targetIsMain = isMainNodeId(params.target)
    const sourceIsTool = isToolNodeId(params.source)
    const targetIsTool = isToolNodeId(params.target)
    const targetIsActionGroup = isActionGroupNodeId(params.target)
    const sourceIsWf = isWorkflowNodeId(params.source)
    const targetIsWf = isWorkflowNodeId(params.target)

    // Main node to Main node (relationship)
    if (sourceIsMain && targetIsMain) {
      addRelationship({
        type: 'RELATES_TO',
        from: params.source,
        to: params.target
      })
      return
    }

    // Main node Tools point to Tool input (tool groups are not connectable)
    if (sourceIsMain && targetIsTool) {
      const toolNode = toolNodes.find((n) => n.id === params.target)
      if (toolNode) {
        updateToolNode(params.target, { targetNodeId: params.source })
        addToolEdge({
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle || undefined,
          targetHandle: params.targetHandle || undefined
        })
      }
      return
    }

    // Tool output to Action input (non-group actions)
    // This must come AFTER the action group check
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

    // Tool output to Action Group input
    if (sourceIsTool && targetIsActionGroup) {
      const sourceTool = toolNodes.find(t => t.id === params.source)
      const isIfElseTool = sourceTool?.type === 'tool:if'
      
      // For if/else tools, ensure only one connection to the action group
      // Remove ANY existing connection from the same tool to the same action group
      if (isIfElseTool) {
        // Remove from store first
        const existingStoreEdges = actionEdges.filter(e => 
          e.source === params.source && 
          e.target === params.target
        )
        existingStoreEdges.forEach(edge => {
          deleteActionEdge(edge.id)
        })
        
        // Also remove from ReactFlow edges state if present
        const existingReactFlowEdges = edges.filter(e => 
          e.source === params.source && 
          e.target === params.target
        )
        if (existingReactFlowEdges.length > 0) {
          const updatedEdges = edges.filter(e => 
            !(e.source === params.source && e.target === params.target)
          )
          setEdges(updatedEdges)
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

    // Tool output to Tool input (tool chaining)
    if (sourceIsTool && targetIsTool) {
      addToolEdge({
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle || undefined,
        targetHandle: params.targetHandle || undefined
      })
      return
    }

    // Legacy workflow connections (for backward compatibility)
    if (sourceIsWf && targetIsWf) {
      console.log('[workflow-connect] ignored workflow-to-workflow link')
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
      if (step) {
        addWorkflowStep(modelId, step)
      }
    }
  }, [addRelationship, addWfEdge, wfNodes, updateWfNode, addWorkflowStep, toolNodes, updateToolNode, addToolEdge, addActionEdge, deleteActionEdge, actionEdges, edges, setEdges, isValidConnection, isActionGroupNodeId])

  // Handle canvas click to deselect
  const onPaneClick = useCallback(() => {
    isUpdatingSelectionRef.current = true
    selectRelationship(null)
    selectNode(null)
    selectWfNode(null)
    setTimeout(() => {
      isUpdatingSelectionRef.current = false
    }, 100)
  }, [selectRelationship, selectNode, selectWfNode])

  // Sync ReactFlow nodes/edges with store (no selection flags on nodes)
  // Sync ReactFlow nodes/edges from store once per change; avoid loops
  const sortedReactFlowNodes = useMemo(
    () => [...reactFlowNodes].sort((a, b) => a.id.localeCompare(b.id)),
    [reactFlowNodes]
  )

  const sortedCurrentNodes = useMemo(
    () => [...nodes].sort((a, b) => a.id.localeCompare(b.id)),
    [nodes]
  )

  const reactFlowNodesSig = useMemo(() => sortedReactFlowNodes
    .map((n) => {
      const data = (n.data as { label?: string; type?: string; workflowCount?: number; isRoot?: boolean; _version?: string; children?: Array<{ id: string }> }) || {}
      // Include version and children count in signature for action groups
      const version = data._version || ''
      const childrenCount = data.children?.length ?? 0
      return [
        n.id,
        n.position.x,
        n.position.y,
        data.label || '',
        data.type || '',
        data.workflowCount || 0,
        n.type || '',
        n.selected ? '1' : '0',
        data.isRoot ? '1' : '0',
        version,
        childrenCount.toString()
      ].join(':')
    })
    .join('|'), [sortedReactFlowNodes])

  const currentNodesSig = useMemo(() => sortedCurrentNodes
    .map((n) => {
      const data = (n.data as { label?: string; type?: string; workflowCount?: number; isRoot?: boolean; _version?: string; children?: Array<{ id: string }> }) || {}
      const version = data._version || ''
      const childrenCount = data.children?.length ?? 0
      return `${n.id}:${n.position.x}:${n.position.y}:${data.label || ''}:${data.type || ''}:${data.workflowCount || 0}:${n.type || ''}:${n.selected ? '1' : '0'}:${data.isRoot ? '1' : '0'}:${version}:${childrenCount}`
    })
    .join('|'), [sortedCurrentNodes])

  useEffect(() => {
    if (isDraggingRef.current) return
    if (reactFlowNodesSig === currentNodesSig) return
    setNodes(reactFlowNodes)
  }, [reactFlowNodes, reactFlowNodesSig, currentNodesSig, setNodes])

  // Track last processed selectedRelationship to avoid loops
  const lastProcessedSelectionRef = useRef<string | null>(null)
  
  // Create signature for reactFlowEdges to detect any changes (similar to nodes)
  const reactFlowEdgesSig = useMemo(() => {
    return reactFlowEdges
      .map((e) => {
        const data = (e.data as { type?: string; cardinality?: string }) || {}
        const marker = e.markerEnd as { color?: string } | undefined
        return `${e.id}:${e.source}:${e.target}:${e.label || ''}:${data.type || ''}:${data.cardinality || ''}:${e.selected ? '1' : '0'}:${marker?.color || ''}`
      })
      .join('|')
  }, [reactFlowEdges])
  
  // Create signature for current edges from ReactFlow state
  const currentEdgesSig = useMemo(() => {
    return edges
      .map((e) => {
        const data = (e.data as { type?: string; cardinality?: string }) || {}
        const marker = e.markerEnd as { color?: string } | undefined
        return `${e.id}:${e.source}:${e.target}:${e.label || ''}:${data.type || ''}:${data.cardinality || ''}:${e.selected ? '1' : '0'}:${marker?.color || ''}`
      })
      .join('|')
  }, [edges])

  // Sync ReactFlow edges with store - use signature comparison for reliable change detection
  useEffect(() => {
    if (isDraggingRef.current) return
    
    // Check if selectedRelationship changed - this is the primary trigger
    const selectedRelationshipChanged = lastProcessedSelectionRef.current !== selectedRelationship
    
    // If selection changed, always update (even if flag is set, as it might be from a previous operation)
    if (selectedRelationshipChanged) {
      isUpdatingSelectionRef.current = true
      setEdges(reactFlowEdges)
      lastProcessedSelectionRef.current = selectedRelationship
      setTimeout(() => {
        isUpdatingSelectionRef.current = false
      }, 150)
      return
    }
    
    // Use signature comparison - if signatures differ, update edges
    // Always update when signature changes, regardless of isUpdatingSelectionRef flag
    // The flag only prevents loops from selection changes, not from data changes like type updates
    if (reactFlowEdgesSig !== currentEdgesSig) {
      setEdges(reactFlowEdges)
      lastProcessedSelectionRef.current = selectedRelationship
    }
  }, [reactFlowEdges, reactFlowEdgesSig, currentEdgesSig, setEdges, selectedRelationship])

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
      console.log('[canvas] onNodeClick tool node', { id: node.id })
      selectToolNode(node.id)
      selectNode(null)
      selectRelationship(null)
      selectWfNode(null)
      selectActionNode(null)
      onSwitchTab?.('tools')
    } else if (isAction) {
      console.log('[canvas] onNodeClick action node', { id: node.id })
      selectActionNode(node.id)
      selectNode(null)
      selectRelationship(null)
      selectWfNode(null)
      selectToolNode(null)
      onSwitchTab?.('actions')
    } else if (isWf) {
      console.log('[canvas] onNodeClick workflow node', { id: node.id })
      selectWfNode(node.id)
      selectNode(null)
      selectRelationship(null)
      selectToolNode(null)
      selectActionNode(null)
    } else {
      console.log('[canvas] onNodeClick model node', { id: node.id })
      selectNode(node.id)
      selectWfNode(null)
      selectRelationship(null)
      selectToolNode(null)
      selectActionNode(null)
      // Switch to nodes tab when clicking a node
      onSwitchTab?.('nodes')
    }
    
    // Reset flag after a short delay to allow ReactFlow to process
    setTimeout(() => {
      isUpdatingSelectionRef.current = false
    }, 100)
  }, [selectNode, selectWfNode, selectRelationship, selectedNode, selectedWfNodeId, onSwitchTab])

  const onSelectionChange = useCallback((params: { nodes: Node[], edges: Edge[] }) => {
    // Ignore selection changes when we're programmatically updating
    if (isUpdatingSelectionRef.current) {
      return
    }
    
    // Handle edge selection
    const firstEdge = params.edges[0]
    if (firstEdge) {
      // Only handle relationship edges (not workflow edges)
      const isRelationshipEdge = !firstEdge.id.includes('__attach') && 
                                  !firstEdge.id.startsWith('wfn_') &&
                                  storeRelationships.some((r: Relationship) => r.id === firstEdge.id)
      if (isRelationshipEdge && firstEdge.id !== selectedRelationship) {
        isUpdatingSelectionRef.current = true
        selectRelationship(firstEdge.id)
        // selectRelationship already clears selectedNode
        selectWfNode(null)
        // Switch to relationships tab when selecting a relationship
        onSwitchTab?.('relationships')
        setTimeout(() => { isUpdatingSelectionRef.current = false }, 100)
        return
      }
    }
    
    // Handle node selection (only if no edge was selected)
    const firstNode = params.nodes[0]
    if (firstNode && !firstEdge) {
      if (!firstNode.id.startsWith('wfn_') && firstNode.id === selectedNode) return
      if (firstNode.id.startsWith('wfn_') && firstNode.id === selectedWfNodeId) return
      
      isUpdatingSelectionRef.current = true
      if (firstNode.id.startsWith('wfn_')) {
        selectWfNode(firstNode.id)
        selectNode(null)
        selectRelationship(null)
      } else {
        selectNode(firstNode.id)
        selectWfNode(null)
        selectRelationship(null)
        // Switch to nodes tab when selecting a node
        onSwitchTab?.('nodes')
      }
      setTimeout(() => { isUpdatingSelectionRef.current = false }, 100)
      return
    }
    
    // If nothing selected in ReactFlow but we have a selectedRelationship in store,
    // don't clear it - it might have been selected from the list
    if (params.nodes.length === 0 && params.edges.length === 0) {
      // Only clear if we don't have a selectedRelationship in store
      // This prevents clearing when selecting from the list
      if (!selectedRelationship) {
        // Don't clear on pane click - let onPaneClick handle that
      }
    }
  }, [selectNode, selectRelationship, selectWfNode, selectedNode, selectedWfNodeId, selectedRelationship, storeRelationships, onSwitchTab])

  const onEdgeClick = useCallback((_e: React.MouseEvent, edge: Edge) => {
    // Ignore workflow attachment edges
    if (edge.id.includes('__attach') || edge.id.startsWith('wfn_')) {
      return
    }

    // Check if it's a relationship edge
    const isRelationshipEdge = storeRelationships.some((r: Relationship) => r.id === edge.id)
    if (isRelationshipEdge) {
      if (edge.id === selectedRelationship) {
        return
      }
      isUpdatingSelectionRef.current = true
      selectRelationship(edge.id)
      selectWfNode(null)
      onSwitchTab?.('relationships')
      setTimeout(() => {
        isUpdatingSelectionRef.current = false
      }, 100)
      return
    }

    // Tool and action edges are handled by the delete button in ToolActionEdge component
    // No need to handle clicks here
  }, [selectRelationship, selectWfNode, selectedRelationship, storeRelationships, onSwitchTab])

  const focusNode = useCallback((id: string) => {
    const node = reactFlowInstance.getNode(id)
    if (!node) return
    const width = node.width || 0
    const height = node.height || 0
    const x = node.position.x + width / 2
    const y = node.position.y + height / 2
    reactFlowInstance.setCenter(x, y, {
      zoom: 1.2,
      duration: 400
    })
  }, [reactFlowInstance])

  const focusRelationship = useCallback((fromNodeId: string, toNodeId: string) => {
    const fromNode = reactFlowInstance.getNode(fromNodeId)
    const toNode = reactFlowInstance.getNode(toNodeId)
    if (!fromNode || !toNode) return
    
    // Focus on the midpoint between the two nodes
    const fromX = fromNode.position.x + (fromNode.width || 0) / 2
    const fromY = fromNode.position.y + (fromNode.height || 0) / 2
    const toX = toNode.position.x + (toNode.width || 0) / 2
    const toY = toNode.position.y + (toNode.height || 0) / 2
    
    const centerX = (fromX + toX) / 2
    const centerY = (fromY + toY) / 2
    
    reactFlowInstance.setCenter(centerX, centerY, {
      zoom: 1.2,
      duration: 400
    })
  }, [reactFlowInstance])

  useEffect(() => {
    if (onRegisterFocusApi) {
      onRegisterFocusApi(focusNode)
    }
  }, [onRegisterFocusApi, focusNode])

  useEffect(() => {
    if (onRegisterFocusRelationshipApi) {
      onRegisterFocusRelationshipApi(focusRelationship)
    }
  }, [onRegisterFocusRelationshipApi, focusRelationship])

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Delete or Backspace is pressed
      if ((event.key === 'Delete' || event.key === 'Backspace') && !event.defaultPrevented) {
        // Check if we're not typing in an input field
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }

      // Delete selected node
      if (selectedNode) {
        event.preventDefault()
        handleDeleteNode(selectedNode)
      }
      // Delete selected workflow node
      else if (selectedWfNodeId) {
        event.preventDefault()
        deleteWfNode(selectedWfNodeId)
        selectWfNode(null)
      }
      // Delete selected relationship
      else if (selectedRelationship) {
        event.preventDefault()
        handleDeleteRelationship(selectedRelationship)
      }
      }
    }

    // Add event listener to window
    window.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedNode, selectedRelationship, selectedWfNodeId, selectedToolNodeId, selectedActionNodeId, handleDeleteRelationship, deleteWfNode, deleteToolNode, deleteActionNode, selectNode, selectRelationship, selectWfNode, selectToolNode, selectActionNode, handleDeleteNode])

  // Note: Node selection highlighting is handled by the selected property in reactFlowNodes
  // No zoom/pan needed - just visual highlighting

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const type =
      event.dataTransfer.getData('application/workflow-step-type') ||
      event.dataTransfer.getData('application/workflow-node-type') ||
      event.dataTransfer.getData('application/tool-type') ||
      event.dataTransfer.getData('application/action-type') ||
      event.dataTransfer.getData('text/plain')
    if (!type) {
      console.log('[workflow-drop] missing type payload', event.dataTransfer.types)
      return
    }
    const screenPoint = { x: event.clientX, y: event.clientY }
    const flowPoint = reactFlowInstance.screenToFlowPosition(screenPoint)

    // Handle tool nodes
    if (type.startsWith('tool:')) {
      let outputs: Array<{ id: string; label: string }> = [{ id: 'output', label: 'Output' }]
      
      if (type === 'tool:if') {
        outputs = [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }]
      } else if (type === 'tool:switch') {
        // Switch outputs will be configured dynamically based on cases
        outputs = [{ id: 'default', label: 'Default' }]
      } else if (type === 'tool:fetch-api') {
        outputs = [{ id: 'output', label: 'Output' }]
      } else if (type === 'tool:fetch-orcid' || type === 'tool:fetch-geonames' || type === 'tool:fetch-europeana' || type === 'tool:fetch-getty') {
        outputs = [{ id: 'output', label: 'Output' }]
      } else if (type === 'tool:http') {
        outputs = [{ id: 'output', label: 'Output' }]
      }
      
      addToolNode({
        type: type as import('../../stores/toolCanvasStore').ToolNodeType,
        label: labelFromType(type),
        position: flowPoint,
        config: {},
        inputs: 1,
        outputs
      })
      return
    }

    // Handle action nodes
    if (type.startsWith('action:')) {
      // Check if dropping on an action group
      const dropTarget = reactFlowInstance.getNodes().find(n => {
        if (n.type !== 'actionGroup') return false
        const bounds = {
          x: n.position.x,
          y: n.position.y,
          width: (n.width || 150) + 20,
          height: (n.height || 100) + 20
        }
        return (
          flowPoint.x >= bounds.x &&
          flowPoint.x <= bounds.x + bounds.width &&
          flowPoint.y >= bounds.y &&
          flowPoint.y <= bounds.y + bounds.height
        )
      })

      // Handle action group creation
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

      // If dropping on an action group, add to group instead of creating standalone
      if (dropTarget && type !== 'action:group') {
        const groupActionNode = actionNodes.find(a => a.id === dropTarget.id)
        if (groupActionNode && (groupActionNode.type === 'action:group' || groupActionNode.isGroup)) {
          const newActionId = addActionNode({
            type: type as import('../../stores/actionCanvasStore').ActionNodeType,
            label: labelFromType(type),
            position: { x: 0, y: 0 },
            config: {}
          })
          updateActionNode(dropTarget.id, {
            children: [...(groupActionNode.children || []), newActionId]
          })
          console.log('[workflow-drop] added action to group', { actionId: newActionId, groupId: dropTarget.id })
          return
        }
      }

      // Create standalone action
      addActionNode({
        type: type as import('../../stores/actionCanvasStore').ActionNodeType,
        label: labelFromType(type),
        position: flowPoint,
        config: {}
      })
      return
    }

    // Handle legacy workflow nodes
    const step = mapDragTypeToStep(type)
    if (!step) {
      console.log('[workflow-drop] unmapped type', type)
      return
    }
    addWfNode({
      kind: step.kind === 'action' ? 'action' : 'condition',
      type: type as import('../../stores/workflowCanvasStore').WorkflowNodeType,
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

  return (
    <div ref={canvasRef} className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeClick={onNodeClick}
        onSelectionChange={onSelectionChange}
        onEdgeClick={onEdgeClick}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onConnectStart={() => {
          // Connection preview starts - ReactFlow shows a dashed line automatically
        }}
        onConnectEnd={() => {
          // Connection preview ends
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode={null}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        selectNodesOnDrag={false}
        multiSelectionKeyCode={['Meta', 'Control']}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5,5' }}
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
      >
        <Background 
          variant={showGrid ? BackgroundVariant.Dots : BackgroundVariant.Lines}
          gap={showGrid ? 20 : 12}
          size={showGrid ? 1 : 1}
        />
        <EnhancedMiniMap 
          className="absolute bottom-4 right-4"
        />
        <CanvasToolbarInner 
          canvasRef={canvasRef} 
          sidebarOpen={sidebarOpen} 
          onToggleSidebar={onToggleSidebar}
          showGrid={showGrid}
          snapToGrid={snapToGrid}
          onGridToggle={setShowGrid}
          onSnapToggle={setSnapToGrid}
        />
      </ReactFlow>
      
      {/* Delete Node Confirmation Dialog */}
      <ConfirmDialog
        open={nodeManagement.deleteNodeDialogOpen}
        onOpenChange={(open) => !open && nodeManagement.handleCancelDeleteNode()}
        title="Delete Node"
        description={
          nodeManagement.pendingNodeId
            ? `Are you sure you want to delete "${storeNodes.find((n: BuilderNode) => n.id === nodeManagement.pendingNodeId)?.label || 'this node'}"? This action cannot be undone.`
            : 'Are you sure you want to delete this node?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteNode}
        variant="destructive"
      />
      {/* Delete Relationship Confirmation Dialog */}
      <ConfirmDialog
        open={edgeManagement.deleteRelationshipDialogOpen}
        onOpenChange={(open) => !open && edgeManagement.handleCancelDeleteRelationship()}
        title="Delete Relationship"
        description={
          edgeManagement.pendingRelationshipId
            ? (() => {
                const rel = storeRelationships.find((r: Relationship) => r.id === edgeManagement.pendingRelationshipId)
                return rel
                  ? `Are you sure you want to delete the relationship "${rel.type || 'RELATES_TO'}"? This action cannot be undone.`
                  : 'Are you sure you want to delete this relationship?'
              })()
            : 'Are you sure you want to delete this relationship?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteRelationship}
        variant="destructive"
      />
      {/* Delete Edge Confirmation Dialog */}
      <ConfirmDialog
        open={edgeManagement.deleteEdgeDialogOpen}
        onOpenChange={(open) => !open && edgeManagement.handleCancelDeleteEdge()}
        title="Delete Connection"
        description={
          edgeManagement.pendingEdgeId && edgeManagement.pendingEdgeType
            ? `Are you sure you want to delete this ${edgeManagement.pendingEdgeType === 'tool' ? 'tool' : 'action'} connection? The ${edgeManagement.pendingEdgeType === 'tool' ? 'tool' : 'action'} will remain, but the connection will be removed. This action cannot be undone.`
            : 'Are you sure you want to delete this connection?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteEdge}
        variant="destructive"
      />
    </div>
  )
}

function CanvasToolbarInner ({ 
  canvasRef, 
  sidebarOpen, 
  onToggleSidebar,
  showGrid,
  snapToGrid,
  onGridToggle,
  onSnapToggle
}: { 
  canvasRef: React.RefObject<HTMLDivElement | null>
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
  showGrid?: boolean
  snapToGrid?: boolean
  onGridToggle?: (enabled: boolean) => void
  onSnapToggle?: (enabled: boolean) => void
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <CanvasToolbar
      canvasRef={canvasRef}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={onToggleSidebar}
      onZoomIn={() => zoomIn()}
      onZoomOut={() => zoomOut()}
      onFitView={() => fitView()}
      showGrid={showGrid}
      snapToGrid={snapToGrid}
      onGridToggle={onGridToggle}
      onSnapToggle={onSnapToggle}
    />
  )
}

// Wrapper component to provide ReactFlow context
export function ModelBuilderCanvas ({ className, sidebarOpen, onToggleSidebar, onRegisterFocusApi, onRegisterFocusRelationshipApi, onSwitchTab }: ModelBuilderCanvasProps) {
  return (
    <ReactFlowProvider>
      <ModelBuilderCanvasInner
        className={className}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={onToggleSidebar}
        onRegisterFocusApi={onRegisterFocusApi}
        onRegisterFocusRelationshipApi={onRegisterFocusRelationshipApi}
        onSwitchTab={onSwitchTab}
      />
    </ReactFlowProvider>
  )
}

