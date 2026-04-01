import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessResource } from '@/utils/rbac'

// GET /api/teams/[id]/members - List team members
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

    // Check if the user has access to this team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { creatorId: true }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = team.creatorId === session.user.id
    
    // Check if user is a member
    const isMember = await prisma.teamMember.findFirst({
        where: { teamId, userId: session.user.id }
    })

    if (!isAdmin && !isOwner && !isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        role: true
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ data: members })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}

// POST /api/teams/[id]/members - Add a team member
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
    const { userId, roleId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

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

    // Check if the user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 })
    }

    // Add the member
    const newMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        roleId
      },
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

    return NextResponse.json({ data: newMember })
  } catch (error) {
    console.error('Error adding team member:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
