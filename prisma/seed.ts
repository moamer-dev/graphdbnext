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

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log('Admin user already exists, skipping...')
    return
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'ADMIN'
    }
  })

  console.log('Admin user created successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

