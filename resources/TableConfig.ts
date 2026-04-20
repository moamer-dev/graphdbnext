import type { ColumnDef } from '@tanstack/react-table'

export type FilterType = 'text' | 'select' | 'date' | 'number' | 'boolean'

export interface FilterConfig {
  key: string
  label: string
  type: FilterType
  options?: Array<{ label: string; value: string | number | boolean }>
  placeholder?: string
}

export type PermissionAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE'

export interface BulkAction<T = unknown> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  action: (selectedRows: T[]) => Promise<void> | void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  requiresConfirmation?: boolean
  confirmationMessage?: string
  permission?: { resource?: string; action: PermissionAction }
}

export type ResourceColumnDef<T = any> = ColumnDef<T> & {
  searchable?: boolean
  sortable?: boolean
  filterable?: boolean
  filterType?: FilterType
  filterOptions?: Array<{ label: string; value: string | number | boolean }>
}

export interface TableConfig<T = unknown> {
  // Table identification
  name: string
  resourceName: string // e.g., "Model", "User", etc.

  // Column definitions
  columns: ResourceColumnDef<T>[]

  // Filter configuration
  filters?: FilterConfig[]

  // Bulk actions
  bulkActions?: BulkAction<T>[]

  // Data fetching
  fetchData: (params: {
    page: number
    pageSize: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, unknown>
  }) => Promise<{
    data: T[]
    total: number
  }>

  // Row actions (e.g., edit, delete, view)
  rowActions?: Array<{
    label: string
    icon?: React.ComponentType<{ className?: string }>
    action: (row: T) => void | Promise<void>
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    requiresConfirmation?: boolean
    confirmationMessage?: string | ((row: T) => string)
    visible?: (row: T) => boolean
    permission?: { resource?: string; action: PermissionAction }
  }>

  // Optional: Custom renderers
  renderCell?: (columnKey: string, value: unknown, row: T) => React.ReactNode

  // Optional: Row click handler
  onRowClick?: (row: T) => void

  // Optional: Default page size
  defaultPageSize?: number

  // Optional: Enable row selection
  enableRowSelection?: boolean
}
