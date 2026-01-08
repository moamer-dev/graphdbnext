/**
 * Cypher Query Library
 * 
 * Centralized collection of Cypher queries used throughout the application.
 * All queries use placeholders that are replaced with actual values.
 */

/**
 * Node-related queries
 */
export const NodeQueries = {
  /**
   * Get all distinct node labels
   */
  getAllLabels: (): string => {
    return `
      MATCH (n)
      UNWIND labels(n) as label
      RETURN DISTINCT label
      ORDER BY label
    `.trim()
  },

  /**
   * Get labels that have nodes matching a search term
   */
  getLabelsWithMatchingNodes: (searchTerm: string): string => {
    const escapedSearch = searchTerm.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    const numericSearch = Number(searchTerm.trim())
    const isNumeric = !isNaN(numericSearch) && isFinite(numericSearch) && searchTerm.trim() === String(numericSearch)
    
    let whereClause = ''
    if (isNumeric) {
      whereClause = `WHERE id(n) = ${numericSearch} OR ANY(key IN keys(n) WHERE toLower(toString(n[key])) CONTAINS toLower('${escapedSearch}'))`
    } else {
      whereClause = `WHERE ANY(key IN keys(n) WHERE toLower(toString(n[key])) CONTAINS toLower('${escapedSearch}'))`
    }
    
    return `
      MATCH (n)
      ${whereClause}
      UNWIND labels(n) as label
      RETURN DISTINCT label
      ORDER BY label
    `.trim()
  },

  /**
   * Get distinct property keys for nodes with a specific label
   */
  getPropertiesByLabel: (label: string): string => {
    return `
      MATCH (n:${label})
      UNWIND keys(n) as key
      RETURN DISTINCT key
      ORDER BY key
    `.trim()
  },

  /**
   * Get a node by its ID
   */
  getNodeById: (nodeId: number | string): string => {
    return `MATCH (n) WHERE id(n) = ${nodeId} RETURN n`
  },

  /**
   * Count nodes with a specific label
   */
  countNodesByLabel: (label: string): string => {
    const labelEscaped = CypherQueryBuilder.label(label)
    return `MATCH (n${labelEscaped}) RETURN count(n) as total`
  },

  /**
   * Get paginated list of nodes with a specific label
   */
  getNodesByLabel: (label: string, skip: number, limit: number, searchTerm?: string): string => {
    const labelEscaped = CypherQueryBuilder.label(label)
    let whereClause = ''
    
    if (searchTerm && searchTerm.trim()) {
      // Escape search term for use in Cypher (escape single quotes and backslashes)
      const escapedSearch = searchTerm.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      
      // Try to parse as number for ID search
      const numericSearch = Number(searchTerm.trim())
      const isNumeric = !isNaN(numericSearch) && isFinite(numericSearch) && searchTerm.trim() === String(numericSearch)
      
      if (isNumeric) {
        // Search by ID or numeric property values
        whereClause = `WHERE id(n) = ${numericSearch} OR ANY(key IN keys(n) WHERE toLower(toString(n[key])) CONTAINS toLower('${escapedSearch}'))`
      } else {
        // Search in property values (convert all to string and search case-insensitive)
        whereClause = `WHERE ANY(key IN keys(n) WHERE toLower(toString(n[key])) CONTAINS toLower('${escapedSearch}'))`
      }
    }
    
    return `
      MATCH (n${labelEscaped})
      ${whereClause}
      RETURN id(n) as nodeId, labels(n) as labels, properties(n) as properties
      ORDER BY id(n)
      SKIP ${skip}
      LIMIT ${limit}
    `.trim()
  },
  
  /**
   * Count nodes with a specific label (with optional search)
   */
  countNodesByLabelWithSearch: (label: string, searchTerm?: string): string => {
    const labelEscaped = CypherQueryBuilder.label(label)
    let whereClause = ''
    
    if (searchTerm && searchTerm.trim()) {
      const escapedSearch = searchTerm.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      const numericSearch = Number(searchTerm.trim())
      const isNumeric = !isNaN(numericSearch) && isFinite(numericSearch) && searchTerm.trim() === String(numericSearch)
      
      if (isNumeric) {
        whereClause = `WHERE id(n) = ${numericSearch} OR ANY(key IN keys(n) WHERE toLower(toString(n[key])) CONTAINS toLower('${escapedSearch}'))`
      } else {
        whereClause = `WHERE ANY(key IN keys(n) WHERE toLower(toString(n[key])) CONTAINS toLower('${escapedSearch}'))`
      }
    }
    
    return `
      MATCH (n${labelEscaped})
      ${whereClause}
      RETURN count(n) as total
    `.trim()
  },

  /**
   * Count outgoing relationships for a node
   */
  countOutgoingRelationships: (nodeId: number | string): string => {
    return `MATCH (n) WHERE id(n) = ${nodeId} OPTIONAL MATCH (n)-[r]->() RETURN count(r) as count`
  }
}

