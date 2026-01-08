import type { Node, Relationship, Property } from '../types'

/**
 * Client-side Markdown schema parser
 * Parses MD files in the format used by the schema templates
 */
export interface ParsedMarkdownSchema {
  nodes: Record<string, {
    name: string
    superclassNames: string[]
    properties: Record<string, {
      name: string
      datatype: string | null
      values: string[]
      required: boolean
    }>
    relationsOut: Record<string, string[]>
    relationsIn: Record<string, string[]>
  }>
  relations: Record<string, {
    name: string
    properties: Record<string, {
      name: string
      datatype: string | null
      values: string[]
      required: boolean
    }>
    domains: Record<string, string[]>
  }>
}

/**
 * Parse Markdown schema content
 */
export function parseMarkdownSchema (mdContent: string): ParsedMarkdownSchema {
  const schema: ParsedMarkdownSchema = { nodes: {}, relations: {} }

  // Split into sections
  const nodesSection = extractSection(mdContent, '## NODES', '## RELATIONS')
  const relationsSection = extractSection(mdContent, '## RELATIONS', '## PROPERTIES REFERENCE')

  // Parse nodes
  parseNodes(nodesSection, schema)

  // Parse relations
  parseRelations(relationsSection, schema)

  return schema
}

/**
 * Convert parsed Markdown schema to builder format
 */
