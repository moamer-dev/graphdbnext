import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { savedQueryCrudService } from '@/lib/services'

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
    const query = await savedQueryCrudService.findOne(session, id)

    if (!query) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ query })
  } catch (error: unknown) {
    console.error('Error fetching query:', error)
    return NextResponse.json(
      { error: 'Failed to fetch query' },
      { status: 500 }
    )
  }
}

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
    const query = await savedQueryCrudService.update(session, id, {
      name: body.name,
      description: body.description || null,
      query: body.query,
      category: body.category || null,
      tags: body.tags || [],
      source: body.source || 'CYPHER'
    })

    return NextResponse.json({ query })
  } catch (error: unknown) {
    console.error('Error updating query:', error)
    if (error instanceof Error && error.message === 'Record not found') {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update query' },
      { status: 500 }
    )
  }
}

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
    await savedQueryCrudService.delete(session, id)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting query:', error)
    if (error instanceof Error && error.message === 'Record not found') {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete query' },
      { status: 500 }
    )
  }
}

