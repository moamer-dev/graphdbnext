'use client'

import * as React from 'react'
import { Briefcase, ChevronsUpDown, Plus, Check, Globe } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useTenantStore } from '@/stores/tenantStore'
import { resourceHooks } from '@/hooks/react-query'
import { Skeleton } from '@/components/ui/skeleton'

export function NavWorkspace() {
  const { isMobile } = useSidebar()
  const { activeWorkspaceId, setActiveWorkspace, isGlobalScope, setGlobalScope } = useTenantStore()
  
  // Use React Query for automatic syncing
  const { data: workspaceData, isLoading } = resourceHooks.workspaces.useList({
    page: 1,
    pageSize: 100,
    filters: {
      mine: 'true'
    }
  } as any)
  
  const workspaces = (workspaceData as any)?.data || []

  React.useEffect(() => {
    // Auto-select first workspace if none selected
    if (!activeWorkspaceId && workspaces.length > 0 && !isGlobalScope) {
      setActiveWorkspace(workspaces[0].id)
    }
  }, [activeWorkspaceId, workspaces, setActiveWorkspace, isGlobalScope])

  const activeWorkspace = workspaces.find((w: any) => w.id === activeWorkspaceId) || workspaces[0]

  if (isLoading && workspaces.length === 0) {
    return (
        <div className="flex items-center gap-2 px-2 py-1">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-16" />
            </div>
        </div>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-primary/10 text-primary flex aspect-square size-8 items-center justify-center rounded-lg">
                {isGlobalScope ? <Globe className="size-4" /> : <Briefcase className="size-4" />}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-tight text-primary">
                  {isGlobalScope ? 'Global Context' : activeWorkspace?.name || 'Select Workspace'}
                </span>
                <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {isGlobalScope ? 'All Workspaces' : 'Workspace'}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((workspace: any) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => {
                  setActiveWorkspace(workspace.id)
                  setGlobalScope(false)
                }}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <span className="text-[10px] font-bold uppercase">{workspace.name.substring(0, 2)}</span>
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                   <span className="font-medium truncate text-sm">{workspace.name}</span>
                   <span className="text-[10px] text-muted-foreground truncate opacity-70 italic">active workspace</span>
                </div>
                {activeWorkspaceId === workspace.id && !isGlobalScope && (
                  <Check className="size-4 text-primary ml-auto" />
                )}
                <DropdownMenuShortcut>⌘{workspaces.indexOf(workspace) + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between p-2 px-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold">Global Scoping</span>
                <span className="text-[10px] text-muted-foreground">Show all resources</span>
              </div>
              <Switch 
                checked={isGlobalScope} 
                onCheckedChange={setGlobalScope}
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-workspace-modal'))}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add Workspace</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
