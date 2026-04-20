'use client'

import { useState, useMemo, useCallback } from 'react'
import { DataTable } from '@/components/data-table/DataTable'
import { useResourceTable } from '@/hooks/view/useResourceTable'
import { resourceHooks } from '@/hooks/react-query'
import { SavedQueryResource, type SavedQuery } from '@/resources/SavedQueryResource'
import { Database } from 'lucide-react'
import { QueryViewModal } from './QueryViewModal'
import { useUIStore } from '@/stores/uiStore'
import { ViewSwitcher } from '@/components/data-table/ViewSwitcher'
import { DataGrid } from '@/components/data-table/DataGrid'
import { ResourceCard } from '@/components/dashboard/ResourceCard'

export default function AdminQueriesPage () {
  // Middleware guarantees admin access, so we can assume isAdmin = true
  const isAdmin = true
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { dashboardView } = useUIStore()

  // Use generic hooks directly
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
    resource: SavedQueryResource,
    useList: resourceHooks.queries.useList,
    useDelete: resourceHooks.queries.useDelete,
    useBulkDelete: resourceHooks.queries.useBulkDelete,
    isAdmin
  })

  // Modal handlers
  const handleView = useCallback((id: string) => {
    const query = data.find(q => q.id === id)
    if (query) {
      setSelectedQuery(query)
      setIsModalOpen(true)
    }
  }, [data])

  const handleEdit = useCallback((id: string) => {
    window.location.href = `${SavedQueryResource.VIEW_PATH}/${id}/edit`
  }, [])

  // Override config with modal handlers
  const tableConfig = useMemo(() => ({
    ...config,
    rowActions: (config.rowActions || []).map(a => 
      a.label === 'View' ? { ...a, action: (row: any) => handleView(row.id) } :
      a.label === 'Edit' ? { ...a, action: (row: any) => handleEdit(row.id) } : a
    )
  }), [config, handleView, handleEdit])

  const gridActions = (item: any) => [
    { label: 'View', icon: Database, action: () => handleView(item.id), permission: { action: 'READ' as const } },
    { label: 'Edit', icon: Database, action: () => handleEdit(item.id), permission: { action: 'UPDATE' as const } },
    { 
      label: 'Delete', 
      icon: Database, // Will be replaced by Trash2 actually if I use standard icons, but let's keep it consistent
      variant: 'destructive' as const,
      action: () => config.rowActions?.find(a => a.label === 'Delete')?.action(item),
      permission: { action: 'DELETE' as const }
    }
  ]

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="relative">
                Saved Queries
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
              </span>
            </h1>
            <p className="text-xs mt-1.5 text-muted-foreground/70">
              View and manage all saved queries from all users
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
              config={tableConfig}
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
            config={tableConfig}
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
                resourceName="SavedQuery"
                title={item.name}
                description={item.description}
                status={true}
                date={item.createdAt}
                creator={item.creator?.name}
                isSelected={isSelected}
                onSelect={onSelect}
                onClick={() => handleView(item.id)}
                actions={gridActions(item)}
              />
            )}
          />
        )}
      </div>

      {selectedQuery && (
        <QueryViewModal
          query={selectedQuery}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </div>
  )
}

