import type { Node, Relationship, Property, ModelBuilderState } from '../types'

/**
 * Export builder state to JSON schema format
 */
export function exportToJson (state: ModelBuilderState): string {
  const schemaJson: {
    version?: string
    lastUpdated?: string
    source?: string
    isSemanticEnabled?: boolean
    selectedOntologyId?: string | null
    rootNodeLabel?: string | null
    nodes: Record<string, {
      name: string
      superclassNames?: string[]
      semantic?: any
      properties: Record<string, {
        name: string
        datatype: string
        values: unknown[]
        required: boolean
        semantic?: any
      }>
      relationsOut?: Record<string, string[]>
      relationsIn?: Record<string, string[]>
    }>
    relations: Record<string, {
      name: string
      semantic?: any
      properties?: Record<string, {
        name: string
        datatype: string
        values: unknown[]
        required: boolean
        semantic?: any
      }>
      domains: Record<string, string[]>
    }>
  } = {
    version: state.metadata.version || '1.0.0',
    lastUpdated: new Date().toISOString(),
    source: state.metadata.name || 'Model Builder',
    isSemanticEnabled: state.isSemanticEnabled,
    selectedOntologyId: state.selectedOntologyId,
    rootNodeLabel: state.nodes.find(n => n.id === state.rootNodeId)?.label || null,
    nodes: {},
    relations: {}
  }

  // Build node map by label (used as key in JSON format)
  const nodeMap = new Map<string, Node>()
  state.nodes.forEach((node) => {
    // Use node label as key, or type if label is different
    const key = node.label
    nodeMap.set(key, node)
    
    // Convert properties
    const properties: Record<string, {
      name: string
      datatype: string
      values: unknown[]
      required: boolean
    }> = {}
    
    node.properties.forEach((prop) => {
      const datatype = mapPropertyTypeToDatatype(prop.type)
      const propSemantic = (node.data as any)?.propertySemantics?.[prop.key]
      properties[prop.key] = {
        name: prop.key,
        datatype,
        values: prop.defaultValue ? [prop.defaultValue] : [],
        required: prop.required,
        ...(propSemantic ? { semantic: propSemantic } : {})
      }
    })
    
    schemaJson.nodes[key] = {
      name: node.label,
      superclassNames: node.type !== node.label ? [node.type] : [],
      ...( (node.data as any)?.semantic ? { semantic: (node.data as any).semantic } : {} ),
      properties,
      relationsOut: {},
      relationsIn: {}
    }
  })
  
  // Build relations map
  const relationsMap = new Map<string, {
    fromNodes: Set<string>
    toNodes: Set<string>
    properties?: Property[]
    semantic?: any
    propertySemantics?: Record<string, any>
  }>()
  
  // Group relationships by type
  state.relationships.forEach((rel) => {
    const fromNode = state.nodes.find((n) => n.id === rel.from)
    const toNode = state.nodes.find((n) => n.id === rel.to)
    
    if (!fromNode || !toNode) return
    
    if (!relationsMap.has(rel.type)) {
      relationsMap.set(rel.type, {
        fromNodes: new Set(),
        toNodes: new Set(),
        properties: rel.properties && rel.properties.length > 0 ? rel.properties : undefined,
        semantic: (rel.data as any)?.semantic,
        propertySemantics: (rel.data as any)?.propertySemantics
      })
    }
    
    const relationData = relationsMap.get(rel.type)!
    relationData.fromNodes.add(fromNode.label)
    relationData.toNodes.add(toNode.label)
  })
  
  // Convert relations map to schema format
  relationsMap.forEach((relData, relType) => {
    const properties: Record<string, {
      name: string
      datatype: string
      values: unknown[]
      required: boolean
      semantic?: any
    }> = {}
    
    if (relData.properties) {
      relData.properties.forEach((prop) => {
        const datatype = mapPropertyTypeToDatatype(prop.type)
        const propSemantic = relData.propertySemantics?.[prop.key]
        properties[prop.key] = {
          name: prop.key,
          datatype,
          values: prop.defaultValue ? [prop.defaultValue] : [],
          required: prop.required,
          ...(propSemantic ? { semantic: propSemantic } : {})
        }
      })
    }
    
    // Build domains (from -> to mappings)
    const domains: Record<string, string[]> = {}
    state.relationships.forEach((rel) => {
      if (rel.type === relType) {
        const fromNode = state.nodes.find((n) => n.id === rel.from)
        const toNode = state.nodes.find((n) => n.id === rel.to)
        
        if (fromNode && toNode) {
          if (!domains[fromNode.label]) {
            domains[fromNode.label] = []
          }
          if (!domains[fromNode.label].includes(toNode.label)) {
            domains[fromNode.label].push(toNode.label)
          }
        }
      }
    })
    
    schemaJson.relations[relType] = {
      name: relType,
      ...(relData.semantic ? { semantic: relData.semantic } : {}),
      properties: properties,
      domains
    }
  })
  
  // Add relationsOut and relationsIn to nodes
  state.relationships.forEach((rel) => {
    const fromNode = state.nodes.find((n) => n.id === rel.from)
    const toNode = state.nodes.find((n) => n.id === rel.to)
    
    if (!fromNode || !toNode) return
    
    const nodeData = schemaJson.nodes[fromNode.label]
    if (nodeData) {
      if (!nodeData.relationsOut) {
        nodeData.relationsOut = {}
      }
      if (!nodeData.relationsOut[rel.type]) {
        nodeData.relationsOut[rel.type] = []
      }
      if (!nodeData.relationsOut[rel.type].includes(toNode.label)) {
        nodeData.relationsOut[rel.type].push(toNode.label)
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
  
  return JSON.stringify(schemaJson, null, 2)
}

/**
 * Export builder state to Markdown schema format
 */
export function exportToMarkdown (state: ModelBuilderState): string {
  let md = `# Schema Documentation\n\n`
  
  if (state.metadata.name) {
    md += `**Source:** ${state.metadata.name}\n`
  }
  if (state.metadata.description) {
    md += `**Description:** ${state.metadata.description}\n`
  }
  if (state.metadata.version) {
    md += `**Version:** ${state.metadata.version}\n`
  }
  md += `**Last Updated:** ${new Date().toISOString()}\n\n`
  
  if (state.isSemanticEnabled) {
    md += `**Semantic Enabled:** true\n`
    if (state.selectedOntologyId) {
      md += `**Ontology ID:** ${state.selectedOntologyId}\n`
    }
    md += `\n`
  }

  const rootNode = state.nodes.find(n => n.id === state.rootNodeId)
  if (rootNode) {
    md += `**Root Node:** ${rootNode.label}\n\n`
  }
  
  md += `## NODES\n\n`
  
  // Export nodes
  state.nodes.forEach((node) => {
    // Use level-4 headings for nodes to match reference schema format
    md += `#### ${node.label}\n\n`
    
    // Superclass names (labels) – keep simple, using node.type when it differs
    if (node.type && node.type !== node.label) {
      md += `**Labels**: \`${node.type}\`\n\n`
    } else {
      md += `**Labels**: \`${node.label}\`\n\n`
    }
    
    const semantic = (node.data as any)?.semantic
    if (semantic && semantic.classIri) {
      md += `**Semantic Class**: ${semantic.classLabel || ''}${semantic.classCurie ? ` [${semantic.classCurie}]` : ''} (\`${semantic.classIri}\`)\n\n`
    }
    
    // Properties
    if (node.properties && node.properties.length > 0) {
      md += `**Properties:**\n`
      node.properties.forEach((prop) => {
        const required = prop.required ? 'required' : 'optional'
        const datatype = mapPropertyTypeToDatatype(prop.type)
        md += `- \`${prop.key}\` (${required}, ${datatype})`
        if (prop.description) {
          md += ` - ${prop.description}`
        }
        if (prop.defaultValue) {
          md += ` - Default: ${prop.defaultValue}`
        }
        
        const propSemantic = (node.data as any)?.propertySemantics?.[prop.key]
        if (propSemantic && propSemantic.propertyIri) {
          md += ` - Semantic Property: ${propSemantic.propertyLabel || ''}${propSemantic.propertyCurie ? ` [${propSemantic.propertyCurie}]` : ''} (\`${propSemantic.propertyIri}\`)`
        }

        md += `\n`
      })
      md += `\n`
    } else {
      md += `**Properties:** None\n\n`
    }
    
    // Relations Out
    const relationsOut: Record<string, string[]> = {}
    state.relationships.forEach((rel) => {
      if (rel.from === node.id) {
        const toNode = state.nodes.find((n) => n.id === rel.to)
        if (toNode) {
          if (!relationsOut[rel.type]) {
            relationsOut[rel.type] = []
          }
          if (!relationsOut[rel.type].includes(toNode.label)) {
            relationsOut[rel.type].push(toNode.label)
          }
        }
      }
    })
    
    if (Object.keys(relationsOut).length > 0) {
      // Match reference schema wording
      md += `**Relations (outgoing)**:\n`
      Object.entries(relationsOut).forEach(([relType, targets]) => {
        md += `- \`${relType}\` → ${targets.join(', ')}\n`
      })
      md += `\n`
    } else {
      md += `**Relations (outgoing)**: None\n\n`
    }
    
    // Relations In
    const relationsIn: Record<string, string[]> = {}
    state.relationships.forEach((rel) => {
      if (rel.to === node.id) {
        const fromNode = state.nodes.find((n) => n.id === rel.from)
        if (fromNode) {
          if (!relationsIn[rel.type]) {
            relationsIn[rel.type] = []
          }
          if (!relationsIn[rel.type].includes(fromNode.label)) {
            relationsIn[rel.type].push(fromNode.label)
          }
        }
      }
    })
    
    if (Object.keys(relationsIn).length > 0) {
      // Match reference schema wording
      md += `**Relations (incoming)**:\n`
      Object.entries(relationsIn).forEach(([relType, sources]) => {
        md += `- \`${relType}\` ← ${sources.join(', ')}\n`
      })
      md += `\n`
    } else {
      md += `**Relations (incoming)**: None\n\n`
    }
  })
  
  md += `## RELATIONS\n\n`
  
  // Group relationships by type
  const relationsByType = new Map<string, {
    properties?: Property[]
    domains: Record<string, string[]>
    semantic?: any
    propertySemantics?: Record<string, any>
  }>()
  
  state.relationships.forEach((rel) => {
    if (!relationsByType.has(rel.type)) {
      relationsByType.set(rel.type, {
        properties: rel.properties && rel.properties.length > 0 ? rel.properties : undefined,
        domains: {},
        semantic: (rel.data as any)?.semantic,
        propertySemantics: (rel.data as any)?.propertySemantics
      })
    }
    
    const fromNode = state.nodes.find((n) => n.id === rel.from)
    const toNode = state.nodes.find((n) => n.id === rel.to)
    
    if (fromNode && toNode) {
      const relData = relationsByType.get(rel.type)!
      if (!relData.domains[fromNode.label]) {
        relData.domains[fromNode.label] = []
      }
      if (!relData.domains[fromNode.label].includes(toNode.label)) {
        relData.domains[fromNode.label].push(toNode.label)
      }
    }
  })
  
  // Export relations
  relationsByType.forEach((relData, relType) => {
    md += `### ${relType}\n\n`
    
    if (relData.semantic && relData.semantic.propertyIri) {
      md += `**Semantic Property**: ${relData.semantic.propertyLabel || ''}${relData.semantic.propertyCurie ? ` [${relData.semantic.propertyCurie}]` : ''} (\`${relData.semantic.propertyIri}\`)\n\n`
    }
    
    // Properties
    if (relData.properties && relData.properties.length > 0) {
      md += `**Properties:**\n`
      relData.properties.forEach((prop) => {
        const required = prop.required ? 'required' : 'optional'
        const datatype = mapPropertyTypeToDatatype(prop.type)
        md += `- \`${prop.key}\` (${required}, ${datatype})`
        if (prop.description) {
          md += ` - ${prop.description}`
        }
        if (prop.defaultValue) {
          md += ` - Default: ${prop.defaultValue}`
        }
        
        const propSemantic = relData.propertySemantics?.[prop.key]
        if (propSemantic && propSemantic.propertyIri) {
          md += ` - Semantic Property: ${propSemantic.propertyLabel || ''}${propSemantic.propertyCurie ? ` [${propSemantic.propertyCurie}]` : ''} (\`${propSemantic.propertyIri}\`)`
        }

        md += `\n`
      })
      md += `\n`
    } else {
      md += `**Properties:** None\n\n`
    }
    
    // Domain → Range
    if (Object.keys(relData.domains).length > 0) {
      md += `**Domain → Range:**\n`
      Object.entries(relData.domains).forEach(([from, toNodes]) => {
        md += `- \`${from}\` → ${toNodes.join(', ')}\n`
      })
      md += `\n`
    } else {
      md += `**Domain → Range:** None\n\n`
    }
  })
  
  return md
}

/**
 * Map Property type to datatype string
 */
function mapPropertyTypeToDatatype (type: Property['type']): string {
  const mapping: Record<Property['type'], string> = {
    string: 'string',
    number: 'integer',
    boolean: 'boolean',
    date: 'date',
    array: 'array',
    object: 'uri'
  }
  return mapping[type] || 'string'
}

/**
 * Download file helper
 */
export function downloadFile (content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

