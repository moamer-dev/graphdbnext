'use client'

import { DataTable } from '@/components/data-table/DataTable'
import { useResourcePage } from '@/hooks/view/useResourcePage'
import { resourceHooks } from '@/hooks/react-query'
import { UserResource } from '@/resources/UserResource'
import { Users, Loader2 } from 'lucide-react'
import { ViewSwitcher } from '@/components/data-table/ViewSwitcher'
import { DataGrid } from '@/components/data-table/DataGrid'
import { ResourceCard } from '@/components/dashboard/ResourceCard'

export default function UsersPage () {
  const { 
    config, data, total, loading, page, pageSize, sortBy, sortOrder, filters, onPageChange, onPageSizeChange, onSortChange, onFiltersChange,
    status, handleView, getGridActions, currentView, session
  } = useResourcePage({
    resource: UserResource,
    useList: resourceHooks.users.useList,
    useDelete: resourceHooks.users.useDelete,
    useBulkDelete: resourceHooks.users.useBulkDelete
  })

  // Filter grid actions to exclude self-deletion
  const filteredGridActions = (item: any) => {
    return getGridActions(item).filter(action => {
      if (action.label === 'Delete' && item.id === session?.user?.id) return false
      return true
    })
  }

  if (status === 'loading') {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    )
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
      
      <div className="min-h-[400px]">
        {currentView === 'table' ? (
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
                resourceName="TEAM"
                title={item.name || item.email.split('@')[0]}
                description={item.email}
                status={true}
                date={item.createdAt}
                isSelected={isSelected}
                onSelect={onSelect}
                onClick={() => handleView(item.id)}
                showQuickPerspective={false}
                actions={filteredGridActions(item)}
              />
            )}
          />
        )}
      </div>
    </div>
  )
}
