import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST() {
  try {
    console.log('Starting schema generation from application.md...');
    
    // Get the path to the script
    const scriptPath = path.join(process.cwd(), 'scripts', 'validate-and-convert-schema.ts');
    
    // Run the schema generation script using tsx
    const { stdout, stderr } = await execAsync(`npx tsx "${scriptPath}"`, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    if (stderr && !stderr.includes('Loaded')) {
      console.warn('Schema generation warnings:', stderr);
    }
    
    console.log('Schema generation output:', stdout);
    
    return NextResponse.json({
      success: true,
      message: 'Schema generated successfully from application.md',
      files: {
        json: '/schema/schema.json',
        jsonld: '/schema/schema.jsonld',
        summary: '/schema/summary.json',
      },
      output: stdout,
    });
  } catch (error: unknown) {
    console.error('Schema generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate schema';
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

