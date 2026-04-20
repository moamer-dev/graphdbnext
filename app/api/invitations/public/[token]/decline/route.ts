import { NextRequest, NextResponse } from 'next/server'
import { InvitationService } from '@/services/InvitationService'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // 1. Validate invitation
    const invitation = await InvitationService.findByToken(token)
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation invalid or expired' }, { status: 404 })
    }

    // 2. Mark invitation as declined
    await InvitationService.updateStatus(invitation.id, 'DECLINED')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Invitation Decline Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
