import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware';
import { proxy } from '@/app/dashboard/proxy'

const intlMiddleware = createMiddleware({
  locales: ['en', 'de'],
  defaultLocale: 'en',
  localePrefix: 'never' // We use cookies and don't want /en/ or /de/ in URL
});

export async function middleware(request: NextRequest) {
  // 1. Run intl middleware
  const response = intlMiddleware(request);
  
  // 2. Run your existing proxy logic
  return proxy(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|join|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
