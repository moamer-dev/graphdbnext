import { NextResponse } from 'next/server'
import { GraphDatabaseFactory } from '@/lib/services/graph-database'

export async function GET() {
  const dbType = GraphDatabaseFactory.getDatabaseType()
  const host = process.env.GRAPH_DB_HOST || process.env.MEMGRAPH_HOST || process.env.NEO4J_HOST || '127.0.0.1'
  const port = process.env.GRAPH_DB_PORT || process.env.MEMGRAPH_PORT || process.env.NEO4J_PORT || '7687'
  
  const dbName = dbType === 'neo4j' ? 'Neo4j' : 'Memgraph'
  
  return NextResponse.json({
    type: dbType,
    name: dbName,
    host,
    port: parseInt(port),
    displayName: `${dbName}:${port}`
  })
}

