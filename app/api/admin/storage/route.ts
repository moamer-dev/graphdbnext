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

    const configs = await prisma.storageConfig.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ 
      data: configs,
      total: configs.length 
    });
  } catch (error) {
    console.error('StorageConfig GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch storage configs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, config, isDefault, isActive } = body;

    if (!name || !type || !config) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.storageConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const storageConfig = await prisma.storageConfig.create({
      data: { name, type, config, isDefault, isActive: isActive ?? true }
    });

    return NextResponse.json({ data: storageConfig });
  } catch (error) {
    console.error('StorageConfig POST Error:', error);
    return NextResponse.json({ error: 'Failed to save storage config' }, { status: 500 });
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

    await prisma.storageConfig.deleteMany({
      where: { id: { in: ids } }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('StorageConfig DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete storage configs' }, { status: 500 });
  }
}
