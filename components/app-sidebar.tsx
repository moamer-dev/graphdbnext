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
  const userPermissions = (session?.user as any)?.permissions || []
  
  const hasPermission = (resource?: string, action: string = 'READ') => {
    if (isAdmin) return true
    if (!resource) return true // If no resource is defined, it's public
    return userPermissions.some((p: any) => p.resource === resource && (p.action === action || p.action === 'MANAGE'))
  }

  // Filter nav items based on admin status and permissions
  const filteredNavItems = sidebarNavItems
    .map(item => {
      // Create a shallow copy to avoid mutating the original config
      const newItem = { ...item }
      
      // Filter sub-items if they exist
      if (newItem.items) {
        newItem.items = newItem.items.filter(sub => hasPermission(sub.resource, sub.action))
      }
      
      return newItem
    })
    .filter(item => {
      // 1. Admin only check
      if (item.adminOnly && !isAdmin) {
        return false
      }
      
      // 2. Check main item permission if defined
      if (!hasPermission(item.resource, item.action)) {
        return false
      }
      
      // 3. If it has sub-items but all were filtered out, only show if it has a direct URL meant for landing
      // But for Dashboard and some others, they might not have subItems anyway.
      // Usually, if it has a sub-menu, and the sub-menu is empty, we hide the parent.
      if (item.items && item.items.length === 0 && sidebarNavItems.find(i => i.url === item.url)?.items?.length! > 0) {
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
                <span className="truncate font-bold tracking-tight text-primary">Plexus</span>
                <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Research Platform</span>
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
