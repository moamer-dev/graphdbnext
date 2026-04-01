import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { storageManager } from '@/lib/storage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataSource = await prisma.dataSource.findUnique({
      where: { id: params.id }
    });

    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    // Cleanup external file if it exists
    if (dataSource.fileUrl) {
      const provider = await storageManager.getActiveProvider();
      await provider.delete(dataSource.fileUrl);
    }

    // Hard delete or soft delete? User requested isActive so soft delete is better.
    await prisma.dataSource.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DataSources DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete data source' }, { status: 500 });
  }
}
