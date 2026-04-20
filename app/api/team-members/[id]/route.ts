import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TeamMemberService } from '@/services/TeamMemberService'
import { z } from 'zod'

const UpdateTeamMemberSchema = z.object({
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
    const member = await TeamMemberService.findOneWithRBAC(session.user.id, id)

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    return NextResponse.json({ data: member })
  } catch (error: any) {
    console.error('TeamMember GET Error:', error)
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
    const validatedData = UpdateTeamMemberSchema.parse(body)

    const member = await TeamMemberService.updateWithRBAC(session.user.id, id, validatedData as any)

    return NextResponse.json({ data: member })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('TeamMember PATCH Error:', error)
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
    await TeamMemberService.deleteWithRBAC(session.user.id, id)

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('TeamMember DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
