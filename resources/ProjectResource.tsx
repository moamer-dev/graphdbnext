import { createColumnHelper } from '@tanstack/react-table'
import { Eye, Trash2, Pencil } from 'lucide-react'
import type { TableConfig, ResourceColumnDef } from './TableConfig'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface Project {
  id: string
  name: string
  description: string | null
  teamId: string
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

const columnHelper = createColumnHelper<Project>()

export class ProjectResource {
  static readonly RESOURCE_NAME = 'Project'
  static readonly BASE_PATH = '/api/projects'
  static readonly VIEW_PATH = '/dashboard/projects'
  static readonly LIST_PATH = '/dashboard/projects'
  
  static readonly HOOK_CONFIG = {
    workspaceScoped: true
  }

  static createTableConfig (
    onView: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => Promise<void>,
    _onManageMembers?: (id: string) => void,
    isAdmin?: boolean
  ): TableConfig<Project> {
    const columns: ResourceColumnDef<Project>[] = [
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
      } as ResourceColumnDef<Project>,
      {
        ...columnHelper.accessor('description', {
          header: 'Description',
          cell: (info) => <div className="text-muted-foreground">{info.getValue() || '-'}</div>
        }),
        searchable: true
      } as ResourceColumnDef<Project>,
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
      } as ResourceColumnDef<Project>,
      {
        ...columnHelper.accessor('createdAt', {
          header: 'Created',
          cell: (info) => <div className="text-sm text-muted-foreground">{new Date(info.getValue()).toLocaleDateString()}</div>
        }),
        filterable: true,
        filterType: 'date',
        sortable: true
      } as ResourceColumnDef<Project>
    ]

    return {
      name: 'projects',
      resourceName: ProjectResource.RESOURCE_NAME,
      columns,
      rowActions: [
        { label: 'View', icon: Eye, action: (row) => onView(row.id), permission: { action: 'READ' as const } },
        { label: 'Edit', icon: Pencil, action: (row) => onEdit(row.id), permission: { action: 'UPDATE' as const } },
        { 
          label: 'Delete', 
          icon: Trash2, 
          action: (row) => onDelete(row.id), 
          variant: 'destructive',
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

        const res = await fetch(`${ProjectResource.BASE_PATH}?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch projects')
        const result = await res.json()
        return { 
          data: result.data || [], 
          total: result.total || 0 
        }
      }
    }
  }
}
