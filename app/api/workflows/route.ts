import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      console.error('Prisma client is not initialized')
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('Workflow GET: No session or user ID', { hasSession: !!session, hasUser: !!session?.user, userId: session?.user?.id })
      return NextResponse.json({ error: 'Unauthorized: Please sign in to access workflows' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('modelId')

    if (!modelId) {
      return NextResponse.json({ error: 'modelId is required' }, { status: 400 })
    }

    if (!prisma.workflow) {
      console.error('Prisma workflow model is not available. Run: npx prisma generate')
      return NextResponse.json({ error: 'Database schema not updated. Please run: npx prisma generate' }, { status: 500 })
    }

    const workflows = await prisma.workflow.findMany({
      where: {
        modelId,
        userId: session.user.id,
        isActive: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        description: true,
        version: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ workflows })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch workflows'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      console.error('Prisma client is not initialized')
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }

    if (!prisma.workflow) {
      console.error('Prisma workflow model is not available. Run: npx prisma generate')
      return NextResponse.json({ error: 'Database schema not updated. Please run: npx prisma generate' }, { status: 500 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('Workflow POST: No session or user ID', { hasSession: !!session, hasUser: !!session?.user, userId: session?.user?.id })
      return NextResponse.json({ error: 'Unauthorized: Please sign in to save workflows' }, { status: 401 })
    }

    const body = await request.json()
    const { modelId, name, description, config } = body

    if (!modelId || !name || !config) {
      return NextResponse.json(
        { error: 'modelId, name, and config are required' },
        { status: 400 }
      )
    }

    const model = await prisma.model.findFirst({
      where: {
        id: modelId,
        userId: session.user.id
      }
    })

    if (!model) {
      return NextResponse.json({ error: `Model not found or you don't have access to it` }, { status: 404 })
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        description: description || null,
        modelId,
        userId: session.user.id,
        config: config as any
      }
    })

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Error creating workflow:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create workflow'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

