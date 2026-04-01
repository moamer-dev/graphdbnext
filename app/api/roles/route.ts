import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/roles - List available roles for teams (global or team-specific)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { teamId: null }, // Global roles
          ...(teamId ? [{ teamId }] : []) // Team-specific roles if requested
        ],
        isActive: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ data: roles })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
