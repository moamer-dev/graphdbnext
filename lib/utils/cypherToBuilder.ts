/**
 * Converts a Cypher query to Query Builder state
 * This is a simplified parser that handles common Cypher patterns
 */

interface ParsedNode {
  alias: string
  label?: string
}

interface ParsedRelationship {
  alias?: string
  type?: string
  fromAlias: string
  toAlias: string
  direction: '->' | '<-' | '<->' | 'none'
  matchType?: 'AND' | 'OR' | 'MATCH' | 'OPTIONAL_MATCH'
}

interface ParsedCondition {
  nodeAlias: string
  property: string
  operator: string
  value: string
}

interface ParsedQuery {
  nodes: ParsedNode[]
  relationships: ParsedRelationship[]
  conditions: ParsedCondition[]
  returnFields: string[]
  limit?: number
}

export function parseCypherToBuilder (cypherQuery: string): ParsedQuery | null {
  if (!cypherQuery || !cypherQuery.trim()) {
    return null
  }

  const query = cypherQuery.trim()
  const nodes: ParsedNode[] = []
  const relationships: ParsedRelationship[] = []
  const conditions: ParsedCondition[] = []
  const returnFields: string[] = []
  let limit: number | undefined

  // Extract MATCH clauses
  const matchRegex = /(?:MATCH|OPTIONAL\s+MATCH)\s+(.+?)(?=\s*(?:MATCH|OPTIONAL\s+MATCH|WHERE|RETURN|WITH|$))/gi
  const matchClauses: string[] = []
  let matchMatch
  while ((matchMatch = matchRegex.exec(query)) !== null) {
    matchClauses.push(matchMatch[1].trim())
  }

  // If no MATCH clauses found, try to find a single MATCH pattern
  if (matchClauses.length === 0) {
    const singleMatch = query.match(/(?:MATCH|OPTIONAL\s+MATCH)\s+(.+?)(?=\s*(?:WHERE|RETURN|WITH|$))/i)
    if (singleMatch) {
      matchClauses.push(singleMatch[1].trim())
    }
  }

  // Parse each MATCH clause
  matchClauses.forEach((clause, index) => {
    const isOptional = query.substring(0, query.indexOf(clause)).toUpperCase().includes('OPTIONAL')
    const matchType: 'MATCH' | 'OPTIONAL_MATCH' = isOptional ? 'OPTIONAL_MATCH' : 'MATCH'

    // Pattern: (alias:Label)-[relAlias:Type]->(alias2:Label2)
    const patternRegex = /\(([^:)]+)(?::([^)]+))?\)|\[([^:)]+)?(?::([^:)]+))?\]|(->|<-|<->)/g
    let lastNodeAlias: string | null = null
    let lastNodeLabel: string | undefined
    let currentRel: Partial<ParsedRelationship> | null = null

    let patternMatch
    while ((patternMatch = patternRegex.exec(clause)) !== null) {
      if (patternMatch[1]) {
        // Node pattern: (alias:Label)
        const alias = patternMatch[1].trim()
        const label = patternMatch[2]?.trim()

        if (lastNodeAlias && currentRel) {
          // Complete the relationship
          currentRel.toAlias = alias
          relationships.push({
            alias: currentRel.alias,
            type: currentRel.type,
            fromAlias: lastNodeAlias,
            toAlias: alias,
            direction: currentRel.direction || '->',
            matchType: index > 0 ? matchType : undefined
          })
          currentRel = null
        }

        // Add node if not already added
        if (!nodes.find(n => n.alias === alias)) {
          nodes.push({ alias, label })
        }

        lastNodeAlias = alias
        lastNodeLabel = label
      } else if (patternMatch[3] || patternMatch[4]) {
        // Relationship pattern: [alias:Type]
        currentRel = {
          alias: patternMatch[3]?.trim(),
          type: patternMatch[4]?.trim()
        }
      } else if (patternMatch[5]) {
        // Direction: ->, <-, <->
        if (currentRel) {
          currentRel.direction = patternMatch[5] as '->' | '<-' | '<->'
        }
      }
    }
  })

  // Extract WHERE clause
  const whereMatch = query.match(/WHERE\s+(.+?)(?=\s*(?:RETURN|WITH|LIMIT|$))/i)
  if (whereMatch) {
    const whereClause = whereMatch[1].trim()
    
    // Parse conditions: alias.property operator value
    // Handle AND/OR separated conditions
    const conditionParts = whereClause.split(/\s+(?:AND|OR)\s+/i)
    
    conditionParts.forEach(part => {
      // Pattern: alias.property operator "value" or alias.property operator value
      const condMatch = part.match(/(\w+)\.(\w+)\s*(=|!=|<>|<|>|<=|>=|CONTAINS|STARTS\s+WITH|ENDS\s+WITH|IN)\s*(.+)/i)
      if (condMatch) {
        const nodeAlias = condMatch[1].trim()
        const property = condMatch[2].trim()
        let operator = condMatch[3].trim().toUpperCase()
        let value = condMatch[4].trim()

        // Normalize operators
        if (operator === '=') operator = '='
        if (operator === '!=' || operator === '<>') operator = '!='
        if (operator === 'CONTAINS') operator = 'CONTAINS'
        if (operator === 'STARTS WITH') operator = 'STARTS WITH'
        if (operator === 'ENDS WITH') operator = 'ENDS WITH'

        // Remove quotes from value
        value = value.replace(/^["']|["']$/g, '')

        conditions.push({
          nodeAlias,
          property,
          operator,
          value
        })
      }
    })
  }

  // Extract RETURN clause
  const returnMatch = query.match(/RETURN\s+(.+?)(?=\s*(?:LIMIT|$))/i)
  if (returnMatch) {
    const returnClause = returnMatch[1].trim()
    // Split by comma and extract aliases
    returnClause.split(',').forEach(field => {
      const alias = field.trim().split(/\s+/)[0].trim()
      if (alias && !returnFields.includes(alias)) {
        returnFields.push(alias)
      }
    })
  }

  // Extract LIMIT clause
  const limitMatch = query.match(/LIMIT\s+(\d+)/i)
  if (limitMatch) {
    limit = parseInt(limitMatch[1], 10)
  }

  return {
    nodes,
    relationships,
    conditions,
    returnFields: returnFields.length > 0 ? returnFields : nodes.map(n => n.alias),
    limit
  }
}

/**
 * Converts parsed Cypher query to Query Builder state format
 */
export function convertCypherToBuilderState (cypherQuery: string) {
  const parsed = parseCypherToBuilder(cypherQuery)
  if (!parsed) {
    return null
  }

  // Generate unique IDs for nodes
  let nodeIdCounter = 1
  let relationshipIdCounter = 1
  let conditionIdCounter = 1

  const nodeMap = new Map<string, string>() // alias -> nodeId
  const builderNodes = parsed.nodes.map(node => {
    const nodeId = `node_${nodeIdCounter++}`
    nodeMap.set(node.alias, nodeId)
    return {
      id: nodeId,
      label: node.label,
      alias: node.alias
    }
  })

  const builderRelationships = parsed.relationships.map(rel => {
    const fromNodeId = nodeMap.get(rel.fromAlias)
    const toNodeId = nodeMap.get(rel.toAlias)
    
    if (!fromNodeId || !toNodeId) {
      return null
    }

    return {
      id: `rel_${relationshipIdCounter++}`,
      type: rel.type,
      from: fromNodeId,
      to: toNodeId,
      alias: rel.alias,
      matchType: rel.matchType,
      enabled: true
    }
  }).filter(Boolean) as Array<{ id: string, type?: string, from: string, to: string, alias?: string, matchType?: 'AND' | 'OR' | 'MATCH' | 'OPTIONAL_MATCH', enabled?: boolean }>

  const builderConditions = parsed.conditions.map(cond => {
    const nodeId = nodeMap.get(cond.nodeAlias)
    if (!nodeId) {
      return null
    }

    return {
      id: `cond_${conditionIdCounter++}`,
      type: 'property' as const,
      nodeId,
      property: cond.property,
      operator: cond.operator,
      value: cond.value
    }
  }).filter(Boolean) as Array<{ id: string, type: 'property', nodeId: string, property: string, operator: string, value: string }>

  // Map return fields to node indices
  const returnFieldIndices = parsed.returnFields.map(alias => {
    const nodeIndex = builderNodes.findIndex(n => n.alias === alias)
    return nodeIndex >= 0 ? nodeIndex.toString() : null
  }).filter(Boolean) as string[]

  return {
    nodes: builderNodes,
    relationships: builderRelationships,
    conditions: builderConditions,
    returnFields: returnFieldIndices.length > 0 ? returnFieldIndices : builderNodes.map((_, i) => i.toString()),
    limit: parsed.limit?.toString() || '10',
    nodeIdCounter: nodeIdCounter,
    relationshipIdCounter: relationshipIdCounter
  }
}



