import { TableConfig } from './TableConfig'
import { z } from 'zod'

export const RoleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  teamId: z.string().nullable().optional(),
})

export type RoleFormValues = z.infer<typeof RoleSchema>

export const RoleResource = {
  NAME: 'Role',
  resourceName: 'Role',
  BASE_PATH: '/api/roles',
  LIST_PATH: '/dashboard/admin/roles',
  VIEW_PATH: '/dashboard/admin/roles',
  fetchData: async () => ({ data: [], total: 0 }),
  createTableConfig: (onView: (id: string) => void, onEdit: (id: string) => void, onDelete: (id: string) => Promise<void>, _onManageMembers?: (id: string) => void): TableConfig<Role> => ({
    name: 'roles',
    resourceName: 'Role',
    fetchData: async () => ({ data: [], total: 0 }),
    columns: [
      { id: 'name', header: 'Name', accessorKey: 'name' },
      { id: 'isActive', header: 'Active', accessorKey: 'isActive' }
    ],
    rowActions: [
      { label: 'Edit', action: (item) => onEdit(item.id) },
      { label: 'Delete', variant: 'destructive', action: (item) => onDelete(item.id), requiresConfirmation: true }
    ]
  })
}

export const PermissionResource = {
  NAME: 'Permission',
  BASE_PATH: '/api/permissions',
  LIST_PATH: '/api/admin/permissions',
  VIEW_PATH: '/api/admin/permissions',
}

export interface Role {
  id: string
  name: string
  description?: string
  teamId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  permissions?: Permission[]
}

export interface Permission {
  id: string
  roleId: string
  resource: 'MODEL' | 'WORKSPACE' | 'CREDENTIAL' | 'PROJECT' | 'TEAM' | 'SAVED_QUERY' | 'WORKFLOW' | 'DATA_SOURCE'
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'MANAGE'
  scope: 'SELF' | 'TEAM' | 'ALL'
  isActive: boolean
  createdAt: string
  updatedAt: string
}
