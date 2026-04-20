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

import { NavWorkspace } from '@/components/nav-workspace'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const userPermissions = (session?.user as any)?.permissions || []
  
  const hasPermission = (resource?: string, action: string = 'READ') => {
    if (isAdmin) return true
    if (!resource) return true 

    // Check if user has the specific action OR 'MANAGE' on the resource
    return userPermissions.some((p: any) => 
      p.resource === resource && (p.action === action || p.action === 'MANAGE')
    )
  }
  // Filter nav items based on admin status and permissions
  const filteredNavItems = sidebarNavItems
    .map(item => {
      const newItem = { ...item }
      
      // Filter sub-items if they exist
      if (newItem.items) {
        newItem.items = newItem.items.filter(sub => hasPermission(sub.resource, sub.action))
      }
      
      return newItem
    })
    .filter(item => {
      if (item.adminOnly && !isAdmin) {
        return false
      }
      
      if (!hasPermission(item.resource, item.action)) {
        return false
      }
      
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
        <NavWorkspace />
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
