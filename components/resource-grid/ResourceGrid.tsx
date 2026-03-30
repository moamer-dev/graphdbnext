'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { TableConfig } from '@/resources/TableConfig'

interface ResourceGridProps<T extends { id: string }> {
  data: T[]
  loading?: boolean
  config: TableConfig<T>
  onDelete?: (id: string) => Promise<void>
  renderCard: (item: T) => React.ReactNode
}

export function ResourceGrid<T extends { id: string }>({
  data,
  loading = false,
  onDelete,
  renderCard
}: ResourceGridProps<T>) {
  const [deleteConfirmDialog, setDeleteConfirmDialog] = React.useState<{
    open: boolean
    item: T | null
    message?: string
    variant?: 'default' | 'destructive'
  }>({ open: false, item: null })

  const handleConfirmDelete = async () => {
    if (deleteConfirmDialog.item && onDelete) {
      try {
        await onDelete(deleteConfirmDialog.item.id)
        setDeleteConfirmDialog({ open: false, item: null })
      } catch (error) {
        console.error('Delete error:', error)
        throw error // Re-throw to prevent dialog from closing on error
      }
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No items found</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((item) => renderCard(item))}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmDialog.item && (
        <ConfirmDialog
          open={deleteConfirmDialog.open}
          onOpenChange={(open) => setDeleteConfirmDialog({ open, item: null })}
          onConfirm={handleConfirmDelete}
          title="Delete Item"
          description={deleteConfirmDialog.message || `Are you sure you want to delete this item? This action cannot be undone.`}
          confirmLabel="Delete"
          variant={deleteConfirmDialog.variant || 'destructive'}
        />
      )}
    </>
  )
}

