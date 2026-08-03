import { createColumnHelper } from '@tanstack/react-table'
import { Eye, Trash2, Pencil } from 'lucide-react'
import type { TableConfig, ResourceColumnDef } from './TableConfig'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface Workspace {
  id: string
  name: string
  description: string | null
  isActive: boolean
  creatorId: string
  createdAt: string
  updatedAt: string
  creator?: {
    id: string
    name: string | null
    email: string
  }
}

const columnHelper = createColumnHelper<Workspace>()

export class WorkspaceResource {
  static readonly RESOURCE_NAME = 'Workspace'
  static readonly BASE_PATH = '/api/workspaces'
  static readonly VIEW_PATH = '/dashboard/workspaces'
  static readonly LIST_PATH = '/dashboard/workspaces'
  
  static readonly HOOK_CONFIG = {
    workspaceScoped: false
  }

  static readonly VIEW_MODE: 'page' | 'modal' = 'page'
  static readonly EDIT_MODE: 'page' | 'modal' = 'modal'

  static createTableConfig (
    onView: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => Promise<void>,
    _onManageMembers?: (id: string) => void,
    isAdmin?: boolean,
    userId?: string,
    userPermissions?: any[]
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
        { label: 'View', icon: Eye, action: (row) => onView(row.id), permission: { action: 'READ' as const } },
        { 
          label: 'Edit', 
          icon: Pencil, 
          action: (row) => onEdit(row.id),
          permission: { action: 'UPDATE' as const }
        },
        { 
          label: 'Delete', 
          icon: Trash2, 
          action: (row) => onDelete(row.id), 
          variant: 'destructive' as const,
          requiresConfirmation: true,
          permission: { action: 'DELETE' as const }
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
