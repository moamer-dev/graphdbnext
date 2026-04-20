'use client'

import { DataTable } from '@/components/data-table/DataTable'
import { useResourceTable } from '@/hooks/view/useResourceTable'
import { resourceHooks } from '@/hooks/react-query'
import { UserResource } from '@/resources/UserResource'
import { Users, Eye, Trash2 } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { ViewSwitcher } from '@/components/data-table/ViewSwitcher'
import { DataGrid } from '@/components/data-table/DataGrid'
import { ResourceCard } from '@/components/dashboard/ResourceCard'
import { useSession } from 'next-auth/react'

export default function UsersPage () {
  const { data: session } = useSession()
  const isAdmin = true
  const { dashboardView } = useUIStore()

  const { 
    config, 
    data, 
    total, 
    loading,
    page,
    pageSize,
    sortBy,
    sortOrder,
    filters,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onFiltersChange
  } = useResourceTable({
    resource: UserResource,
    useList: resourceHooks.users.useList,
    useDelete: resourceHooks.users.useDelete,
    useBulkDelete: resourceHooks.users.useBulkDelete,
    isAdmin,
    userId: session?.user?.id
  })

  const gridActions = (item: any) => {
    const actions = [
      { label: 'View', icon: Eye, action: () => config.rowActions?.[0]?.action(item), permission: { action: 'READ' as const, resource: 'TEAM' } },
      { 
        label: 'Delete', 
        icon: Trash2, 
        variant: 'destructive' as const,
        action: () => config.rowActions?.[1]?.action(item),
        permission: { action: 'DELETE' as const, resource: 'TEAM' }
      }
    ]

    return actions.filter(action => {
      if (action.label === 'Delete' && item.id === session?.user?.id) return false
      return true
    })
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="relative">
                Users
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
              </span>
            </h1>
            <p className="text-xs mt-1.5 text-muted-foreground/70">
              Manage user accounts and permissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ViewSwitcher />
          </div>
        </div>
      </div>
      
      <div>
        {dashboardView === 'table' ? (
          <DataTable
              config={config}
              data={data}
              total={total}
              loading={loading}
              page={page}
              pageSize={pageSize}
              sortBy={sortBy}
              sortOrder={sortOrder}
              filters={filters}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              onSortChange={onSortChange}
              onFiltersChange={onFiltersChange}
          />
        ) : (
          <DataGrid
            config={config}
            data={data}
            total={total}
            loading={loading}
            page={page}
            pageSize={pageSize}
            filters={filters}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            onFiltersChange={onFiltersChange}
            renderCard={(item: any, { isSelected, onSelect }) => (
              <ResourceCard
                key={item.id}
                item={item}
                resourceName="TEAM" // Users are part of TEAM resource in RBAC terms here? No, RESOURCE_NAME is User but actions check TEAM.
                title={item.name || item.email.split('@')[0]}
                description={item.email}
                status={true}
                date={item.createdAt}
                isSelected={isSelected}
                onSelect={onSelect}
                onClick={() => config.rowActions?.[0]?.action(item)}
                showQuickPerspective={false}
                actions={gridActions(item)}
              />
            )}
          />
        )}
      </div>
    </div>
  )
}

