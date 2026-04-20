import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { InvitationService } from '@/services/InvitationService'
import { z } from 'zod'

const CreateInviteSchema = z.object({
  email: z.string().email(),
  roleId: z.string().optional()
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

    const { id: teamId } = await params
    const invitations = await InvitationService.listByTeam(teamId)

    return NextResponse.json({ data: invitations })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: teamId } = await params
    const body = await req.json()
    const { email, roleId } = CreateInviteSchema.parse(body)

    const invitation = await InvitationService.createInvitation(
      teamId,
      session.user.id,
      email,
      roleId
    )

    return NextResponse.json({ data: invitation })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
