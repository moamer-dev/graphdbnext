'use client'

import { useRef, useState } from 'react'
import { Loader2, ZoomIn, ZoomOut, Maximize2, Minimize2, Focus, Home, Plus } from 'lucide-react'
import { NodeFactSheet } from './NodeFactSheet'
import { RelationshipFactSheet } from './RelationshipFactSheet'
import { CreateNodeDialog } from './CreateNodeDialog'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import { useGraphView } from '../../hooks/view/useGraphView'
import { GraphNode } from '@/lib/services/GraphVisualizationService'
import type { VisualizationConfig } from '@/lib/services/CustomVisualizationService'

interface GraphViewProps {
  results: unknown[]
  loading?: boolean
  onRefresh?: () => void
  visualizationConfig?: VisualizationConfig
  onGraphDataChange?: (data: { nodes: GraphNode[], edges: any[] }) => void
}

export function GraphView({ results, loading, onRefresh, visualizationConfig, onGraphDataChange }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const [createNodeDialogOpen, setCreateNodeDialogOpen] = useState(false)

  const {
    graphData,
    error,
    fetchingRelationships,
    selectedNode,
    setSelectedNode,
    selectedRelationship,
    setSelectedRelationship,
    isFullscreen,
    handleToggleFullscreen,
    handleZoomIn,
    handleZoomOut,
    handleFitToView,
    handleResetZoom
  } = useGraphView({ results, loading, containerRef, fullscreenContainerRef, visualizationConfig, onGraphDataChange })

  if (loading || fetchingRelationships) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mb-2 animate-spin" />
          <p className="text-sm">
            {fetchingRelationships ? 'Fetching relationships...' : 'Loading graph...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-destructive">
          <p className="text-sm font-medium">Error loading graph</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No graph data to display</p>
          <p className="text-xs mt-1">Query results do not contain nodes or relationships</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <ResizablePanelGroup direction="horizontal" className="w-full h-full">
        <ResizablePanel defaultSize={(selectedNode || selectedRelationship) ? 75 : 100} minSize={50}>
          <div
            ref={fullscreenContainerRef}
            className="w-full h-full relative"
          >
            <div
              ref={containerRef}
              className={`w-full h-full border rounded-md bg-background ${isFullscreen ? 'border-0 rounded-none' : ''}`}
              style={{ minHeight: '800px' }}
            />
            {/* Zoom Controls */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFitToView}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                title="Fit to View"
              >
                <Focus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateNodeDialogOpen(true)}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                title="Create Node"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetZoom}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                title="Reset Zoom"
              >
                <Home className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFullscreen}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
            {/* Graph Stats */}
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-md p-2 text-xs border">
              <div className="space-y-1">
                <div>Nodes: {graphData.nodes.length}</div>
                <div>Edges: {graphData.edges.length}</div>
              </div>
            </div>
          </div>
        </ResizablePanel>
        {(selectedNode || selectedRelationship) && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              {selectedNode && (
                <NodeFactSheet
                  node={selectedNode}
                  edges={graphData.edges}
                  allNodes={graphData.nodes}
                  onClose={() => setSelectedNode(null)}
                  onNodeUpdate={onRefresh}
                />
              )}
              {selectedRelationship && graphData && (
                <RelationshipFactSheet
                  relationship={selectedRelationship}
                  sourceNode={(() => {
                    // Handle both string IDs and D3 node objects
                    const source = selectedRelationship.source
                    // Check if it's a node object (has labels or nodeId property)
                    if (typeof source === 'object' && source !== null && ('labels' in source || 'nodeId' in source || 'id' in source)) {
                      // D3 has converted it to a node object
                      return source as GraphNode
                    }
                    // It's still a string ID, find the node
                    const sourceIdStr = String(source)
                    return graphData.nodes.find(n => {
                      const nodeIdStr = String(n.nodeId || n.id)
                      return nodeIdStr === sourceIdStr
                    }) || undefined
                  })()}
                  targetNode={(() => {
                    // Handle both string IDs and D3 node objects
                    const target = selectedRelationship.target
                    // Check if it's a node object (has labels or nodeId property)
                    if (typeof target === 'object' && target !== null && ('labels' in target || 'nodeId' in target || 'id' in target)) {
                      // D3 has converted it to a node object
                      return target as GraphNode
                    }
                    // It's still a string ID, find the node
                    const targetIdStr = String(target)
                    return graphData.nodes.find(n => {
                      const nodeIdStr = String(n.nodeId || n.id)
                      return nodeIdStr === targetIdStr
                    }) || undefined
                  })()}
                  onClose={() => setSelectedRelationship(null)}
                  onRelationshipUpdate={onRefresh}
                />
              )}
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Create Node Dialog */}
      <CreateNodeDialog
        open={createNodeDialogOpen}
        onOpenChange={setCreateNodeDialogOpen}
        onSuccess={onRefresh}
      />
    </>
  )
}
