import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      permissions?: { resource: string, action: string }[]
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    permissions?: { resource: string, action: string }[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    updatedAt: string
    permissions?: { resource: string, action: string }[]
  }
}

