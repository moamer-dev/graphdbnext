'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { GraphVisualizationService, GraphData, GraphNode, GraphEdge } from '@/lib/services/GraphVisualizationService'
import { CustomVisualizationService, type VisualizationConfig } from '@/lib/services/CustomVisualizationService'
import * as d3 from 'd3'

interface UseCustomGraphViewProps {
  results: unknown[]
  loading?: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  config?: VisualizationConfig
}

export function useCustomGraphView({ results, containerRef, config }: UseCustomGraphViewProps) {
  const serviceRef = useRef<GraphVisualizationService | null>(null)
  const visualizationServiceRef = useRef<CustomVisualizationService | null>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null)

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
  }, [])

  useEffect(() => {
    if (!results || results.length === 0) {
      setGraphData(null)
      return
    }

    try {
      if (!serviceRef.current || !visualizationServiceRef.current) return

      const initialData = serviceRef.current.extractGraphData(results)
      
      let processedNodes = initialData.nodes
      const processedEdges = initialData.edges

      if (config) {
        const visService = visualizationServiceRef.current
        
        if (config.layout && config.layout !== 'force') {
          processedNodes = visService.applyLayout(processedNodes, processedEdges, config)
        }
        
        processedNodes = processedNodes.map(node => ({
          ...node,
          _color: visService.getNodeColor(node, config),
          _size: visService.getNodeSize(node, config)
        }))
      }

      setGraphData({
        nodes: processedNodes,
        edges: processedEdges.map(edge => ({
          ...edge,
          _color: config ? visualizationServiceRef.current!.getEdgeColor(edge, config) : '#999',
          _width: config ? visualizationServiceRef.current!.getEdgeWidth(edge, config) : 2
        }))
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract graph data')
      setGraphData(null)
    }
  }, [results, config])

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node)
    setSelectedEdge(null)
  }, [])

  const handleEdgeClick = useCallback((edge: GraphEdge) => {
    setSelectedEdge(edge)
    setSelectedNode(null)
  }, [])

  useEffect(() => {
    if (!containerRef.current || !serviceRef.current || !graphData) return

    const container = containerRef.current
    const service = serviceRef.current
    const isFixedLayout = config?.layout && config.layout !== 'force'

    const width = container.clientWidth || 800
    const height = container.clientHeight || 600

    service.initializeGraph(container, graphData, {
      width,
      height,
      chargeStrength: isFixedLayout ? 0 : -200,
      linkDistance: 130,
      collisionRadius: 50,
      onNodeClick: handleNodeClick,
      onNodeDoubleClick: handleNodeClick,
      onEdgeClick: handleEdgeClick
    } as Parameters<typeof service.initializeGraph>[2] & { onEdgeClick?: (edge: GraphEdge) => void })

    if (isFixedLayout && serviceRef.current) {
      setTimeout(() => {
        const sim = (serviceRef.current as any).simulation as d3.Simulation<GraphNode, GraphEdge> | null
        if (sim) {
          sim.stop()
          sim.nodes().forEach((node, i) => {
            const graphNode = graphData.nodes[i]
            if (graphNode && graphNode.x != null && graphNode.y != null) {
              node.x = graphNode.x
              node.y = graphNode.y
              node.fx = graphNode.x
              node.fy = graphNode.y
            }
          })
          sim.alpha(0)
        }
      }, 100)
    }

    const handleResize = () => {
      if (container && service) {
        service.resize(container.clientWidth, container.clientHeight)
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [graphData, config, handleNodeClick, handleEdgeClick, containerRef])

  return {
    graphData,
    error,
    selectedNode,
    setSelectedNode,
    selectedEdge,
    setSelectedEdge
  }
}

