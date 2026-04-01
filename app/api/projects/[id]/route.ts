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
    const project = await prisma.project.findUnique({
      where: { id },
      select: { creatorId: true }
    })

    if (!project) return new NextResponse('Not Found', { status: 404 })
    if (!isAdmin && project.creatorId !== session.user.id) {
        return new NextResponse('Forbidden: You can only delete projects you created', { status: 403 })
    }
    
    // Hard delete
    await prisma.project.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting project:', error)
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
        const project = await prisma.project.findUnique({
            where: { id },
            select: { creatorId: true }
        })

        if (!project) return new NextResponse('Not Found', { status: 404 })
        if (!isAdmin && project.creatorId !== session.user.id) {
            return new NextResponse('Forbidden: You can only update projects you created', { status: 403 })
        }

        const updatedProject = await prisma.$transaction(async (tx) => {
            // Basic project update
            const updated = await tx.project.update({
                where: { id },
                data: {
                    name: body.name,
                    description: body.description,
                    isActive: body.isActive,
                    teamId: body.teamId,
                    ...(isAdmin && body.creatorId ? { creatorId: body.creatorId } : {})
                }
            })

            // Workspace assignments
            if (body.workspaceIds && Array.isArray(body.workspaceIds)) {
                // Remove existing assignments
                await tx.projectWorkspace.deleteMany({
                    where: { projectId: id }
                })
                
                // Create new assignments
                if (body.workspaceIds.length > 0) {
                    await tx.projectWorkspace.createMany({
                        data: body.workspaceIds.map((workspaceId: string) => ({
                            projectId: id,
                            workspaceId
                        }))
                    })
                }
            }

            return true
        })

        const fullUpdated = await prisma.project.findUnique({
            where: { id },
            include: {
                team: true,
                creator: true,
                workspaces: {
                    include: {
                        workspace: true
                    }
                }
            }
        })

        return NextResponse.json({ data: fullUpdated })
    } catch (error) {
        console.error('Error updating project:', error)
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
    const project = await prisma.project.findFirst({
      where: { 
        id, 
        ...(isAdmin ? {} : { creatorId: session.user.id }) 
      },
      include: {
        team: true,
        creator: true,
        workspaces: {
          include: {
            workspace: true
          }
        }
      }
    })

    if (!project) return new NextResponse('Not Found', { status: 404 })
    
    return NextResponse.json({ data: project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
