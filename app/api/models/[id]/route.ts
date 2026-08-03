import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ModelService } from '@/services/ModelService'
import { z } from 'zod'

const UpdateModelSchema = z.object({
  name: z.string().min(0).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  schemaJson: z.any().optional().nullable(),
  schemaMd: z.string().optional().nullable(),
  version: z.string().optional(),
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
    const model = await ModelService.findOneWithRBAC(session.user.id, id)

    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    return NextResponse.json({ data: model })
  } catch (error: any) {
    console.error('Model GET Error:', error)
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
    const validatedData = UpdateModelSchema.parse(body)

    const model = await ModelService.updateWithRBAC(session.user.id, id, validatedData as any)

    return NextResponse.json({ data: model })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Model PATCH Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Support PUT as an alias for PATCH for backward compatibility if needed, 
// though enterprise practice usually prefers explicit PATCH for partial updates.
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return PATCH(req, { params })
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
    await ModelService.updateWithRBAC(session.user.id, id, { isActive: false })

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('Model DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
