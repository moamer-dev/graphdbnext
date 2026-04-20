import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { proxy } from '@/app/dashboard/proxy'

export async function middleware(request: NextRequest) {
  return proxy(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|join|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
