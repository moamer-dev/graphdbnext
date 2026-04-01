import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const isGlobal = searchParams.get('global') === 'true';

    const roles = await prisma.role.findMany({
      where: isGlobal ? { teamId: null } : teamId ? { teamId } : {},
      include: {
        permissions: { where: { isActive: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      data: roles,
      total: roles.length
    });
  } catch (error) {
    console.error('Roles GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, teamId, permissions } = body;

    // Create Role with nested permissions
    const role = await prisma.role.create({
      data: {
         name,
         teamId,
         isActive: true,
         permissions: {
            create: (permissions || []).map((p: any) => ({
               resource: p.resource,
               action: p.action,
               isActive: true
            }))
         }
      },
      include: { permissions: true }
    });
    return NextResponse.json({ data: role });
  } catch (error) {
    console.error('Roles POST Error:', error);
    return NextResponse.json({ error: 'Failed to save role' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'IDs are required' }, { status: 400 });
    }

    await prisma.role.deleteMany({
      where: { id: { in: ids } }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Roles DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete roles' }, { status: 500 });
  }
}
