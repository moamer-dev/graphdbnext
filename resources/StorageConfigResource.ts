import { TableConfig } from './TableConfig'

export const StorageConfigResource = {
  NAME: 'StorageConfig',
  BASE_PATH: '/api/admin/storage',
  LIST_PATH: '/api/admin/storage',
  VIEW_PATH: '/api/admin/storage',
  createTableConfig: (onView: (id: string) => void, onEdit: (id: string) => void, onDelete: (id: string) => Promise<void>): TableConfig<StorageConfig> => ({
    name: 'storage-configs',
    resourceName: 'StorageConfig',
    fetchData: async () => ({ data: [], total: 0 }),
    columns: [
      { id: 'name', header: 'Name', accessorKey: 'name', searchable: true, sortable: true },
      { id: 'type', header: 'Type', accessorKey: 'type', searchable: true, sortable: true },
      { id: 'isDefault', header: 'Default', accessorKey: 'isDefault', sortable: true },
      { id: 'isActive', header: 'Active', accessorKey: 'isActive', sortable: true }
    ],
    rowActions: [
      { label: 'Edit', action: (item) => onEdit(item.id) },
      { label: 'Delete', variant: 'destructive', action: (item) => onDelete(item.id), requiresConfirmation: true }
    ],
    enableRowSelection: true
  })
}

export interface StorageConfig {
  id: string
  name: string
  type: 'DATABASE' | 'EXTERNAL_S3' | 'LOCAL_FS'
  config: any
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}
