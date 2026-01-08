import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { GraphVisualizationService, GraphData, GraphNode, GraphEdge } from '@/lib/services/GraphVisualizationService'
import { CustomVisualizationService, type VisualizationConfig } from '@/lib/services/CustomVisualizationService'

interface UseGraphViewProps {
  results: unknown[]
  loading?: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  fullscreenContainerRef?: React.RefObject<HTMLDivElement | null>
  visualizationConfig?: VisualizationConfig
  onGraphDataChange?: (data: GraphData) => void
}

export function useGraphView({ results, containerRef, fullscreenContainerRef, visualizationConfig, onGraphDataChange }: UseGraphViewProps) {
  const serviceRef = useRef<GraphVisualizationService | null>(null)
  const visualizationServiceRef = useRef<CustomVisualizationService | null>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [rawData, setRawData] = useState<GraphData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fetchingRelationships, setFetchingRelationships] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedRelationship, setSelectedRelationship] = useState<GraphEdge | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [isExpanding, setIsExpanding] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [expansionData, setExpansionData] = useState<Map<number, { nodes: Set<number>, edges: Set<string> }>>(new Map())

  // Initialize service
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new GraphVisualizationService()
    }
    if (!visualizationServiceRef.current) {
      visualizationServiceRef.current = new CustomVisualizationService()
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.cleanup()
        serviceRef.current = null
      }
    }
  }, []) // Services are stateless, no need to re-create

  // 1. Extract graph data from results and fetch relationships (Populate rawData)
  useEffect(() => {
    if (!results || results.length === 0) {
      setRawData(null)
      return
    }

    const fetchGraphData = async () => {
      try {
        if (!serviceRef.current) return

        const initialData = serviceRef.current.extractGraphData(results)

        if (initialData.nodes.length > 0 && initialData.edges.length === 0) {
          const nodeIds = initialData.nodes
            .map(n => n.nodeId)
            .filter((id): id is number => id !== undefined)

          if (nodeIds.length > 0) {
            setFetchingRelationships(true)

            const nodeIdList = nodeIds.join(',')
            const relationshipQuery = `
              MATCH (a)-[r]->(b)
              WHERE id(a) IN [${nodeIdList}] AND id(b) IN [${nodeIdList}]
              RETURN DISTINCT a, r, b
            `

            try {
              const response = await fetch('/api/database/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: relationshipQuery })
              })

              const data = await response.json()

              if (data.success && data.results && data.results.length > 0) {
                const combinedResults = [...results, ...data.results]
                const finalData = serviceRef.current.extractGraphData(combinedResults)
                setRawData(finalData)
              } else {
                setRawData(initialData)
              }
            } catch (queryErr) {
              console.warn('Failed to fetch relationships:', queryErr)
              setRawData(initialData)
            } finally {
              setFetchingRelationships(false)
            }
          } else {
            setRawData(initialData)
          }
        } else {
          // If we already have edges, filter to only include nodes from RETURN clause
          const nodeIds = initialData.nodes
            .map(n => n.nodeId)
            .filter((id): id is number => id !== undefined)

          if (nodeIds.length > 0) {
            const allowedNodeIdsSet = new Set(nodeIds)
            const filteredData = serviceRef.current.extractGraphData(results, allowedNodeIdsSet)
            setRawData(filteredData)
          } else {
            setRawData(initialData)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to extract graph data')
        setRawData(null)
      }
    }

    fetchGraphData()
  }, [results])

  // 2. Apply visualization settings to rawData to create graphData
  useEffect(() => {
    if (!rawData) {
      setGraphData(null)
      if (onGraphDataChange) onGraphDataChange({ nodes: [], edges: [] })
      return
    }

    // Always apply config, even if partial, or fallback to rawData if services missing
    if (!visualizationServiceRef.current) {
      setGraphData(rawData)
      if (onGraphDataChange) onGraphDataChange(rawData)
      return
    }

    try {
      const visService = visualizationServiceRef.current

      // Deep copy to prevent mutation of rawData
      // We need to clone nodes and edges because d3 modifies them directly (x, y, vx, vy)
      // and we want rawData to remain clean for re-application of different layouts
      // Use JSON parse/stringify for deep clone to remove d3 internal properties if needed, 
      // but simplistic spread is safer for preserving object types if they matter. 
      // D3 nodes are objects.
      const nodesCopy = rawData.nodes.map(n => ({ ...n }))
      const edgesCopy = rawData.edges.map(e => ({ ...e }))

      let finalNodes = nodesCopy
      let finalEdges = edgesCopy

      if (visualizationConfig) {
        // Set node/edge values for size/width calculations
        if (visualizationConfig.nodeSizeBy?.property) {
          visService.setNodeValues(finalNodes, visualizationConfig.nodeSizeBy.property)
        }
        if (visualizationConfig.edgeWidthBy?.property) {
          visService.setEdgeValues(finalEdges, visualizationConfig.edgeWidthBy.property)
        }

        // Apply layout if not force-directed
        const isFixedLayout = visualizationConfig.layout && visualizationConfig.layout !== 'force'

        if (isFixedLayout) {
          finalNodes = visService.applyLayout(finalNodes, finalEdges, visualizationConfig)
          // Fix positions for non-force layouts
          finalNodes = finalNodes.map(node => ({
            ...node,
            fx: node.x,
            fy: node.y,
            // Ensure x and y are set from fx/fy
            x: (node.x ?? node.fx) ?? undefined,
            y: (node.y ?? node.fy) ?? undefined
          }))
        } else {
          // Clear fixed positions when switching to force layout
          finalNodes = finalNodes.map(node => ({
            ...node,
            fx: undefined,
            fy: undefined
          }))
        }

        // Apply color and size customizations
        finalNodes = finalNodes.map(node => ({
          ...node,
          _color: visService.getNodeColor(node, visualizationConfig),
          _size: visService.getNodeSize(node, visualizationConfig)
        }))

        finalEdges = finalEdges.map(edge => ({
          ...edge,
          _color: visService.getEdgeColor(edge, visualizationConfig),
          _width: visService.getEdgeWidth(edge, visualizationConfig)
        }))
      }

      const newData = {
        nodes: finalNodes,
        edges: finalEdges
      }
      setGraphData(newData)

      // Notify parent of data change with the actual rendered data
      if (onGraphDataChange) onGraphDataChange(newData)

    } catch (err) {
      console.error('Error applying visualization settings:', err)
      // Fallback
      setGraphData(rawData)
      if (onGraphDataChange) onGraphDataChange(rawData)
    }
  }, [rawData, visualizationConfig, onGraphDataChange])

  // Handle node click (show fact sheet)
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node)
    setSelectedRelationship(null) // Clear relationship selection when node is selected
  }, [])

  // Handle relationship/edge click (show relationship fact sheet)
  const handleEdgeClick = useCallback((edge: GraphEdge) => {
    setSelectedRelationship(edge)
    setSelectedNode(null) // Clear node selection when relationship is selected
  }, [])

  // Handle node double-click (toggle expand/collapse)
  const handleNodeDoubleClick = useCallback(async (node: GraphNode) => {
    if (!node.nodeId || isExpanding) return

    if (expandedNodes.has(node.nodeId)) {
      const expansion = expansionData.get(node.nodeId)

      if (expansion) {
        const nodesToRemove = expansion.nodes
        const edgesToRemove = expansion.edges

        // Update rawData directly
        setRawData(prev => {
          if (!prev) return prev

          const filteredNodes = prev.nodes.filter(n =>
            !n.nodeId || !nodesToRemove.has(n.nodeId)
          )

          const filteredEdges = prev.edges.filter(e =>
            !edgesToRemove.has(e.id)
          )

          return {
            nodes: filteredNodes,
            edges: filteredEdges
          }
        })

        setExpandedNodes(prev => {
          const newSet = new Set(prev)
          newSet.delete(node.nodeId!)
          return newSet
        })

        setExpansionData(prev => {
          const newMap = new Map(prev)
          newMap.delete(node.nodeId!)
          return newMap
        })
      } else {
        setExpandedNodes(prev => {
          const newSet = new Set(prev)
          newSet.delete(node.nodeId!)
          return newSet
        })
      }

      return
    }

    setIsExpanding(true)
    setExpandedNodes(prev => new Set(prev).add(node.nodeId!))

    try {
      const expandQuery = `
        MATCH (a)-[r]->(b)
        WHERE id(a) = ${node.nodeId} OR id(b) = ${node.nodeId}
        RETURN DISTINCT a, r, b
      `

      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: expandQuery })
      })

      const data = await response.json()

      if (data.success && data.results && data.results.length > 0) {
        const addedNodeIds = new Set<number>()
        const addedEdgeIds = new Set<string>()

        // Update rawData directly
        setRawData(prev => {
          if (!prev) return prev

          // Extract new nodes and relationships
          const currentNodeIds = new Set(prev.nodes.map(n => n.nodeId).filter(Boolean))
          const newData = serviceRef.current!.extractGraphData(data.results)

          // Add new nodes that aren't already in the graph
          const newNodes = newData.nodes.filter(n => {
            if (!n.nodeId || currentNodeIds.has(n.nodeId)) return false
            // Track as added by this expansion
            addedNodeIds.add(n.nodeId)
            return true
          })

          // Add new relationships - track which ones we're adding
          const expandedNodeId = node.nodeId!
          const newEdges = newData.edges.filter(e => {
            const sourceId = parseInt(e.source)
            const targetId = parseInt(e.target)
            const isNewEdge = !prev.edges.some(existing => existing.id === e.id)

            // Include edge if it's new AND connects to/from the expanded node
            const connectsToExpanded = sourceId === expandedNodeId || targetId === expandedNodeId

            if (isNewEdge && connectsToExpanded) {
              addedEdgeIds.add(e.id)
              return true
            }
            return false
          })

          if (newNodes.length > 0 || newEdges.length > 0) {
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
          }

          return prev
        })

        // Track what was added by this expansion
        if (addedNodeIds.size > 0 || addedEdgeIds.size > 0) {
          setExpansionData(prev => {
            const newMap = new Map(prev)
            newMap.set(node.nodeId!, {
              nodes: addedNodeIds,
              edges: addedEdgeIds
            })
            return newMap
          })
        }
      }
    } catch (err) {
      console.warn('Failed to expand node:', err)
    } finally {
      setIsExpanding(false)
    }
  }, [expandedNodes, isExpanding, expansionData])

  // Initialize and update graph
  useEffect(() => {
    if (!containerRef.current || !serviceRef.current || !graphData) return

    const container = containerRef.current
    const service = serviceRef.current

    // Handle resize
    const handleResize = () => {
      if (container && service) {
        service.resize(container.clientWidth, container.clientHeight)
      }
    }

    // Check if we have fixed positions (non-force layout)
    const hasFixedPositions = graphData.nodes.some(n => n.fx != null || n.fy != null)

    // Clean up previous graph before re-initializing
    service.cleanup()

    // Initialize graph with edge click handler (using type assertion since the type definition is incomplete)
    service.initializeGraph(container, graphData, {
      width: container.clientWidth,
      height: container.clientHeight,
      chargeStrength: hasFixedPositions ? 0 : -200,
      linkDistance: 130,
      collisionRadius: 50,
      enableDragRelease: !hasFixedPositions,
      onNodeClick: handleNodeClick,
      onNodeDoubleClick: handleNodeDoubleClick,
      onEdgeClick: handleEdgeClick
    } as Parameters<typeof service.initializeGraph>[2] & { onEdgeClick?: (edge: GraphEdge) => void })

    // For fixed layouts, stop the simulation immediately and fix positions
    if (hasFixedPositions && serviceRef.current) {
      // Use a small timeout to ensure the simulation is initialized
      setTimeout(() => {
        const serviceInstance = serviceRef.current as any
        if (!serviceInstance) return

        const sim = serviceInstance.simulation as d3.Simulation<GraphNode, GraphEdge> | null
        if (sim) {
          // Set fixed positions on all nodes
          graphData.nodes.forEach(node => {
            if (node.fx != null && node.fy != null) {
              const simNode = sim.nodes().find((n: GraphNode) => n.id === node.id)
              if (simNode) {
                simNode.fx = node.fx
                simNode.fy = node.fy
                simNode.x = node.fx
                simNode.y = node.fy
              }
            }
          })
          // Stop the simulation
          sim.stop()
          sim.alpha(0)
          // Force a tick to update positions immediately
          sim.tick()
          // Update the visual representation
          const g = serviceInstance.g
          if (g) {
            const nodes = g.selectAll('.node')
            nodes.attr('transform', (d: GraphNode) => `translate(${d.x || 0},${d.y || 0})`)

            const edges = g.selectAll('line.edge-line, line.edge-hit')
            edges
              .attr('x1', (d: GraphEdge) => {
                const source = (typeof d.source === 'object' ? d.source : null) as GraphNode | null
                return source?.x || 0
              })
              .attr('y1', (d: GraphEdge) => {
                const source = (typeof d.source === 'object' ? d.source : null) as GraphNode | null
                return source?.y || 0
              })
              .attr('x2', (d: GraphEdge) => {
                const target = (typeof d.target === 'object' ? d.target : null) as GraphNode | null
                return target?.x || 0
              })
              .attr('y2', (d: GraphEdge) => {
                const target = (typeof d.target === 'object' ? d.target : null) as GraphNode | null
                return target?.y || 0
              })

            const edgeLabels = g.selectAll('.edge-label')
            edgeLabels
              .attr('x', (d: GraphEdge) => {
                const source = (typeof d.source === 'object' ? d.source : null) as GraphNode | null
                const target = (typeof d.target === 'object' ? d.target : null) as GraphNode | null
                return ((source?.x || 0) + (target?.x || 0)) / 2
              })
              .attr('y', (d: GraphEdge) => {
                const source = (typeof d.source === 'object' ? d.source : null) as GraphNode | null
                const target = (typeof d.target === 'object' ? d.target : null) as GraphNode | null
                return ((source?.y || 0) + (target?.y || 0)) / 2
              })
          }
        }
      }, 50)
    }

    // Add resize observer
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [graphData, handleNodeClick, handleNodeDoubleClick, handleEdgeClick, containerRef])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
        (document as unknown as { mozFullScreenElement?: Element }).mozFullScreenElement ||
        (document as unknown as { msFullscreenElement?: Element }).msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)

      // Resize graph when entering/exiting fullscreen
      if (containerRef.current && serviceRef.current) {
        setTimeout(() => {
          if (containerRef.current && serviceRef.current) {
            serviceRef.current.resize(
              containerRef.current.clientWidth,
              containerRef.current.clientHeight
            )
          }
        }, 100)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [containerRef])

  const handleToggleFullscreen = async () => {
    const container = fullscreenContainerRef?.current || containerRef.current
    if (!container) return

    try {
      if (isFullscreen) {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
          await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen()
        } else if ((document as unknown as { mozCancelFullScreen?: () => Promise<void> }).mozCancelFullScreen) {
          await (document as unknown as { mozCancelFullScreen: () => Promise<void> }).mozCancelFullScreen()
        } else if ((document as unknown as { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) {
          await (document as unknown as { msExitFullscreen: () => Promise<void> }).msExitFullscreen()
        }
      } else {
        // Enter fullscreen
        if (container.requestFullscreen) {
          await container.requestFullscreen()
        } else if ((container as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
          await (container as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen()
        } else if ((container as unknown as { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen) {
          await (container as unknown as { mozRequestFullScreen: () => Promise<void> }).mozRequestFullScreen()
        } else if ((container as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
          await (container as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen()
        }
      }
    } catch (err) {
      console.error('Failed to toggle fullscreen:', err)
    }
  }

  const handleZoomIn = () => {
    serviceRef.current?.zoomIn()
  }

  const handleZoomOut = () => {
    serviceRef.current?.zoomOut()
  }

  const handleFitToView = () => {
    if (graphData && serviceRef.current) {
      serviceRef.current.fitToView(graphData.nodes)
    }
  }

  const handleResetZoom = () => {
    serviceRef.current?.resetZoom()
  }

  return {
    serviceRef,
    graphData,
    error,
    fetchingRelationships,
    selectedNode,
    setSelectedNode,
    selectedRelationship,
    setSelectedRelationship,
    isFullscreen,
    handleNodeClick,
    handleNodeDoubleClick,
    handleToggleFullscreen,
    handleZoomIn,
    handleZoomOut,
    handleFitToView,
    handleResetZoom
  }
}
