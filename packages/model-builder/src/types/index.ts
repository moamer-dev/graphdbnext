export interface Node {
  id: string
  label: string
  type: string
  properties: Property[]
  position: { x: number; y: number }
  groupId?: string
  order?: number // Order for ungrouped nodes only
  data?: Record<string, unknown>
}

export interface NodeGroup {
  id: string
  name: string
  collapsed: boolean
  order: number
}

export interface Property {
  key: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  required: boolean
  defaultValue?: unknown
  description?: string
}

export interface Relationship {
  id: string
  type: string
  from: string // node id
  to: string   // node id
  properties?: Property[]
  cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-many'
  data?: Record<string, unknown>
}

export interface RelationshipType {
  type: string
  properties?: Property[]
  cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-many'
}

export interface ModelBuilderState {
  nodes: Node[]
  relationships: Relationship[]
  relationshipTypes: RelationshipType[] // Unique relationship types for reuse
  groups: NodeGroup[]
  selectedNode: string | null
  selectedRelationship: string | null
  selectedOntologyId: string | null // Global ontology selection for the model
  isSemanticEnabled?: boolean // Whether semantic enrichment is enabled
  hideUnconnectedNodes: boolean
  rootNodeId: string | null // ID of the root node for workflow execution
  metadata: {
    name: string
    description: string
    version: string
  }
}

export interface Schema {
  nodes: Array<{
    label: string
    type: string
    properties: Array<{
      name: string
      type: string
      required?: boolean
      default?: unknown
      description?: string
    }>
  }>
  relationships: Array<{
    type: string
    from: string
    to: string
    properties?: Array<{
      name: string
      type: string
      required?: boolean
      default?: unknown
    }>
    cardinality?: string
  }>
}

export * from './semanticTypes'

