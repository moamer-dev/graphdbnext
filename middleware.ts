import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware (request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))

  // Protected routes that require authentication
  const isProtectedRoute = pathname.startsWith('/dashboard')

  // Admin-only routes - require authentication and admin role
  const isAdminRoute = pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/settings')

  // If accessing admin route, check authentication and admin role first
  if (isAdminRoute) {
    // Must be authenticated
    if (!token) {
      const url = new URL('/', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    
    // Must be admin
    const isAdmin = token.role === 'ADMIN'
    if (!isAdmin) {
      const url = new URL('/dashboard', request.url)
      return NextResponse.redirect(url)
    }
  }

  // If accessing a protected route without authentication, redirect to home (auth page)
  if (isProtectedRoute && !token) {
    const url = new URL('/', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // If already authenticated and trying to access home, redirect to dashboard
  if (pathname === '/' && token) {
    const url = new URL('/dashboard', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}

