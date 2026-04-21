import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'

// Load environment variables from .env file
config({ path: '.env' })

// Create Prisma client with adapter for seeding
const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set')
}

let prisma: PrismaClient

if (dbUrl.startsWith('prisma+')) {
  // Prisma Accelerate
  prisma = new PrismaClient({ accelerateUrl: dbUrl })
} else {
  // Direct PostgreSQL connection
  const connectionString = dbUrl.replace(/^prisma\+/, '')
  const adapter = new PrismaPg({ connectionString })
  prisma = new PrismaClient({ adapter })
}

async function main () {
  console.log('Seeding database...')

  // Default admin credentials
  const adminEmail = 'admin@example.com'
  const adminPassword = 'admin123' // Change this in production!
  const adminName = 'Admin User'

  // 1. Create Global roles
  const adminRole = await prisma.role.upsert({
    where: { id: 'cl_admin_global' },
    update: { 
      name: 'ADMIN', 
      description: 'Platform Administrator with full access to all resources.',
      teamId: null, 
      isActive: true 
    },
    create: {
      id: 'cl_admin_global',
      name: 'ADMIN',
      description: 'Platform Administrator with full access to all resources.',
      teamId: null,
      isActive: true,
      permissions: {
        create: [
          { resource: 'MODEL', action: 'MANAGE', scope: 'ALL', isActive: true },
          { resource: 'WORKSPACE', action: 'MANAGE', scope: 'ALL', isActive: true },
          { resource: 'CREDENTIAL', action: 'MANAGE', scope: 'ALL', isActive: true },
          { resource: 'PROJECT', action: 'MANAGE', scope: 'ALL', isActive: true },
          { resource: 'TEAM', action: 'MANAGE', scope: 'ALL', isActive: true },
          { resource: 'SAVED_QUERY', action: 'MANAGE', scope: 'ALL', isActive: true },
          { resource: 'WORKFLOW', action: 'MANAGE', scope: 'ALL', isActive: true },
          { resource: 'DATA_SOURCE', action: 'MANAGE', scope: 'ALL', isActive: true }
        ]
      }
    }
  })

  const userRole = await prisma.role.upsert({
    where: { id: 'cl_user_global' },
    update: { 
      name: 'USER', 
      description: 'Standard platform user with personal space and team collaboration.',
      teamId: null, 
      isActive: true 
    },
    create: {
      id: 'cl_user_global',
      name: 'USER',
      description: 'Standard platform user with personal space and team collaboration.',
      teamId: null,
      isActive: true,
      permissions: {
        create: [
          { resource: 'MODEL', action: 'READ', scope: 'ALL', isActive: true }, // Can see shared models
          { resource: 'MODEL', action: 'CREATE', scope: 'SELF', isActive: true },
          { resource: 'MODEL', action: 'UPDATE', scope: 'SELF', isActive: true },
          { resource: 'MODEL', action: 'DELETE', scope: 'SELF', isActive: true },
          
          { resource: 'WORKSPACE', action: 'READ', scope: 'ALL', isActive: true },
          { resource: 'WORKSPACE', action: 'CREATE', scope: 'SELF', isActive: true },
          
          { resource: 'PROJECT', action: 'READ', scope: 'ALL', isActive: true },
          { resource: 'PROJECT', action: 'CREATE', scope: 'SELF', isActive: true },
          
          { resource: 'TEAM', action: 'READ', scope: 'ALL', isActive: true },
          { resource: 'TEAM', action: 'CREATE', scope: 'SELF', isActive: true }
        ]
      }
    }
  })

  console.log('Global roles provisioned.')

  // 2. Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  let userId: string

  if (!existingAdmin) {
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // Create admin user
    const newUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName
      }
    })
    userId = newUser.id
    console.log('Admin user created successfully!')
  } else {
    console.log('Admin user already exists, checking roles...')
    userId = existingAdmin.id
  }

  // 3. Ensure admin user has Admin global role
  await prisma.userGlobalRole.upsert({
    where: { userId_roleId: { userId, roleId: adminRole.id } },
    update: {},
    create: { userId, roleId: adminRole.id }
  })
  
  // 4. Create Default Storage Configuration
  await prisma.storageConfig.upsert({
    where: { id: 'default-database-storage' },
    update: {},
    create: {
      id: 'default-database-storage',
      name: 'System Database Storage',
      type: 'DATABASE',
      config: {},
      isDefault: true,
      isActive: true
    }
  })
  
  console.log('Default storage configuration provisioned.')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

