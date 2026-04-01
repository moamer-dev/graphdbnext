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
  BASE_PATH: '/api/admin/roles',
  LIST_PATH: '/api/admin/roles',
  VIEW_PATH: '/api/admin/roles',
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
  BASE_PATH: '/api/admin/permissions',
  LIST_PATH: '/api/admin/permissions',
  VIEW_PATH: '/api/admin/permissions',
}

export interface Role {
  id: string
  name: string
  teamId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  permissions?: Permission[]
}

export interface Permission {
  id: string
  roleId: string
  resource: 'MODEL' | 'WORKSPACE' | 'CREDENTIAL' | 'PROJECT' | 'TEAM'
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'MANAGE'
  isActive: boolean
  createdAt: string
  updatedAt: string
}
