import { NextResponse } from 'next/server';
import { SchemaLoaderService } from '@/lib/services/SchemaLoaderService';

export async function GET() {
  try {
    // Load schema from pre-generated JSON (required)
    const loader = new SchemaLoaderService(process.cwd());
    const schema = await loader.loadFromJSON();
    return NextResponse.json(schema);
  } catch (error: unknown) {
    console.error('Schema loading error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to load schema';
    return NextResponse.json(
      { 
        error: errorMessage,
        hint: 'Run "npm run generate-schema" to generate the schema JSON file from application.md'
      },
      { status: 500 }
    );
  }
}

