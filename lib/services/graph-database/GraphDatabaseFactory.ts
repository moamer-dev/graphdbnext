import { IGraphDatabaseService } from './IGraphDatabaseService'
import { MemgraphAdapter } from './MemgraphAdapter'
import { Neo4jAdapter } from './Neo4jAdapter'

export type GraphDatabaseType = 'memgraph' | 'neo4j'

export class GraphDatabaseFactory {
  private static instance: IGraphDatabaseService | null = null

  static getInstance(): IGraphDatabaseService {
    if (this.instance) {
      return this.instance
    }

    const dbType = (process.env.GRAPH_DB_TYPE || 'memgraph').toLowerCase() as GraphDatabaseType
    const host = process.env.GRAPH_DB_HOST || process.env.MEMGRAPH_HOST || process.env.NEO4J_HOST || '127.0.0.1'
    const port = parseInt(
      process.env.GRAPH_DB_PORT || 
      process.env.MEMGRAPH_PORT || 
      process.env.NEO4J_PORT || 
      '7687'
    )
    const username = process.env.GRAPH_DB_USERNAME || process.env.NEO4J_USERNAME || ''
    const password = process.env.GRAPH_DB_PASSWORD || process.env.NEO4J_PASSWORD || ''

    switch (dbType) {
      case 'neo4j':
        this.instance = new Neo4jAdapter(host, port, username, password)
        break
      case 'memgraph':
      default:
        this.instance = new MemgraphAdapter(host, port, username, password)
        break
    }

    return this.instance
  }

  static resetInstance(): void {
    if (this.instance) {
      this.instance.close().catch(console.error)
      this.instance = null
    }
  }

  static getDatabaseType(): GraphDatabaseType {
    const dbType = (process.env.GRAPH_DB_TYPE || 'memgraph').toLowerCase() as GraphDatabaseType
    return dbType === 'neo4j' ? 'neo4j' : 'memgraph'
  }
}

export function getGraphDatabaseService(): IGraphDatabaseService {
  return GraphDatabaseFactory.getInstance()
}

