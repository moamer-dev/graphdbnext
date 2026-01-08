import type { Node as BuilderNode, Relationship } from '../../types'
import type { SchemaJson } from '../../types/mappingConfig'
import type { ToolCanvasNode, ToolCanvasEdge } from '../../stores/toolCanvasStore'
import type { ActionCanvasNode, ActionCanvasEdge } from '../../stores/actionCanvasStore'

export interface GraphJsonNode {
  id: number
  type: 'node'
  labels: string[]
  properties: Record<string, unknown>
}

export interface GraphJsonRelationship {
  id: number
  type: 'relationship'
  label: string
  start: number
  end: number
  properties: Record<string, unknown>
}

export type GraphJson = Array<GraphJsonNode | GraphJsonRelationship>

export interface ExecuteOptions {
  xmlContent: string
  schemaJson: SchemaJson
  nodes: BuilderNode[]
  relationships: Relationship[]
  toolNodes: ToolCanvasNode[]
  toolEdges: ToolCanvasEdge[]
  actionNodes: ActionCanvasNode[]
  actionEdges: ActionCanvasEdge[]
  startNodeId?: string
}

export interface ExecutionContext {
  xmlElement: Element
  parentGraphNode: GraphJsonNode | null
  currentGraphNode: GraphJsonNode | null
  builderNode: BuilderNode | null
  elementToGraph: Map<Element, GraphJsonNode>
  deferredRelationships: Array<{
    from: GraphJsonNode
    to: GraphJsonNode | null
    type: string
    properties: Record<string, unknown>
  }>
  skipped?: boolean
  skipMainNode?: boolean
  skipChildren?: boolean
  skipChildrenTags?: string[]
  apiData?: Record<string, unknown>
}

