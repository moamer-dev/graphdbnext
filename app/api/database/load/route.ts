/**
 * API Route: Load Graph JSON into Memgraph
 * POST /api/database/load
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGraphDatabaseService } from '@/lib/services/graph-database';

export async function POST(request: NextRequest) {
  const db = getGraphDatabaseService();
  
  try {
    await db.connect();

    const { graph } = await request.json();

    if (!graph || !Array.isArray(graph)) {
      return NextResponse.json(
        { error: 'Invalid graph data. Expected an array.' },
        { status: 400 }
      );
    }

    // Delete all existing nodes and relationships (write operation)
    await db.executeWrite('MATCH (n) DETACH DELETE n');

    const nodes = graph.filter((item: { type?: string }) => item.type === 'node');
    const relationships = graph.filter((item: { type?: string }) => item.type === 'relationship');

    // Create nodes first, then build mapping
    const idToNodeMap = new Map<number | string, { identity: number }>();
    let nodesCreated = 0;
    
    // Step 1: Create all nodes
    for (const node of nodes) {
      const labels = node.labels.join(':');
      const props: string[] = [];
      
      // Add all properties from node.properties FIRST (including any id property from properties)
      // This preserves the original id property like "line_1.14_I_1_1" for Part nodes
      for (const [key, value] of Object.entries(node.properties || {})) {
        if (value === null || value === undefined) continue;
        
        // Escape property key if it contains special characters (like colons)
        const escapedKey = key.includes(':') || key.includes(' ') || key.includes('-')
          ? `\`${key.replace(/`/g, '\\`')}\``
          : key;
        
        // Properly escape property values
        let val: string;
        if (typeof value === 'string') {
          // Escape quotes, backslashes, and newlines in strings
          const escaped = String(value)
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          val = `"${escaped}"`;
        } else if (typeof value === 'boolean') {
          val = String(value);
        } else if (typeof value === 'number') {
          val = String(value);
        } else {
          // For other types, convert to JSON string
          val = `"${JSON.stringify(value).replace(/"/g, '\\"')}"`;
        }
        
        props.push(`${escapedKey}: ${val}`);
      }
      
      // Add the JSON node id as jsonId property (to preserve the numeric/string id from JSON structure)
      // This allows us to map relationships while keeping the original id property from node.properties
      const jsonId = node.id;
      const jsonIdValue = typeof jsonId === 'string' 
        ? `"${String(jsonId).replace(/"/g, '\\"')}"` 
        : jsonId;
      
      // Always add jsonId for relationship mapping (it won't conflict with id from properties)
      props.push(`jsonId: ${jsonIdValue}`);

      const createQuery = `CREATE (n:${labels} {${props.join(', ')}})`;
      await db.executeWrite(createQuery);
      nodesCreated++;
    }

    // Step 2: Build mapping by querying all nodes with their jsonId property
    // First try jsonId, then fall back to id property for backward compatibility
    const mappingQuery = `MATCH (n) WHERE n.jsonId IS NOT NULL OR n.id IS NOT NULL RETURN id(n) as internalId, COALESCE(n.jsonId, n.id) as jsonId`;
    const mappingResults = await db.executeRead(mappingQuery) as Array<{ internalId: number, jsonId: number | string }>;
    
    for (const result of mappingResults) {
      idToNodeMap.set(result.jsonId, { identity: result.internalId });
    }
    
    console.log(`Created ${nodesCreated} nodes, mapped ${idToNodeMap.size} nodes for relationships`);

    let relationshipsCreated = 0;
    for (const rel of relationships) {
      const startNode = idToNodeMap.get(rel.start);
      const endNode = idToNodeMap.get(rel.end);
      
      if (!startNode || !endNode) {
        console.warn(`Failed to find nodes for relationship ${rel.id}: start=${rel.start}, end=${rel.end}`);
        continue;
      }

      const props: string[] = [];
      
      for (const [key, value] of Object.entries(rel.properties || {})) {
        if (value === null || value === undefined) continue;
        
        // Escape property key if it contains special characters (like colons)
        const escapedKey = key.includes(':') || key.includes(' ') || key.includes('-')
          ? `\`${key.replace(/`/g, '\\`')}\``
          : key;
        
        // Properly escape property values
        let val: string;
        if (typeof value === 'string') {
          // Escape quotes, backslashes, and newlines in strings
          const escaped = String(value)
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          val = `"${escaped}"`;
        } else if (typeof value === 'boolean') {
          val = String(value);
        } else if (typeof value === 'number') {
          val = String(value);
        } else {
          // For other types, convert to JSON string
          val = `"${JSON.stringify(value).replace(/"/g, '\\"')}"`;
        }
        
        props.push(`${escapedKey}: ${val}`);
      }

      const propString = props.length > 0 ? ` {${props.join(', ')}}` : '';
      const query = `
        MATCH (start), (end)
        WHERE id(start) = ${startNode.identity} AND id(end) = ${endNode.identity}
        CREATE (start)-[r:${rel.label}${propString}]->(end)
      `;
      
      try {
        await db.executeWrite(query);
        relationshipsCreated++;
      } catch (error) {
        console.warn(`Failed to create relationship ${rel.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      nodesCreated,
      relationshipsCreated,
      message: `Successfully loaded ${nodesCreated} nodes and ${relationshipsCreated} relationships into the graph database`
    });
  } catch (error: unknown) {
    console.error('Database load error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to load graph into database';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

