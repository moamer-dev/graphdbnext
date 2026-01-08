/**
 * API Route: Check Database Status
 * GET /api/database/status
 */

import { NextResponse } from 'next/server';
import { getGraphDatabaseService } from '@/lib/services/graph-database';

export async function GET() {
  const db = getGraphDatabaseService();
  
  try {
    await db.connect();

    // Get node count (read operation)
    const nodeCountResult = await db.executeRead('MATCH (n) RETURN count(n) as count');
    const nodeCount = (nodeCountResult[0] as { count?: number })?.count || 0;

    // Get relationship count (read operation)
    const relCountResult = await db.executeRead('MATCH ()-[r]->() RETURN count(r) as count');
    const relCount = (relCountResult[0] as { count?: number })?.count || 0;

    // Get sample nodes (read operation)
    const sampleNodes = await db.executeRead('MATCH (n) RETURN labels(n) as labels, count(n) as count ORDER BY count DESC LIMIT 10');

    return NextResponse.json({
      success: true,
      connected: true,
      stats: {
        nodeCount,
        relationshipCount: relCount,
        sampleLabels: sampleNodes
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect to database';
    return NextResponse.json({
      success: false,
      connected: false,
      error: errorMessage
    });
  }
}

