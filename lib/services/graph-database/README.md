# Graph Database Service Layer

This service layer provides a unified interface for working with different graph databases (Memgraph, Neo4j, etc.) using the Adapter pattern.

## Architecture

- **IGraphDatabaseService**: Interface defining the contract for all graph database adapters
- **MemgraphAdapter**: Adapter for Memgraph database
- **Neo4jAdapter**: Adapter for Neo4j database
- **GraphDatabaseFactory**: Factory that returns the appropriate adapter based on configuration

## Configuration

Set the following environment variables to configure which database to use:

### For Memgraph (default):
```env
GRAPH_DB_TYPE=memgraph
GRAPH_DB_HOST=127.0.0.1
GRAPH_DB_PORT=7687
GRAPH_DB_USERNAME=
GRAPH_DB_PASSWORD=
```

Or use legacy Memgraph variables:
```env
MEMGRAPH_HOST=127.0.0.1
MEMGRAPH_PORT=7687
```

### For Neo4j:
```env
GRAPH_DB_TYPE=neo4j
GRAPH_DB_HOST=127.0.0.1
GRAPH_DB_PORT=7687
GRAPH_DB_USERNAME=neo4j
GRAPH_DB_PASSWORD=password
```

Or use Neo4j-specific variables:
```env
NEO4J_HOST=127.0.0.1
NEO4J_PORT=7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```

## Usage

### In API Routes:
```typescript
import { getGraphDatabaseService } from '@/lib/services/graph-database'

export async function POST(request: NextRequest) {
  const db = getGraphDatabaseService()
  
  await db.connect()
  const results = await db.executeRead('MATCH (n) RETURN n LIMIT 10')
  // ...
}
```

### Available Methods:
- `connect()`: Connect to the database
- `execute(query, parameters?)`: Execute a query (auto-detect read/write)
- `executeRead(query, parameters?)`: Execute a read query
- `executeWrite(query, parameters?)`: Execute a write query
- `executeSingle(query, parameters?)`: Execute and return first result
- `close()`: Close the connection
- `getDatabaseType()`: Get the database type ('memgraph' or 'neo4j')

## Adding New Database Adapters

1. Create a new adapter class implementing `IGraphDatabaseService`
2. Add the new type to `GraphDatabaseType` in `GraphDatabaseFactory.ts`
3. Add a case in the factory's `getInstance()` method

Example:
```typescript
export class MyGraphAdapter implements IGraphDatabaseService {
  // Implement all interface methods
  async connect(): Promise<void> { /* ... */ }
  async execute(query: string, parameters?: Record<string, unknown>): Promise<unknown[]> { /* ... */ }
  // ... other methods
  getDatabaseType(): string { return 'mygraph' }
}
```

