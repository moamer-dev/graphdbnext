import { NextRequest, NextResponse } from 'next/server'
import { InvitationService } from '@/services/InvitationService'
import { UserService } from '@/services/UserService'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { name, password } = await req.json()

    // 1. Validate invitation
    const invitation = await InvitationService.findByToken(token)
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation invalid or expired' }, { status: 404 })
    }

    // 2. Check if user already exists (just in case they registered meanwhile)
    let user = await prisma.user.findUnique({
      where: { email: invitation.email }
    })

    if (!user) {
      // 3. Create new user account
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      user = await prisma.user.create({
        data: {
          email: invitation.email,
          name,
          password: hashedPassword,
          isActive: true,
          emailVerified: new Date() // They joined via email link, so verified
        }
      })

      // Add default USER role
      const defaultRole = await prisma.role.findFirst({
          where: { name: 'USER', teamId: null }
      })
      if (defaultRole) {
          await prisma.userGlobalRole.create({
              data: {
                  userId: user.id,
                  roleId: defaultRole.id
              }
          })
      }
    }

    // 4. Add to team
    await prisma.teamMember.upsert({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId: invitation.teamId
        }
      },
      update: {
        isActive: true
      },
      create: {
        userId: user.id,
        teamId: invitation.teamId,
        isActive: true
      }
    })

    // If an invitation had a specific team role, we could assign it here
    if (invitation.roleId) {
        // Find or create TeamMemberRole
        const teamMember = await prisma.teamMember.findUnique({
            where: { userId_teamId: { userId: user.id, teamId: invitation.teamId } }
        })
        if (teamMember) {
            await prisma.teamMemberRole.upsert({
                where: {
                    teamMemberId_roleId: {
                        teamMemberId: teamMember.id,
                        roleId: invitation.roleId
                    }
                },
                update: {},
                create: {
                    teamMemberId: teamMember.id,
                    roleId: invitation.roleId
                }
            })
        }
    }

    // 5. Mark invitation as accepted
    await InvitationService.updateStatus(invitation.id, 'ACCEPTED')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Invitation Confirmation Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
