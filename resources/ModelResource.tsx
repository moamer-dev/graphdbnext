import { createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Trash2, Edit } from 'lucide-react'
import type { TableConfig, BulkAction, ResourceColumnDef } from './TableConfig'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface Model {
  id: string
  name: string
  description: string | null
  version: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  creatorId?: string
  workspaceId?: string | null
  schemaJson?: unknown
  schemaMd?: string | null
  noteCount?: number
  relationCount?: number
  creator?: {
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
  
  static readonly HOOK_CONFIG = {
    workspaceScoped: true
  }

  /**
   * Create table configuration for the Model entity
   */
  static createTableConfig (
    onView: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => Promise<void>,
    _onManageMembers?: (id: string) => void,
    isAdmin?: boolean
  ): TableConfig<Model> {
    const columns: ResourceColumnDef<Model>[] = [
      {
        ...columnHelper.accessor('name', {
          header: 'Name',
          cell: (info) => {
            const name = info.getValue()
            const modelId = info.row.original.id
            return (
              <Button
                variant="link"
                className="h-auto p-0 font-medium text-left justify-start hover:cursor-pointer"
                onClick={() => onView(modelId)}
              >
                {name}
              </Button>
            )
          }
        }),
        searchable: false,
        sortable: true
      } as ResourceColumnDef<Model>,
      {
        ...columnHelper.accessor('description', {
          header: 'Description',
          cell: (info) => (
            <div className="max-w-[300px] truncate text-muted-foreground">
              {info.getValue() || '-'}
            </div>
          )
        }),
        searchable: true
      } as ResourceColumnDef<Model>,
      {
        ...columnHelper.accessor('version', {
          header: 'Version',
          cell: (info) => (
            <div className="text-sm">{info.getValue()}</div>
          )
        }),
        searchable: true
      } as ResourceColumnDef<Model>,
      ...(isAdmin
        ? [
            columnHelper.accessor('creator', {
              header: 'Created By',
              cell: (info) => {
                const creator = info.getValue()
                const modelId = info.row.original.id
                if (!creator) {
                  return <div className="text-sm text-muted-foreground">-</div>
                }
                return (
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm text-left justify-start hover:cursor-pointer"
                    onClick={() => onView(modelId)}
                  >
                    {creator.name || creator.email}
                  </Button>
                )
              }
            }) as ResourceColumnDef<Model>
          ]
        : []),
      {
        ...columnHelper.accessor('isActive', {
          header: 'Status',
          cell: (info) => (
            <Badge variant={info.getValue() ? 'default' : 'secondary'}>
              {info.getValue() ? 'Active' : 'Inactive'}
            </Badge>
          )
        }),
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { label: 'Active', value: true },
          { label: 'Inactive', value: false }
        ]
      } as ResourceColumnDef<Model>,
      {
        ...columnHelper.accessor('createdAt', {
          header: 'Created',
          cell: (info) => {
            const date = new Date(info.getValue())
            return (
              <div className="text-sm text-muted-foreground">
                {date.toLocaleDateString()}
              </div>
            )
          }
        }),
        sortable: true,
        filterable: true,
        filterType: 'date'
      } as ResourceColumnDef<Model>,
      {
        ...columnHelper.accessor('updatedAt', {
          header: 'Updated',
          cell: (info) => {
            const date = new Date(info.getValue())
            return (
              <div className="text-sm text-muted-foreground">
                {date.toLocaleDateString()}
              </div>
            )
          }
        }),
        sortable: true,
        filterable: true,
        filterType: 'date'
      } as ResourceColumnDef<Model>
    ]

    const rowActions = [
      {
        label: 'View',
        icon: Eye,
        action: (row: Model) => {
          onView(row.id)
        },
        permission: { action: 'READ' as const }
      },
      {
        label: 'Edit',
        icon: Edit,
        action: (row: Model) => {
          onEdit(row.id)
        },
        permission: { action: 'UPDATE' as const }
      },
      {
        label: 'Delete',
        icon: Trash2,
        variant: 'destructive' as const,
        action: async (row: Model) => {
          await onDelete(row.id)
        },
        requiresConfirmation: true,
        confirmationMessage: (row: Model) => `Are you sure you want to delete model "${row.name}"? This action cannot be undone.`,
        permission: { action: 'DELETE' as const }
      }
    ]

    return {
      name: 'models',
      resourceName: 'Model',
      columns,
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
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'search') {
              // For search, we'll pass it as a general search parameter
              params.append('search', String(value))
            } else {
              params.append(key, String(value))
            }
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
  return ModelResource.createTableConfig(onView, onEdit, onDelete, undefined, isAdmin)
}

