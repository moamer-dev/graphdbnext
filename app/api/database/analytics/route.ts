/**
 * API Route: Get Graph Analytics
 * GET /api/database/analytics
 */

import { NextResponse } from 'next/server'
import { GraphAnalyticsService } from '@/lib/services/GraphAnalyticsService'

export async function GET() {
  try {
    const service = new GraphAnalyticsService()
    const analytics = await service.getFullAnalytics()
    
    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics'
    console.error('Error fetching analytics:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}

