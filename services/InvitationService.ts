import { prisma } from '@/lib/prisma'
import { InvitationStatus } from '@prisma/client'

export class InvitationService {
  static async createInvitation(teamId: string, invitedById: string, email: string, roleId?: string) {
    
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    return await prisma.teamInvitation.upsert({
      where: {
        email_teamId: {
          email,
          teamId
        }
      },
      update: {
        token,
        expiresAt,
        isActive: true,
        status: 'PENDING',
        invitedById,
        roleId
      },
      create: {
        email,
        teamId,
        invitedById,
        token,
        expiresAt,
        roleId
      },
      include: {
        team: true,
        invitedBy: true
      }
    })
  }

  static async findByToken(token: string) {
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        team: true,
        invitedBy: true
      }
    })

    if (!invitation) return null

    // Check if expired
    if (new Date() > invitation.expiresAt) return null
    
    // Check if active
    if (!invitation.isActive) return null

    return invitation
  }

  static async updateStatus(id: string, status: InvitationStatus) {
    return await prisma.teamInvitation.update({
      where: { id },
      data: { status }
    })
  }

  static async deleteInvitation(id: string) {
    return await prisma.teamInvitation.delete({
      where: { id }
    })
  }

  static async listByTeam(teamId: string) {
    return await prisma.teamInvitation.findMany({
      where: { teamId },
      include: {
        invitedBy: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}
