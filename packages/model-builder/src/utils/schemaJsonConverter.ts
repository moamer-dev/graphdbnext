import type { Node, Relationship } from '../types'
import type { SchemaJson } from '../types/mappingConfig'

/**
 * Convert builder nodes and relationships to SchemaJson format
 * This is used by the generic XML converter
 */
export function convertBuilderToSchemaJson (
  nodes: Node[],
  relationships: Relationship[]
): SchemaJson {
  const schemaJson: SchemaJson = {
    nodes: {},
    relations: {}
  }

  // Convert nodes
  nodes.forEach((node) => {
    const properties: Record<string, {
      name: string
      datatype: string
      values?: unknown[]
      required: boolean
    }> = {}

    node.properties.forEach((prop) => {
      properties[prop.key] = {
        name: prop.key,
        datatype: mapPropertyTypeToDatatype(prop.type),
        values: prop.defaultValue ? [prop.defaultValue] : [],
        required: prop.required
      }
    })

    schemaJson.nodes[node.label] = {
      name: node.label,
      superclassNames: node.type !== node.label ? [node.type] : [],
      properties,
      relationsOut: {},
      relationsIn: {}
    }
  })

  // Convert relationships
  const relationsByType = new Map<string, {
    properties?: Record<string, {
      name: string
      datatype: string
      values?: unknown[]
      required: boolean
    }>
    domains: Record<string, string[]>
  }>()

  relationships.forEach((rel) => {
    const fromNode = nodes.find((n) => n.id === rel.from)
    const toNode = nodes.find((n) => n.id === rel.to)

    if (!fromNode || !toNode) return

    if (!relationsByType.has(rel.type)) {
      const relProperties: Record<string, {
        name: string
        datatype: string
        values?: unknown[]
        required: boolean
      }> = {}

      if (rel.properties) {
        rel.properties.forEach((prop) => {
          relProperties[prop.key] = {
            name: prop.key,
            datatype: mapPropertyTypeToDatatype(prop.type),
            values: prop.defaultValue ? [prop.defaultValue] : [],
            required: prop.required
          }
        })
      }

      relationsByType.set(rel.type, {
        properties: Object.keys(relProperties).length > 0 ? relProperties : undefined,
        domains: {}
      })
    }

    const relData = relationsByType.get(rel.type)!
    if (!relData.domains[fromNode.label]) {
      relData.domains[fromNode.label] = []
    }
    if (!relData.domains[fromNode.label].includes(toNode.label)) {
      relData.domains[fromNode.label].push(toNode.label)
    }

    // Also update relationsOut and relationsIn on nodes
    const fromNodeData = schemaJson.nodes[fromNode.label]
    if (fromNodeData) {
      if (!fromNodeData.relationsOut) {
        fromNodeData.relationsOut = {}
      }
      if (!fromNodeData.relationsOut[rel.type]) {
        fromNodeData.relationsOut[rel.type] = []
      }
      if (!fromNodeData.relationsOut[rel.type].includes(toNode.label)) {
        fromNodeData.relationsOut[rel.type].push(toNode.label)
      }
    }

    const toNodeData = schemaJson.nodes[toNode.label]
    if (toNodeData) {
      if (!toNodeData.relationsIn) {
        toNodeData.relationsIn = {}
      }
      if (!toNodeData.relationsIn[rel.type]) {
        toNodeData.relationsIn[rel.type] = []
      }
      if (!toNodeData.relationsIn[rel.type].includes(fromNode.label)) {
        toNodeData.relationsIn[rel.type].push(fromNode.label)
      }
    }
  })

  // Convert relations map to schema format
  relationsByType.forEach((relData, relType) => {
    schemaJson.relations[relType] = {
      name: relType,
      properties: relData.properties,
      domains: relData.domains
    }
  })

  return schemaJson
}

function mapPropertyTypeToDatatype (type: string): string {
  const mapping: Record<string, string> = {
    string: 'string',
    number: 'integer',
    boolean: 'boolean',
    date: 'date',
    array: 'array',
    object: 'uri'
  }
  return mapping[type.toLowerCase()] || 'string'
}

