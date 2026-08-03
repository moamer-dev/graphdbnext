import { createColumnHelper } from '@tanstack/react-table'
import { Building2, Eye, Trash2, Pencil } from 'lucide-react'
import type { TableConfig, ResourceColumnDef } from './TableConfig'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface Team {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const columnHelper = createColumnHelper<Team>()

export class TeamResource {
  static readonly RESOURCE_NAME = 'Team'
  static readonly BASE_PATH = '/api/teams'
  static readonly VIEW_PATH = '/dashboard/teams'
  static readonly LIST_PATH = '/dashboard/teams'
  
  static readonly HOOK_CONFIG = {
    workspaceScoped: true
  }

  static readonly VIEW_MODE: 'page' | 'modal' = 'page'
  static readonly EDIT_MODE: 'page' | 'modal' = 'modal'

  static createTableConfig (
    onView: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => Promise<void>,
    onManageMembers: (id: string) => void
  ): TableConfig<Team> {
    const columns: ResourceColumnDef<Team>[] = [
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
      } as ResourceColumnDef<Team>,
      {
        ...columnHelper.accessor('description', {
          header: 'Description',
          cell: (info) => <div className="text-muted-foreground">{info.getValue() || '-'}</div>
        }),
        searchable: true
      } as ResourceColumnDef<Team>,
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
      } as ResourceColumnDef<Team>,
      {
        ...columnHelper.accessor('createdAt', {
          header: 'Created',
          cell: (info) => <div className="text-sm text-muted-foreground">{new Date(info.getValue()).toLocaleDateString()}</div>
        }),
        sortable: true,
        filterable: true,
        filterType: 'date'
      } as ResourceColumnDef<Team>
    ]

    return {
      name: 'teams',
      resourceName: TeamResource.RESOURCE_NAME,
      columns,
      enableRowSelection: true,
      rowActions: [
        { label: 'View', icon: Eye, action: (row) => onView(row.id), permission: { action: 'READ' as const } },
        { label: 'Edit', icon: Pencil, action: (row) => onEdit(row.id), permission: { action: 'UPDATE' as const } },
        { 
          label: 'Delete', 
          icon: Trash2, 
          action: (row) => onDelete(row.id), 
          variant: 'destructive' as const,
          requiresConfirmation: true,
          permission: { action: 'DELETE' as const }
        },
        {
          label: 'Members',
          icon: Building2,
          action: (row) => onManageMembers(row.id),
          permission: { action: 'UPDATE' as const }
        }
      ],
      fetchData: async ({ page, pageSize, sortBy, sortOrder, filters: filterParams }) => {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        })

        Object.entries(filterParams || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value))
          }
        })

        if (sortBy) {
          params.append('sortBy', sortBy)
          if (sortOrder) params.append('sortOrder', sortOrder)
        }
        const res = await fetch(`${TeamResource.BASE_PATH}?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch teams')
        const result = await res.json()
        return { 
          data: result.data || [], 
          total: result.total || 0 
        }
      }
    }
  }
}