/**
 * Relationship-related queries
 */
export const RelationshipQueries = {
  /**
   * Get all distinct relationship types
   */
  getAllTypes: (): string => {
    return `MATCH ()-[r]->() RETURN DISTINCT type(r) as relationshipType ORDER BY relationshipType`
  },

  /**
   * Get distinct relationship types from a specific source label
   */
  getTypesByFromLabel: (fromLabel: string): string => {
    return `MATCH (a:${fromLabel})-[r]->() RETURN DISTINCT type(r) as relationshipType ORDER BY relationshipType`
  },

  /**
   * Get distinct relationship types between two specific labels
   */
  getTypesByLabels: (fromLabel: string, toLabel: string): string => {
    return `MATCH (a:${fromLabel})-[r]->(b:${toLabel}) RETURN DISTINCT type(r) as relationshipType ORDER BY relationshipType`
  },

  /**
   * Get maximum pos value for a relationship type
   */
  getMaxPosByType: (relationshipType: string): string => {
    return `MATCH ()-[r:${relationshipType}]->() RETURN max(r.pos) as maxPos`
  },

  /**
   * Count relationships by type
   */
  countRelationshipsByType: (relationshipType: string): string => {
    return `MATCH ()-[r:${relationshipType}]->() RETURN count(r) as total`
  },

  /**
   * Get paginated list of relationships by type
   */
  getRelationshipsByType: (relationshipType: string, skip: number, limit: number): string => {
    return `
      MATCH (a)-[r:${relationshipType}]->(b)
      RETURN id(r) as relId, id(a) as fromId, id(b) as toId, type(r) as type, properties(r) as properties, labels(a) as fromLabels, labels(b) as toLabels
      ORDER BY id(r)
      SKIP ${skip}
      LIMIT ${limit}
    `.trim()
  }
}

/**
 * Common/utility queries
 */
export const CommonQueries = {
  /**
   * Default query for initial load
   */
  defaultQuery: (): string => {
    return 'MATCH (n) RETURN n LIMIT 10'
  }
}

/**
 * Query builder for creating parameterized queries safely
 */
export class CypherQueryBuilder {
  /**
   * Safely escape a label/type name for use in Cypher queries
   * Only escapes if the label contains special characters
   */
  private static escapeIdentifier(identifier: string): string {
    // If identifier contains spaces or special chars, wrap in backticks
    if (/[^a-zA-Z0-9_]/.test(identifier)) {
      return `\`${identifier.replace(/`/g, '``')}\``
    }
    return identifier
  }

  /**
   * Build a label pattern with optional escaping
   */
  static label(label: string): string {
    const escaped = this.escapeIdentifier(label)
    return `:${escaped}`
  }

  /**
   * Build a relationship type pattern with optional escaping
   */
  static relationshipType(type: string): string {
    const escaped = this.escapeIdentifier(type)
    return `:${escaped}`
  }
}

