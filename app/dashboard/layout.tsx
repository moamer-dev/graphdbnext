'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { AppSidebar } from '@/components/app-sidebar'
import { ClientOnly } from '@/components/client-only'
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
  const currentTitle = sectionTitles[pathname] || 'Dashboard'

  return (
    <SidebarProvider suppressHydrationWarning>
      <ClientOnly>
        <AppSidebar />
      </ClientOnly>
      <SidebarInset suppressHydrationWarning className="gradient-page">
        <header className="gradient-header flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12" suppressHydrationWarning>
          <div className="relative z-10 flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4 opacity-40"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard" className="text-sm font-medium text-foreground/80 hover:text-foreground">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block opacity-40" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm font-semibold">{currentTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className={cn('flex flex-1 flex-col gap-3 relative gradient-section', pathname === '/dashboard/graph/builder' || pathname?.includes('/edit') ? 'p-0' : 'p-3 pt-0')}>
          <div className={cn('mx-auto w-full relative z-10', pathname === '/dashboard/database/queries' || pathname === '/dashboard/graph/builder' || pathname === '/dashboard/graph/model/new' || pathname?.includes('/edit') ? '' : 'max-w-7xl')}>
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
