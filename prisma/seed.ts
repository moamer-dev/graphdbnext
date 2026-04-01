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

  // 1. Create/Verify Global ADMIN role and full permissions
  const adminRole = await prisma.role.upsert({
    where: { id: 'cl_admin_global' },
    update: { name: 'ADMIN', teamId: null, isActive: true },
    create: {
      id: 'cl_admin_global',
      name: 'ADMIN',
      teamId: null,
      isActive: true,
      permissions: {
        create: [
          { resource: 'MODEL', action: 'MANAGE', isActive: true },
          { resource: 'WORKSPACE', action: 'MANAGE', isActive: true },
          { resource: 'CREDENTIAL', action: 'MANAGE', isActive: true },
          { resource: 'PROJECT', action: 'MANAGE', isActive: true },
          { resource: 'TEAM', action: 'MANAGE', isActive: true }
        ]
      }
    }
  })
  console.log('Global ADMIN role provisioned.')

  // 2. Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // Create admin user
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'ADMIN' // Maps to the global role by name
      }
    })
    console.log('Admin user created successfully!')
  } else {
    console.log('Admin user already exists, skipping...')
    // Ensure existing user has the correct role string
    await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN' }
    })
  }
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

