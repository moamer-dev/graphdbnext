import type { Node as BuilderNode, Relationship } from '../../../types'
import type { SchemaJson } from '../../../types/mappingConfig'
import type { GraphJsonNode, GraphJsonRelationship } from '../types'

export function createGraphNode(
  builderNode: BuilderNode,
  element: Element,
  id: number,
  schemaJson?: SchemaJson
): GraphJsonNode {
  const schemaNode = schemaJson?.nodes?.[builderNode.label]
  const labels = schemaNode
    ? [builderNode.label, ...(schemaNode.superclassNames || [])]
    : [builderNode.label]

  const properties: Record<string, unknown> = {}
  
  Array.from(element.attributes || []).forEach((attr) => {
    properties[attr.name] = attr.value
  })

  if (builderNode.properties) {
    builderNode.properties.forEach(prop => {
      if (prop.key && prop.defaultValue !== undefined) {
        properties[prop.key] = prop.defaultValue
      }
    })
  }

  return {
    id,
    type: 'node',
    labels,
    properties
  }
}

export function createRelationship(
  from: GraphJsonNode,
  to: GraphJsonNode,
  relType: Relationship,
  relIdCounter: { value: number },
  properties: Record<string, unknown> = {}
): GraphJsonRelationship {
  const rel: GraphJsonRelationship = {
    id: relIdCounter.value++,
    type: 'relationship',
    label: relType.type,
    start: from.id,
    end: to.id,
    properties: {
      ...properties,
      ...(relType.cardinality ? { cardinality: relType.cardinality } : {})
    }
  }
  return rel
}

