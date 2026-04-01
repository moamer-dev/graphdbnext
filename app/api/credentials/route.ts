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

    const credentials = await prisma.credential.findMany({
      where: { workspaceId, isActive: true },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ 
      data: credentials,
      total: credentials.length 
    });
  } catch (error) {
    console.error('Credentials GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, name, description, type, data, workspaceId } = body;

    if (!name || !type || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let credential;
    if (id) {
      credential = await prisma.credential.update({
        where: { id },
        data: { name, description, type, data, updatedAt: new Date() } as any
      });
    } else {
      credential = await prisma.credential.create({
        data: { name, description, type, data, workspaceId } as any
      });
    }

    return NextResponse.json({ data: credential });
  } catch (error) {
    console.error('Credentials POST Error:', error);
    return NextResponse.json({ error: 'Failed to save credential' }, { status: 500 });
  }
}
