'use client'

import { cn } from '@/utils'
import { AppSidebar } from '@/components/app-sidebar'
import { ClientOnly } from '@/components/client-only'
import { sidebarNavItems } from '@/config/sidebar-nav'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { QuickActions } from '@/components/quick-actions'
import { TenantProvider } from '@/components/TenantProvider'
import { TenantSwitchers } from '@/components/tenant-switchers'

const sectionTitles: Record<string, string> = {
  '/dashboard/convert': 'XML to Graph Conversion',
  '/dashboard/database': 'Database Management',
  '/dashboard/database/queries': 'Query Execution',
  '/dashboard/database/analytics': 'Graph Analytics',
  '/dashboard/html': 'HTML Conversion',
  '/dashboard/graph/model': 'Model Visualization',
  '/dashboard/graph/builder': 'Model Builder',
  '/dashboard/admin/users': 'User Management',
  '/dashboard/admin/queries': 'Saved Queries Management'
}

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const currentTitle = sectionTitles[pathname] || 'Dashboard'

  // Route guard logic
  useEffect(() => {
    if (status === 'loading' || !session) return

    const isAdmin = session?.user?.role === 'ADMIN'
    const userPermissions = (session?.user as any)?.permissions || []

    // Helper to find navigation item by URL
    const findNavItem = (path: string) => {
      // Flatten all items including sub-items
      const allItems = sidebarNavItems.flatMap(item => [
        item,
        ...(item.items || [])
      ])
      return allItems.find(item => item.url === path)
    }

    const currentNavItem = findNavItem(pathname)

    if (currentNavItem) {
      const isAdminOnly = (currentNavItem as any).adminOnly === true
      const hasResource = !!currentNavItem.resource
      
      let hasAccess = isAdmin
      if (!hasAccess && hasResource) {
        hasAccess = userPermissions.some((p: any) => 
          p.resource === currentNavItem.resource && (p.action === 'READ' || p.action === 'MANAGE')
        )
      } else if (!hasAccess && !hasResource && !isAdminOnly) {
        // Public dashboard page or item without specific resource
        hasAccess = true
      }

      // 1. Admin only check
      if (isAdminOnly && !isAdmin) {
        router.push('/dashboard')
        toast.error('This section is restricted to administrators')
        return
      }

      // 2. Resource permission check
      if (hasResource && !hasAccess) {
        router.push('/dashboard')
        toast.error(`You do not have permission to access ${currentNavItem.title}`)
      }
    }
  }, [pathname, session, status, router])

  return (
    <SidebarProvider suppressHydrationWarning>
      <ClientOnly>
        <AppSidebar />
      </ClientOnly>
      <SidebarInset suppressHydrationWarning className="gradient-page">
        <TenantProvider>
          <header className="gradient-header flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12" suppressHydrationWarning>
            <div className="relative z-10 flex items-center gap-2 px-4 w-full overflow-hidden">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4 opacity-40 shrink-0"
              />
              <div className="flex flex-col gap-0.5 min-w-0">
                <Breadcrumb className="hidden md:block">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard" className="text-[10px] font-medium text-foreground/60 hover:text-foreground">
                        PLEXUS
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="opacity-20" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-[10px] font-semibold uppercase tracking-wider">{currentTitle}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                
                {/* Tenant Switcher Module - Hidden for Admins to show all resources without scoping */}
                {session?.user?.role !== 'ADMIN' && (
                  <div className="flex items-center gap-2">
                    <TenantSwitchers />
                  </div>
                )}
              </div>

              <div className="ml-auto flex items-center gap-2 shrink-0">
                <QuickActions />
              </div>
            </div>
          </header>
          <div className={cn('flex flex-1 flex-col gap-3 relative gradient-section', pathname === '/dashboard/graph/builder' || pathname?.includes('/edit') ? 'p-0' : 'p-3 pt-0')}>
            <div className={cn('mx-auto w-full relative z-10', pathname === '/dashboard/database/queries' || pathname === '/dashboard/graph/builder' || pathname === '/dashboard/graph/model/new' || pathname?.includes('/edit') ? '' : 'max-w-7xl')}>
              {children}
            </div>
          </div>
        </TenantProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
