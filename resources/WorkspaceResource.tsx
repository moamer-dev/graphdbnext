import { createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Layers, Eye, Trash2, Pencil } from 'lucide-react'
import type { TableConfig, ResourceColumnDef } from './TableConfig'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface Workspace {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const columnHelper = createColumnHelper<Workspace>()

export class WorkspaceResource {
  static readonly RESOURCE_NAME = 'Workspace'
  static readonly BASE_PATH = '/api/workspaces'
  static readonly VIEW_PATH = '/dashboard/settings/workspaces'
  static readonly LIST_PATH = '/dashboard/settings/workspaces'

  static createTableConfig (
    onView: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => Promise<void>,
    _onManageMembers?: (id: string) => void
  ): TableConfig<Workspace> {
    const columns: ResourceColumnDef<Workspace>[] = [
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
      } as ResourceColumnDef<Workspace>,
      {
        ...columnHelper.accessor('description', {
          header: 'Description',
          cell: (info) => <div className="text-muted-foreground">{info.getValue() || '-'}</div>
        }),
        searchable: true
      } as ResourceColumnDef<Workspace>,
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
      } as ResourceColumnDef<Workspace>,
      {
        ...columnHelper.accessor('createdAt', {
          header: 'Created',
          cell: (info) => <div className="text-sm text-muted-foreground">{new Date(info.getValue()).toLocaleDateString()}</div>
        }),
        sortable: true,
        filterable: true,
        filterType: 'date'
      } as ResourceColumnDef<Workspace>
    ]

    return {
      name: 'workspaces',
      resourceName: WorkspaceResource.RESOURCE_NAME,
      columns,
      rowActions: [
        { label: 'View', icon: Eye, action: (row) => onView(row.id) },
        { label: 'Edit', icon: Pencil, action: (row) => onEdit(row.id) },
        { 
          label: 'Delete', 
          icon: Trash2, 
          action: (row) => onDelete(row.id), 
          variant: 'destructive',
          requiresConfirmation: true
        }
      ],
      enableRowSelection: true,
      fetchData: async ({ page, pageSize, sortBy, sortOrder, filters: filterParams }) => {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        })

        Object.entries(filterParams || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'search') {
              params.append('search', String(value))
            } else {
              params.append(key, String(value))
            }
          }
        })

        if (sortBy) {
          params.append('sortBy', sortBy)
          if (sortOrder) params.append('sortOrder', sortOrder)
        }

        const res = await fetch(`${WorkspaceResource.BASE_PATH}?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch workspaces')
        const result = await res.json()
        return { 
          data: result.data || [], 
          total: result.total || 0 
        }
      }
    }
  }
}
