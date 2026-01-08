import { NextRequest, NextResponse } from 'next/server';
import { SchemaLoaderService } from '@/lib/services/SchemaLoaderService';
import { SchemaValidatorService } from '@/lib/services/SchemaValidatorService';

export async function POST(request: NextRequest) {
  try {
    const { graph } = await request.json();

    if (!graph || !Array.isArray(graph)) {
      return NextResponse.json(
        { error: 'Invalid graph data. Expected an array.' },
        { status: 400 }
      );
    }

    // Load schema from pre-generated JSON (required)
    const loader = new SchemaLoaderService(process.cwd());
    const schema = await loader.loadFromJSON();

    // Validate graph
    const validator = new SchemaValidatorService(schema);
    const result = validator.validate(graph);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Validation failed';
    return NextResponse.json(
      { 
        error: errorMessage,
        hint: 'Run "npm run generate-schema" to generate the schema JSON file from application.md'
      },
      { status: 500 }
    );
  }
}

