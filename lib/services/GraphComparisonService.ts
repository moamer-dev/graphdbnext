import type { GraphNode, GraphEdge, GraphData } from './GraphVisualizationService'

export interface GraphComparisonResult {
  addedNodes: GraphNode[]
  removedNodes: GraphNode[]
  modifiedNodes: Array<{ node: GraphNode; changes: Record<string, { old: unknown; new: unknown }> }>
  addedEdges: GraphEdge[]
  removedEdges: GraphEdge[]
  modifiedEdges: Array<{ edge: GraphEdge; changes: Record<string, { old: unknown; new: unknown }> }>
  statistics: {
    nodesAdded: number
    nodesRemoved: number
    nodesModified: number
    edgesAdded: number
    edgesRemoved: number
    edgesModified: number
  }
}

export class GraphComparisonService {
  compareGraphs(graph1: GraphData, graph2: GraphData): GraphComparisonResult {
    const nodeMap1 = new Map<string, GraphNode>()
    const nodeMap2 = new Map<string, GraphNode>()
    const edgeMap1 = new Map<string, GraphEdge>()
    const edgeMap2 = new Map<string, GraphEdge>()

    graph1.nodes.forEach(node => nodeMap1.set(node.id, node))
    graph2.nodes.forEach(node => nodeMap2.set(node.id, node))
    graph1.edges.forEach(edge => edgeMap1.set(edge.id, edge))
    graph2.edges.forEach(edge => edgeMap2.set(edge.id, edge))

    const addedNodes: GraphNode[] = []
    const removedNodes: GraphNode[] = []
    const modifiedNodes: Array<{ node: GraphNode; changes: Record<string, { old: unknown; new: unknown }> }> = []

    for (const [id, node2] of nodeMap2) {
      const node1 = nodeMap1.get(id)
      if (!node1) {
        addedNodes.push(node2)
      } else {
        const changes = this.compareNodeProperties(node1, node2)
        if (Object.keys(changes).length > 0) {
          modifiedNodes.push({ node: node2, changes })
        }
      }
    }

    for (const [id, node1] of nodeMap1) {
      if (!nodeMap2.has(id)) {
        removedNodes.push(node1)
      }
    }

    const addedEdges: GraphEdge[] = []
    const removedEdges: GraphEdge[] = []
    const modifiedEdges: Array<{ edge: GraphEdge; changes: Record<string, { old: unknown; new: unknown }> }> = []

    for (const [id, edge2] of edgeMap2) {
      const edge1 = edgeMap1.get(id)
      if (!edge1) {
        addedEdges.push(edge2)
      } else {
        const changes = this.compareEdgeProperties(edge1, edge2)
        if (Object.keys(changes).length > 0) {
          modifiedEdges.push({ edge: edge2, changes })
        }
      }
    }

    for (const [id, edge1] of edgeMap1) {
      if (!edgeMap2.has(id)) {
        removedEdges.push(edge1)
      }
    }

    return {
      addedNodes,
      removedNodes,
      modifiedNodes,
      addedEdges,
      removedEdges,
      modifiedEdges,
      statistics: {
        nodesAdded: addedNodes.length,
        nodesRemoved: removedNodes.length,
        nodesModified: modifiedNodes.length,
        edgesAdded: addedEdges.length,
        edgesRemoved: removedEdges.length,
        edgesModified: modifiedEdges.length
      }
    }
  }

  private compareNodeProperties(node1: GraphNode, node2: GraphNode): Record<string, { old: unknown; new: unknown }> {
    const changes: Record<string, { old: unknown; new: unknown }> = {}

    const allKeys = new Set([...Object.keys(node1.properties), ...Object.keys(node2.properties)])

    for (const key of allKeys) {
      const val1 = node1.properties[key]
      const val2 = node2.properties[key]

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        changes[key] = { old: val1, new: val2 }
      }
    }

    if (JSON.stringify(node1.labels) !== JSON.stringify(node2.labels)) {
      changes['__labels__'] = { old: node1.labels, new: node2.labels }
    }

    return changes
  }

  private compareEdgeProperties(edge1: GraphEdge, edge2: GraphEdge): Record<string, { old: unknown; new: unknown }> {
    const changes: Record<string, { old: unknown; new: unknown }> = {}

    if (edge1.type !== edge2.type) {
      changes['type'] = { old: edge1.type, new: edge2.type }
    }

    if (edge1.source !== edge2.source || edge1.target !== edge2.target) {
      changes['__connection__'] = {
        old: { source: edge1.source, target: edge1.target },
        new: { source: edge2.source, target: edge2.target }
      }
    }

    const allKeys = new Set([...Object.keys(edge1.properties), ...Object.keys(edge2.properties)])

    for (const key of allKeys) {
      const val1 = edge1.properties[key]
      const val2 = edge2.properties[key]

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        changes[key] = { old: val1, new: val2 }
      }
    }

    return changes
  }

  highlightDifferences(
    graph: GraphData,
    comparison: GraphComparisonResult
  ): {
    nodes: Map<string, 'added' | 'removed' | 'modified' | 'unchanged'>
    edges: Map<string, 'added' | 'removed' | 'modified' | 'unchanged'>
  } {
    const nodeStatus = new Map<string, 'added' | 'removed' | 'modified' | 'unchanged'>()
    const edgeStatus = new Map<string, 'added' | 'removed' | 'modified' | 'unchanged'>()

    graph.nodes.forEach(node => {
      if (comparison.addedNodes.some(n => n.id === node.id)) {
        nodeStatus.set(node.id, 'added')
      } else if (comparison.removedNodes.some(n => n.id === node.id)) {
        nodeStatus.set(node.id, 'removed')
      } else if (comparison.modifiedNodes.some(m => m.node.id === node.id)) {
        nodeStatus.set(node.id, 'modified')
      } else {
        nodeStatus.set(node.id, 'unchanged')
      }
    })

    graph.edges.forEach(edge => {
      if (comparison.addedEdges.some(e => e.id === edge.id)) {
        edgeStatus.set(edge.id, 'added')
      } else if (comparison.removedEdges.some(e => e.id === edge.id)) {
        edgeStatus.set(edge.id, 'removed')
      } else if (comparison.modifiedEdges.some(m => m.edge.id === edge.id)) {
        edgeStatus.set(edge.id, 'modified')
      } else {
        edgeStatus.set(edge.id, 'unchanged')
      }
    })

    return { nodes: nodeStatus, edges: edgeStatus }
  }
}

