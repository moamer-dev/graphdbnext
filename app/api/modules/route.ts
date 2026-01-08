import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { moduleService } from '@/lib/services/ModuleService'
import { MODULE_IDS } from '@/lib/modules/types'

// GET /api/modules - Get all modules
export async function GET (request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can view module settings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const modules = moduleService.getAllModules()

    return NextResponse.json({ modules })
  } catch (error: unknown) {
    console.error('Error fetching modules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    )
  }
}

// PUT /api/modules/[moduleId] - Update module state
export async function PUT (request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can update module settings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { moduleId, enabled } = body

    if (!moduleId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'moduleId and enabled are required' },
        { status: 400 }
      )
    }

    // Validate moduleId
    if (!Object.values(MODULE_IDS).includes(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      )
    }

    await moduleService.updateModuleState(moduleId, enabled)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error updating module:', error)
    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 500 }
    )
  }
}

