/**
 * API Route: Execute Cypher Query
 * POST /api/database/query
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGraphDatabaseService } from '@/lib/services/graph-database';

export async function POST(request: NextRequest) {
  const db = getGraphDatabaseService();
  
  try {
    await db.connect();

    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query. Expected a Cypher query string.' },
        { status: 400 }
      );
    }

    // Convert to uppercase once for all keyword checks
    const upperQuery = query.toUpperCase();

    // Basic safety check - prevent dangerous operations in production
    const dangerousKeywords = ['DROP', 'DELETE', 'DETACH DELETE'];
    const hasDangerousOp = dangerousKeywords.some(keyword => 
      upperQuery.includes(keyword) && !upperQuery.includes('MATCH')
    );

    if (hasDangerousOp && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Dangerous operations are not allowed in production' },
        { status: 403 }
      );
    }

    // Determine if query is read or write based on keywords
    // Check for write keywords anywhere in the query (not just at start)
    // This handles cases like "MATCH ... SET ..." which starts with MATCH but contains SET
    const writeKeywords = ['SET', 'CREATE', 'MERGE', 'DELETE', 'REMOVE', 'DETACH DELETE'];
    
    // Check if query contains any write keywords
    // Use word boundaries to avoid false positives (e.g., "RESET" shouldn't match "SET")
    const isWriteQuery = writeKeywords.some(keyword => {
      // For multi-word keywords like "DETACH DELETE", check for exact phrase
      if (keyword.includes(' ')) {
        return upperQuery.includes(keyword);
      }
      // For single keywords, check if they appear as standalone words
      // Match keyword followed by whitespace, newline, or end of query
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(query);
    });
    
    // Use appropriate transaction type
    const results = isWriteQuery 
      ? await db.executeWrite(query)
      : await db.executeRead(query);

    return NextResponse.json({
      success: true,
      results,
      count: results.length
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Query execution failed';
    console.error('Query execution error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

