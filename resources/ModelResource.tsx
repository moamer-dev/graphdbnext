import { createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Trash2, Edit } from 'lucide-react'
import type { TableConfig, BulkAction } from './TableConfig'
import React from 'react'

export interface Model {
  id: string
  name: string
  description: string | null
  version: string
  createdAt: string
  updatedAt: string
  userId?: string
  schemaJson?: unknown
  schemaMd?: string | null
  user?: {
    id: string
    email: string
    name: string | null
  }
}

const columnHelper = createColumnHelper<Model>()

/**
 * Model Resource Class
 * 
 * Centralizes all model-related configuration including:
 * - API paths
 * - Route paths
 * - Table configuration
 * 
 * This pattern should be followed for other models as well.
 */
export class ModelResource {
  // Static path definitions - single source of truth
  static readonly RESOURCE_NAME = 'Model'
  static readonly BASE_PATH = '/api/models'
  static readonly VIEW_PATH = '/dashboard/graph/model'
  static readonly LIST_PATH = '/dashboard/graph/model'
  static readonly EDIT_PATH = (id: string) => `${ModelResource.VIEW_PATH}/${id}/edit`

  /**
   * Create table configuration for the Model entity
   */
  static createTableConfig (
    onView: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => Promise<void>,
    isAdmin: boolean
  ): TableConfig<Model> {
    const columns: ColumnDef<Model>[] = [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <div className="font-medium">{info.getValue()}</div>
        )
      }) as ColumnDef<Model>,
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => (
          <div className="max-w-[300px] truncate text-muted-foreground">
            {info.getValue() || '-'}
          </div>
        )
      }) as ColumnDef<Model>,
      columnHelper.accessor('version', {
        header: 'Version',
        cell: (info) => (
          <div className="text-sm">{info.getValue()}</div>
        )
      }) as ColumnDef<Model>,
      ...(isAdmin
        ? [
            columnHelper.accessor('user', {
              header: 'Created By',
              cell: (info) => {
                const user = info.getValue()
                return (
                  <div className="text-sm text-muted-foreground">
                    {user?.email || '-'}
                  </div>
                )
              }
            }) as ColumnDef<Model>
          ]
        : []),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => {
          const date = new Date(info.getValue())
          return (
            <div className="text-sm text-muted-foreground">
              {date.toLocaleDateString()}
            </div>
          )
        }
      }) as ColumnDef<Model>,
      columnHelper.accessor('updatedAt', {
        header: 'Updated',
        cell: (info) => {
          const date = new Date(info.getValue())
          return (
            <div className="text-sm text-muted-foreground">
              {date.toLocaleDateString()}
            </div>
          )
        }
      }) as ColumnDef<Model>
    ]

    const filters = [
      {
        key: 'name',
        label: 'Name',
        type: 'text' as const,
        placeholder: 'Filter by name...'
      },
      {
        key: 'version',
        label: 'Version',
        type: 'text' as const,
        placeholder: 'Filter by version...'
      }
    ]

    const bulkActions: BulkAction<Model>[] = [
      {
        label: 'Delete Selected',
        icon: Trash2,
        variant: 'destructive',
        requiresConfirmation: true,
        confirmationMessage: 'Are you sure you want to delete the selected models?',
        action: async (selectedRows) => {
          for (const row of selectedRows) {
            await onDelete(row.id)
          }
        }
      }
    ]

    const rowActions = [
      {
        label: 'View',
        icon: Eye,
        action: (row: Model) => {
          onView(row.id)
        }
      },
      {
        label: 'Edit',
        icon: Edit,
        action: (row: Model) => {
          onEdit(row.id)
        }
      },
      {
        label: 'Delete',
        icon: Trash2,
        variant: 'destructive' as const,
        action: async (row: Model) => {
          await onDelete(row.id)
        },
        requiresConfirmation: true,
        confirmationMessage: (row: Model) => `Are you sure you want to delete model "${row.name}"? This action cannot be undone.`
      }
    ]

    return {
      name: 'models',
      resourceName: 'Model',
      columns,
      filters,
      sortableColumns: ['name', 'version', 'createdAt', 'updatedAt'],
      bulkActions,
      rowActions,
      enableRowSelection: true,
      defaultPageSize: 10,
      fetchData: async ({ page, pageSize, sortBy, sortOrder, filters: filterParams }) => {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize)
        })

        if (sortBy) {
          params.append('sortBy', sortBy)
          if (sortOrder) {
            params.append('sortOrder', sortOrder)
          }
        }

        Object.entries(filterParams || {}).forEach(([key, value]) => {
          if (value) {
            params.append(key, String(value))
          }
        })

        const response = await fetch(`${ModelResource.BASE_PATH}?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch models')
        }

        const result = await response.json()
        return {
          data: result.models || [],
          total: result.total || 0
        }
      }
      // onRowClick removed - users should use the "View" action in row actions dropdown instead
    }
  }
}

/**
 * Backward compatibility: Export a function that uses the class
 * @deprecated Use ModelResource.createTableConfig() instead
 */
export function createModelTableConfig (
  onView: (id: string) => void,
  onEdit: (id: string) => void,
  onDelete: (id: string) => Promise<void>,
  isAdmin: boolean
): TableConfig<Model> {
  return ModelResource.createTableConfig(onView, onEdit, onDelete, isAdmin)
}

