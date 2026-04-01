import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize (credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          console.log('Attempting to authenticate user:', credentials.email)

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            console.log('User not found:', credentials.email)
            return null
          }

          if (!user.password) {
            console.log('User has no password set')
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)

          if (!isValid) {
            console.log('Invalid password for user:', credentials.email)
            return null
          }

          console.log('Authentication successful for user:', credentials.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error('Authorization error:', error)
          if (error instanceof Error) {
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
          }
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt ({ token, user, trigger }) {
      // When user signs in, store their role
      if (user) {
        token.role = user.role
        token.id = user.id
        // Fetch fresh user data and permissions
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { 
              updatedAt: true,
              role: true
            }
          })
          
          if (dbUser) {
            token.updatedAt = dbUser.updatedAt.toISOString()
            
            // Fetch permissions for the role
            const role = await prisma.role.findFirst({
              where: { name: dbUser.role, isActive: true },
              include: { permissions: { where: { isActive: true } } }
            })
            
            if (role) {
                token.permissions = role.permissions.map(p => ({
                    resource: p.resource,
                    action: p.action
                }))
            }
          }
        } catch (error) {
          console.error('Error fetching user data/permissions during signin:', error)
        }
      }
      
      // On every JWT callback, validate the user's current role from database
      // This ensures that if role changes, the token reflects the current role
      if (token.id && (trigger === 'update' || !trigger)) {
        try {
          const currentUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, updatedAt: true }
          })
          
          if (currentUser) {
            // Update token with current role and timestamp
            token.role = currentUser.role
            token.updatedAt = currentUser.updatedAt.toISOString()

            // Fetch permissions
            const role = await prisma.role.findFirst({
              where: { name: currentUser.role, isActive: true },
              include: { permissions: { where: { isActive: true } } }
            })
            
            if (role) {
                token.permissions = role.permissions.map(p => ({
                    resource: p.resource,
                    action: p.action
                }))
            } else {
                token.permissions = []
            }
          }
        } catch (error) {
          console.error('Error validating user role in JWT callback:', error)
        }
      }
      
      return token
    },
    async session ({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.permissions = (token.permissions as any[]) || []
      }
      return session
    }
  },
  pages: {
    signIn: '/'
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}

