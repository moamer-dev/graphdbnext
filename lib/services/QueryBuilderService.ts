export interface QueryNode {
  id: string
  label?: string
  alias: string
}

export interface QueryRelationship {
  id: string
  type?: string
  from: string
  to: string
  alias?: string
  matchType?: 'AND' | 'OR' | 'MATCH' | 'OPTIONAL_MATCH'
  enabled?: boolean
}

export interface QueryCondition {
  id: string
  type: 'node' | 'relationship' | 'property' | 'path'
  nodeId?: string
  property?: string
  operator?: string
  value?: string
}

export interface QueryConditionType {
  id: string
  type: 'node' | 'relationship' | 'property' | 'path'
  nodeId?: string
  property?: string
  operator?: string
  value?: string
}

export interface QueryBuilderState {
  nodes: QueryNode[]
  relationships: QueryRelationship[]
  conditions: QueryCondition[]
  returnFields: string[]
  limit: string
  limitMode?: 'rows' | 'nodes' // 'rows' = limit result rows (default), 'nodes' = limit distinct nodes then get all relationships
}

export class QueryBuilderService {
  generateQuery (state: QueryBuilderState): string {
    const { nodes: matchNodes, relationships: matchRelationships, conditions, returnFields, limit, limitMode = 'rows' } = state
    
    // Filter out disabled relationships
    const enabledRelationships = matchRelationships.filter(rel => rel.enabled !== false)
    
    // If limitMode is 'nodes', we need to restructure the query to match primary node first, then limit, then relationships
    if (limitMode === 'nodes' && limit && matchNodes.length > 0 && enabledRelationships.length > 0) {
      return this.generateQueryWithNodeLimit(state, matchNodes, enabledRelationships, conditions, returnFields, limit)
    }
    
    let query = 'MATCH '
    
    if (enabledRelationships.length > 0) {
      // Build connected patterns using relationships
      const connectedPatterns: string[] = []
      const usedNodeIds = new Set<string>()
      
      // Track used node aliases to ensure uniqueness in the query
      const usedNodeAliases = new Set<string>()
      const nodeAliasMap = new Map<string, string>() // Map node.id -> unique alias for this query
      
      // First pass: assign unique aliases to all nodes used in relationships
      enabledRelationships.forEach((rel) => {
        const fromNode = matchNodes.find(n => n.id === rel.from)
        const toNode = matchNodes.find(n => n.id === rel.to)
        if (fromNode && !nodeAliasMap.has(fromNode.id)) {
          // Generate unique alias for this node
          let alias = fromNode.alias
          let aliasNum = 0
          while (usedNodeAliases.has(alias)) {
            // If alias is taken, try next letter
            const baseCharCode = alias.charCodeAt(0)
            alias = String.fromCharCode(baseCharCode + aliasNum)
            aliasNum++
            if (aliasNum > 25) break // Prevent infinite loop
          }
          usedNodeAliases.add(alias)
          nodeAliasMap.set(fromNode.id, alias)
        }
        if (toNode && !nodeAliasMap.has(toNode.id)) {
          // Generate unique alias for this node
          let alias = toNode.alias
          let aliasNum = 0
          while (usedNodeAliases.has(alias)) {
            // If alias is taken, try next letter
            const baseCharCode = alias.charCodeAt(0)
            alias = String.fromCharCode(baseCharCode + aliasNum)
            aliasNum++
            if (aliasNum > 25) break // Prevent infinite loop
          }
          usedNodeAliases.add(alias)
          nodeAliasMap.set(toNode.id, alias)
        }
      })
      
      // Track used relationship aliases to ensure uniqueness
      const usedRelAliases = new Set<string>()
      
      // Track which nodes have been used in the main MATCH clause
      const nodesInMainMatch = new Set<string>()
      const optionalPatterns: Array<{ pattern: string, type: 'MATCH' | 'OPTIONAL_MATCH', fromAlias: string, fromNodeId: string }> = []
      
      // First pass: add all AND relationships to main MATCH
      enabledRelationships.forEach((rel, index) => {
        const fromNode = matchNodes.find(n => n.id === rel.from)
        const toNode = matchNodes.find(n => n.id === rel.to)
        if (fromNode && toNode) {
          const matchType = rel.matchType || (index === 0 ? undefined : 'OPTIONAL_MATCH')
          
          if (matchType !== 'MATCH' && matchType !== 'OPTIONAL_MATCH') {
            // AND (default or undefined) - add to main MATCH
            const fromLabel = fromNode.label ? `:${fromNode.label}` : ''
            const toLabel = toNode.label ? `:${toNode.label}` : ''
            const typePart = rel.type ? `:${rel.type}` : ''
            const fromAlias = nodeAliasMap.get(fromNode.id) || fromNode.alias
            const toAlias = nodeAliasMap.get(toNode.id) || toNode.alias
            
            let relAlias = rel.alias || `r${index + 1}`
            if (usedRelAliases.has(relAlias)) {
              let aliasNum = 1
              while (usedRelAliases.has(`r${aliasNum}`)) {
                aliasNum++
              }
              relAlias = `r${aliasNum}`
            }
            usedRelAliases.add(relAlias)
            
            const relPart = `[${relAlias}${typePart}]`
            const pattern = `(${fromAlias}${fromLabel})-${relPart}->(${toAlias}${toLabel})`
            connectedPatterns.push(pattern)
            nodesInMainMatch.add(fromNode.id)
            nodesInMainMatch.add(toNode.id)
            usedNodeIds.add(fromNode.id)
            usedNodeIds.add(toNode.id)
          }
        }
      })
      
      // Second pass: add OPTIONAL MATCH and separate MATCH relationships
      enabledRelationships.forEach((rel, index) => {
        const fromNode = matchNodes.find(n => n.id === rel.from)
        const toNode = matchNodes.find(n => n.id === rel.to)
        if (fromNode && toNode) {
          const matchType = rel.matchType || (index === 0 ? undefined : 'OPTIONAL_MATCH')
          
          if (matchType === 'MATCH' || matchType === 'OPTIONAL_MATCH') {
            const fromAlias = nodeAliasMap.get(fromNode.id) || fromNode.alias
            const toAlias = nodeAliasMap.get(toNode.id) || toNode.alias
            
            // If the from node is already in main MATCH, don't re-specify its label
            const fromNodeInMainMatch = nodesInMainMatch.has(fromNode.id)
            const fromLabel = fromNodeInMainMatch ? '' : (fromNode.label ? `:${fromNode.label}` : '')
            const toLabel = toNode.label ? `:${toNode.label}` : ''
            const typePart = rel.type ? `:${rel.type}` : ''
            
            let relAlias = rel.alias || `r${index + 1}`
            if (usedRelAliases.has(relAlias)) {
              let aliasNum = 1
              while (usedRelAliases.has(`r${aliasNum}`)) {
                aliasNum++
              }
              relAlias = `r${aliasNum}`
            }
            usedRelAliases.add(relAlias)
            
            const relPart = `[${relAlias}${typePart}]`
            const pattern = `(${fromAlias}${fromLabel})-${relPart}->(${toAlias}${toLabel})`
            
            optionalPatterns.push({ 
              pattern, 
              type: matchType as 'MATCH' | 'OPTIONAL_MATCH',
              fromAlias,
              fromNodeId: fromNode.id
            })
            
            usedNodeIds.add(fromNode.id)
            usedNodeIds.add(toNode.id)
          }
        }
      })
      
      // Add any nodes that aren't connected by relationships
      const unconnectedNodes: string[] = []
      matchNodes.forEach(node => {
        if (!usedNodeIds.has(node.id)) {
          const labelPart = node.label ? `:${node.label}` : ''
          unconnectedNodes.push(`(${node.alias}${labelPart})`)
        }
      })
      
      // Combine connected patterns and unconnected nodes
      const allPatterns = [...connectedPatterns, ...unconnectedNodes]
      if (allPatterns.length > 0) {
        query += allPatterns.join(', ')
      } else {
        query += '(n)'
      }
      
      // Add OPTIONAL MATCH or separate MATCH for relationships based on their matchType
      const optionalMatchPatterns = optionalPatterns.filter(p => p.type === 'OPTIONAL_MATCH').map(p => p.pattern)
      const separateMatchPatterns = optionalPatterns.filter(p => p.type === 'MATCH').map(p => p.pattern)
      
      // If we have OPTIONAL MATCH patterns, use WITH clause to ensure we get all rows from main MATCH first
      if (optionalMatchPatterns.length > 0) {
        // Collect all aliases from the main MATCH to pass through WITH
        const mainMatchAliases = new Set<string>()
        connectedPatterns.forEach(pattern => {
          // Extract aliases from pattern (simple regex match for (alias) or (alias:Label))
          const aliasMatches = pattern.match(/\((\w+)(?::[^)]+)?\)/g)
          if (aliasMatches) {
            aliasMatches.forEach(match => {
              const alias = match.match(/\((\w+)/)?.[1]
              if (alias) mainMatchAliases.add(alias)
            })
          }
        })
        unconnectedNodes.forEach(pattern => {
          const aliasMatches = pattern.match(/\((\w+)(?::[^)]+)?\)/g)
          if (aliasMatches) {
            aliasMatches.forEach(match => {
              const alias = match.match(/\((\w+)/)?.[1]
              if (alias) mainMatchAliases.add(alias)
            })
          }
        })
        
        // Use WITH to pass through all variables from main MATCH
        if (mainMatchAliases.size > 0) {
          query += ' WITH ' + Array.from(mainMatchAliases).join(', ')
        }
        
        query += ' OPTIONAL MATCH ' + optionalMatchPatterns.join(', ')
      }
      
      // Add separate MATCH patterns
      separateMatchPatterns.forEach(pattern => {
        query += ' MATCH ' + pattern
      })
    } else {
      // No relationships - use simple comma-separated node patterns
      const matchParts: string[] = []
      matchNodes.forEach(node => {
        const labelPart = node.label ? `:${node.label}` : ''
        matchParts.push(`(${node.alias}${labelPart})`)
      })
      
      if (matchParts.length > 0) {
        query += matchParts.join(', ')
      } else {
        query += '(n)'
      }
    }

    // Build WHERE clause
    if (conditions.length > 0) {
      query += ' WHERE '
      const whereParts = conditions.map(cond => {
        if (cond.type === 'property' && cond.nodeId && cond.property && cond.operator && cond.value) {
          // Find the node by ID to get its alias
          const node = matchNodes.find(n => n.id === cond.nodeId)
          const nodeAlias = node?.alias || 'n'
          const propName = cond.property
          
          // Numeric comparison operators
          const numericOperators = ['>', '<', '>=', '<=']
          const isNumericOperator = numericOperators.includes(cond.operator)
          
          // Check if value is a valid number
          const trimmedValue = String(cond.value).trim()
          const numValue = Number(trimmedValue)
          const isNumericValue = !isNaN(numValue) && isFinite(numValue) && trimmedValue === String(numValue)
          
          // For numeric operators with numeric values, cast property to number to handle string properties
          if (isNumericOperator && isNumericValue) {
            // Check if it's an integer or float
            const isInteger = Number.isInteger(numValue)
            const castFunction = isInteger ? 'toInteger' : 'toFloat'
            return `${castFunction}(${nodeAlias}.${propName}) ${cond.operator} ${trimmedValue}`
          }
          
          // For string operators, cast property to string and quote the value
          if (cond.operator === 'CONTAINS' || cond.operator === 'STARTS WITH' || cond.operator === 'ENDS WITH') {
            return `toString(${nodeAlias}.${propName}) ${cond.operator} "${cond.value}"`
          }
          
          // For equality operators, quote string values, don't quote numeric values
          if (isNumericValue) {
            return `${nodeAlias}.${propName} ${cond.operator} ${trimmedValue}`
          }
          
          // Default: quote string values
          return `${nodeAlias}.${propName} ${cond.operator} "${cond.value}"`
        }
        return ''
      }).filter(Boolean)
      query += whereParts.join(' AND ')
    }

    // Build RETURN clause
    query += ' RETURN '
    
    // Collect all node aliases used in relationships and conditions
    const allUsedAliases = new Set<string>()
    matchRelationships.forEach(rel => {
      const fromNode = matchNodes.find(n => n.id === rel.from)
      const toNode = matchNodes.find(n => n.id === rel.to)
      if (fromNode) allUsedAliases.add(fromNode.alias)
      if (toNode) allUsedAliases.add(toNode.alias)
    })
    conditions.forEach(cond => {
      if (cond.nodeId) {
        const node = matchNodes.find(n => n.id === cond.nodeId)
        if (node) allUsedAliases.add(node.alias)
      }
    })
    
    if (returnFields.length > 0) {
      // Map selected node indices to aliases and remove duplicates
      const mappedFields = returnFields
        .map(field => {
          // Field is a node index (string representation of index)
          const nodeIndex = parseInt(field)
          if (!isNaN(nodeIndex) && nodeIndex >= 0 && nodeIndex < matchNodes.length) {
            return matchNodes[nodeIndex]?.alias || 'n'
          }
          // If field is already an alias, use it
          return field
        })
        .filter((alias, index, self) => {
          // Remove duplicates and invalid entries
          return alias && self.indexOf(alias) === index
        })
      
      if (mappedFields.length > 0) {
        query += mappedFields.join(', ')
      } else if (allUsedAliases.size > 0) {
        // Fallback: return all nodes used in relationships/conditions
        query += Array.from(allUsedAliases).sort().join(', ')
      } else {
        query += 'n'
      }
    } else {
      // If no return fields selected, return all nodes that are used in relationships or conditions
      if (allUsedAliases.size > 0) {
        query += Array.from(allUsedAliases).sort().join(', ')
      } else {
        query += 'n'
      }
    }

    // Build LIMIT clause (only for 'rows' mode, 'nodes' mode is handled separately)
    if (limit && limitMode === 'rows') {
      query += ` LIMIT ${limit}`
    }

    return query
  }

