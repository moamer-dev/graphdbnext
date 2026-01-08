'use client'

import { useState, useMemo, useCallback } from 'react'
import { DataTable } from '@/components/data-table/DataTable'
import { useResourceTable } from '@/app/dashboard/hooks/view/useResourceTable'
import { resourceHooks } from '@/lib/react-query/hooks'
import { SavedQueryResource, type SavedQuery } from '@/lib/resources/SavedQueryResource'
import { Database } from 'lucide-react'
import { QueryViewModal } from './QueryViewModal'

export default function AdminQueriesPage () {
  // Middleware guarantees admin access, so we can assume isAdmin = true
  const isAdmin = true
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Use generic hooks directly
  const { 
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
    isAdmin
  })

  // Delete mutation
  const deleteMutation = resourceHooks.queries.useDelete({ redirect: false })

  // Override the view handler to open modal instead of navigating
  const handleView = useCallback((id: string) => {
    const query = data.find(q => q.id === id)
    if (query) {
      setSelectedQuery(query)
      setIsModalOpen(true)
    }
  }, [data])

  const handleDelete = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }, [deleteMutation])

  const handleEdit = useCallback((id: string) => {
    window.location.href = `${SavedQueryResource.VIEW_PATH}/${id}/edit`
  }, [])

  // Create custom table config with modal view handler
  const tableConfig = useMemo(() => {
    return SavedQueryResource.createTableConfig(
      handleView,
      handleEdit,
      handleDelete
    )
  }, [handleView, handleEdit, handleDelete])

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
        </div>
      </div>
      
      <div>
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

