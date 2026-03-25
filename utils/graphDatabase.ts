import { GraphDatabaseFactory } from '@/services/graph/graph-database'

export function getDatabaseDisplayName(): string {
  const dbType = GraphDatabaseFactory.getDatabaseType()
  const port = process.env.GRAPH_DB_PORT || process.env.MEMGRAPH_PORT || process.env.NEO4J_PORT || '7687'
  
  const dbName = dbType === 'neo4j' ? 'Neo4j' : 'Memgraph'
  return `${dbName}:${port}`
}

export function getDatabaseType(): string {
  return GraphDatabaseFactory.getDatabaseType()
}

