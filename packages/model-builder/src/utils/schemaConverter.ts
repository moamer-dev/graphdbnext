import type { Node, Relationship, Schema, Property } from '../types'
import { calculateHierarchicalLayout } from './layout'

/**
 * Schema JSON format (from schema.json template)
 */
interface SchemaJsonFormat {
  version?: string
  lastUpdated?: string
  source?: string
  nodes: {
    [nodeName: string]: {
      name: string
      superclassNames?: string[]
      properties: {
        [propName: string]: {
          name: string
          datatype: string
          values: unknown[]
          required: boolean
        }
      }
      relationsOut?: {
        [relType: string]: string[]
      }
      relationsIn?: {
        [relType: string]: string[]
      }
    }
  }
  relations: {
    [relName: string]: {
      name: string
      properties?: {
        [propName: string]: {
          name: string
          datatype: string
          values: unknown[]
          required: boolean
        }
      }
      domains: {
        [sourceNode: string]: string[]
      }
    }
  }
}

/**
 * Converts builder state to schema format
 */
export function convertBuilderToSchema(
  nodes: Node[],
  relationships: Relationship[]
): Schema {
  return {
    nodes: nodes.map((node) => ({
      label: node.label,
      type: node.type,
      properties: node.properties.map((prop) => ({
        name: prop.key,
        type: prop.type,
        required: prop.required,
        default: prop.defaultValue,
        description: prop.description
      }))
    })),
    relationships: relationships.map((rel) => ({
      type: rel.type,
      from: rel.from,
      to: rel.to,
      properties: rel.properties?.map((prop) => ({
        name: prop.key,
        type: prop.type,
        required: prop.required,
        default: prop.defaultValue
      })),
      cardinality: rel.cardinality
    }))
  }
}

/**
 * Converts schema format to builder state
 */
export function convertSchemaToBuilder(schema: Schema): {
  nodes: Node[]
  relationships: Relationship[]
} {
  const nodes: Node[] = schema.nodes.map((node, index) => ({
    id: `node_${index}`,
    label: node.label,
    type: node.type,
    properties: node.properties.map((prop) => ({
      key: prop.name,
      type: prop.type as Property['type'],
      required: prop.required ?? false,
      defaultValue: prop.default,
      description: prop.description
    })),
    position: {
      x: (index % 3) * 300,
      y: Math.floor(index / 3) * 200
    }
  }))
  
  const relationships: Relationship[] = schema.relationships.map((rel, index) => {
    const fromNode = nodes.find((n) => n.label === rel.from || n.id === rel.from)
    const toNode = nodes.find((n) => n.label === rel.to || n.id === rel.to)
    
    return {
      id: `rel_${index}`,
      type: rel.type,
      from: fromNode?.id ?? rel.from,
      to: toNode?.id ?? rel.to,
      properties: rel.properties?.map((prop) => ({
        key: prop.name,
        type: prop.type as Property['type'],
        required: prop.required ?? false,
        defaultValue: prop.default
      })),
      cardinality: rel.cardinality as Relationship['cardinality']
    }
  })
  
  return { nodes, relationships }
}

/**
 * Converts schema.json format to builder state
 */
