/**
 * API Route: Get Schema Statistics
 * GET /api/database/schema
 */

import { NextResponse } from 'next/server'
import { SchemaExplorerService } from '@/lib/services/SchemaExplorerService'

export async function GET() {
  try {
    const service = new SchemaExplorerService()
    const statistics = await service.getSchemaStatistics()
    
    return NextResponse.json({
      success: true,
      statistics
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch schema statistics'
    console.error('Error fetching schema:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}

