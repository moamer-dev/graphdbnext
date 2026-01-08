import { createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Trash2, Edit } from 'lucide-react'
import type { TableConfig, BulkAction } from './TableConfig'
import React from 'react'
import { Badge } from '@/components/ui/badge'

export interface User {
  id: string
  email: string
  name: string | null
  role: 'USER' | 'ADMIN'
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
    onDelete: (id: string) => Promise<void>
  ): TableConfig<User> {
    const columns: ColumnDef<User>[] = [
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => (
          <div className="font-medium">{info.getValue()}</div>
        )
      }) as ColumnDef<User>,
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <div className="text-muted-foreground">
            {info.getValue() || '-'}
          </div>
        )
      }) as ColumnDef<User>,
      columnHelper.accessor('role', {
        header: 'Role',
        cell: (info) => {
          const role = info.getValue()
          return (
            <Badge variant={role === 'ADMIN' ? 'default' : 'secondary'}>
              {role}
            </Badge>
          )
        }
      }) as ColumnDef<User>,
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
      }) as ColumnDef<User>,
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => (
          <div className="text-sm text-muted-foreground">
            {new Date(info.getValue()).toLocaleDateString()}
          </div>
        )
      }) as ColumnDef<User>
    ]

    const bulkActions: BulkAction<User>[] = [
      {
        label: 'Delete Selected',
        icon: Trash2,
        action: async (selectedRows) => {
          await Promise.all(selectedRows.map(row => onDelete(row.id)))
        },
        variant: 'destructive',
        requiresConfirmation: true,
        confirmationMessage: 'Are you sure you want to delete the selected user(s)? This action cannot be undone.'
      }
    ]

    const rowActions = [
      {
        label: 'View',
        icon: Eye,
        action: (row: User) => onView(row.id),
        variant: 'default' as const
      },
      {
        label: 'Edit',
        icon: Edit,
        action: (row: User) => onEdit(row.id),
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
      filters: [
        {
          key: 'email',
          label: 'Email',
          type: 'text',
          placeholder: 'Search by email...'
        },
        {
          key: 'role',
          label: 'Role',
          type: 'select',
          options: [
            { label: 'Admin', value: 'ADMIN' },
            { label: 'User', value: 'USER' }
          ]
        }
      ],
      sortableColumns: ['email', 'name', 'role', 'createdAt'],
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

