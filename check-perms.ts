import { prisma } from './lib/prisma'

async function checkRolePermissions() {
  try {
    console.log('--- Checking Role Permissions in DB ---')
    const roleId = 'cl_user_global' // Example ID from logs
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true }
    })
    
    if (!role) {
      console.log(`Role ${roleId} not found. checking all roles...`)
      const roles = await prisma.role.findMany({ take: 2, include: { _count: { select: { permissions: true } } }})
      console.log('Roles Samples:', JSON.stringify(roles, null, 2))
      return
    }

    console.log(`Role: ${role.name} (${role.id})`)
    console.log(`Found ${role.permissions.length} permissions in DB.`)
    console.log('Permissions Samples:', JSON.stringify(role.permissions.slice(0, 3), null, 2))
    
  } catch (e: any) {
    console.error('Query Failed:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkRolePermissions()
