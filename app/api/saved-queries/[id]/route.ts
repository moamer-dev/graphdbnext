import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SavedQueryService } from '@/services/SavedQueryService'
import { z } from 'zod'
import { QuerySource } from '@prisma/client'

const UpdateSavedQuerySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  query: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  source: z.nativeEnum(QuerySource).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const savedQuery = await SavedQueryService.findOneWithRBAC(session.user.id, id)

    if (!savedQuery) {
      return NextResponse.json({ error: 'SavedQuery not found' }, { status: 404 })
    }

    return NextResponse.json({ data: savedQuery })
  } catch (error: any) {
    console.error('SavedQuery GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = UpdateSavedQuerySchema.parse(body)

    const savedQuery = await SavedQueryService.updateWithRBAC(session.user.id, id, validatedData as any)

    return NextResponse.json({ data: savedQuery })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('SavedQuery PATCH Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await SavedQueryService.deleteWithRBAC(session.user.id, id)

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('SavedQuery DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
