'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { TableConfig } from '@/lib/resources/TableConfig'

interface ResourceGridProps<T extends { id: string }> {
  data: T[]
  loading?: boolean
  config: TableConfig<T>
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => Promise<void>
  renderCard?: (item: T) => React.ReactNode
}

export function ResourceGrid<T extends { id: string }>({
  data,
  loading = false,
  config,
  onView,
  onEdit,
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

  // Default card renderer
  const defaultRenderCard = (item: T) => {
    // Try to extract common fields
    const itemRecord = item as Record<string, unknown>
    const name = itemRecord.name as string | undefined
    const description = itemRecord.description as string | undefined
    const createdAt = itemRecord.createdAt as string | undefined
    const updatedAt = itemRecord.updatedAt as string | undefined

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{name || 'Untitled'}</CardTitle>
              {description && (
                <CardDescription className="text-xs mt-1 line-clamp-2">
                  {description}
                </CardDescription>
              )}
            </div>
            {config.rowActions && config.rowActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {config.rowActions.map((action, index) => {
                    const Icon = action.icon
                    const handleAction = () => {
                      if (action.requiresConfirmation) {
                        const message = typeof action.confirmationMessage === 'function'
                          ? action.confirmationMessage(item)
                          : action.confirmationMessage || `Are you sure you want to ${action.label.toLowerCase()} this item? This action cannot be undone.`
                        
                        setDeleteConfirmDialog({
                          open: true,
                          item,
                          message,
                          variant: action.variant === 'destructive' ? 'destructive' : 'default'
                        })
                      } else {
                        action.action(item)
                      }
                    }
                    
                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={handleAction}
                        className={action.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
                      >
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
                        {action.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs text-muted-foreground">
            {createdAt && (
              <div>Created: {new Date(createdAt).toLocaleDateString()}</div>
            )}
            {updatedAt && (
              <div>Updated: {new Date(updatedAt).toLocaleDateString()}</div>
            )}
          </div>
        </CardContent>
      </Card>
    )
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
        {data.map((item) => (
          <div key={item.id}>
            {renderCard ? renderCard(item) : defaultRenderCard(item)}
          </div>
        ))}
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

