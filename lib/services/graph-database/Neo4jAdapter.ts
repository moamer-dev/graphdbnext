import neo4j, { Driver, Record as Neo4jRecord, ManagedTransaction, Integer } from 'neo4j-driver'
import type { Node, Relationship, Path, PathSegment } from 'neo4j-driver'
import { IGraphDatabaseService } from './IGraphDatabaseService'

export class Neo4jAdapter implements IGraphDatabaseService {
  private driver: Driver | null = null
  private uri: string
  private username: string
  private password: string

  constructor(host = '127.0.0.1', port = 7687, username = 'neo4j', password = 'password') {
    this.uri = `bolt://${host}:${port}`
    this.username = username
    this.password = password
  }

  async connect(): Promise<void> {
    if (this.driver) {
      return
    }

    try {
      this.driver = neo4j.driver(
        this.uri,
        neo4j.auth.basic(this.username, this.password)
      )
      
      await this.driver.verifyConnectivity()
    } catch (error) {
      console.error('Failed to connect to Neo4j:', error)
      throw error
    }
  }

  async execute(query: string, parameters: Record<string, unknown> = {}): Promise<unknown[]> {
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

  async executeRead(query: string, parameters: Record<string, unknown> = {}): Promise<unknown[]> {
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

  async executeWrite(query: string, parameters: Record<string, unknown> = {}): Promise<unknown[]> {
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

  async executeSingle(query: string, parameters: Record<string, unknown> = {}): Promise<unknown> {
    const results = await this.execute(query, parameters)
    return results[0] || null
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close()
      this.driver = null
    }
  }

  getDatabaseType(): string {
    return 'neo4j'
  }

  private convertNeo4jValue(value: unknown): unknown {
    if (neo4j.isInt(value)) {
      return (value as Integer).toNumber()
    }
    
    if (neo4j.isNode(value)) {
      const node = value as Node
      const allProperties = this.convertProperties(node.properties)
      return {
        id: node.identity.toNumber(),
        elementId: node.elementId,
        labels: node.labels,
        properties: allProperties,
        type: 'node'
      }
    }
    
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

  private convertProperties(properties: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(properties)) {
      result[key] = this.convertNeo4jValue(value)
    }
    return result
  }
}

