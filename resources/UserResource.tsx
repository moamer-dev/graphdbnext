import { createColumnHelper } from '@tanstack/react-table'
import { Eye, Trash2, Edit } from 'lucide-react'
import type { TableConfig, BulkAction, ResourceColumnDef } from './TableConfig'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  updatedAt: string
  emailVerified: string | null
}

const columnHelper = createColumnHelper<User>()

/**
 * User Resource Class
 * 
 * Centralizes all user-related configuration including:
 * - API paths
 * - Route paths
 * - Table configuration
 */
export class UserResource {
  // Static path definitions - single source of truth
  static readonly RESOURCE_NAME = 'User'
  static readonly BASE_PATH = '/api/users'
  static readonly VIEW_PATH = '/dashboard/admin/users'
  static readonly LIST_PATH = '/dashboard/admin/users'
  static readonly EDIT_PATH = (id: string) => `${UserResource.VIEW_PATH}/${id}/edit`

  /**
   * Create table configuration for the User entity
   */
  static createTableConfig (
    onView: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => Promise<void>,
    _onManageMembers?: (id: string) => void
  ): TableConfig<User> {
    const columns: ResourceColumnDef<User>[] = [
      {
        ...columnHelper.accessor('email', {
          header: 'Email',
          cell: (info) => {
            const email = info.getValue()
            const userId = info.row.original.id
            return (
              <Button
                variant="link"
                className="h-auto p-0 font-medium text-left justify-start hover:cursor-pointer"
                onClick={() => onView(userId)}
              >
                {email}
              </Button>
            )
          }
        }),
        searchable: true,
        sortable: true
      } as ResourceColumnDef<User>,
      {
        ...columnHelper.accessor('name', {
          header: 'Name',
          cell: (info) => (
            <div className="text-muted-foreground">
              {info.getValue() || '-'}
            </div>
          )
        }),
        searchable: true,
        sortable: true
      } as ResourceColumnDef<User>,
      {
        ...columnHelper.accessor('role', {
          header: 'Role',
          cell: (info) => {
            const role = info.getValue()
            return (
              <Badge variant={role === 'ADMIN' ? 'default' : 'secondary'}>
                {role}
              </Badge>
            )
          }
        }),
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { label: 'Admin', value: 'ADMIN' },
          { label: 'User', value: 'USER' }
        ]
      } as ResourceColumnDef<User>,
      columnHelper.accessor('emailVerified', {
        header: 'Verified',
        cell: (info) => {
          const verified = info.getValue()
          const isVerified = verified !== null && verified !== ''
          return (
            <Badge variant={isVerified ? 'default' : 'outline'}>
              {isVerified ? 'Yes' : 'No'}
            </Badge>
          )
        }
      }) as ResourceColumnDef<User>,
      {
        ...columnHelper.accessor('createdAt', {
          header: 'Created',
          cell: (info) => (
            <div className="text-sm text-muted-foreground">
              {new Date(info.getValue()).toLocaleDateString()}
            </div>
          )
        }),
        sortable: true,
        filterable: true,
        filterType: 'date'
      } as ResourceColumnDef<User>
    ]

    const rowActions = [
      {
        label: 'View',
        icon: Eye,
        action: (row: User) => onView(row.id),
        variant: 'default' as const
      },
      {
        label: 'Delete',
        icon: Trash2,
        action: (row: User) => onDelete(row.id),
        variant: 'destructive' as const,
        requiresConfirmation: true,
        confirmationMessage: (row: User) => `Are you sure you want to delete user "${row.email}"? This action cannot be undone.`
      }
    ]

    return {
      name: 'users',
      resourceName: UserResource.RESOURCE_NAME,
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

        const response = await fetch(`${UserResource.BASE_PATH}?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }

        const result = await response.json()
        return {
          data: result.users || [],
          total: result.total || 0
        }
      }
    }
  }
}

