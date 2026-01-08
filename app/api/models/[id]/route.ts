import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { modelCrudService } from '@/lib/services'

// GET /api/models/[id] - Get a specific model (admins can access any, users only their own)
export async function GET (
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

    // Use CrudService for consistent RBAC
    const model = await modelCrudService.findOne(session, id)

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found or unauthorized access' },
        { status: 404 }
      )
    }

    // Return in the format expected by useResource hook: { data: model }
    return NextResponse.json({ data: model })
  } catch (error: unknown) {
    console.error('Error fetching model:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model' },
      { status: 500 }
    )
  }
}

// PUT /api/models/[id] - Update a model (admins can update any, users only their own)
export async function PUT (
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
    const body = await request.json()
    const { name, description, schemaJson, schemaMd, version, isActive } = body

    // Use CrudService for consistent RBAC and update logic
    const model = await modelCrudService.update(session, id, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(schemaJson !== undefined && { schemaJson }),
      ...(schemaMd !== undefined && { schemaMd }),
      ...(version && { version }),
      ...(isActive !== undefined && { isActive })
    })

    // Return in the format expected by useResource hook: { data: model }
    return NextResponse.json({ data: model })
  } catch (error: unknown) {
    console.error('Error updating model:', error)
    
    // Handle "Record not found" error from CrudService
    if (error instanceof Error && error.message === 'Record not found') {
      return NextResponse.json(
        { error: 'Model not found or unauthorized access' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    )
  }
}

// DELETE /api/models/[id] - Soft delete a model (admins can delete any, users only their own)
export async function DELETE (
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

    // Use CrudService for consistent RBAC and soft delete logic
    await modelCrudService.delete(session, id)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting model:', error)
    
    // Handle "Record not found" error from CrudService
    if (error instanceof Error && error.message === 'Record not found') {
      return NextResponse.json(
        { error: 'Model not found or unauthorized access' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    )
  }
}
