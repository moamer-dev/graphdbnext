/**
 * API Route: XML to JSON Conversion
 * POST /api/xml2json
 */

import { NextRequest, NextResponse } from 'next/server';
import { XMLConverterService } from '@/lib/services/XMLConverterService';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const xmlContent = await file.text();
    
    console.log('Received XML file, length:', xmlContent.length);
    console.log('First 500 chars:', xmlContent.substring(0, 500));
    
    // Full conversion logic ported from Python
    const service = new XMLConverterService();
    const graph = service.convertXMLToGraph(xmlContent);

    console.log('Conversion result: graph length =', graph.length);

    // Save to project directory
    const outputDir = join(process.cwd(), 'output');
    const fileName = file.name.replace('.xml', '.json');
    const filePath = join(outputDir, fileName);

    // Create output directory if it doesn't exist
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    // Write JSON file
    const jsonContent = JSON.stringify(graph, null, 2);
    await writeFile(filePath, jsonContent, 'utf-8');

    console.log('Saved converted JSON to:', filePath);

    return NextResponse.json({
      success: true,
      graph,
      count: graph.length,
      savedPath: filePath,
      fileName: fileName,
      message: 'Conversion completed successfully and saved to project directory.'
    });
  } catch (error: unknown) {
    console.error('XML to JSON conversion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

