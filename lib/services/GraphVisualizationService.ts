import * as d3 from 'd3'

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  labels: string[]
  properties: Record<string, unknown>
  nodeId?: number
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
  properties: Record<string, unknown>
  relationshipId?: number
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export class GraphVisualizationService {
  private simulation: d3.Simulation<GraphNode, GraphEdge> | null = null
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
  private g: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
  private width: number = 0
  private height: number = 0
  private onNodeClick?: (node: GraphNode) => void
  private onNodeDoubleClick?: (node: GraphNode) => void
  private onEdgeClick?: (edge: GraphEdge) => void
  private enableDragRelease: boolean = true

  /**
   * Extract nodes and edges from query results
   * @param results - Query results
   * @param allowedNodeIds - Optional set of node IDs to include (for filtering to RETURN clause only)
   */
  extractGraphData(results: unknown[], allowedNodeIds?: Set<number>): GraphData {
    // Use node ID as the key to avoid duplicates
    const nodeMap = new Map<number, GraphNode>()
    const edgeMap = new Map<string, GraphEdge>()
    const relationshipsToProcess: Array<{ id: number, type: string, start: number, end: number, properties: Record<string, unknown> }> = []

    // First pass: collect all nodes and collect relationships for later processing
    results.forEach((result: unknown) => {
      if (!result || typeof result !== 'object') return

      const resultObj = result as Record<string, unknown>
      Object.entries(resultObj).forEach(([, value]) => {
        // Handle node objects
        if (value && typeof value === 'object' && 'id' in value && 'labels' in value) {
          const node = value as { id: number, labels: string[], properties: Record<string, unknown> }

          // Only include nodes that are in the allowed set (if provided)
          if (allowedNodeIds && !allowedNodeIds.has(node.id)) {
            return
          }

          // Use node ID as key to ensure deduplication
          if (!nodeMap.has(node.id)) {
            nodeMap.set(node.id, {
              id: String(node.id),
              labels: node.labels,
              properties: node.properties,
              nodeId: node.id
            })
          }
        }

        // Collect relationships for processing after all nodes are added
        if (value && typeof value === 'object' && 'type' in value && 'start' in value && 'end' in value) {
          const rel = value as { id: number, type: string, start: number, end: number, properties: Record<string, unknown> }
          relationshipsToProcess.push(rel)
        }
      })
    })

    // Second pass: process relationships now that all nodes are in the map
    // Only include relationships where both nodes are in the allowed set
    relationshipsToProcess.forEach(rel => {
      const edgeKey = `rel_${rel.id}`

      // Check if both nodes exist and are allowed
      const sourceAllowed = !allowedNodeIds || allowedNodeIds.has(rel.start)
      const targetAllowed = !allowedNodeIds || allowedNodeIds.has(rel.end)

      if (nodeMap.has(rel.start) && nodeMap.has(rel.end) && sourceAllowed && targetAllowed) {
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            id: edgeKey,
            source: String(rel.start),
            target: String(rel.end),
            type: rel.type,
            properties: rel.properties,
            relationshipId: rel.id
          })
        }
      }
    })

    return {
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values())
    }
  }

  /**
   * Initialize the D3 force-directed graph
   */
  initializeGraph(
    container: HTMLElement,
    data: GraphData,
    options?: {
      width?: number
      height?: number
      chargeStrength?: number
      linkDistance?: number
      collisionRadius?: number
      onNodeClick?: (node: GraphNode) => void
      onNodeDoubleClick?: (node: GraphNode) => void
      onEdgeClick?: (edge: GraphEdge) => void
      enableDragRelease?: boolean
    }
  ): void {
    // Clear previous simulation
    this.cleanup()

    this.enableDragRelease = options?.enableDragRelease ?? true

    this.width = options?.width || container.clientWidth || 800
    this.height = options?.height || container.clientHeight || 600

    // Create SVG
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)

    // Create container for zoom
    this.g = this.svg.append('g')

    // Add zoom behavior
    this.zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        if (this.g) {
          this.g.attr('transform', event.transform)
        }
      })

    this.svg.call(this.zoom)

    // Create arrow markers for edges
    this.svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999')

    // Initialize node positions to spread them out initially
    // Skip if nodes already have fixed positions (fx/fy) from custom layouts
    const hasFixedPositions = data.nodes.some(n => n.fx != null || n.fy != null)
    const nodeCount = data.nodes.length
    if (nodeCount > 0 && !hasFixedPositions) {
      const angleStep = (2 * Math.PI) / nodeCount
      const radius = Math.min(this.width, this.height) / 3

      data.nodes.forEach((node, i) => {
        if (node.x == null && node.y == null) {
          const angle = i * angleStep
          node.x = this.width / 2 + radius * Math.cos(angle)
          node.y = this.height / 2 + radius * Math.sin(angle)
        }
      })
    } else if (hasFixedPositions) {
      // For fixed layouts, set x/y from fx/fy if not already set
      data.nodes.forEach((node) => {
        if (node.fx != null && node.x == null) {
          node.x = node.fx
        }
        if (node.fy != null && node.y == null) {
          node.y = node.fy
        }
      })
    }

    // Create force simulation
    this.simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink<GraphNode, GraphEdge>(data.edges)
        .id((d) => {
          const node = d as GraphNode
          return node.id
        })
        .distance(options?.linkDistance || 80)
      )
      .force('charge', d3.forceManyBody().strength(options?.chargeStrength || -200))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(options?.collisionRadius || 50))
      .alphaDecay(0.1) // Faster decay - simulation cools down quicker
      .velocityDecay(0.6) // Higher damping - nodes slow down faster
      .alpha(1) // Start with full energy to spread nodes out initially

    // Create edges group
    const edgesGroup = this.g!.append('g').attr('class', 'edges')

    // Create invisible hit areas for edges (thicker, invisible lines for easier clicking)
    const edgeHits = edgesGroup
      .selectAll('line.edge-hit')
      .data(data.edges)
      .enter().append('line')
      .attr('class', 'edge-hit')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 20)
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent, d: GraphEdge) => {
        event.stopPropagation()
        options?.onEdgeClick?.(d)
      })

    // Create visible edges
    const edges = edgesGroup
      .selectAll('line.edge-line')
      .data(data.edges)
      .enter().append('line')
      .attr('class', 'edge-line')
      .attr('stroke', (d: GraphEdge) => (d as any)._color || '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: GraphEdge) => (d as any)._width || 2)
      .attr('marker-end', 'url(#arrowhead)')
      .style('pointer-events', 'none')

    // Create edge labels
    const edgeLabels = this.g!.append('g')
      .attr('class', 'edge-labels')
      .selectAll('text')
      .data(data.edges)
      .enter().append('text')
      .attr('class', 'edge-label')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .style('cursor', 'pointer')
      .text((d: GraphEdge) => d.type)
      .on('click', (event: MouseEvent, d: GraphEdge) => {
        event.stopPropagation()
        options?.onEdgeClick?.(d)
      })

    // Create nodes
    const nodes = this.g!.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(this.drag() as never)

    // Store event handlers for later use in updateGraph
    this.onNodeClick = options?.onNodeClick
    this.onNodeDoubleClick = options?.onNodeDoubleClick
    this.onEdgeClick = options?.onEdgeClick

    // Add click and double-click handlers
    if (options?.onNodeClick) {
      nodes.on('click', (event: MouseEvent, d: GraphNode) => {
        event.stopPropagation()
        options.onNodeClick?.(d)
      })
    }

    if (options?.onNodeDoubleClick) {
      nodes.on('dblclick', (event: MouseEvent, d: GraphNode) => {
        event.stopPropagation()
        options.onNodeDoubleClick?.(d)
      })
    }

    // Add circles for nodes
    nodes.append('circle')
      .attr('r', (d: GraphNode) => (d as any)._size || 15)
      .attr('fill', (d: GraphNode) => (d as any)._color || this.getNodeColor(d.labels))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')

    // Add labels for nodes
    nodes.append('text')
      .attr('dx', 20)
      .attr('dy', 5)
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text((d: GraphNode) => {
        const formattedLabel = this.getFormattedLabel(d.labels, d.properties)
        // For Character and Sign nodes, we already have the text in the formatted label
        // For other nodes, show the id if available
        if (formattedLabel.includes('"')) {
          // Already formatted with text (Character or Sign)
          return formattedLabel
        }
        const id = d.properties.id as string
        return id ? `${formattedLabel}: ${id}` : formattedLabel
      })

    // Add tooltips
    nodes.append('title')
      .text((d: GraphNode) => {
        const labels = d.labels.join(', ')
        const props = JSON.stringify(d.properties, null, 2)
        return `Labels: ${labels}\nProperties:\n${props}`
      })

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      // Update hit areas and visible edges
      const updateEdgePositions = (edgeSelection: d3.Selection<SVGLineElement, GraphEdge, SVGGElement, unknown>) => {
        edgeSelection
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
      }

      updateEdgePositions(this.g!.selectAll('line.edge-hit'))
      updateEdgePositions(this.g!.selectAll('line.edge-line'))

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

      nodes
        .attr('transform', (d: GraphNode) => `translate(${d.x || 0},${d.y || 0})`)
    })
  }

  /**
   * Get color for node based on labels
   */
  private getNodeColor(labels: string[]): string {
    const specificLabel = this.getSpecificLabel(labels)
    const colors: Record<string, string> = {
      Word: '#3b82f6',
      Seg: '#10b981',
      Sign: '#f59e0b',
      Character: '#ef4444',
      Phrase: '#8b5cf6',
      Part: '#ec4899',
      Line: '#06b6d4',
      Surface: '#14b8a6',
      Column: '#f97316'
    }
    return colors[specificLabel] || '#6b7280'
  }

  /**
   * Get the most specific label (filter out generic labels)
   */
  private getSpecificLabel(labels: string[]): string {
    const genericLabels = ['Thing', 'TextUnit', 'VisualUnit', 'GraphicalUnit', 'GrammaticalUnit', 'MorphologicalUnit', 'TextInformationLayer', 'PoetologicalUnit']
    const specificLabels = labels.filter(label => !genericLabels.includes(label))
    return specificLabels.length > 0 ? specificLabels[specificLabels.length - 1] : labels[labels.length - 1] || 'Node'
  }

  /**
   * Get formatted label with text property for Character and Sign nodes
   */
  private getFormattedLabel(labels: string[], properties: Record<string, unknown>): string {
    const specificLabel = this.getSpecificLabel(labels)
    // For Character and Sign nodes, append the text property
    if ((specificLabel === 'Character' || specificLabel === 'Sign') && properties.text) {
      return `${specificLabel}: "${String(properties.text)}"`
    }
    return specificLabel
  }

  /**
   * Create drag behavior for nodes
   */
  private drag() {
    return d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active && this.simulation) {
          this.simulation.alphaTarget(0.1).restart()
        }
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active && this.simulation) {
          this.simulation.alphaTarget(0)
        }
        if (this.enableDragRelease) {
          d.fx = null
          d.fy = null
        }
      })
  }

  /**
   * Update graph data
   */
  updateGraph(data: GraphData, options?: {
    linkDistance?: number
    chargeStrength?: number
    collisionRadius?: number
    parentNodeId?: string | number
  }): void {
    if (!this.simulation || !this.svg) return

    const g = this.svg.select('g')

    // Get existing nodes to find parent node position for new nodes
    const existingNodes = this.simulation.nodes() as GraphNode[]
    const parentNode = options?.parentNodeId
      ? existingNodes.find(n => n.id === String(options.parentNodeId) || n.nodeId === options.parentNodeId)
      : null

    // Position new nodes in a circle around the parent node if available
    const newNodes = data.nodes.filter(newNode =>
      !existingNodes.some(existing => existing.id === newNode.id)
    )

    if (parentNode && parentNode.x != null && parentNode.y != null && newNodes.length > 0) {
      const angleStep = (2 * Math.PI) / newNodes.length
      const radius = options?.linkDistance ? options.linkDistance * 1.5 : 300 // Position further from parent

      newNodes.forEach((node, i) => {
        if (node.x == null || node.y == null) {
          const angle = i * angleStep
          node.x = parentNode.x! + radius * Math.cos(angle)
          node.y = parentNode.y! + radius * Math.sin(angle)
        }
      })
    }

    // Update edge hit areas
    const edgeHits = g.select('.edges').selectAll<SVGLineElement, GraphEdge>('line.edge-hit')
      .data(data.edges, d => d.id)

    edgeHits.exit().remove()

    const edgeHitsEnter = edgeHits.enter().append('line')
      .attr('class', 'edge-hit')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 20)
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent, d: GraphEdge) => {
        event.stopPropagation()
        this.onEdgeClick?.(d)
      })

    edgeHitsEnter.merge(edgeHits)

    // Update visible edges using enter/update/exit pattern
    const edges = g.select('.edges').selectAll<SVGLineElement, GraphEdge>('line.edge-line')
      .data(data.edges, d => d.id)

    // Remove old edges
    edges.exit().remove()

    // Add new edges
    edges.enter().append('line')
      .attr('class', 'edge-line')
      .attr('stroke', (d: GraphEdge) => (d as any)._color || '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: GraphEdge) => (d as any)._width || 2)
      .attr('marker-end', 'url(#arrowhead)')
      .style('pointer-events', 'none')
      .merge(edges)

    // Update edge labels
    const edgeLabels = g.select('.edge-labels').selectAll<SVGTextElement, GraphEdge>('text')
      .data(data.edges, d => d.id)

    edgeLabels.exit().remove()

    const edgeLabelsEnter = edgeLabels.enter().append('text')
      .attr('class', 'edge-label')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent, d: GraphEdge) => {
        event.stopPropagation()
        this.onEdgeClick?.(d)
      })

    const edgeLabelsUpdate = edgeLabelsEnter.merge(edgeLabels)
    edgeLabelsUpdate.text(d => d.type)

    // Re-attach click handlers for edge labels
    edgeLabelsUpdate.on('click', (event: MouseEvent, d: GraphEdge) => {
      event.stopPropagation()
      this.onEdgeClick?.(d)
    })

    // Update nodes using enter/update/exit pattern
    const nodes = g.select('.nodes').selectAll<SVGGElement, GraphNode>('g.node')
      .data(data.nodes, d => d.id)

    nodes.exit().remove()

    const nodesEnter = nodes.enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(this.drag() as never)

    // Re-attach event handlers for new nodes
    if (this.onNodeClick) {
      nodesEnter.on('click', (event, d) => {
        event.stopPropagation()
        this.onNodeClick?.(d)
      })
    }

    if (this.onNodeDoubleClick) {
      nodesEnter.on('dblclick', (event, d) => {
        event.stopPropagation()
        this.onNodeDoubleClick?.(d)
      })
    }

    // Add circle and text for new nodes
    nodesEnter.append('circle')
      .attr('r', (d) => (d as any)._size || 15)
      .attr('fill', (d) => (d as any)._color || this.getNodeColor(d.labels))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')

    nodesEnter.append('text')
      .attr('dx', 20)
      .attr('dy', 5)
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text((d) => {
        const formattedLabel = this.getFormattedLabel(d.labels, d.properties)
        if (formattedLabel.includes('"')) {
          return formattedLabel
        }
        const id = d.properties.id as string
        return id ? `${formattedLabel}: ${id}` : formattedLabel
      })

    nodesEnter.append('title')
      .text((d) => {
        const labels = d.labels.join(', ')
        const props = JSON.stringify(d.properties, null, 2)
        return `Labels: ${labels}\nProperties:\n${props}`
      })

    // Update existing node colors and labels
    nodes.select('circle')
      .attr('r', (d) => (d as any)._size || 15)
      .attr('fill', (d) => (d as any)._color || this.getNodeColor(d.labels))

    nodes.select('text')
      .text((d) => {
        const formattedLabel = this.getFormattedLabel(d.labels, d.properties)
        if (formattedLabel.includes('"')) {
          return formattedLabel
        }
        const id = d.properties.id as string
        return id ? `${formattedLabel}: ${id}` : formattedLabel
      })

    // Update simulation with new force parameters if provided
    this.simulation.nodes(data.nodes)

    // Update links with new distance if provided
    const linkForce = this.simulation.force('link') as d3.ForceLink<GraphNode, GraphEdge>
    if (linkForce) {
      linkForce.links(data.edges)
      if (options?.linkDistance !== undefined) {
        linkForce.distance(options.linkDistance)
      }
    }

    // Update charge strength if provided
    if (options?.chargeStrength !== undefined) {
      const chargeForce = this.simulation.force('charge') as d3.ForceManyBody<GraphNode>
      if (chargeForce) {
        chargeForce.strength(options.chargeStrength)
      }
    }

    // Update collision radius if provided
    if (options?.collisionRadius !== undefined) {
      const collisionForce = this.simulation.force('collision') as d3.ForceCollide<GraphNode>
      if (collisionForce) {
        collisionForce.radius(options.collisionRadius)
      }
    }

    this.simulation.alpha(0.5).restart() // Higher alpha for more movement when new nodes are added
  }

  /**
   * Resize graph
   */
  resize(width: number, height: number): void {
    this.width = width
    this.height = height

    if (this.svg) {
      this.svg.attr('width', width).attr('height', height)
    }

    if (this.simulation) {
      const centerForce = this.simulation.force('center') as d3.ForceCenter<d3.SimulationNodeDatum>
      if (centerForce) {
        centerForce.x(width / 2).y(height / 2)
      }
      this.simulation.alpha(0.3).restart()
    }
  }

  /**
   * Zoom in
   */
  zoomIn(): void {
    if (this.svg && this.zoom) {
      this.svg.transition().call(this.zoom.scaleBy, 1.5)
    }
  }

  /**
   * Zoom out
   */
  zoomOut(): void {
    if (this.svg && this.zoom) {
      this.svg.transition().call(this.zoom.scaleBy, 1 / 1.5)
    }
  }

  /**
   * Reset zoom and pan to default
   */
  resetZoom(): void {
    if (this.svg && this.zoom) {
      this.svg.transition().call(this.zoom.transform, d3.zoomIdentity)
    }
  }

  /**
   * Fit the graph to view all nodes
   */
  fitToView(nodes: GraphNode[]): void {
    if (!this.svg || !this.zoom || !this.g || nodes.length === 0) return

    // Wait a bit for simulation to settle if it's running
    if (this.simulation && this.simulation.alpha() > 0) {
      // If simulation is still running, wait for it to settle
      const checkInterval = setInterval(() => {
        if (!this.simulation || this.simulation.alpha() <= 0.1) {
          clearInterval(checkInterval)
          this.performFitToView(nodes)
        }
      }, 100)

      // Fallback timeout
      setTimeout(() => {
        clearInterval(checkInterval)
        this.performFitToView(nodes)
      }, 2000)
    } else {
      this.performFitToView(nodes)
    }
  }

  /**
   * Perform the actual fit to view calculation
   */
  private performFitToView(nodes: GraphNode[]): void {
    if (!this.svg || !this.zoom || nodes.length === 0) return

    // Filter nodes that have valid positions
    const nodesWithPositions = nodes.filter(n => n.x != null && n.y != null && !isNaN(n.x) && !isNaN(n.y))

    if (nodesWithPositions.length === 0) {
      // If no nodes have positions yet, just reset zoom
      this.resetZoom()
      return
    }

    // Get bounding box of all nodes
    const xCoords = nodesWithPositions.map(n => n.x!)
    const yCoords = nodesWithPositions.map(n => n.y!)

    const minX = Math.min(...xCoords)
    const maxX = Math.max(...xCoords)
    const minY = Math.min(...yCoords)
    const maxY = Math.max(...yCoords)

    const padding = 50
    const graphWidth = maxX - minX || 1
    const graphHeight = maxY - minY || 1

    // Calculate scale to fit
    const scaleX = (this.width - padding * 2) / graphWidth
    const scaleY = (this.height - padding * 2) / graphHeight
    const scale = Math.min(scaleX, scaleY, 2) // Cap at 2x zoom

    // Calculate center
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    // Calculate translation to center the graph
    const translateX = this.width / 2 - centerX * scale
    const translateY = this.height / 2 - centerY * scale

    const transform = d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(scale)

    this.svg.transition()
      .duration(750)
      .call(this.zoom.transform, transform)
  }

  /**
   * Cleanup and destroy the graph
   */
  cleanup(): void {
    if (this.simulation) {
      this.simulation.stop()
      this.simulation = null
    }

    if (this.svg) {
      this.svg.selectAll('*').remove()
      this.svg.remove()
      this.svg = null
    }

    this.g = null
    this.zoom = null
  }
}

