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
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { creatorId: true }
    })

    if (!workspace) return new NextResponse('Not Found', { status: 404 })
    if (!isAdmin && workspace.creatorId !== session.user.id) {
        return new NextResponse('Forbidden: You can only delete workspaces you created', { status: 403 })
    }
    
    // Hard delete
    await prisma.workspace.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting workspace:', error)
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
        const workspace = await prisma.workspace.findUnique({
            where: { id },
            select: { creatorId: true }
        })

        if (!workspace) return new NextResponse('Not Found', { status: 404 })
        if (!isAdmin && workspace.creatorId !== session.user.id) {
            return new NextResponse('Forbidden: You can only update workspaces you created', { status: 403 })
        }

        const updatedWorkspace = await prisma.$transaction(async (tx) => {
            // Basic workspace update
            const updated = await tx.workspace.update({
                where: { id },
                data: {
                    name: body.name,
                    description: body.description,
                    isActive: body.isActive,
                    ...(isAdmin && body.creatorId ? { creatorId: body.creatorId } : {})
                }
            })

            // Project assignments
            if (body.projectIds && Array.isArray(body.projectIds)) {
                // Remove existing assignments
                await tx.projectWorkspace.deleteMany({
                    where: { workspaceId: id }
                })
                
                // Create new assignments
                if (body.projectIds.length > 0) {
                    await tx.projectWorkspace.createMany({
                        data: body.projectIds.map((projectId: string) => ({
                            workspaceId: id,
                            projectId
                        }))
                    })
                }
            }

            return true
        })

        const fullUpdated = await prisma.workspace.findUnique({
            where: { id },
            include: {
                creator: true,
                projects: {
                    include: {
                        project: true
                    }
                }
            }
        })

        return NextResponse.json({ data: fullUpdated })
    } catch (error) {
        console.error('Error updating workspace:', error)
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

    const workspace = await prisma.workspace.findFirst({
      where: { 
        id, 
        ...(isAdmin ? {} : { creatorId: session.user.id }) 
      },
      include: {
        creator: true,
        projects: {
          include: {
            project: true
          }
        }
      }
    })

    if (!workspace) return new NextResponse('Not Found', { status: 404 })
    
    return NextResponse.json({ data: workspace })
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
