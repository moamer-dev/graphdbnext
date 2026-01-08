import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SchemaLoaderService } from '@/lib/services/SchemaLoaderService'

// POST /api/models/upload - Upload and process a schema file
export async function POST (request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      )
    }

    const fileContent = await file.text()
    const fileName = file.name.toLowerCase()
    let schemaJson = null
    let schemaMd = null

    // Determine file type and process accordingly
    if (fileName.endsWith('.json')) {
      try {
        const parsed = JSON.parse(fileContent)
        // Validate it's a schema JSON
        if (parsed.nodes && parsed.relations) {
          schemaJson = parsed
        } else {
          return NextResponse.json(
            { error: 'Invalid schema JSON format. Expected nodes and relations.' },
            { status: 400 }
          )
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid JSON format' },
          { status: 400 }
        )
      }
    } else if (fileName.endsWith('.md')) {
      schemaMd = fileContent
      // Parse and convert MD to JSON for storage
      try {
        // Basic validation - check if it has NODES and RELATIONS sections
        if (!fileContent.includes('## NODES') && !fileContent.includes('## RELATIONS')) {
          return NextResponse.json(
            { error: 'Invalid Markdown schema format. Expected ## NODES and ## RELATIONS sections.' },
            { status: 400 }
          )
        }
        
        // Parse MD to JSON using SchemaLoaderService
        const loader = new SchemaLoaderService(process.cwd())
        schemaJson = loader.loadFromMarkdown(fileContent)
      } catch (error) {
        console.error('Error parsing MD schema:', error)
        return NextResponse.json(
          { error: `Failed to parse Markdown schema: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload .md or .json file.' },
        { status: 400 }
      )
    }

    // Create the model
    const model = await prisma.model.create({
      data: {
        name,
        description: description || null,
        userId: session.user.id,
        schemaJson: schemaJson as any,
        schemaMd: schemaMd,
        version: '1.0'
      }
    })

    return NextResponse.json({
      model: {
        id: model.id,
        name: model.name,
        description: model.description,
        version: model.version,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt
      }
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error uploading model:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload model'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

