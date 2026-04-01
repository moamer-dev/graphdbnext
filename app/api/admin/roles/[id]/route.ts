import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const role = await prisma.role.findUnique({
            where: { id },
            include: {
                permissions: { where: { isActive: true } }
            }
        });

        if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

        return NextResponse.json({ data: role });
    } catch (error) {
        console.error('Role GET Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

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
        const { name, teamId, permissions, isActive } = body;

        // Transactional update for atomicity
        const role = await prisma.$transaction(async (tx) => {
            const updatedRole = await tx.role.update({
                where: { id },
                data: { 
                    name, 
                    teamId: teamId === undefined ? undefined : teamId, 
                    isActive: isActive ?? true 
                }
            });

            if (permissions && Array.isArray(permissions)) {
                // Deactivate old permissions and create new ones
                await tx.permission.updateMany({
                   where: { roleId: id },
                   data: { isActive: false }
                });

                // Filter to only create active permissions
                const activePermissions = permissions.filter((p: any) => p.isActive);
                
                if (activePermissions.length > 0) {
                    await tx.permission.createMany({
                       data: activePermissions.map((p: any) => ({
                          roleId: id,
                          resource: p.resource,
                          action: p.action,
                          isActive: true
                       }))
                    });
                }
            }
            return updatedRole;
        });

        return NextResponse.json({ data: role });
    } catch (error) {
        console.error('Role PUT Error:', error);
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
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
        
        // Hard delete the role
        await prisma.role.delete({
            where: { id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Role DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
    }
}
