import { createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Database, Eye, Trash2 } from 'lucide-react'
import type { TableConfig } from './TableConfig'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface DataSource {
  id: string
  name: string
  type: string
  size: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const columnHelper = createColumnHelper<DataSource>()

export class DataSourceResource {
  static readonly RESOURCE_NAME = 'DataSource'
  static readonly BASE_PATH = '/api/data-sources'
  static readonly VIEW_PATH = '/dashboard/database'
  static readonly LIST_PATH = '/dashboard/database'

  static createTableConfig (
    onView: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => Promise<void>,
    _onManageMembers?: (id: string) => void
  ): TableConfig<DataSource> {
    const columns: ColumnDef<DataSource>[] = [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <Button
            variant="link"
            className="h-auto p-0 font-medium text-left justify-start hover:cursor-pointer"
            onClick={() => onView(info.row.original.id)}
          >
            {info.getValue()}
          </Button>
        )
      }) as ColumnDef<DataSource>,
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>
      }) as ColumnDef<DataSource>,
      columnHelper.accessor('size', {
        header: 'Size',
        cell: (info) => <div className="text-muted-foreground">{info.getValue() ? `${(info.getValue()! / 1024).toFixed(1)} KB` : '-'}</div>
      }) as ColumnDef<DataSource>,
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={info.getValue() ? 'default' : 'secondary'}>
            {info.getValue() ? 'Active' : 'Inactive'}
          </Badge>
        )
      }) as ColumnDef<DataSource>,
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => <div className="text-sm text-muted-foreground">{new Date(info.getValue()).toLocaleDateString()}</div>
      }) as ColumnDef<DataSource>
    ]

    return {
      name: 'data-sources',
      resourceName: DataSourceResource.RESOURCE_NAME,
      columns,
      rowActions: [
        { label: 'View', icon: Eye, action: (row) => onView(row.id) },
        { label: 'Delete', icon: Trash2, action: (row) => onDelete(row.id), variant: 'destructive', requiresConfirmation: true }
      ],
      fetchData: async ({ page, pageSize, sortBy, sortOrder, filters }) => {
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), ...filters })
        if (sortBy) {
          params.append('sortBy', sortBy)
          if (sortOrder) params.append('sortOrder', sortOrder)
        }
        const res = await fetch(`${DataSourceResource.BASE_PATH}?${params.toString()}`)
        const result = await res.json()
        return { data: result.data || [], total: result.total || 0 }
      }
    }
  }
}
