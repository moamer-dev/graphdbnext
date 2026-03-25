import React, { useState, useRef, useCallback, useEffect } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  NodeTypes,
  EdgeTypes
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useModelBuilderStore } from '../../stores/modelBuilderStore'

import { CustomNode } from '../nodes/CustomNode'
import WorkflowBlock from '../nodes/WorkflowBlock'
import { ToolNode } from '../nodes/ToolNode'
import { ActionNode } from '../nodes/ActionNode'
import { ActionGroupNode } from '../nodes/ActionGroupNode'
import { CustomEdge } from './CustomEdge'
import { ToolActionEdge } from '../dialogs/ToolActionEdge'
import { CanvasToolbar } from './CanvasToolbar'
import { ConfirmDialog } from '../dialogs/ConfirmDialog'
import { EnhancedMiniMap } from './EnhancedMiniMap'

import {
  useCanvasStateSync,
  useCanvasSelection,
  useCanvasConnections,
  useCanvasInteractions,
  useCanvasKeyboardShortcuts,
  useCanvasNodeManagement,
  useCanvasEdgeManagement
} from '../../hooks'

import { Relationship } from '../../types'

interface ModelBuilderCanvasProps {
  className?: string
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
  onRegisterFocusApi?: (api: (nodeId: string) => void) => void
  onRegisterFocusRelationshipApi?: (api: (relId: string) => void) => void
  onSwitchTab?: (tab: 'nodes' | 'relationships' | 'tools' | 'actions') => void
  showToolbar?: boolean
}

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

const ModelBuilderCanvasInner = ({ 
  className, 
  sidebarOpen,
  onToggleSidebar,
  onSwitchTab, 
  onRegisterFocusApi, 
  onRegisterFocusRelationshipApi,
  showToolbar = true
}: ModelBuilderCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(false)
  
  const { nodes: storeNodes, relationships: storeRelationships } = useModelBuilderStore()
  
  // Hook 1: Node/Edge Management (Dialogs)
  const nodeManagement = useCanvasNodeManagement()
  const edgeManagement = useCanvasEdgeManagement()

  // Hook 2: State Synchronization
  const { 
    nodes, 
    edges, 
    setEdges, 
    isDraggingRef, 
    isUpdatingSelectionRef,
    onNodesChange: handleNodesChangeState,
    onEdgesChange: handleEdgesChangeState
  } = useCanvasStateSync({
    handleDeleteNode: nodeManagement.handleDeleteNode,
    handleDeleteRelationship: edgeManagement.handleDeleteRelationship,
    handleDeleteEdge: edgeManagement.handleDeleteEdge,
    onSwitchTab: onSwitchTab as any
  })

  // Hook 3: Selection Handling
  const {
    onNodeClick,
    onEdgeClick,
    onPaneClick,
    onSelectionChange
  } = useCanvasSelection({
    isUpdatingSelectionRef,
    onSwitchTab: onSwitchTab as any
  })

  // Hook 4: Connection Handling
  const {
    isValidConnection,
    onConnect
  } = useCanvasConnections({
    edges,
    setEdges
  })

  // Hook 5: Interactions (Drag & Drop, Changes)
  const {
    handleNodesChange,
    handleEdgesChange,
    onNodeDragStop,
    handleDrop,
    handleDragOver
  } = useCanvasInteractions({
    onNodesChange: handleNodesChangeState,
    onEdgesChange: handleEdgesChangeState,
    setEdges,
    isDraggingRef,
    snapToGrid
  })

  // Hook 6: Keyboard Shortcuts
  useCanvasKeyboardShortcuts({
    handleDeleteNode: nodeManagement.handleDeleteNode,
    handleDeleteRelationship: edgeManagement.handleDeleteRelationship
  })

  // Focus API registration
  const { setCenter } = useReactFlow()
  
  const focusNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      setCenter(node.position.x + 100, node.position.y + 40, { zoom: 1.2, duration: 800 })
    }
  }, [nodes, setCenter])

  const focusRelationship = useCallback((relId: string) => {
    const edge = edges.find(e => e.id === relId)
    if (edge) {
      const source = nodes.find(n => n.id === edge.source)
      const target = nodes.find(n => n.id === edge.target)
      if (source && target) {
        const x = (source.position.x + target.position.x) / 2
        const y = (source.position.y + target.position.y) / 2
        setCenter(x + 100, y + 40, { zoom: 1.2, duration: 800 })
      }
    }
  }, [edges, nodes, setCenter])

  useEffect(() => {
    onRegisterFocusApi?.(focusNode)
  }, [onRegisterFocusApi, focusNode])

  useEffect(() => {
    onRegisterFocusRelationshipApi?.(focusRelationship)
  }, [onRegisterFocusRelationshipApi, focusRelationship])

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
          // Connection start handler - no default action
        }}
        onConnectEnd={() => {
          // Connection end handler - no default action
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
        {showToolbar && (
          <CanvasToolbarInner
            canvasRef={canvasRef}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={onToggleSidebar}
            showGrid={showGrid}
            snapToGrid={snapToGrid}
            onGridToggle={setShowGrid}
            onSnapToggle={setSnapToGrid}
          />
        )}
      </ReactFlow>

      {/* Delete Node Confirmation Dialog */}
      <ConfirmDialog
        open={nodeManagement.deleteNodeDialogOpen}
        onOpenChange={(open: boolean) => !open && nodeManagement.handleCancelDeleteNode()}
        title="Delete Node"
        description={
          nodeManagement.pendingNodeId
            ? `Are you sure you want to delete "${storeNodes.find((n: any) => n.id === nodeManagement.pendingNodeId)?.label || 'this node'}"? This action cannot be undone.`
            : 'Are you sure you want to delete this node?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={nodeManagement.handleConfirmDeleteNode}
        variant="destructive"
      />
      
      {/* Delete Relationship Confirmation Dialog */}
      <ConfirmDialog
        open={edgeManagement.deleteRelationshipDialogOpen}
        onOpenChange={(open: boolean) => !open && edgeManagement.handleCancelDeleteRelationship()}
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
        onConfirm={edgeManagement.handleConfirmDeleteRelationship}
        variant="destructive"
      />
      
      {/* Delete Edge Confirmation Dialog */}
      <ConfirmDialog
        open={edgeManagement.deleteEdgeDialogOpen}
        onOpenChange={(open: boolean) => !open && edgeManagement.handleCancelDeleteEdge()}
        title="Delete Connection"
        description={
          edgeManagement.pendingEdgeId && edgeManagement.pendingEdgeType
            ? `Are you sure you want to delete this ${edgeManagement.pendingEdgeType === 'tool' ? 'tool' : 'action'} connection? The ${edgeManagement.pendingEdgeType === 'tool' ? 'tool' : 'action'} will remain, but the connection will be removed. This action cannot be undone.`
            : 'Are you sure you want to delete this connection?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={edgeManagement.handleConfirmDeleteEdge}
        variant="destructive"
      />
    </div>
  )
}

function CanvasToolbarInner({
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

export function ModelBuilderCanvas(props: ModelBuilderCanvasProps) {
  return (
    <ReactFlowProvider>
      <ModelBuilderCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
