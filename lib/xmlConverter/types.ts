export interface ParsedElement {
  tag: string
  attrib: Record<string, string>
  text: string | null
  tail: string | null
  children: ParsedElement[]
  parent?: ParsedElement
}

export interface GraphNode {
  id: number
  labels: string[]
  properties: Record<string, unknown>
  type: 'node'
}

export interface GraphRelationship {
  id: number
  start: number
  end: number
  label: string
  properties: Record<string, unknown>
  type: 'relationship'
}

export type GraphElement = GraphNode | GraphRelationship

