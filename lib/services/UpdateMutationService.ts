export interface PropertyUpdate {
  property: string
  value: unknown
  originalValue?: unknown
}

export interface NodeUpdateParams {
  nodeId: number | string
  updates: PropertyUpdate[]
}

export interface RelationshipUpdateParams {
  relationshipId: number | string
  updates: PropertyUpdate[]
}

export class UpdateMutationService {
  /**
   * Generate Cypher query to update node properties
   * @param nodeId - The internal node ID
   * @param updates - Array of property updates
   * @returns Cypher query string
   */
  generateUpdateNodeQuery (nodeId: number | string, updates: PropertyUpdate[]): string {
    if (updates.length === 0) {
      throw new Error('No property updates provided')
    }

    const setClauses = updates.map(update => {
      const value = this.formatValue(update.value)
      return `n.${update.property} = ${value}`
    })

    return `MATCH (n) WHERE id(n) = ${nodeId} SET ${setClauses.join(', ')} RETURN n`
  }

  /**
   * Generate Cypher query to update relationship properties
   * @param relationshipId - The internal relationship ID
   * @param updates - Array of property updates
   * @returns Cypher query string
   */
  generateUpdateRelationshipQuery (relationshipId: number | string, updates: PropertyUpdate[]): string {
    if (updates.length === 0) {
      throw new Error('No property updates provided')
    }

    const setClauses = updates.map(update => {
      const value = this.formatValue(update.value)
      return `r.${update.property} = ${value}`
    })

    return `MATCH ()-[r]->() WHERE id(r) = ${relationshipId} SET ${setClauses.join(', ')} RETURN r`
  }

  /**
   * Generate Cypher query to delete a node
   * @param nodeId - The internal node ID
   * @param detach - Whether to detach (delete) relationships as well
   * @param cascade - Whether to cascade delete (delete node and all directly connected nodes)
   * @returns Cypher query string
   */
  generateDeleteNodeQuery (nodeId: number | string, detach = false, cascade = false): string {
    if (cascade) {
      // Cascade delete: delete the node and all directly connected nodes
      return `MATCH (n) WHERE id(n) = ${nodeId} OPTIONAL MATCH (n)-[r]-(connected) DETACH DELETE n, connected`
    }
    const detachKeyword = detach ? 'DETACH ' : ''
    return `MATCH (n) WHERE id(n) = ${nodeId} ${detachKeyword}DELETE n`
  }

  /**
   * Generate Cypher query to delete a relationship
   * @param relationshipId - The internal relationship ID
   * @returns Cypher query string
   */
  generateDeleteRelationshipQuery (relationshipId: number | string): string {
    return `MATCH ()-[r]->() WHERE id(r) = ${relationshipId} DELETE r`
  }

  /**
   * Format a value for use in Cypher query
   * Handles strings, numbers, booleans, null, and JSON objects/arrays
   */
  private formatValue (value: unknown): string {
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
      // Escape quotes in strings
      const escaped = value.replace(/"/g, '\\"')
      return `"${escaped}"`
    }

    // For objects and arrays, serialize as JSON
    if (typeof value === 'object') {
      try {
        const json = JSON.stringify(value)
        // Escape quotes in JSON string
        const escaped = json.replace(/"/g, '\\"')
        return `"${escaped}"`
      } catch {
        throw new Error(`Failed to serialize value: ${JSON.stringify(value)}`)
      }
    }

    // Fallback: convert to string
    const stringValue = String(value).replace(/"/g, '\\"')
    return `"${stringValue}"`
  }

  /**
   * Generate Cypher query to create a new node
   * @param labels - Array of node labels
   * @param properties - Object with property key-value pairs
   * @returns Cypher query string
   */
  generateCreateNodeQuery (labels: string[], properties: Record<string, unknown> = {}): string {
    if (labels.length === 0) {
      throw new Error('At least one label is required to create a node')
    }

    const labelsStr = labels.map(label => `\`${label}\``).join(':')
    const propsStr = Object.keys(properties).length > 0
      ? ` {${Object.entries(properties).map(([key, value]) => {
          const formattedValue = this.formatValue(value)
          const escapedKey = key.includes(':') || key.includes(' ') || key.includes('-')
            ? `\`${key.replace(/`/g, '\\`')}\``
            : key
          return `${escapedKey}: ${formattedValue}`
        }).join(', ')}}`
      : ''

    return `CREATE (n:${labelsStr}${propsStr}) RETURN n`
  }

  /**
   * Generate Cypher query to create a new relationship
   * @param fromNodeId - Source node ID
   * @param toNodeId - Target node ID
   * @param relationshipType - Type of the relationship
   * @param properties - Object with property key-value pairs (optional)
   * @returns Cypher query string
   */
  generateCreateRelationshipQuery (
    fromNodeId: number | string,
    toNodeId: number | string,
    relationshipType: string,
    properties: Record<string, unknown> = {}
  ): string {
    if (!relationshipType || typeof relationshipType !== 'string') {
      throw new Error('Relationship type is required')
    }

    const escapedType = relationshipType.includes(':') || relationshipType.includes(' ') || relationshipType.includes('-')
      ? `\`${relationshipType.replace(/`/g, '\\`')}\``
      : relationshipType

    const propsStr = Object.keys(properties).length > 0
      ? ` {${Object.entries(properties).map(([key, value]) => {
          const formattedValue = this.formatValue(value)
          const escapedKey = key.includes(':') || key.includes(' ') || key.includes('-')
            ? `\`${key.replace(/`/g, '\\`')}\``
            : key
          return `${escapedKey}: ${formattedValue}`
        }).join(', ')}}`
      : ''

    return `MATCH (a), (b) WHERE id(a) = ${fromNodeId} AND id(b) = ${toNodeId} CREATE (a)-[r:${escapedType}${propsStr}]->(b) RETURN r`
  }

  /**
   * Validate property updates
   * @param updates - Array of property updates
   * @returns Validation result with errors if any
   */
  validateUpdates (updates: PropertyUpdate[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (updates.length === 0) {
      errors.push('At least one property update is required')
    }

    updates.forEach((update, index) => {
      if (!update.property || typeof update.property !== 'string') {
        errors.push(`Update ${index + 1}: Property name is required and must be a string`)
      }

      if (update.property && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(update.property)) {
        errors.push(`Update ${index + 1}: Invalid property name "${update.property}"`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