  /**
   * Generate a query with node limit mode: match primary node first, limit it, then match relationships
   */
  private generateQueryWithNodeLimit (
    state: QueryBuilderState,
    matchNodes: QueryNode[],
    enabledRelationships: QueryRelationship[],
    conditions: QueryCondition[],
    returnFields: string[],
    limit: string
  ): string {
    // Find the primary node (first node that is a source of a relationship in main MATCH, or first node)
    let primaryNode = matchNodes[0]
    for (const rel of enabledRelationships) {
      const fromNode = matchNodes.find(n => n.id === rel.from)
      if (fromNode && rel.matchType !== 'OPTIONAL_MATCH' && rel.matchType !== 'MATCH') {
        primaryNode = fromNode
        break
      }
    }
    
    // Step 1: MATCH primary node only (without relationships)
    let query = 'MATCH '
    const primaryLabel = primaryNode.label ? `:${primaryNode.label}` : ''
    query += `(${primaryNode.alias}${primaryLabel})`
    
    // Step 2: Apply WHERE conditions (only those that apply to the primary node)
    const primaryNodeConditions = conditions.filter(cond => cond.nodeId === primaryNode.id)
    if (primaryNodeConditions.length > 0) {
      query += ' WHERE '
      const whereParts = primaryNodeConditions.map(cond => {
        if (cond.type === 'property' && cond.property && cond.operator && cond.value) {
          const propName = cond.property
          const numericOperators = ['>', '<', '>=', '<=']
          const isNumericOperator = numericOperators.includes(cond.operator)
          const trimmedValue = String(cond.value).trim()
          const numValue = Number(trimmedValue)
          const isNumericValue = !isNaN(numValue) && isFinite(numValue) && trimmedValue === String(numValue)
          
          if (isNumericOperator && isNumericValue) {
            const isInteger = Number.isInteger(numValue)
            const castFunction = isInteger ? 'toInteger' : 'toFloat'
            return `${castFunction}(${primaryNode.alias}.${propName}) ${cond.operator} ${trimmedValue}`
          }
          
          if (cond.operator === 'CONTAINS' || cond.operator === 'STARTS WITH' || cond.operator === 'ENDS WITH') {
            return `toString(${primaryNode.alias}.${propName}) ${cond.operator} "${cond.value}"`
          }
          
          if (isNumericValue) {
            return `${primaryNode.alias}.${propName} ${cond.operator} ${trimmedValue}`
          }
          
          return `${primaryNode.alias}.${propName} ${cond.operator} "${cond.value}"`
        }
        return ''
      }).filter(Boolean)
      query += whereParts.join(' AND ')
    }
    
    // Step 3: WITH primaryNode LIMIT
    query += ` WITH ${primaryNode.alias} LIMIT ${limit}`
    
    // Step 4: MATCH relationships from the limited nodes
    const relationshipPatterns: string[] = []
    enabledRelationships.forEach((rel, index) => {
      // Skip relationships that are OPTIONAL MATCH or separate MATCH - we'll handle them after if needed
      if (rel.matchType === 'OPTIONAL_MATCH' || rel.matchType === 'MATCH') {
        return
      }
      
      const fromNode = matchNodes.find(n => n.id === rel.from)
      const toNode = matchNodes.find(n => n.id === rel.to)
      if (fromNode && toNode) {
        // Don't re-specify the primary node label (it's already bound)
        const fromLabel = fromNode.id === primaryNode.id ? '' : (fromNode.label ? `:${fromNode.label}` : '')
        const toLabel = toNode.label ? `:${toNode.label}` : ''
        const relType = rel.type ? `:${rel.type}` : ''
        const relAlias = rel.alias || `r${index + 1}`
        relationshipPatterns.push(`(${fromNode.alias}${fromLabel})-[${relAlias}${relType}]->(${toNode.alias}${toLabel})`)
      }
    })
    
    if (relationshipPatterns.length > 0) {
      query += ' MATCH ' + relationshipPatterns.join(', ')
    }
    
    // Step 5: Handle OPTIONAL MATCH and separate MATCH relationships if any
    const optionalMatchPatterns = enabledRelationships
      .filter(rel => rel.matchType === 'OPTIONAL_MATCH')
      .map((rel, index) => {
        const fromNode = matchNodes.find(n => n.id === rel.from)
        const toNode = matchNodes.find(n => n.id === rel.to)
        if (fromNode && toNode) {
          const fromLabel = fromNode.id === primaryNode.id ? '' : (fromNode.label ? `:${fromNode.label}` : '')
          const toLabel = toNode.label ? `:${toNode.label}` : ''
          const relType = rel.type ? `:${rel.type}` : ''
          const relAlias = rel.alias || `r_opt${index + 1}`
          return `(${fromNode.alias}${fromLabel})-[${relAlias}${relType}]->(${toNode.alias}${toLabel})`
        }
        return null
      })
      .filter((pattern): pattern is string => pattern !== null)
    
    const separateMatchPatterns = enabledRelationships
      .filter(rel => rel.matchType === 'MATCH')
      .map((rel, index) => {
        const fromNode = matchNodes.find(n => n.id === rel.from)
        const toNode = matchNodes.find(n => n.id === rel.to)
        if (fromNode && toNode) {
          const fromLabel = fromNode.id === primaryNode.id ? '' : (fromNode.label ? `:${fromNode.label}` : '')
          const toLabel = toNode.label ? `:${toNode.label}` : ''
          const relType = rel.type ? `:${rel.type}` : ''
          const relAlias = rel.alias || `r_match${index + 1}`
          return `(${fromNode.alias}${fromLabel})-[${relAlias}${relType}]->(${toNode.alias}${toLabel})`
        }
        return null
      })
      .filter((pattern): pattern is string => pattern !== null)
    
    if (optionalMatchPatterns.length > 0) {
      query += ' OPTIONAL MATCH ' + optionalMatchPatterns.join(', ')
    }
    
    if (separateMatchPatterns.length > 0) {
      separateMatchPatterns.forEach(pattern => {
        query += ' MATCH ' + pattern
      })
    }
    
    // Step 6: Apply remaining WHERE conditions (for non-primary nodes)
    const remainingConditions = conditions.filter(cond => cond.nodeId !== primaryNode.id)
    if (remainingConditions.length > 0) {
      query += ' WHERE '
      const whereParts = remainingConditions.map(cond => {
        if (cond.type === 'property' && cond.nodeId && cond.property && cond.operator && cond.value) {
          const node = matchNodes.find(n => n.id === cond.nodeId)
          const nodeAlias = node?.alias || 'n'
          const propName = cond.property
          const numericOperators = ['>', '<', '>=', '<=']
          const isNumericOperator = numericOperators.includes(cond.operator)
          const trimmedValue = String(cond.value).trim()
          const numValue = Number(trimmedValue)
          const isNumericValue = !isNaN(numValue) && isFinite(numValue) && trimmedValue === String(numValue)
          
          if (isNumericOperator && isNumericValue) {
            const isInteger = Number.isInteger(numValue)
            const castFunction = isInteger ? 'toInteger' : 'toFloat'
            return `${castFunction}(${nodeAlias}.${propName}) ${cond.operator} ${trimmedValue}`
          }
          
          if (cond.operator === 'CONTAINS' || cond.operator === 'STARTS WITH' || cond.operator === 'ENDS WITH') {
            return `toString(${nodeAlias}.${propName}) ${cond.operator} "${cond.value}"`
          }
          
          if (isNumericValue) {
            return `${nodeAlias}.${propName} ${cond.operator} ${trimmedValue}`
          }
          
          return `${nodeAlias}.${propName} ${cond.operator} "${cond.value}"`
        }
        return ''
      }).filter(Boolean)
      query += whereParts.join(' AND ')
    }
    
    // Step 7: RETURN clause
    query += ' RETURN '
    
    const allUsedAliases = new Set<string>()
    enabledRelationships.forEach(rel => {
      const fromNode = matchNodes.find(n => n.id === rel.from)
      const toNode = matchNodes.find(n => n.id === rel.to)
      if (fromNode) allUsedAliases.add(fromNode.alias)
      if (toNode) allUsedAliases.add(toNode.alias)
    })
    conditions.forEach(cond => {
      if (cond.nodeId) {
        const node = matchNodes.find(n => n.id === cond.nodeId)
        if (node) allUsedAliases.add(node.alias)
      }
    })
    
    if (returnFields.length > 0) {
      const mappedFields = returnFields
        .map(field => {
          const nodeIndex = parseInt(field)
          if (!isNaN(nodeIndex) && nodeIndex >= 0 && nodeIndex < matchNodes.length) {
            return matchNodes[nodeIndex]?.alias || 'n'
          }
          return field
        })
        .filter((alias, index, self) => {
          return alias && self.indexOf(alias) === index
        })
      
      if (mappedFields.length > 0) {
        query += mappedFields.join(', ')
      } else if (allUsedAliases.size > 0) {
        query += Array.from(allUsedAliases).sort().join(', ')
      } else {
        query += primaryNode.alias
      }
    } else {
      if (allUsedAliases.size > 0) {
        query += Array.from(allUsedAliases).sort().join(', ')
      } else {
        query += primaryNode.alias
      }
    }
    
    return query
  }