export function convertSchemaJsonToBuilder(schemaJson: SchemaJsonFormat): {
  nodes: Node[]
  relationships: Relationship[]
} {
  const nodeMap = new Map<string, Node>()
  const relationships: Relationship[] = []
  
  // Convert nodes
  let nodeIndex = 0
  Object.entries(schemaJson.nodes).forEach(([nodeName, nodeData]) => {
    const nodeId = `node_${Date.now()}_${nodeIndex++}_${Math.random().toString(36).substr(2, 9)}`
    
    // Convert properties
    const properties: Property[] = Object.entries(nodeData.properties || {}).map(([propName, propData]) => {
      // Map datatype to Property type
      let propType: Property['type'] = 'string'
      const datatype = propData.datatype.toLowerCase()
      if (datatype === 'integer' || datatype === 'number') {
        propType = 'number'
      } else if (datatype === 'boolean') {
        propType = 'boolean'
      } else if (datatype === 'date' || datatype === 'datetime') {
        propType = 'date'
      } else if (datatype === 'array') {
        propType = 'array'
      } else if (datatype === 'object' || datatype === 'uri') {
        propType = 'object'
      }
      
      return {
        key: propName,
        type: propType,
        required: propData.required ?? false
      }
    })
    
    const node: Node = {
      id: nodeId,
      label: nodeData.name,
      type: nodeData.name,
      properties,
      position: {
        x: (nodeIndex % 4) * 300 + Math.random() * 50,
        y: Math.floor(nodeIndex / 4) * 250 + Math.random() * 50
      },
      order: nodeIndex // Set order for ungrouped nodes so they appear in the palette
    }
    
    nodeMap.set(nodeName, node)
  })
  
  // Calculate better positions using hierarchical layout
  const nodeArray = Array.from(nodeMap.values())
  const tempRelationships: Relationship[] = []
  
  // Build temporary relationships for layout calculation
  Object.entries(schemaJson.nodes).forEach(([sourceNodeName, nodeData]) => {
    const sourceNode = nodeMap.get(sourceNodeName)
    if (!sourceNode) return
    
    Object.entries(nodeData.relationsOut || {}).forEach(([relType, targetNodeNames]) => {
      targetNodeNames.forEach((targetNodeName) => {
        const targetNode = nodeMap.get(targetNodeName)
        if (!targetNode) return
        tempRelationships.push({
          id: `temp_${sourceNode.id}_${targetNode.id}`,
          type: relType,
          from: sourceNode.id,
          to: targetNode.id
        })
      })
    })
  })
  
  // Calculate positions using hierarchical layout
  const positions = calculateHierarchicalLayout(nodeArray, tempRelationships, {
    horizontalSpacing: 350,
    verticalSpacing: 250,
    padding: 100
  })
  
  // Update node positions
  nodeArray.forEach(node => {
    const position = positions.get(node.id)
    if (position) {
      node.position = position
    }
  })
  
  // Convert relationships from relationsOut/relationsIn
  let relIndex = 0
  const relationshipSet = new Set<string>() // Track relationships to avoid duplicates
  
  // Process relationsOut (outgoing relationships)
  Object.entries(schemaJson.nodes).forEach(([sourceNodeName, nodeData]) => {
    const sourceNode = nodeMap.get(sourceNodeName)
    if (!sourceNode) return
    
    Object.entries(nodeData.relationsOut || {}).forEach(([relType, targetNodeNames]) => {
      targetNodeNames.forEach((targetNodeName) => {
        const targetNode = nodeMap.get(targetNodeName)
        if (!targetNode) return
        
        // Create unique key to avoid duplicates
        const relKey = `${sourceNode.id}-${relType}-${targetNode.id}`
        if (relationshipSet.has(relKey)) return
        relationshipSet.add(relKey)
        
        // Get relation properties from relations object
        const relationDef = schemaJson.relations[relType]
        const relProperties: Property[] | undefined = relationDef?.properties
          ? Object.entries(relationDef.properties).map(([propName, propData]) => {
              let propType: Property['type'] = 'string'
              const datatype = propData.datatype.toLowerCase()
              if (datatype === 'integer' || datatype === 'number') {
                propType = 'number'
              } else if (datatype === 'boolean') {
                propType = 'boolean'
              } else if (datatype === 'date' || datatype === 'datetime') {
                propType = 'date'
              } else if (datatype === 'array') {
                propType = 'array'
              } else if (datatype === 'object' || datatype === 'uri') {
                propType = 'object'
              }
              
              return {
                key: propName,
                type: propType,
                required: propData.required ?? false
              }
            })
          : undefined
        
        relationships.push({
          id: `rel_${Date.now()}_${relIndex++}_${Math.random().toString(36).substr(2, 9)}`,
          type: relType,
          from: sourceNode.id,
          to: targetNode.id,
          properties: relProperties && relProperties.length > 0 ? relProperties : undefined
        })
      })
    })
  })
  
  return {
    nodes: Array.from(nodeMap.values()),
    relationships
  }
}

