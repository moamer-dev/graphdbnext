import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, type, config, isDefault, isActive } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.storageConfig.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const storageConfig = await prisma.storageConfig.update({
      where: { id },
      data: { 
        ...(name && { name }), 
        ...(type && { type }), 
        ...(config && { config }), 
        ...(isDefault !== undefined && { isDefault }), 
        ...(isActive !== undefined && { isActive }) 
      }
    });

    return NextResponse.json({ data: storageConfig });
  } catch (error) {
    console.error('StorageConfig PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update storage config' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.storageConfig.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('StorageConfig DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete storage config' }, { status: 500 });
  }
}
