import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    // Find all active users who are NOT in this team and NOT the current user
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        NOT: {
            id: session.user.id
        },
        AND: [
            {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            },
            {
                teamMembers: {
                    none: {
                        teamId: teamId
                    }
                }
            }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      take: 10
    })

    return NextResponse.json({ data: users })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
