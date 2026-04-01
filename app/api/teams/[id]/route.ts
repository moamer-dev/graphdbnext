import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const { id } = await params
    const isAdmin = session.user.role === 'ADMIN'
    
    // Check ownership
    const team = await prisma.team.findUnique({
      where: { id },
      select: { creatorId: true }
    })

    if (!team) return new NextResponse('Not Found', { status: 404 })
    if (!isAdmin && team.creatorId !== session.user.id) {
      return new NextResponse('Forbidden: You can only delete teams you created', { status: 403 })
    }
    
    // Hard delete
    await prisma.team.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting team:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const { id } = await params
        const body = await req.json()
        const isAdmin = session.user.role === 'ADMIN'

        // Check ownership
        const team = await prisma.team.findUnique({
            where: { id },
            select: { creatorId: true }
        })

        if (!team) return new NextResponse('Not Found', { status: 404 })
        if (!isAdmin && team.creatorId !== session.user.id) {
            return new NextResponse('Forbidden: You can only update teams you created', { status: 403 })
        }

        const updatedTeam = await prisma.$transaction(async (tx) => {
            // Update team basic info
            const updated = await tx.team.update({
                where: { id },
                data: {
                    name: body.name,
                    description: body.description,
                    isActive: body.isActive,
                    ...(isAdmin && body.creatorId ? { creatorId: body.creatorId } : {})
                }
            })

            // Update project assignments if projectIds is present
            if (body.projectIds && Array.isArray(body.projectIds)) {
                // 1. Unassign projects that were in this team but are no longer selected
                await tx.project.updateMany({
                    where: { 
                        teamId: id,
                        id: { notIn: body.projectIds }
                    },
                    data: { teamId: null }
                })

                // 2. Assign new projects to this team
                await tx.project.updateMany({
                    where: { 
                        id: { in: body.projectIds }
                    },
                    data: { teamId: id }
                })
            }

            return true
        })

        const fullUpdated = await prisma.team.findUnique({
            where: { id },
            include: {
                projects: true,
                creator: true,
                members: {
                    include: {
                        user: true,
                        role: true
                    }
                }
            }
        })

        return NextResponse.json({ data: fullUpdated })
    } catch (error) {
        console.error('Error updating team:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const { id } = await params
    const isAdmin = session.user.role === 'ADMIN'

    const team = await prisma.team.findFirst({
      where: { 
        id, 
        ...(isAdmin ? {} : { creatorId: session.user.id }) 
      },
      include: {
        creator: true,
        members: {
          include: {
            user: true,
            role: true
          }
        }
      }
    })

    if (!team) return new NextResponse('Not Found', { status: 404 })
    
    return NextResponse.json({ data: team })
  } catch (error) {
    console.error('Error fetching team:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
