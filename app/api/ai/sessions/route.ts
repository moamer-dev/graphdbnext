import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });

    const sessions = await prisma.chatSession.findMany({
      where: { workspaceId, isActive: true },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('ChatSession GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, agentId, workspaceId } = body;

    if (!agentId || !workspaceId) return NextResponse.json({ error: 'agentId and workspaceId are required' }, { status: 400 });

    const chatSession = await prisma.chatSession.create({
      data: { 
        title: title || 'New Conversation',
        agentId, 
        workspaceId,
        isActive: true
      }
    });

    return NextResponse.json({ session: chatSession });
  } catch (error) {
    console.error('ChatSession POST Error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