  /**
   * Generate an UPDATE query (MATCH ... SET ...) based on query builder state
   * @param state - Query builder state
   * @param targetNodeAlias - Alias of the node to update
   * @param propertyUpdates - Map of property names to new values
   * @returns Cypher UPDATE query string
   */
  generateUpdateQuery (
    state: QueryBuilderState,
    targetNodeAlias: string,
    propertyUpdates: Record<string, unknown>
  ): string {
    const { nodes: matchNodes, relationships: matchRelationships, conditions } = state
    
    // Build MATCH clause (reuse existing logic)
    let query = 'MATCH '

    const enabledRelationships = matchRelationships.filter(rel => rel.enabled !== false)
    
    if (enabledRelationships.length > 0) {
      const connectedPatterns: string[] = []
      const usedNodeIds = new Set<string>()
      const usedNodeAliases = new Set<string>()
      const nodeAliasMap = new Map<string, string>()
      
      enabledRelationships.forEach((rel) => {
        const fromNode = matchNodes.find(n => n.id === rel.from)
        const toNode = matchNodes.find(n => n.id === rel.to)
        if (fromNode && !nodeAliasMap.has(fromNode.id)) {
          let alias = fromNode.alias
          let aliasNum = 0
          while (usedNodeAliases.has(alias)) {
            const baseCharCode = alias.charCodeAt(0)
            alias = String.fromCharCode(baseCharCode + aliasNum)
            aliasNum++
            if (aliasNum > 25) break
          }
          usedNodeAliases.add(alias)
          nodeAliasMap.set(fromNode.id, alias)
        }
        if (toNode && !nodeAliasMap.has(toNode.id)) {
          let alias = toNode.alias
          let aliasNum = 0
          while (usedNodeAliases.has(alias)) {
            const baseCharCode = alias.charCodeAt(0)
            alias = String.fromCharCode(baseCharCode + aliasNum)
            aliasNum++
            if (aliasNum > 25) break
          }
          usedNodeAliases.add(alias)
          nodeAliasMap.set(toNode.id, alias)
        }
      })

      const usedRelAliases = new Set<string>()
      const nodesInMainMatch = new Set<string>()
      const optionalPatterns: Array<{ pattern: string, type: 'MATCH' | 'OPTIONAL_MATCH', fromAlias: string, fromNodeId: string }> = []
      
      enabledRelationships.forEach((rel, index) => {
        const fromNode = matchNodes.find(n => n.id === rel.from)
        const toNode = matchNodes.find(n => n.id === rel.to)
        if (fromNode && toNode) {
          const matchType = rel.matchType || (index === 0 ? undefined : 'OPTIONAL_MATCH')
          
          if (matchType !== 'MATCH' && matchType !== 'OPTIONAL_MATCH') {
            const fromLabel = fromNode.label ? `:${fromNode.label}` : ''
            const toLabel = toNode.label ? `:${toNode.label}` : ''
            const typePart = rel.type ? `:${rel.type}` : ''
            const fromAlias = nodeAliasMap.get(fromNode.id) || fromNode.alias
            const toAlias = nodeAliasMap.get(toNode.id) || toNode.alias
            
            let relAlias = rel.alias || `r${index + 1}`
            if (usedRelAliases.has(relAlias)) {
              let aliasNum = 1
              while (usedRelAliases.has(`r${aliasNum}`)) {
                aliasNum++
              }
              relAlias = `r${aliasNum}`
            }
            usedRelAliases.add(relAlias)
            
            const relPart = `[${relAlias}${typePart}]`
            const pattern = `(${fromAlias}${fromLabel})-${relPart}->(${toAlias}${toLabel})`
            connectedPatterns.push(pattern)
            nodesInMainMatch.add(fromNode.id)
            nodesInMainMatch.add(toNode.id)
            usedNodeIds.add(fromNode.id)
            usedNodeIds.add(toNode.id)
          }
        }
      })

      enabledRelationships.forEach((rel, index) => {
        const fromNode = matchNodes.find(n => n.id === rel.from)
        const toNode = matchNodes.find(n => n.id === rel.to)
        if (fromNode && toNode) {
          const matchType = rel.matchType || (index === 0 ? undefined : 'OPTIONAL_MATCH')
          
          if (matchType === 'MATCH' || matchType === 'OPTIONAL_MATCH') {
            const fromAlias = nodeAliasMap.get(fromNode.id) || fromNode.alias
            const toAlias = nodeAliasMap.get(toNode.id) || toNode.alias
            const fromNodeInMainMatch = nodesInMainMatch.has(fromNode.id)
            const fromLabel = fromNodeInMainMatch ? '' : (fromNode.label ? `:${fromNode.label}` : '')
            const toLabel = toNode.label ? `:${toNode.label}` : ''
            const typePart = rel.type ? `:${rel.type}` : ''
            
            let relAlias = rel.alias || `r${index + 1}`
            if (usedRelAliases.has(relAlias)) {
              let aliasNum = 1
              while (usedRelAliases.has(`r${aliasNum}`)) {
                aliasNum++
              }
              relAlias = `r${aliasNum}`
            }
            usedRelAliases.add(relAlias)
            
            const relPart = `[${relAlias}${typePart}]`
            const pattern = `(${fromAlias}${fromLabel})-${relPart}->(${toAlias}${toLabel})`
            
            optionalPatterns.push({ 
              pattern, 
              type: matchType as 'MATCH' | 'OPTIONAL_MATCH',
              fromAlias,
              fromNodeId: fromNode.id
            })
            
            usedNodeIds.add(fromNode.id)
            usedNodeIds.add(toNode.id)
          }
        }
      })

      const unconnectedNodes: string[] = []
      matchNodes.forEach(node => {
        if (!usedNodeIds.has(node.id)) {
          const labelPart = node.label ? `:${node.label}` : ''
          unconnectedNodes.push(`(${node.alias}${labelPart})`)
        }
      })

      const allPatterns = [...connectedPatterns, ...unconnectedNodes]
      if (allPatterns.length > 0) {
        query += allPatterns.join(', ')
      } else {
        query += '(n)'
      }

      const optionalMatchPatterns = optionalPatterns.filter(p => p.type === 'OPTIONAL_MATCH').map(p => p.pattern)
      const separateMatchPatterns = optionalPatterns.filter(p => p.type === 'MATCH').map(p => p.pattern)
      
      if (optionalMatchPatterns.length > 0) {
        const mainMatchAliases = new Set<string>()
        connectedPatterns.forEach(pattern => {
          const aliasMatches = pattern.match(/\((\w+)(?::[^)]+)?\)/g)
          if (aliasMatches) {
            aliasMatches.forEach(match => {
              const alias = match.match(/\((\w+)/)?.[1]
              if (alias) mainMatchAliases.add(alias)
            })
          }
        })
        unconnectedNodes.forEach(pattern => {
          const aliasMatches = pattern.match(/\((\w+)(?::[^)]+)?\)/g)
          if (aliasMatches) {
            aliasMatches.forEach(match => {
              const alias = match.match(/\((\w+)/)?.[1]
              if (alias) mainMatchAliases.add(alias)
            })
          }
        })
        
        if (mainMatchAliases.size > 0) {
          query += ' WITH ' + Array.from(mainMatchAliases).join(', ')
        }
        
        query += ' OPTIONAL MATCH ' + optionalMatchPatterns.join(', ')
      }

      separateMatchPatterns.forEach(pattern => {
        query += ' MATCH ' + pattern
      })
    } else {
      const matchParts: string[] = []
      matchNodes.forEach(node => {
        const labelPart = node.label ? `:${node.label}` : ''
        matchParts.push(`(${node.alias}${labelPart})`)
      })
      
      if (matchParts.length > 0) {
        query += matchParts.join(', ')
      } else {
        query += '(n)'
      }
    }

    // Build WHERE clause
    if (conditions.length > 0) {
      query += ' WHERE '
      const whereParts = conditions.map(cond => {
        if (cond.type === 'property' && cond.nodeId && cond.property && cond.operator && cond.value) {
          const node = matchNodes.find(n => n.id === cond.nodeId)
          const nodeAlias = node?.alias || 'n'
          const propName = cond.property
          
          const numericOperators = ['>', '<', '>=', '<=']
          const isNumericOperator = numericOperators.includes(cond.operator)
          
          const trimmedValue = String(cond.value).trim()
          const numValue = Number(trimmedValue)
          const isNumericValue = !isNaN(numValue) && isFinite(numValue) && trimmedValue === String(numValue)
          
          if (isNumericOperator && isNumericValue) {
            const isInteger = Number.isInteger(numValue)
            const castFunction = isInteger ? 'toInteger' : 'toFloat'
            return `${castFunction}(${nodeAlias}.${propName}) ${cond.operator} ${trimmedValue}`
          }
          
          if (cond.operator === 'CONTAINS' || cond.operator === 'STARTS WITH' || cond.operator === 'ENDS WITH') {
            return `toString(${nodeAlias}.${propName}) ${cond.operator} "${cond.value}"`
          }
          
          if (isNumericValue) {
            return `${nodeAlias}.${propName} ${cond.operator} ${trimmedValue}`
          }
          
          return `${nodeAlias}.${propName} ${cond.operator} "${cond.value}"`
        }
        return ''
      }).filter(Boolean)
      query += whereParts.join(' AND ')
    }

    // Verify target node alias exists
    const allAliases = new Set<string>()
    matchNodes.forEach(node => allAliases.add(node.alias))
    matchRelationships.forEach(rel => {
      const fromNode = matchNodes.find(n => n.id === rel.from)
      const toNode = matchNodes.find(n => n.id === rel.to)
      if (fromNode) allAliases.add(fromNode.alias)
      if (toNode) allAliases.add(toNode.alias)
    })

    if (!allAliases.has(targetNodeAlias)) {
      throw new Error(`Target node alias "${targetNodeAlias}" not found in query`)
    }

    // Build SET clause
    const setClauses = Object.entries(propertyUpdates).map(([prop, value]) => {
      const formattedValue = this.formatValueForUpdate(value)
      return `${targetNodeAlias}.${prop} = ${formattedValue}`
    })

    query += ` SET ${setClauses.join(', ')}`

    // Return updated node
    query += ` RETURN ${targetNodeAlias}`

    return query
  }

  /**
   * Format a value for use in SET clause
   */
  private formatValueForUpdate (value: unknown): string {
    if (value === null || value === undefined) {
      return 'null'
    }

    if (typeof value === 'boolean') {
      return value.toString()
    }

    if (typeof value === 'number') {
      return value.toString()
    }

    if (typeof value === 'string') {
      const escaped = value.replace(/"/g, '\\"')
      return `"${escaped}"`
    }

    if (typeof value === 'object') {
      try {
        const json = JSON.stringify(value)
        const escaped = json.replace(/"/g, '\\"')
        return `"${escaped}"`
      } catch {
        throw new Error(`Failed to serialize value: ${JSON.stringify(value)}`)
      }
    }

    const stringValue = String(value).replace(/"/g, '\\"')
    return `"${stringValue}"`
  }
}

