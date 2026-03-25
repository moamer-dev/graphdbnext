/**
 * Memgraph Service - Database connection and query utilities
 * 
 * Uses Neo4j driver (compatible with Memgraph's Bolt protocol)
 * Based on official Memgraph JavaScript client documentation:
 * https://memgraph.com/docs/client-libraries/javascript
 */

import neo4j, { Driver, Record as Neo4jRecord, ManagedTransaction, Integer } from 'neo4j-driver'
import type { Node, Relationship, Path, PathSegment } from 'neo4j-driver'

export class MemgraphService {
  private driver: Driver | null = null
  private uri: string
  private username: string
  private password: string

  constructor (host = '127.0.0.1', port = 7687, username = '', password = '') {
    this.uri = `bolt://${host}:${port}`
    this.username = username
    this.password = password
  }

  /**
   * Connect to Memgraph database
   * Based on: https://memgraph.com/docs/client-libraries/javascript#database-connection
   */
  async connect (): Promise<Driver> {
    if (this.driver) {
      return this.driver
    }

    try {
      this.driver = neo4j.driver(
        this.uri,
        neo4j.auth.basic(this.username, this.password)
      )
      
      // Verify connectivity
      await this.driver.verifyConnectivity()
      return this.driver
    } catch (error) {
      console.error('Failed to connect to Memgraph:', error)
      throw error
    }
  }

  /**
   * Execute a read query using automatic transaction
   * Based on: https://memgraph.com/docs/client-libraries/javascript#automatic-transactions
   */
  async execute (query: string, parameters: Record<string, unknown> = {}): Promise<unknown[]> {
    if (!this.driver) {
      await this.connect()
    }

    const session = this.driver!.session()
    try {
      const result = await session.run(query, parameters)
      return result.records.map((record: Neo4jRecord) => {
        const obj: Record<string, unknown> = {}
        record.keys.forEach((key) => {
          const keyStr = String(key)
          obj[keyStr] = this.convertNeo4jValue(record.get(keyStr))
        })
        return obj
      })
    } catch (error) {
      console.error('Query execution failed:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  /**
   * Execute a read query using managed transaction
   * Based on: https://memgraph.com/docs/client-libraries/javascript#managed-transactions
   */
  async executeRead (query: string, parameters: Record<string, unknown> = {}): Promise<unknown[]> {
    if (!this.driver) {
      await this.connect()
    }

    const session = this.driver!.session()
    try {
      const result = await session.executeRead(async (tx: ManagedTransaction) => {
        return await tx.run(query, parameters)
      })
      
      return result.records.map((record: Neo4jRecord) => {
        const obj: Record<string, unknown> = {}
        record.keys.forEach((key) => {
          const keyStr = String(key)
          obj[keyStr] = this.convertNeo4jValue(record.get(keyStr))
        })
        return obj
      })
    } catch (error) {
      console.error('Read query execution failed:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  /**
   * Execute a write query using managed transaction
   * Based on: https://memgraph.com/docs/client-libraries/javascript#managed-transactions
   */
  async executeWrite (query: string, parameters: Record<string, unknown> = {}): Promise<unknown[]> {
    if (!this.driver) {
      await this.connect()
    }

    const session = this.driver!.session()
    try {
      const result = await session.executeWrite(async (tx: ManagedTransaction) => {
        return await tx.run(query, parameters)
      })
      
      return result.records.map((record: Neo4jRecord) => {
        const obj: Record<string, unknown> = {}
        record.keys.forEach((key) => {
          const keyStr = String(key)
          obj[keyStr] = this.convertNeo4jValue(record.get(keyStr))
        })
        return obj
      })
    } catch (error) {
      console.error('Write query execution failed:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  /**
   * Execute query and return single result
   */
  async executeSingle (query: string, parameters: Record<string, unknown> = {}): Promise<unknown> {
    const results = await this.execute(query, parameters)
    return results[0] || null
  }

  /**
   * Convert Neo4j values to JavaScript primitives
   * Based on: https://memgraph.com/docs/client-libraries/javascript#process-the-results
   */
  private convertNeo4jValue (value: unknown): unknown {
    // Handle Neo4j Integer
    if (neo4j.isInt(value)) {
      return (value as Integer).toNumber()
    }
    
    // Handle Node
    if (neo4j.isNode(value)) {
      const node = value as Node
      // Always include ALL properties from the node - no filtering
      // This ensures every property stored in the database is returned
      const allProperties = this.convertProperties(node.properties)
      return {
        id: node.identity.toNumber(),
        elementId: node.elementId,
        labels: node.labels,
        properties: allProperties,
        type: 'node' // Add type indicator for consistency
      }
    }
    
    // Handle Relationship
    if (neo4j.isRelationship(value)) {
      const rel = value as Relationship
      return {
        id: rel.identity.toNumber(),
        elementId: rel.elementId,
        type: rel.type,
        startNodeElementId: rel.startNodeElementId,
        endNodeElementId: rel.endNodeElementId,
        start: rel.start.toNumber(),
        end: rel.end.toNumber(),
        properties: this.convertProperties(rel.properties)
      }
    }
    
    // Handle Path
    if (neo4j.isPath(value)) {
      const path = value as Path
      return {
        start: this.convertNeo4jValue(path.start),
        end: this.convertNeo4jValue(path.end),
        segments: path.segments.map((segment: PathSegment) => ({
          start: this.convertNeo4jValue(segment.start),
          relationship: this.convertNeo4jValue(segment.relationship),
          end: this.convertNeo4jValue(segment.end)
        }))
      }
    }
    
    if (Array.isArray(value)) {
      return value.map(v => this.convertNeo4jValue(v))
    }
    if (value && typeof value === 'object') {
      return this.convertProperties(value as Record<string, unknown>)
    }
    return value
  }

  /**
   * Convert Neo4j properties object
   */
  private convertProperties (properties: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(properties)) {
      result[key] = this.convertNeo4jValue(value)
    }
    return result
  }

  /**
   * Close the connection
   */
  async close (): Promise<void> {
    if (this.driver) {
      await this.driver.close()
      this.driver = null
    }
  }
}

// Singleton instance for API routes
let memgraphInstance: MemgraphService | null = null

export function getMemgraphService (): MemgraphService {
  if (!memgraphInstance) {
    const host = process.env.GRAPH_DB_HOST || '127.0.0.1'
    const port = parseInt(process.env.GRAPH_DB_PORT || '7688')
    memgraphInstance = new MemgraphService(host, port)
  }
  return memgraphInstance
}

// Backward compatibility exports
export { MemgraphService as MemgraphClient }
export { getMemgraphService as getMemgraphClient }

