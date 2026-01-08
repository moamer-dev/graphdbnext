import type { Node, Relationship } from '../types'

interface Position {
  x: number
  y: number
}

interface LayoutOptions {
  nodeWidth?: number
  nodeHeight?: number
  horizontalSpacing?: number
  verticalSpacing?: number
  padding?: number
}

/**
 * Calculate hierarchical layout for nodes based on relationships
 */
export function calculateHierarchicalLayout(
  nodes: Node[],
  relationships: Relationship[],
  options: LayoutOptions = {}
): Map<string, Position> {
  const {
    nodeWidth = 200,
    nodeHeight = 100,
    horizontalSpacing = 300,
    verticalSpacing = 200,
    padding = 50
  } = options

  const positions = new Map<string, Position>()
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  
  // Build adjacency lists
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  
  relationships.forEach(rel => {
    if (!outgoing.has(rel.from)) outgoing.set(rel.from, [])
    if (!incoming.has(rel.to)) incoming.set(rel.to, [])
    outgoing.get(rel.from)!.push(rel.to)
    incoming.get(rel.to)!.push(rel.from)
  })
  
  // Find root nodes (nodes with no incoming edges)
  const rootNodes = nodes.filter(node => !incoming.has(node.id) || incoming.get(node.id)!.length === 0)
  
  // If no root nodes, use nodes with fewest incoming edges
  const sortedNodes = rootNodes.length > 0 
    ? rootNodes 
    : [...nodes].sort((a, b) => {
        const aIn = incoming.get(a.id)?.length || 0
        const bIn = incoming.get(b.id)?.length || 0
        return aIn - bIn
      })
  
  // Assign levels using BFS
  const levels = new Map<string, number>()
  const visited = new Set<string>()
  const queue: Array<{ id: string; level: number }> = []
  
  // Start with root nodes
  sortedNodes.slice(0, Math.min(5, sortedNodes.length)).forEach(node => {
    queue.push({ id: node.id, level: 0 })
    visited.add(node.id)
  })
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    levels.set(id, level)
    
    const children = outgoing.get(id) || []
    children.forEach(childId => {
      if (!visited.has(childId)) {
        visited.add(childId)
        queue.push({ id: childId, level: level + 1 })
      }
    })
  }
  
  // Assign levels to unvisited nodes
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      const inCount = incoming.get(node.id)?.length || 0
      levels.set(node.id, inCount)
    }
  })
  
  // Group nodes by level
  const nodesByLevel = new Map<number, Node[]>()
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, [])
    }
    nodesByLevel.get(level)!.push(node)
  })
  
  // Calculate positions
  const maxLevel = Math.max(...Array.from(nodesByLevel.keys()))
  
  nodesByLevel.forEach((levelNodes, level) => {
    const levelWidth = levelNodes.length * horizontalSpacing
    const startX = padding + (maxLevel > 0 ? 0 : (window.innerWidth || 1200 - levelWidth) / 2)
    const y = padding + level * verticalSpacing
    
    levelNodes.forEach((node, index) => {
      const x = startX + index * horizontalSpacing
      positions.set(node.id, { x, y })
    })
  })
  
  return positions
}

/**
 * Calculate grid layout for nodes
 */
export function calculateGridLayout(
  nodes: Node[],
  options: LayoutOptions = {}
): Map<string, Position> {
  const {
    nodeWidth = 200,
    nodeHeight = 100,
    horizontalSpacing = 250,
    verticalSpacing = 150,
    padding = 50
  } = options

  const positions = new Map<string, Position>()
  const cols = Math.ceil(Math.sqrt(nodes.length))
  
  nodes.forEach((node, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    const x = padding + col * horizontalSpacing
    const y = padding + row * verticalSpacing
    positions.set(node.id, { x, y })
  })
  
  return positions
}

/**
 * Calculate circular layout for nodes
 */
export function calculateCircularLayout(
  nodes: Node[],
  options: LayoutOptions = {}
): Map<string, Position> {
  const {
    padding = 100
  } = options

  const positions = new Map<string, Position>()
  const centerX = (window.innerWidth || 1200) / 2
  const centerY = (window.innerHeight || 800) / 2
  const radius = Math.min(centerX, centerY) - padding
  const angleStep = (2 * Math.PI) / nodes.length
  
  nodes.forEach((node, index) => {
    const angle = index * angleStep
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    positions.set(node.id, { x, y })
  })
  
  return positions
}

