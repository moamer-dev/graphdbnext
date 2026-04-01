import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { teamCrudService } from '@/services/crud'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '100')
  const search = searchParams.get('search') || undefined
  const sortBy = searchParams.get('sortBy') || undefined
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined

  // Extract all other params as potential filters
  const filters: Record<string, any> = {}
  searchParams.forEach((value, key) => {
    if (!['page', 'pageSize', 'search', 'sortBy', 'sortOrder'].includes(key)) {
      filters[key] = value
    }
  })

  try {
    const result = await teamCrudService.findAll(session, {
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
      filters
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return new NextResponse('Name is required', { status: 400 })
    }

    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name,
          description,
          creatorId: session.user.id
        }
      })

      const adminRole = await tx.role.create({
        data: {
          name: 'Manager',
          teamId: newTeam.id,
          permissions: {
            create: [
                { resource: 'MODEL', action: 'MANAGE' },
                { resource: 'WORKSPACE', action: 'MANAGE' },
                { resource: 'PROJECT', action: 'MANAGE' },
                { resource: 'TEAM', action: 'MANAGE' }
            ]
          }
        }
      })

      await tx.teamMember.create({
        data: {
          userId: session.user.id!,
          teamId: newTeam.id,
          roleId: adminRole.id
        }
      })

      return newTeam
    })

    return NextResponse.json({
      data: team,
      total: 1
    })
  } catch (error) {
    console.error('Error creating team:', error)
    return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { ids } = await req.json()
    if (!ids || !Array.isArray(ids)) {
      return new NextResponse('IDs are required', { status: 400 })
    }

    await teamCrudService.deleteMany(session, ids)
    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('Error bulk deleting teams:', error)
    return new NextResponse(error.message || 'Internal Error', { status: 500 })
  }
}
