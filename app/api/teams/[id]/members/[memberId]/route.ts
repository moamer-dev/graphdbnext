import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/teams/[id]/members/[memberId] - Remove a team member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: teamId, memberId } = await params

    // Check if the user has permission to manage this team (admin or owner)
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { creatorId: true }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = team.creatorId === session.user.id
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if the team member exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { id: memberId }
    })

    if (!existingMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    if (existingMember.teamId !== teamId) {
        return NextResponse.json({ error: 'Member does not belong to this team' }, { status: 400 })
    }

    // Remove the member
    await prisma.teamMember.delete({
      where: { id: memberId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error removing team member:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}

// PATCH /api/teams/[id]/members/[memberId] - Update a team member's role
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string, memberId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    
        const { id: teamId, memberId } = await params
        const { roleId } = await req.json()
    
        // Check if the user has permission to manage this team (admin or owner)
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: { creatorId: true }
        })
    
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        }
    
        const isAdmin = session.user.role === 'ADMIN'
        const isOwner = team.creatorId === session.user.id
        
        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
    
        // Update the member's role
        const updatedMember = await prisma.teamMember.update({
            where: { id: memberId },
            data: { roleId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                role: true
            }
        })
    
        return NextResponse.json({ data: updatedMember })
    } catch (error) {
        console.error('Error updating team member:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
