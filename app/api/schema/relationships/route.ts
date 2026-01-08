import { NextResponse } from 'next/server'
import { SchemaLoaderService } from '@/lib/services/SchemaLoaderService'

/**
 * API endpoint to get node-to-relationship mapping from schema
 * Returns a map of node types to their valid outgoing relationship types
 */
export async function GET () {
  try {
    const loader = new SchemaLoaderService(process.cwd())
    const schema = await loader.loadFromJSON()

    // Build node-to-relationships mapping from schema
    const nodeRelationshipMap: Record<string, string[]> = {}

    // Iterate through all nodes and extract their outgoing relationships
    for (const [nodeName, nodeSchema] of Object.entries(schema.nodes)) {
      // Get all outgoing relationships for this node
      const outgoingRelations = Object.keys(nodeSchema.relationsOut || {})
      if (outgoingRelations.length > 0) {
        nodeRelationshipMap[nodeName] = outgoingRelations
      } else {
        // Explicitly set empty array for nodes with no outgoing relationships
        nodeRelationshipMap[nodeName] = []
      }
    }

    return NextResponse.json({ nodeRelationshipMap })
  } catch (error: unknown) {
    console.error('Failed to load relationship mapping:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: errorMessage,
        hint: 'Run "npm run generate-schema" to generate the schema JSON file'
      },
      { status: 500 }
    )
  }
}

