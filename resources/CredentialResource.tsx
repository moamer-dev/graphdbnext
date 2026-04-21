import { createColumnHelper } from '@tanstack/react-table'
import { Eye, Trash2, Pencil, Key, Globe, Lock, Shield } from 'lucide-react'
import type { TableConfig, ResourceColumnDef } from './TableConfig'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type CredentialType = 
  | 'orcid'
  | 'geonames'
  | 'europeana'
  | 'getty'
  | 'apiKey'
  | 'bearer'
  | 'basic'
  | 'custom'

export interface Credential {
  id: string
  name: string
  description?: string
  type: CredentialType
  data: any
  workspaceId?: string | null
  creatorId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  creator?: {
    id: string
    name: string | null
    email: string
  }
}

const columnHelper = createColumnHelper<Credential>()

export class CredentialResource {
  static readonly RESOURCE_NAME = 'CREDENTIAL'
  static readonly BASE_PATH = '/api/credentials'
  static readonly VIEW_PATH = '/dashboard/credentials'
  static readonly LIST_PATH = '/dashboard/credentials'
  
  static readonly HOOK_CONFIG = {
    workspaceScoped: true
  }

  static createTableConfig (
    onView: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => Promise<void>
  ): TableConfig<Credential> {
    const columns: ResourceColumnDef<Credential>[] = [
      {
        ...columnHelper.accessor('name', {
          header: 'Name',
          cell: (info) => (
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-muted/50 border border-border/50">
                <Key className="h-3.5 w-3.5 text-primary/70" />
              </div>
              <Button
                variant="link"
                className="h-auto p-0 font-medium text-left justify-start hover:cursor-pointer"
                onClick={() => onView(info.row.original.id)}
              >
                {info.getValue()}
              </Button>
            </div>
          )
        }),
        searchable: true,
        sortable: true
      } as ResourceColumnDef<Credential>,
      {
        ...columnHelper.accessor('type', {
          header: 'Type',
          cell: (info) => (
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest bg-muted/30 border-border/50">
              {info.getValue()}
            </Badge>
          )
        }),
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { label: 'ORCID', value: 'orcid' },
          { label: 'GeoNames', value: 'geonames' },
          { label: 'Europeana', value: 'europeana' },
          { label: 'Getty', value: 'getty' },
          { label: 'API Key', value: 'apiKey' },
          { label: 'Bearer', value: 'bearer' },
          { label: 'Basic', value: 'basic' },
          { label: 'Custom', value: 'custom' }
        ]
      } as ResourceColumnDef<Credential>,
      {
        ...columnHelper.accessor('workspaceId', {
          header: 'Scope',
          cell: (info) => (
            <div className="flex items-center gap-2">
              {info.getValue() ? (
                <Badge variant="outline" className="bg-primary/5 text-primary/70 border-primary/20 flex items-center gap-1 py-0 px-1.5 h-5 text-[9px] uppercase font-bold">
                  <Shield className="h-2.5 w-2.5" />
                  Workspace
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1 py-0 px-1.5 h-5 text-[9px] uppercase font-bold opacity-70">
                  <Lock className="h-2.5 w-2.5" />
                  Personal
                </Badge>
              )}
            </div>
          )
        }),
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { label: 'Workspace', value: 'true' }, // We'll handle this in backend
          { label: 'Personal', value: 'false' }
        ]
      } as ResourceColumnDef<Credential>,
      {
        ...columnHelper.accessor('createdAt', {
          header: 'Created',
          cell: (info) => <div className="text-[11px] text-muted-foreground uppercase font-medium">{new Date(info.getValue()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        }),
        sortable: true
      } as ResourceColumnDef<Credential>
    ]

    return {
      name: 'credentials',
      resourceName: CredentialResource.RESOURCE_NAME,
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
            params.append(key, String(value))
          }
        })

        if (sortBy) {
          params.append('sortBy', sortBy)
          if (sortOrder) params.append('sortOrder', sortOrder)
        }

        const res = await fetch(`${CredentialResource.BASE_PATH}?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch credentials')
        const result = await res.json()
        return { 
          data: result.data || [], 
          total: result.total || (result.data?.length || 0) 
        }
      }
    }
  }
}
