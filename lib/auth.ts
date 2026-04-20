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

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            return null
          }

          if (!user.isActive) {
            throw new Error('You are disabled from access, please contact the administrator.')
          }

          if (!user.password) {
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)

          if (!isValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'USER' // Satisfy NextAuth type, actual role is determined in jwt callback
          }
        } catch (error) {
          if (error instanceof Error && (error.message.includes('disabled') || error.message.includes('access'))) {
            throw error
          }
          console.error('Authorization error:', error)
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
      if (user) {
        token.id = user.id
      }
      
      // On sign-in or session update, fetch permissions
      if (token.id && (trigger === 'update' || !trigger || user)) {
        try {
          const { getEffectivePermissions } = await import('@/utils/rbac-engine')
          const permissions = await getEffectivePermissions(token.id as string)
          
          // Detect ADMIN role from Global Roles
          const userGlobalRoles = await prisma.userGlobalRole.findMany({
            where: { userId: token.id as string },
            include: { role: true }
          })
          
          const hasAdminRole = userGlobalRoles.some(ugr => ugr.role.name.toUpperCase() === 'ADMIN')
          token.role = hasAdminRole ? 'ADMIN' : 'USER'
          token.permissions = permissions
        } catch (error) {
          console.error('Error fetching permissions in JWT callback:', error)
          token.permissions = []
          token.role = 'USER'
        }
      }
      
      return token
    },
    async session ({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
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

