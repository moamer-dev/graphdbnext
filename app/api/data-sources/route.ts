import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { storageManager } from '@/lib/storage';
import { StreamingParser } from '@/lib/storage/StreamingParser';
import { Readable } from 'stream';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const dataSources = await prisma.dataSource.findMany({
      where: {
        workspaceId,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        size: true,
        createdAt: true,
        updatedAt: true,
        // Only return content for small items
        jsonContent: true,
        content: true,
        fileUrl: true,
        structure: true
      }
    });

    return NextResponse.json({ 
      data: dataSources,
      total: dataSources.length 
    });
  } catch (error) {
    console.error('DataSources GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data sources' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, data, content, workspaceId, storageConfigId } = body;

    if (!name || !type || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payload = data || content;
    const stringified = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const size = Buffer.byteLength(stringified);

    let dataSourceData: any = {
      name,
      type,
      workspaceId,
      size,
      authorId: session.user.id,
      storageConfigId: storageConfigId || null,
    };

    if (storageManager.shouldUseExternal(size)) {
      // Massive file found - push to storage provider
      const provider = await storageManager.getActiveProvider();
      const fileName = `${workspaceId}/${type.toLowerCase()}/${Date.now()}_${name.replace(/\s+/g, '_')}`;
      const { url } = await provider.save(fileName, stringified);
      
      dataSourceData.fileUrl = url;

      // Real-time Structural DNA extraction via Streaming
      const readable = Readable.from(stringified);
      const { paths } = await StreamingParser.getJsonStructure(readable);
      dataSourceData.structure = paths;
    } else {
      // Small file - store directly in DB
      if (type === 'XML') {
        dataSourceData.content = stringified;
      } else {
        dataSourceData.jsonContent = typeof payload === 'string' ? JSON.parse(payload) : payload;
      }
    }

    const dataSource = await prisma.dataSource.create({
      data: dataSourceData
    });

    return NextResponse.json({ data: dataSource });
  } catch (error) {
    console.error('DataSources POST Error:', error);
    return NextResponse.json({ error: 'Failed to create data source' }, { status: 500 });
  }
}
