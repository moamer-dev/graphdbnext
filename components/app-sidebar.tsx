'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { sidebarNavItems } from '@/config/sidebar-nav'
import { Network } from 'lucide-react'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  // Filter nav items based on admin status
  const filteredNavItems = sidebarNavItems.filter(item => {
    if (item.adminOnly && !isAdmin) {
      return false
    }
    return true
  })

  const navMain = filteredNavItems.map(item => ({
    ...item,
    isActive: pathname === item.url || pathname?.startsWith(item.url + '/')
  }))

  return (
    <Sidebar collapsible="icon" suppressHydrationWarning {...props}>
      <SidebarHeader suppressHydrationWarning>
        <SidebarMenu suppressHydrationWarning>
          <SidebarMenuItem suppressHydrationWarning>
            <SidebarMenuButton size="lg" suppressHydrationWarning>
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Network className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">EUPT Graph Database</span>
                <span className="truncate text-xs text-muted-foreground">Research Platform</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent suppressHydrationWarning>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter suppressHydrationWarning>
        {session?.user && (
          <NavUser user={{
            name: session.user.name || 'User',
            email: session.user.email || '',
            avatar: ''
          }} />
        )}
      </SidebarFooter>
      <SidebarRail suppressHydrationWarning />
    </Sidebar>
  )
}
