'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { GraphVisualizationService, GraphData, GraphNode, GraphEdge } from '@/lib/services/GraphVisualizationService'
import type { SchemaNode, Schema } from '@/lib/services/SchemaLoaderService'
import { Loader2, ZoomIn, ZoomOut, Maximize2, Minimize2, Focus, Home, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface NodeTypeVisualizationProps {
  node: SchemaNode
  schema: Schema | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NodeTypeVisualization({ node, schema, open, onOpenChange }: NodeTypeVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const serviceRef = useRef<GraphVisualizationService | null>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [expansionData, setExpansionData] = useState<Map<number, { nodes: Set<number>, edges: Set<string> }>>(new Map())
  const [isExpanding, setIsExpanding] = useState(false)

  // Initialize service
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new GraphVisualizationService()
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.cleanup()
        serviceRef.current = null
      }
    }
  }, [])

  // Generate graph data from schema node
  useEffect(() => {
    if (!open || !node) {
      setGraphData(null)
      return
    }

    const generateGraphData = (): GraphData => {
      const nodes: GraphNode[] = []
      const edges: Array<{ id: string, source: string, target: string, type: string, properties: Record<string, unknown> }> = []
      const nodeIdMap = new Map<string, number>()

      let nodeIdCounter = 0

      // Add the main node type in the center
      const mainNodeId = '0'
      nodeIdMap.set(node.name, 0)
      nodes.push({
        id: mainNodeId,
        labels: [node.name],
        properties: {
          type: 'node-type',
          name: node.name
        },
        nodeId: 0
      })

      // Add properties as nodes
      Object.entries(node.properties).forEach(([propName, prop]) => {
        const propNodeId = String(nodeIdCounter + 1)
        nodeIdCounter++
        nodeIdMap.set(`prop:${propName}`, nodeIdCounter)
        nodes.push({
          id: propNodeId,
          labels: [propName],
          properties: {
            type: 'property',
            name: propName,
            datatype: prop.datatype || 'unknown',
            required: prop.required
          },
          nodeId: nodeIdCounter
        })
        // Connect property to main node
        edges.push({
          id: `edge_${edges.length}`,
          source: mainNodeId,
          target: propNodeId,
          type: 'hasProperty',
          properties: {}
        })
      })

      // Add outgoing relations
      Object.entries(node.relationsOut || {}).forEach(([relName, targets]) => {
        targets.forEach((targetNodeType) => {
          let targetNodeId = nodeIdMap.get(targetNodeType)
          if (targetNodeId === undefined) {
            nodeIdCounter++
            targetNodeId = nodeIdCounter
            nodeIdMap.set(targetNodeType, targetNodeId)
            nodes.push({
              id: String(targetNodeId),
              labels: [targetNodeType],
              properties: {
                type: 'node-type',
                name: targetNodeType
              },
              nodeId: targetNodeId
            })
          }
          edges.push({
            id: `edge_${edges.length}`,
            source: mainNodeId,
            target: String(targetNodeId),
            type: relName,
            properties: {}
          })
        })
      })

      // Add incoming relations
      Object.entries(node.relationsIn || {}).forEach(([relName, sources]) => {
        sources.forEach((sourceNodeType) => {
          let sourceNodeId = nodeIdMap.get(sourceNodeType)
          if (sourceNodeId === undefined) {
            nodeIdCounter++
            sourceNodeId = nodeIdCounter
            nodeIdMap.set(sourceNodeType, sourceNodeId)
            nodes.push({
              id: String(sourceNodeId),
              labels: [sourceNodeType],
              properties: {
                type: 'node-type',
                name: sourceNodeType
              },
              nodeId: sourceNodeId
            })
          }
          edges.push({
            id: `edge_${edges.length}`,
            source: String(sourceNodeId),
            target: mainNodeId,
            type: relName,
            properties: {}
          })
        })
      })

      return {
        nodes,
        edges: edges as GraphEdge[]
      }
    }

    const data = generateGraphData()
    console.log('Generated graph data:', { nodes: data.nodes.length, edges: data.edges.length })
    setGraphData(data)
    // Reset expansion state when node changes
    setExpandedNodes(new Set())
    setExpansionData(new Map())
  }, [open, node])

  // Handle node click (could show details in future)
  const handleNodeClick = useCallback((node: GraphNode) => {
    // Could show node details in a side panel or tooltip
    console.log('Node clicked:', node)
  }, [])

  // Handle node double-click (toggle expand/collapse)
  const handleNodeDoubleClick = useCallback((clickedNode: GraphNode) => {
    if (!clickedNode.nodeId || isExpanding || !schema) return

    // If already expanded, collapse it
    if (expandedNodes.has(clickedNode.nodeId)) {
      const expansion = expansionData.get(clickedNode.nodeId)

      if (expansion) {
        const nodesToRemove = expansion.nodes
        const edgesToRemove = expansion.edges

        setGraphData(prev => {
          if (!prev) return prev

          // Remove only the nodes that were added by this expansion
          const filteredNodes = prev.nodes.filter(n =>
            !n.nodeId || !nodesToRemove.has(n.nodeId)
          )

          // Remove only the edges that were added by this expansion
          const filteredEdges = prev.edges.filter(e =>
            !edgesToRemove.has(e.id)
          )

          return {
            nodes: filteredNodes,
            edges: filteredEdges
          }
        })

        // Remove from expanded set
        setExpandedNodes(prev => {
          const newSet = new Set(prev)
          newSet.delete(clickedNode.nodeId!)
          return newSet
        })

        // Remove expansion tracking
        setExpansionData(prev => {
          const newMap = new Map(prev)
          newMap.delete(clickedNode.nodeId!)
          return newMap
        })
      }

      return
    }

    // Otherwise, expand it - find the node type in schema and add its details
    const nodeTypeName = clickedNode.labels[0]
    if (!nodeTypeName || clickedNode.properties.type === 'property') return // Don't expand properties

    const schemaNode = schema.nodes[nodeTypeName]
    if (!schemaNode) return

    setIsExpanding(true)
    setExpandedNodes(prev => new Set(prev).add(clickedNode.nodeId!))

    try {
      const addedNodeIds = new Set<number>()
      const addedEdgeIds = new Set<string>()

      // Get the highest node ID currently in the graph
      const maxNodeId = Math.max(...(graphData?.nodes.map(n => n.nodeId || 0) || [0]))
      let newNodeIdCounter = maxNodeId

      const newNodes: GraphNode[] = []
      const newEdges: GraphEdge[] = []

      // Add properties as nodes if not already present
      Object.entries(schemaNode.properties).forEach(([propName, prop]) => {
        // Check if property node already exists
        const existingPropNode = graphData?.nodes.find(n =>
          n.properties.type === 'property' && n.properties.name === propName
        )

        if (!existingPropNode) {
          newNodeIdCounter++
          const propNodeId = newNodeIdCounter
          addedNodeIds.add(propNodeId)

          newNodes.push({
            id: String(propNodeId),
            labels: [propName],
            properties: {
              type: 'property',
              name: propName,
              datatype: prop.datatype || 'unknown',
              required: prop.required
            },
            nodeId: propNodeId
          })

          // Connect property to the expanded node
          const edgeId = `edge_${clickedNode.nodeId}_prop_${propName}`
          addedEdgeIds.add(edgeId)
          newEdges.push({
            id: edgeId,
            source: String(clickedNode.nodeId),
            target: String(propNodeId),
            type: 'hasProperty',
            properties: {}
          })
        }
      })

      // Add outgoing relations to new node types
      Object.entries(schemaNode.relationsOut || {}).forEach(([relName, targets]) => {
        targets.forEach((targetNodeType) => {
          // Check if target node already exists
          const existingTargetNode = graphData?.nodes.find(n =>
            n.labels.includes(targetNodeType) && n.properties.type === 'node-type'
          )

          if (!existingTargetNode) {
            newNodeIdCounter++
            const targetNodeId = newNodeIdCounter
            addedNodeIds.add(targetNodeId)

            newNodes.push({
              id: String(targetNodeId),
              labels: [targetNodeType],
              properties: {
                type: 'node-type',
                name: targetNodeType
              },
              nodeId: targetNodeId
            })
          }

          // Add edge (use existing node if found, or new one)
          const targetNodeId = existingTargetNode?.nodeId || newNodeIdCounter
          const edgeId = `edge_${clickedNode.nodeId}_${relName}_${targetNodeType}`
          addedEdgeIds.add(edgeId)
          newEdges.push({
            id: edgeId,
            source: String(clickedNode.nodeId),
            target: String(targetNodeId),
            type: relName,
            properties: {}
          })
        })
      })

      // Add incoming relations from new node types
      Object.entries(schemaNode.relationsIn || {}).forEach(([relName, sources]) => {
        sources.forEach((sourceNodeType) => {
          // Check if source node already exists
          const existingSourceNode = graphData?.nodes.find(n =>
            n.labels.includes(sourceNodeType) && n.properties.type === 'node-type'
          )

          if (!existingSourceNode) {
            newNodeIdCounter++
            const sourceNodeId = newNodeIdCounter
            addedNodeIds.add(sourceNodeId)

            newNodes.push({
              id: String(sourceNodeId),
              labels: [sourceNodeType],
              properties: {
                type: 'node-type',
                name: sourceNodeType
              },
              nodeId: sourceNodeId
            })
          }

          // Add edge
          const sourceNodeId = existingSourceNode?.nodeId || newNodeIdCounter
          const edgeId = `edge_${sourceNodeType}_${relName}_${clickedNode.nodeId}`
          addedEdgeIds.add(edgeId)
          newEdges.push({
            id: edgeId,
            source: String(sourceNodeId),
            target: String(clickedNode.nodeId),
            type: relName,
            properties: {}
          })
        })
      })

      if (newNodes.length > 0 || newEdges.length > 0) {
        setGraphData(prev => {
          if (!prev) return prev

          // Merge nodes (avoid duplicates)
          const nodeMap = new Map(prev.nodes.map(n => [n.nodeId, n]))
          newNodes.forEach(n => {
            if (n.nodeId && !nodeMap.has(n.nodeId)) {
              nodeMap.set(n.nodeId, n)
            }
          })

          // Merge edges (avoid duplicates)
          const edgeMap = new Map(prev.edges.map(e => [e.id, e]))
          newEdges.forEach(e => {
            if (!edgeMap.has(e.id)) {
              edgeMap.set(e.id, e)
            }
          })

          return {
            nodes: Array.from(nodeMap.values()),
            edges: Array.from(edgeMap.values())
          }
        })

        // Track what was added by this expansion
        setExpansionData(prev => {
          const newMap = new Map(prev)
          newMap.set(clickedNode.nodeId!, {
            nodes: addedNodeIds,
            edges: addedEdgeIds
          })
          return newMap
        })
      }
    } catch (err) {
      console.warn('Failed to expand node:', err)
    } finally {
      setIsExpanding(false)
    }
  }, [expandedNodes, isExpanding, expansionData, schema, graphData])

  // Update graph when graphData changes (e.g., after expansion)
  useEffect(() => {
    if (!open || !graphData || !serviceRef.current || !containerRef.current) {
      return
    }

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    if (width === 0 || height === 0) {
      return
    }

    // Update the graph with new data and improved spacing configs
    if (serviceRef.current) {
      // Find the last expanded node to position new nodes around it
      const lastExpandedNodeId = expandedNodes.size > 0
        ? Array.from(expandedNodes)[expandedNodes.size - 1]
        : undefined

      serviceRef.current.updateGraph(graphData, {
        linkDistance: 200,
        chargeStrength: -800,
        collisionRadius: 80,
        parentNodeId: lastExpandedNodeId
      })
    }
  }, [open, graphData, expandedNodes])

  // Initialize graph visualization when container is ready
  useEffect(() => {
    if (!open || !graphData || !serviceRef.current) {
      return
    }

    // Wait for container to have dimensions
    let retryCount = 0
    const maxRetries = 20

    const initGraph = () => {
      const container = containerRef.current
      if (!container || !serviceRef.current || !graphData) {
        retryCount++
        if (retryCount < maxRetries) {
          setTimeout(initGraph, 100)
        } else {
          console.error('Failed to initialize graph: container not available after max retries')
        }
        return
      }

      const width = container.clientWidth
      const height = container.clientHeight

      if (width === 0 || height === 0) {
        retryCount++
        if (retryCount < maxRetries) {
          // Retry after a short delay if container doesn't have dimensions yet
          setTimeout(initGraph, 100)
        } else {
          console.error('Failed to initialize graph: container has no dimensions after max retries')
        }
        return
      }

      // Cleanup any existing graph first
      serviceRef.current.cleanup()

      console.log('Initializing graph with dimensions:', { width, height, nodes: graphData.nodes.length, edges: graphData.edges.length })

      try {
        serviceRef.current.initializeGraph(container, graphData, {
          width,
          height,
          linkDistance: 200, // Increased distance between connected nodes
          chargeStrength: -800, // Stronger repulsion to push nodes apart
          collisionRadius: 80, // Larger collision radius to prevent overlap
          onNodeClick: handleNodeClick,
          onNodeDoubleClick: handleNodeDoubleClick
        })

        // Fit to view after simulation settles
        setTimeout(() => {
          if (serviceRef.current && graphData.nodes.length > 0) {
            serviceRef.current.fitToView(graphData.nodes)
          }
        }, 500)
      } catch (error) {
        console.error('Error initializing graph:', error)
      }
    }

    // Start initialization after a short delay to ensure dialog is fully rendered
    const timeoutId = setTimeout(initGraph, 300)

    return () => {
      clearTimeout(timeoutId)
      if (serviceRef.current) {
        serviceRef.current.cleanup()
      }
    }
  }, [open, graphData, handleNodeClick, handleNodeDoubleClick])

  // Cleanup on close
  useEffect(() => {
    if (!open && serviceRef.current) {
      serviceRef.current.cleanup()
    }
  }, [open])

  // Handle fullscreen
  const handleToggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => {
          // Fallback for browsers that don't support fullscreen
          console.warn('Fullscreen not supported')
        })
    } else {
      document.exitFullscreen?.()
        .then(() => setIsFullscreen(false))
        .catch(() => {
          setIsFullscreen(false)
        })
    }
  }, [isFullscreen])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full h-[90vh] p-0 flex flex-col"
        style={{ maxWidth: '75vw' }}
        showCloseButton={false}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base">Node Type Visualization: {node.name}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 relative min-h-0 px-6 pb-6 flex flex-col">
          {!graphData && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          <div
            ref={containerRef}
            className="flex-1 w-full border rounded-md bg-background"
            style={{ minHeight: '500px' }}
          />

          {/* Zoom Controls */}
          {graphData && (
            <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => serviceRef.current?.zoomIn()}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => serviceRef.current?.zoomOut()}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (graphData && serviceRef.current) {
                    serviceRef.current.fitToView(graphData.nodes)
                  }
                }}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                title="Fit to View"
              >
                <Focus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => serviceRef.current?.resetZoom()}
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
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          )}

          <div className="absolute top-4 left-14 pointer-events-none select-none z-10">
            <p className="text-muted-foreground/100 text-[12px] bg-background/50 px-2 py-1 rounded-full backdrop-blur-[2px] border border-border/10">
              Double click to reveal/unreveal the connected nodes properties
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

