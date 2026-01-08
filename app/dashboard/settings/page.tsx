'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Package } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage () {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    // Wait for session to load before redirecting
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }
    
    if (status === 'authenticated' && !isAdmin) {
      router.push('/dashboard')
    }
  }, [status, isAdmin, router])

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Show access denied if not admin (after session loads)
  if (status === 'authenticated' && !isAdmin) {
    return null
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="relative">
                Settings
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
              </span>
            </h1>
            <p className="text-xs mt-1.5 text-muted-foreground/70">
              Manage application settings and modules
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/20 bg-muted/10 backdrop-blur-sm hover:bg-muted/20 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Modules
            </CardTitle>
            <CardDescription className="text-xs">
              Enable or disable optional application modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/modules">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Manage Modules
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Add more settings cards here as needed */}
      </div>
    </div>
  )
}

