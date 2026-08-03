import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
import readline from 'readline'

// Load environment variables from .env file
config({ path: '.env' })

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.error('Error: DATABASE_URL environment variable is not set.')
  process.exit(1)
}

let prisma: PrismaClient

if (dbUrl.startsWith('prisma+')) {
  prisma = new PrismaClient({ accelerateUrl: dbUrl })
} else {
  const connectionString = dbUrl.replace(/^prisma\+/, '')
  const adapter = new PrismaPg({ connectionString })
  prisma = new PrismaClient({ adapter })
}

function createPrompter() {
  const isTTY = Boolean(process.stdin.isTTY)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  const defaultWrite = (rl as any)._writeToOutput.bind(rl)

  return {
    ask(query: string, hidden = false): Promise<string> {
      return new Promise((resolve) => {
        if (hidden && isTTY) {
          ;(rl as any)._writeToOutput = (stringToWrite: string) => {
            if ((rl as any).line) {
              process.stdout.write(query + '*'.repeat((rl as any).line.length) + '\r')
            } else {
              defaultWrite(stringToWrite)
            }
          }
        } else {
          ;(rl as any)._writeToOutput = defaultWrite
        }

        rl.question(query, (answer) => {
          ;(rl as any)._writeToOutput = defaultWrite
          if (hidden && isTTY) {
            console.log()
          }
          resolve(answer.trim())
        })
      })
    },
    close() {
      rl.close()
    }
  }
}

async function main() {
  console.log('--- Create Admin User ---')
  const prompter = createPrompter()

  try {
    let email = await prompter.ask('Enter Email: ')
    while (!email || !email.includes('@')) {
      console.log('Please enter a valid email address.')
      email = await prompter.ask('Enter Email: ')
    }

    let name = await prompter.ask('Enter Name (optional, default: Admin User): ')
    if (!name) {
      name = 'Admin User'
    }

    let password = await prompter.ask('Enter Password: ', true)
    while (!password) {
      console.log('Password cannot be empty.')
      password = await prompter.ask('Enter Password: ', true)
    }

    prompter.close()

    console.log('\nProcessing...')

    // 1. Ensure Global Admin Role exists (matching prisma/seed.ts)
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

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10)

    // 3. Upsert User
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    let userId: string

    if (existingUser) {
      console.log(`User ${email} already exists. Updating password and assigning Admin role...`)
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name: name || existingUser.name
        }
      })
      userId = updatedUser.id
    } else {
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name
        }
      })
      userId = newUser.id
      console.log(`Created new user: ${email}`)
    }

    // 4. Ensure user has Admin global role
    await prisma.userGlobalRole.upsert({
      where: { userId_roleId: { userId, roleId: adminRole.id } },
      update: {},
      create: { userId, roleId: adminRole.id }
    })

    console.log(`\n✅ Admin user (${email}) created/configured successfully!`)
  } finally {
    prompter.close()
  }
}

main()
  .catch((e) => {
    console.error('Error creating admin user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
