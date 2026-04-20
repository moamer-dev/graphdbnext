import { NextRequest, NextResponse } from 'next/server'
import { InvitationService } from '@/services/InvitationService'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const invitation = await InvitationService.findByToken(token)

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation invalid or expired' }, { status: 404 })
    }

    // Only return non-sensitive info
    return NextResponse.json({ 
      data: {
        teamName: invitation.team.name,
        email: invitation.email,
        invitedBy: invitation.invitedBy.name || invitation.invitedBy.email
      } 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
