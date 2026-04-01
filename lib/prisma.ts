import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma 7 requires either adapter or accelerateUrl
// Check if using Prisma Accelerate (prisma+postgres://) or direct connection (postgres://)
const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Build PrismaClient config
const prismaConfig: {
  adapter?: PrismaPg
  accelerateUrl?: string
  log?: ('query' | 'error' | 'warn')[]
} = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
}

// If using Prisma Accelerate, use accelerateUrl
if (dbUrl.startsWith('prisma+')) {
  console.log('Using Prisma Accelerate')
  prismaConfig.accelerateUrl = dbUrl
} else {
  // For direct PostgreSQL connections, use the pg adapter
  const connectionString = dbUrl.replace(/^prisma\+/, '')
  try {
    const adapter = new PrismaPg({ connectionString })
    prismaConfig.adapter = adapter
    console.log('Prisma adapter initialized for:', connectionString.substring(0, 20) + '...')
  } catch (error) {
    console.error('CRITICAL: Failed to create Prisma adapter:', error)
    // If adapter fails, we might still want to try native if possible, but Prisma 7 might not allow it without adapter if configured.
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaConfig)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}


