import { createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Trash2, Edit } from 'lucide-react'
import type { TableConfig, BulkAction } from './TableConfig'
import React from 'react'
import { Badge } from '@/components/ui/badge'

export interface SavedQuery {
  id: string
  name: string
  description: string | null
  query: string
  category: string | null
  tags: string[]
  source: 'BUILDER' | 'CYPHER' | 'LIBRARY'
  userId: string
  executedAt: string | null
  executionCount: number
  createdAt: string
  updatedAt: string
}

const columnHelper = createColumnHelper<SavedQuery>()

export class SavedQueryResource {
  static readonly RESOURCE_NAME = 'SavedQuery'
  static readonly BASE_PATH = '/api/queries'
  static readonly VIEW_PATH = '/dashboard/database/queries'
  static readonly LIST_PATH = '/dashboard/database/queries'
  static readonly EDIT_PATH = (id: string) => `${SavedQueryResource.VIEW_PATH}/${id}/edit`

  static createTableConfig (
    onView: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => Promise<void>
  ): TableConfig<SavedQuery> {
    const columns: ColumnDef<SavedQuery>[] = [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <div className="font-medium">{info.getValue()}</div>
        )
      }) as ColumnDef<SavedQuery>,
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => (
          <div className="max-w-[300px] truncate text-muted-foreground">
            {info.getValue() || '-'}
          </div>
        )
      }) as ColumnDef<SavedQuery>,
      columnHelper.accessor('category', {
        header: 'Category',
        cell: (info) => {
          const category = info.getValue()
          return category ? (
            <Badge variant="outline">{category}</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )
        }
      }) as ColumnDef<SavedQuery>,
      columnHelper.accessor('source', {
        header: 'Source',
        cell: (info) => {
          const source = info.getValue()
          return (
            <Badge variant="secondary" className="text-xs">
              {source}
            </Badge>
          )
        }
      }) as ColumnDef<SavedQuery>,
      columnHelper.accessor('executionCount', {
        header: 'Executions',
        cell: (info) => (
          <div className="text-sm text-muted-foreground">
            {info.getValue() || 0}
          </div>
        )
      }) as ColumnDef<SavedQuery>,
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => (
          <div className="text-sm text-muted-foreground">
            {new Date(info.getValue()).toLocaleDateString()}
          </div>
        )
      }) as ColumnDef<SavedQuery>
    ]

    const bulkActions: BulkAction<SavedQuery>[] = [
      {
        label: 'Delete Selected',
        icon: Trash2,
        action: async (selectedRows) => {
          await Promise.all(selectedRows.map(row => onDelete(row.id)))
        },
        variant: 'destructive',
        requiresConfirmation: true,
        confirmationMessage: 'Are you sure you want to delete the selected queries? This action cannot be undone.'
      }
    ]

    const rowActions = [
      {
        label: 'View',
        icon: Eye,
        action: (row: SavedQuery) => onView(row.id),
        variant: 'default' as const
      },
      {
        label: 'Edit',
        icon: Edit,
        action: (row: SavedQuery) => onEdit(row.id),
        variant: 'default' as const
      },
      {
        label: 'Delete',
        icon: Trash2,
        action: (row: SavedQuery) => onDelete(row.id),
        variant: 'destructive' as const,
        requiresConfirmation: true,
        confirmationMessage: (row: SavedQuery) => `Are you sure you want to delete "${row.name}"? This action cannot be undone.`
      }
    ]

    return {
      name: 'saved-queries',
      resourceName: SavedQueryResource.RESOURCE_NAME,
      columns,
      filters: [
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          placeholder: 'Search by name...'
        },
        {
          key: 'category',
          label: 'Category',
          type: 'text',
          placeholder: 'Filter by category...'
        },
        {
          key: 'source',
          label: 'Source',
          type: 'select',
          options: [
            { label: 'All', value: '' },
            { label: 'Builder', value: 'BUILDER' },
            { label: 'Cypher', value: 'CYPHER' },
            { label: 'Library', value: 'LIBRARY' }
          ]
        }
      ],
      sortableColumns: ['name', 'category', 'source', 'executionCount', 'createdAt'],
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

        const response = await fetch(`${SavedQueryResource.BASE_PATH}?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch queries')
        }

        const result = await response.json()
        return {
          data: result.queries || [],
          total: result.total || 0
        }
      }
    }
  }
}