export function convertMarkdownSchemaToBuilder (parsedSchema: ParsedMarkdownSchema): {
  nodes: Node[]
  relationships: Relationship[]
} {
  const nodeMap = new Map<string, Node>()
  const relationships: Relationship[] = []

  // Convert nodes
  let nodeIndex = 0
  Object.entries(parsedSchema.nodes).forEach(([nodeName, nodeData]) => {
    const nodeId = `node_${Date.now()}_${nodeIndex++}_${Math.random().toString(36).substr(2, 9)}`

    // Convert properties
    const properties: Property[] = Object.entries(nodeData.properties || {}).map(([propName, propData]) => {
      let propType: Property['type'] = 'string'
      const datatype = propData.datatype?.toLowerCase() || 'string'
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
      order: nodeIndex
    }

    nodeMap.set(nodeName, node)
  })

  // Convert relationships
  let relIndex = 0
  const relationshipSet = new Set<string>()

  Object.entries(parsedSchema.nodes).forEach(([sourceNodeName, nodeData]) => {
    const sourceNode = nodeMap.get(sourceNodeName)
    if (!sourceNode) return

    Object.entries(nodeData.relationsOut || {}).forEach(([relType, targetNodeNames]) => {
      targetNodeNames.forEach((targetNodeName) => {
        const targetNode = nodeMap.get(targetNodeName)
        if (!targetNode) return

        const relKey = `${sourceNode.id}-${relType}-${targetNode.id}`
        if (relationshipSet.has(relKey)) return
        relationshipSet.add(relKey)

        // Get relation properties from relations object
        const relationDef = parsedSchema.relations[relType]
        const relProperties: Property[] | undefined = relationDef?.properties
          ? Object.entries(relationDef.properties).map(([propName, propData]) => {
              let propType: Property['type'] = 'string'
              const datatype = propData.datatype?.toLowerCase() || 'string'
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

function extractSection (content: string, startMarker: string, endMarker: string): string {
  const startIdx = content.indexOf(startMarker)
  const endIdx = content.indexOf(endMarker)

  if (startIdx === -1) {
    return ''
  }

  if (endIdx === -1) {
    return content.substring(startIdx)
  }

  return content.substring(startIdx, endIdx)
}

function parseNodes (nodesSection: string, schema: ParsedMarkdownSchema): void {
  const nodeBlocks = nodesSection.split(/#### (\w+)/)

  for (let i = 1; i < nodeBlocks.length; i += 2) {
    const name = nodeBlocks[i]
    const content = nodeBlocks[i + 1] || ''

    const labelsMatch = content.match(/\*\*Labels\*\*: (.+?)(?:\n|$)/)
    const labelsStr = labelsMatch ? labelsMatch[1] : ''

    // Match both "**Properties**:" (application.md style) and "**Properties:**" (export style)
    const propertiesMatch = content.match(/(?:\*\*Properties\*\*:|\*\*Properties:\*\*)\s*\n((?:- .+?\n)*)/)
    const propertiesStr = propertiesMatch ? propertiesMatch[1] : ''

    const relationsOutMatch = content.match(/\*\*Relations \(outgoing\)\*\*:\s*\n((?:- .+?\n)*)/)
    const relationsOutStr = relationsOutMatch ? relationsOutMatch[1] : ''

    const relationsInMatch = content.match(/\*\*Relations \(incoming\)\*\*:\s*\n((?:- .+?\n)*)/)
    const relationsInStr = relationsInMatch ? relationsInMatch[1] : ''

    schema.nodes[name] = {
      name,
      superclassNames: parseLabels(labelsStr),
      properties: parseNodeProperties(propertiesStr),
      relationsOut: parseRelationsList(relationsOutStr),
      relationsIn: parseRelationsList(relationsInStr)
    }
  }
}

function parseLabels (labelsStr: string): string[] {
  const labels: string[] = []
  const labelRegex = /`(\w+)`/g
  let match
  while ((match = labelRegex.exec(labelsStr)) !== null) {
    labels.push(match[1])
  }
  return labels
}

function parseNodeProperties (propertiesStr: string): Record<string, { name: string; datatype: string | null; values: string[]; required: boolean }> {
  const properties: Record<string, { name: string; datatype: string | null; values: string[]; required: boolean }> = {}

  if (!propertiesStr.trim() || propertiesStr.includes('None')) {
    return properties
  }

  // More robust line-by-line parsing that tolerates descriptions, "Values:" blocks, etc.
  const lines = propertiesStr.split('\n')

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('- `')) return

    // Match "- `name` (required, string)" and ignore everything after ")"
    const match = trimmed.match(/- `([^`]+)` \((required|optional), ([^)]+)\)/)
    if (!match) return

    const propName = match[1]
    const required = match[2] === 'required'
    const datatype = match[3] || null

    properties[propName] = {
      name: propName,
      datatype: normalizeDatatype(datatype),
      values: [],
      required
    }
  })

  return properties
}

function parseRelationsList (relationsStr: string): Record<string, string[]> {
  const relations: Record<string, string[]> = {}

  if (!relationsStr.trim() || relationsStr.includes('None')) {
    return relations
  }

  const relRegex = /- `(\w+)` (→|←) (.+?)$/gm

  let match
  while ((match = relRegex.exec(relationsStr)) !== null) {
    const relationName = match[1]
    const targetsStr = match[3]

    const targets = targetsStr.split(',').map(t => t.trim())

    if (!relations[relationName]) {
      relations[relationName] = []
    }
    relations[relationName].push(...targets)
  }

  return relations
}

function parseRelations (relationsSection: string, schema: ParsedMarkdownSchema): void {
  const relationBlocks = relationsSection.split(/### (\w+)/)

  for (let i = 1; i < relationBlocks.length; i += 2) {
    const name = relationBlocks[i]
    const content = relationBlocks[i + 1] || ''

    // Match both "**Properties**:" and "**Properties:**"
    const propertiesMatch = content.match(/(?:\*\*Properties\*\*:|\*\*Properties:\*\*)\s*\n((?:- .+?\n)*|None)/)
    const propertiesStr = propertiesMatch ? propertiesMatch[1] : ''

    // Match "Domain" headers in both styles: "**Domain → Range**:" and "**Domain → Range:**"
    let domainsStr = ''
    let domainsMatch = content.match(/\*\*Domain(?: → Range)?(?: Examples)?(?: \(from\))?\*\*:\s*\n((?:- .+?\n)*)/)
    if (!domainsMatch) {
      domainsMatch = content.match(/\*\*Domain(?: → Range)?(?: Examples)?(?: \(from\))?:\*\*\s*\n((?:- .+?\n)*)/)
    }
    if (domainsMatch) {
      domainsStr = domainsMatch[1]
    }

    const rangeMatch = content.match(/\*\*Range \(to\)\*\*:\s*\n((?:- .+?\n)*)/)
    const rangeStr = rangeMatch ? rangeMatch[1] : ''

    schema.relations[name] = {
      name,
      properties: parseRelationProperties(propertiesStr),
      domains: parseRelationDomains(domainsStr, rangeStr)
    }
  }
}

function parseRelationProperties (propertiesStr: string): Record<string, { name: string; datatype: string | null; values: string[]; required: boolean }> {
  const properties: Record<string, { name: string; datatype: string | null; values: string[]; required: boolean }> = {}

  if (!propertiesStr.trim() || propertiesStr.includes('None')) {
    return properties
  }

  const lines = propertiesStr.split('\n')

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('- `')) return

    const match = trimmed.match(/- `([^`]+)` \((required|optional), ([^)]+)\)/)
    if (!match) return

    const propName = match[1]
    const required = match[2] === 'required'
    const datatype = match[3] || null

    properties[propName] = {
      name: propName,
      datatype: normalizeDatatype(datatype),
      values: [],
      required
    }
  })

  return properties
}

function parseRelationDomains (domainsStr: string, rangeStr?: string): Record<string, string[]> {
  const domains: Record<string, string[]> = {}

  if (domainsStr.trim()) {
    const domainFromRegex = /- (\w+)$/gm
    let match
    while ((match = domainFromRegex.exec(domainsStr)) !== null) {
      const source = match[1]

      if (rangeStr) {
        const rangeTargets = rangeStr.split('\n')
          .filter(line => line.trim().startsWith('-'))
          .flatMap(line => {
            const targetsMatch = line.match(/-\s*(.+)$/)
            if (targetsMatch) {
              return targetsMatch[1].split(',').map(t => t.trim())
            }
            return []
          })

        domains[source] = rangeTargets
      } else {
        domains[source] = []
      }
    }
  }

  if (domainsStr.trim()) {
    const domainRangeRegex = /- (\w+) → (.+?)$/gm
    let match
    while ((match = domainRangeRegex.exec(domainsStr)) !== null) {
      const source = match[1]
      const targetsStr = match[2]

      const targets = targetsStr.split(',').map(t => t.trim())

      domains[source] = targets
    }
  }

  return domains
}

function normalizeDatatype (datatype: string | null): string | null {
  if (!datatype) return null

  const mapping: Record<string, string> = {
    string: 'string',
    integer: 'integer',
    boolean: 'boolean',
    uri: 'URI'
  }

  return mapping[datatype.toLowerCase()] || datatype
}

