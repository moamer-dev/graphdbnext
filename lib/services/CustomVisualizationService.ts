import type { GraphNode, GraphEdge } from './GraphVisualizationService'

export type LayoutType = 'force' | 'hierarchical' | 'circular' | 'grid' | 'timeline'

export interface VisualizationConfig {
  nodeColorBy?: {
    property: string
    colorMap: Record<string, string>
    defaultColor?: string
  }
  nodeLabelColors?: Record<string, string>
  nodeSizeBy?: {
    property: string
    minSize?: number
    maxSize?: number
    scale?: 'linear' | 'log' | 'sqrt'
  }
  edgeColorBy?: {
    property: string
    colorMap: Record<string, string>
    defaultColor?: string
  }
  relationshipTypeColors?: Record<string, string>
  edgeWidthBy?: {
    property: string
    minWidth?: number
    maxWidth?: number
    scale?: 'linear' | 'log' | 'sqrt'
  }
  layout?: LayoutType
  layoutOptions?: {
    hierarchical?: {
      root?: string
      direction?: 'TB' | 'BT' | 'LR' | 'RL'
    }
    circular?: {
      radius?: number
      startAngle?: number
    }
    grid?: {
      rows?: number
      cols?: number
    }
    timeline?: {
      timeProperty: string
      timeFormat?: string
    }
  }
}

export class CustomVisualizationService {
  getNodeColor(node: GraphNode, config?: VisualizationConfig): string {
    // Priority 1: Property-based color mapping
    if (config?.nodeColorBy) {
      const { property, colorMap, defaultColor = '#6b7280' } = config.nodeColorBy
      const value = node.properties[property]

      if (value !== null && value !== undefined) {
        const valueStr = String(value)
        if (colorMap[valueStr]) {
          return colorMap[valueStr]
        }
      }
    }

    // Priority 2: Label-based color mapping
    if (config?.nodeLabelColors) {
      // Check for most specific label first
      const specificLabel = this.getSpecificLabel(node.labels)
      if (config.nodeLabelColors[specificLabel]) {
        return config.nodeLabelColors[specificLabel]
      }

      // Check any label
      for (const label of node.labels) {
        if (config.nodeLabelColors[label]) {
          return config.nodeLabelColors[label]
        }
      }
    }

    return this.getDefaultNodeColor(node.labels)
  }

  getNodeSize(node: GraphNode, config?: VisualizationConfig): number {
    const defaultSize = 15

    if (!config?.nodeSizeBy) {
      return defaultSize
    }

    const { property, minSize = 10, maxSize = 30, scale = 'linear' } = config.nodeSizeBy
    const value = node.properties[property]

    if (value === null || value === undefined || typeof value !== 'number') {
      return defaultSize
    }

    const allValues = this.getAllNodeValues(property)
    if (allValues.length === 0) {
      return defaultSize
    }

    const min = Math.min(...allValues)
    const max = Math.max(...allValues)

    if (min === max) {
      return defaultSize
    }

    let normalized: number
    if (scale === 'log') {
      normalized = (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min))
    } else if (scale === 'sqrt') {
      normalized = (Math.sqrt(value) - Math.sqrt(min)) / (Math.sqrt(max) - Math.sqrt(min))
    } else {
      normalized = (value - min) / (max - min)
    }

