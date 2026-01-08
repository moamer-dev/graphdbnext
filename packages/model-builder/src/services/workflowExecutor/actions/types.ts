import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ExecutionContext, GraphJsonNode, GraphJsonRelationship } from '../types'
import type { Node as BuilderNode, Relationship } from '../../../types'
import type { SchemaJson } from '../../../types/mappingConfig'

export interface ActionExecutionContext extends ExecutionContext {
  graphNodes: GraphJsonNode[]
  graphRels: GraphJsonRelationship[]
  nodeIdCounter: { value: number }
  relIdCounter: { value: number }
  relationships: Relationship[]
  schemaJson: SchemaJson
  doc: Document
  createGraphNode: (builderNode: { label: string; properties?: Array<{ key: string; defaultValue?: unknown }> }, element: Element, id: number) => GraphJsonNode
  createRelationship: (from: GraphJsonNode, to: GraphJsonNode, relType: Relationship, properties?: Record<string, unknown>) => GraphJsonRelationship
  getApiResponseData: (action: ActionCanvasNode) => unknown
  evaluateTemplate: (value: string, apiResponseData: unknown) => string
  applyTransforms: (text: string, transforms: Array<{ type: string; [key: string]: unknown }>) => string
  findElementById: (doc: Document, id: string) => Element | null
  actionNodes: ActionCanvasNode[]
}

export type ActionExecutor = (action: ActionCanvasNode, ctx: ActionExecutionContext) => void

