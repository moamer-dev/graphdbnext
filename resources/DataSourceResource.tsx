import { createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Trash2, Pencil } from 'lucide-react'
import type { TableConfig } from './TableConfig'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface DataSource {
  id: string
  name: string
  type: string
  content?: string | null
  jsonContent?: any | null
  size: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  workspace?: { id: string, name: string } | null
  creator?: { id: string, name: string | null, email: string } | null
}

const columnHelper = createColumnHelper<DataSource>()

export class DataSourceResource {
  static readonly RESOURCE_NAME = 'DataSource'
  static readonly BASE_PATH = '/api/data-sources'
  static readonly VIEW_PATH = '/dashboard/database'
  static readonly LIST_PATH = '/dashboard/database'

  static readonly HOOK_CONFIG = {
    workspaceScoped: true
  }

  static createTableConfig (
    onView: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => Promise<void>,
    _onManageMembers?: (id: string) => void,
    _isAdmin?: boolean,
    _userId?: string,
    _userPermissions?: any[]
  ): TableConfig<DataSource> {
    const columns: ColumnDef<DataSource>[] = [
      {
        ...columnHelper.accessor('name', {
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
        }),
        searchable: true,
        sortable: true
      } as any,
      {
        ...columnHelper.accessor('type', {
          header: 'Type',
          cell: (info) => <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight">{info.getValue()}</Badge>
        }),
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { label: 'XML', value: 'XML' },
          { label: 'JSON', value: 'JSON' },
          { label: 'API Response', value: 'API_RESPONSE' }
        ]
      } as any,
      {
        ...columnHelper.accessor('size', {
          header: 'Size',
          cell: (info) => <div className="text-muted-foreground font-mono text-[11px]">{info.getValue() ? `${(info.getValue()! / 1024).toFixed(1)} KB` : '-'}</div>
        }),
        sortable: true
      } as any,
      {
        ...columnHelper.accessor('isActive', {
          header: 'Status',
          cell: (info) => (
            <Badge variant={info.getValue() ? 'default' : 'secondary'} className="h-5 px-1.5 text-[9px] font-bold uppercase ring-1 ring-inset ring-foreground/10">
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
      } as any,
      {
        ...columnHelper.accessor('createdAt', {
          header: 'Created',
          cell: (info) => <div className="text-[11px] text-muted-foreground font-medium">{new Date(info.getValue()).toLocaleDateString()}</div>
        }),
        sortable: true
      } as any
    ]

    return {
      name: 'data-sources',
      resourceName: DataSourceResource.RESOURCE_NAME,
      columns,
      enableRowSelection: true,
      rowActions: [
        { label: 'View', icon: Eye, action: (row) => onView(row.id), permission: { action: 'READ' as const } },
        { label: 'Edit', icon: Pencil, action: (row) => onEdit(row.id), permission: { action: 'UPDATE' as const } },
        { label: 'Delete', icon: Trash2, action: (row) => onDelete(row.id), variant: 'destructive' as const, requiresConfirmation: true, permission: { action: 'DELETE' as const } }
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
