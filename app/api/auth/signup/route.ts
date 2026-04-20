import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST (request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, workspaceName, projectName } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user, roles, and onboarding resources in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      })

      // 1. Assign default global USER role
      await tx.userGlobalRole.create({
        data: {
          userId: newUser.id,
          roleId: 'cl_user_global'
        }
      })

      // 2. Automated Onboarding (Workspace & Project)
      if (workspaceName) {
        const workspace = await tx.workspace.create({
          data: {
            name: workspaceName,
            creatorId: newUser.id
          }
        })

        if (projectName) {
          const project = await tx.project.create({
            data: {
              name: projectName,
              creatorId: newUser.id
            }
          })

          // Link them
          await tx.projectWorkspace.create({
            data: {
              projectId: project.id,
              workspaceId: workspace.id
            }
          })
        }
      }

      return newUser
    })

    return NextResponse.json(
      { user, message: 'User created successfully' },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
