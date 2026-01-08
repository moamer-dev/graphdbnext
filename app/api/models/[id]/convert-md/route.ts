import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SchemaLoaderService } from '@/lib/services/SchemaLoaderService'
import { buildUserWhereClauseWithFilters } from '@/lib/utils/rbac'

// POST /api/models/[id]/convert-md - Convert MD schema to JSON
export async function POST (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check ownership/access: admins can access any, users only their own
    const whereClause = buildUserWhereClauseWithFilters(
      session,
      { id },
      'userId'
    )

    const model = await prisma.model.findFirst({
      where: whereClause
    })

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    if (!model.schemaMd) {
      return NextResponse.json(
        { error: 'Model does not have Markdown schema' },
        { status: 400 }
      )
    }

    // Parse MD to JSON
    const loader = new SchemaLoaderService(process.cwd())
    const schema = loader.loadFromMarkdown(model.schemaMd)

    // Update model with converted JSON
    await prisma.model.update({
      where: { id },
      data: {
        schemaJson: schema as any
      }
    })

    return NextResponse.json({ schema })
  } catch (error: unknown) {
    console.error('Error converting MD schema:', error)
    return NextResponse.json(
      { error: 'Failed to convert Markdown schema' },
      { status: 500 }
    )
  }
}

