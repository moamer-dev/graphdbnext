import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RoleService } from '@/services/RoleService'
import { z } from 'zod'

const UpdateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  teamId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.object({
    resource: z.string(),
    action: z.string(),
    scope: z.string(),
    isActive: z.boolean().optional(),
  })).optional(),
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
    const role = await RoleService.findOneWithRBAC(session.user.id, id)

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ data: role })
  } catch (error: any) {
    console.error('Role GET Error:', error)
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
    const validatedData = UpdateRoleSchema.parse(body)

    const role = await RoleService.updateWithRBAC(session.user.id, id, validatedData as any)

    return NextResponse.json({ data: role })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Role PATCH Error:', error)
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
    await RoleService.deleteWithRBAC(session.user.id, id)

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('Role DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
