/**
 * API Route: Graph to HTML Conversion
 * POST /api/graph2html
 */

import { NextRequest, NextResponse } from 'next/server';
import { GraphToHtmlService } from '@/lib/services/GraphToHtmlService';

export async function POST(request: NextRequest) {
  try {
    const { mode } = await request.json();

    if (!mode || !['facsimile', 'philology'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Expected "facsimile" or "philology".' },
        { status: 400 }
      );
    }

    // Full HTML generation logic ported from Python
    const service = new GraphToHtmlService();
    const html = await service.convertGraphToHtml(mode);

    return NextResponse.json({
      success: true,
      html,
      message: `HTML generation completed successfully for ${mode} mode.`
    });
  } catch (error: unknown) {
    console.error('Graph to HTML conversion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

