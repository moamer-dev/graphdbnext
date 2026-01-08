import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma || !prisma.workflow) {
      console.error('Prisma client or workflow model is not available')
      return NextResponse.json({ error: 'Database schema not updated. Please run: npx prisma generate' }, { status: 500 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('Workflow GET [id]: No session or user ID', { hasSession: !!session, hasUser: !!session?.user, userId: session?.user?.id })
      return NextResponse.json({ error: 'Unauthorized: Please sign in to access workflows' }, { status: 401 })
    }

    const { id } = await params

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        userId: session.user.id,
        isActive: true
      }
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found or you don\'t have access to it' }, { status: 404 })
    }

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Error fetching workflow:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch workflow'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma || !prisma.workflow) {
      console.error('Prisma client or workflow model is not available')
      return NextResponse.json({ error: 'Database schema not updated. Please run: npx prisma generate' }, { status: 500 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('Workflow PUT: No session or user ID', { hasSession: !!session, hasUser: !!session?.user, userId: session?.user?.id })
      return NextResponse.json({ error: 'Unauthorized: Please sign in to update workflows' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, config } = body

    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found or you don\'t have access to it' }, { status: 404 })
    }

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(config !== undefined && { config: config as any })
      }
    })

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Error updating workflow:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update workflow'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma || !prisma.workflow) {
      console.error('Prisma client or workflow model is not available')
      return NextResponse.json({ error: 'Database schema not updated. Please run: npx prisma generate' }, { status: 500 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('Workflow DELETE: No session or user ID', { hasSession: !!session, hasUser: !!session?.user, userId: session?.user?.id })
      return NextResponse.json({ error: 'Unauthorized: Please sign in to delete workflows' }, { status: 401 })
    }

    const { id } = await params

    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found or you don\'t have access to it' }, { status: 404 })
    }

    await prisma.workflow.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}

