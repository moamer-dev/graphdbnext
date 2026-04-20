import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WorkflowService } from '@/services/WorkflowService'
import { z } from 'zod'

const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  modelId: z.string().optional(),
  config: z.any().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const workflow = await WorkflowService.findOneWithRBAC(session.user.id, id)

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({ data: workflow, workflow })
  } catch (error: any) {
    console.error('Workflow GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = UpdateWorkflowSchema.parse(body)

    const workflow = await WorkflowService.updateWithRBAC(session.user.id, id, validatedData as any)

    return NextResponse.json({ data: workflow, workflow })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Workflow PATCH Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await WorkflowService.deleteWithRBAC(session.user.id, id)

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('Workflow DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