    return minSize + (maxSize - minSize) * normalized
  }

  getEdgeColor(edge: GraphEdge, config?: VisualizationConfig): string {
    // Priority 1: Property-based color mapping
    if (config?.edgeColorBy) {
      const { property, colorMap, defaultColor = '#999' } = config.edgeColorBy
      const value = edge.properties[property]

      if (value !== null && value !== undefined) {
        const valueStr = String(value)
        if (colorMap[valueStr]) {
          return colorMap[valueStr]
        }
      }
    }

    // Priority 2: Type-based color mapping
    if (config?.relationshipTypeColors && config.relationshipTypeColors[edge.type]) {
      return config.relationshipTypeColors[edge.type]
    }

    return '#999'
  }

  getEdgeWidth(edge: GraphEdge, config?: VisualizationConfig): number {
    const defaultWidth = 2

    if (!config?.edgeWidthBy) {
      return defaultWidth
    }

    const { property, minWidth = 1, maxWidth = 5, scale = 'linear' } = config.edgeWidthBy
    const value = edge.properties[property]

    if (value === null || value === undefined || typeof value !== 'number') {
      return defaultWidth
    }

    const allValues = this.getAllEdgeValues(property)
    if (allValues.length === 0) {
      return defaultWidth
    }

    const min = Math.min(...allValues)
    const max = Math.max(...allValues)

    if (min === max) {
      return defaultWidth
    }

    let normalized: number
    if (scale === 'log') {
      normalized = (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min))
    } else if (scale === 'sqrt') {
      normalized = (Math.sqrt(value) - Math.sqrt(min)) / (Math.sqrt(max) - Math.sqrt(min))
    } else {
      normalized = (value - min) / (max - min)
    }

    return minWidth + (maxWidth - minWidth) * normalized
  }

  applyLayout(
    nodes: GraphNode[],
    edges: GraphEdge[],
    config?: VisualizationConfig
  ): GraphNode[] {
    const layout = config?.layout || 'force'
    const options = config?.layoutOptions

    switch (layout) {
      case 'hierarchical':
        return this.applyHierarchicalLayout(nodes, edges, options?.hierarchical)
      case 'circular':
        return this.applyCircularLayout(nodes, edges, options?.circular)
      case 'grid':
        return this.applyGridLayout(nodes, edges, options?.grid)
      case 'timeline':
        return this.applyTimelineLayout(nodes, edges, options?.timeline)
      default:
        return nodes
    }
  }

  private applyHierarchicalLayout(
    nodes: GraphNode[],
    edges: GraphEdge[],
    options?: { root?: string; direction?: 'TB' | 'BT' | 'LR' | 'RL' }
  ): GraphNode[] {
    const rootId = options?.root
    const direction = options?.direction || 'TB'

    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const children = new Map<string, string[]>()
    const levels = new Map<string, number>()

    const root = rootId ? nodeMap.get(rootId) : nodes[0]
    if (!root) return nodes

    const visited = new Set<string>()
    const queue: Array<{ node: GraphNode; level: number }> = [{ node: root, level: 0 }]
    visited.add(root.id)
    levels.set(root.id, 0)

    while (queue.length > 0) {
      const { node, level } = queue.shift()!

      edges
        .filter(e => e.source === node.id)
        .forEach(edge => {
          if (!visited.has(edge.target)) {
            visited.add(edge.target)
            levels.set(edge.target, level + 1)
            queue.push({ node: nodeMap.get(edge.target)!, level: level + 1 })

            if (!children.has(node.id)) {
              children.set(node.id, [])
            }
            children.get(node.id)!.push(edge.target)
          }
        })
    }

    const levelGroups = new Map<number, GraphNode[]>()
    nodes.forEach(node => {
      const level = levels.get(node.id) || 0
      if (!levelGroups.has(level)) {
        levelGroups.set(level, [])
      }
      levelGroups.get(level)!.push(node)
    })

    const maxLevel = Math.max(...Array.from(levelGroups.keys()))
    const width = 800
    const height = 600
    const levelHeight = height / (maxLevel + 1)

    nodes.forEach(node => {
      const level = levels.get(node.id) || 0
      const levelNodes = levelGroups.get(level)!
      const index = levelNodes.indexOf(node)
      const levelWidth = width / (levelNodes.length + 1)

      if (direction === 'TB' || direction === 'BT') {
        node.x = levelWidth * (index + 1)
        node.y = levelHeight * (level + 1)
      } else {
        node.x = levelHeight * (level + 1)
        node.y = levelWidth * (index + 1)
      }
    })

    return nodes
  }

  private applyCircularLayout(
    nodes: GraphNode[],
    edges: GraphEdge[],
    options?: { radius?: number; startAngle?: number }
  ): GraphNode[] {
    const radius = options?.radius || 200
    const startAngle = options?.startAngle || 0
    const centerX = 400
    const centerY = 300

    const angleStep = (2 * Math.PI) / nodes.length

    nodes.forEach((node, i) => {
      const angle = startAngle + i * angleStep
      node.x = centerX + radius * Math.cos(angle)
      node.y = centerY + radius * Math.sin(angle)
    })

    return nodes
  }

  private applyGridLayout(
    nodes: GraphNode[],
    edges: GraphEdge[],
    options?: { rows?: number; cols?: number }
  ): GraphNode[] {
    const cols = options?.cols || Math.ceil(Math.sqrt(nodes.length))
    const rows = options?.rows || Math.ceil(nodes.length / cols)
    const cellWidth = 800 / cols
    const cellHeight = 600 / rows

    nodes.forEach((node, i) => {
      const row = Math.floor(i / cols)
      const col = i % cols
      node.x = col * cellWidth + cellWidth / 2
      node.y = row * cellHeight + cellHeight / 2
    })

    return nodes
  }

  private applyTimelineLayout(
    nodes: GraphNode[],
    edges: GraphEdge[],
    options?: { timeProperty: string; timeFormat?: string }
  ): GraphNode[] {
    if (!options?.timeProperty) {
      return nodes
    }

    const timeValues: number[] = []

    nodes.forEach(node => {
      const timeValue = node.properties[options.timeProperty!]
      if (timeValue) {
        const date = new Date(String(timeValue))
        if (!isNaN(date.getTime())) {
          timeValues.push(date.getTime())
        }
      }
    })

    if (timeValues.length === 0) {
      return nodes
    }

    const minTime = Math.min(...timeValues)
    const maxTime = Math.max(...timeValues)
    const timeRange = maxTime - minTime || 1

    const width = 800
    const height = 600
    const verticalSpacing = height / nodes.length

    nodes.forEach((node, i) => {
      const timeValue = node.properties[options.timeProperty!]
      if (timeValue) {
        const date = new Date(String(timeValue))
        if (!isNaN(date.getTime())) {
          const normalized = (date.getTime() - minTime) / timeRange
          node.x = normalized * width
        } else {
          node.x = width / 2
        }
      } else {
        node.x = width / 2
      }
      node.y = i * verticalSpacing + verticalSpacing / 2
    })

    return nodes
  }

  private getDefaultNodeColor(labels: string[]): string {
    const colorMap: Record<string, string> = {
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

    for (const label of labels) {
      if (colorMap[label]) {
        return colorMap[label]
      }
    }

    return '#6b7280'
  }

  setNodeValues(nodes: GraphNode[], property: string): void {
    this.nodeValuesCache = nodes
      .map(n => n.properties[property])
      .filter((v): v is number => typeof v === 'number')
    this.currentNodeProperty = property
  }

  setEdgeValues(edges: GraphEdge[], property: string): void {
    this.edgeValuesCache = edges
      .map(e => e.properties[property])
      .filter((v): v is number => typeof v === 'number')
    this.currentEdgeProperty = property
  }

  private nodeValuesCache: number[] = []
  private edgeValuesCache: number[] = []
  private currentNodeProperty = ''
  private currentEdgeProperty = ''

  private getAllNodeValues(property: string): number[] {
    if (property === this.currentNodeProperty) {
      return this.nodeValuesCache
    }
    return []
  }

  private getAllEdgeValues(property: string): number[] {
    if (property === this.currentEdgeProperty) {
      return this.edgeValuesCache
    }
    return []
  }

  /**
   * Get the most specific label (filter out generic labels)
   */
  private getSpecificLabel(labels: string[]): string {
    const genericLabels = ['Thing', 'TextUnit', 'VisualUnit', 'GraphicalUnit', 'GrammaticalUnit', 'MorphologicalUnit', 'TextInformationLayer', 'PoetologicalUnit']
    const specificLabels = labels.filter(label => !genericLabels.includes(label))
    return specificLabels.length > 0 ? specificLabels[specificLabels.length - 1] : labels[labels.length - 1] || 'Node'
  }
}

