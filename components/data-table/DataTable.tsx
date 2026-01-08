'use client'

import * as React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ChevronDown, ChevronUp, MoreHorizontal, ArrowUpDown } from 'lucide-react'
import type { TableConfig, BulkAction } from '@/lib/resources/TableConfig'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { cn } from '@/lib/utils'

interface DataTableProps<T> {
  config: TableConfig<T>
  data: T[]
  total: number
  loading?: boolean
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, unknown>
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSortChange?: (sortBy?: string, sortOrder?: 'asc' | 'desc') => void
  onFiltersChange?: (filters: Record<string, unknown>) => void
}

export function DataTable<T extends { id: string }>({
  config,
  data,
  total,
  loading = false,
  page: externalPage,
  pageSize: externalPageSize,
  sortBy: externalSortBy,
  sortOrder: externalSortOrder,
  filters: externalFilters,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onFiltersChange
}: DataTableProps<T>) {
  // Use external state if provided, otherwise use internal state
  const [internalPage, setInternalPage] = React.useState(1)
  const [internalPageSize, setInternalPageSize] = React.useState(config.defaultPageSize || 10)
  const [internalSortBy, setInternalSortBy] = React.useState<string | undefined>()
  const [internalSortOrder, setInternalSortOrder] = React.useState<'asc' | 'desc' | undefined>()
  const [internalFilters, setInternalFilters] = React.useState<Record<string, unknown>>({})

  const page = externalPage ?? internalPage
  const pageSize = externalPageSize ?? internalPageSize
  const sortBy = externalSortBy ?? internalSortBy
  const sortOrder = externalSortOrder ?? internalSortOrder
  const filterValues = externalFilters ?? internalFilters

  // Convert sortBy/sortOrder to TanStack Table's sorting format
  const sorting = React.useMemo<SortingState>(() => {
    if (!sortBy || !sortOrder) return []
    return [{ id: sortBy, desc: sortOrder === 'desc' }]
  }, [sortBy, sortOrder])

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void | Promise<void>
    variant?: 'default' | 'destructive'
  } | null>(null)

  // Add selection column if enabled
  const columnsWithSelection = React.useMemo<ColumnDef<T>[]>(() => {
    if (!config.enableRowSelection) {
      return config.columns
    }

    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false
      },
      ...config.columns
    ]
  }, [config.columns, config.enableRowSelection])

  // Add row actions column if configured
  const finalColumns = React.useMemo<ColumnDef<T>[]>(() => {
    if (!config.rowActions || config.rowActions.length === 0) {
      return columnsWithSelection
    }

    return [
      ...columnsWithSelection,
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const item = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {config.rowActions?.map((action, index) => {
                  const Icon = action.icon
                  const handleAction = () => {
                    if (action.requiresConfirmation) {
                      const message = typeof action.confirmationMessage === 'function'
                        ? action.confirmationMessage(item)
                        : action.confirmationMessage || `Are you sure you want to ${action.label.toLowerCase()} this item? This action cannot be undone.`
                      
                      setConfirmDialog({
                        open: true,
                        title: action.label,
                        description: message,
                        variant: action.variant === 'destructive' ? 'destructive' : 'default',
                        onConfirm: async () => {
                          try {
                            await action.action(item)
                          } catch (error) {
                            console.error('Row action error:', error)
                            throw error
                          }
                        }
                      })
                    } else {
                      action.action(item)
                    }
                  }
                  
                  return (
                    <DropdownMenuItem
                      key={index}
                      onClick={handleAction}
                      className={action.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {action.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      }
    ]
  }, [columnsWithSelection, config.rowActions])

  const table = useReactTable({
    data,
    columns: finalColumns,
    onSortingChange: (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
      const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue
      if (newSorting.length === 0) {
        if (onSortChange) {
          onSortChange(undefined, undefined)
        } else {
          setInternalSortBy(undefined)
          setInternalSortOrder(undefined)
        }
      } else {
        const sort = newSorting[0]
        if (onSortChange) {
          onSortChange(sort.id, sort.desc ? 'desc' : 'asc')
        } else {
          setInternalSortBy(sort.id)
          setInternalSortOrder(sort.desc ? 'desc' : 'asc')
        }
      }
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter
    },
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
    manualSorting: true,
    manualFiltering: true
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)

  const handleBulkAction = async (action: BulkAction<T>) => {
    if (action.requiresConfirmation) {
      setConfirmDialog({
        open: true,
        title: action.label,
        description: action.confirmationMessage || `Are you sure you want to ${action.label.toLowerCase()} ${selectedRows.length} item(s)? This action cannot be undone.`,
        variant: action.variant === 'destructive' ? 'destructive' : 'default',
        onConfirm: async () => {
          try {
            await action.action(selectedRows)
            setRowSelection({})
          } catch (error) {
            console.error('Bulk action error:', error)
            throw error // Re-throw to prevent dialog from closing on error
          }
        }
      })
      return
    }

    try {
      await action.action(selectedRows)
      setRowSelection({})
    } catch (error) {
      console.error('Bulk action error:', error)
    }
  }

  const handleFilterChange = (key: string, value: unknown) => {
    const newFilters = { ...filterValues }
    
    // Remove empty values from filters
    if (value === '' || value === null || value === undefined || value === 'all') {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    
    if (onFiltersChange) {
      onFiltersChange(newFilters)
    } else {
      setInternalFilters(newFilters)
    }
    // Reset to first page when filters change
    const newPage = 1
    if (onPageChange) {
      onPageChange(newPage)
    } else {
      setInternalPage(newPage)
    }
  }

  const handleSortChange = (columnId: string) => {
    let newSortBy: string | undefined
    let newSortOrder: 'asc' | 'desc' | undefined

    const currentSort = sorting.find((s) => s.id === columnId)
    if (currentSort) {
      if (currentSort.desc) {
        // Already descending, remove sort
        newSortBy = undefined
        newSortOrder = undefined
      } else {
        // Currently ascending, switch to descending
        newSortBy = columnId
        newSortOrder = 'desc'
      }
    } else {
      // No sort, set to ascending
      newSortBy = columnId
      newSortOrder = 'asc'
    }

    if (onSortChange) {
      onSortChange(newSortBy, newSortOrder)
    } else {
      setInternalSortBy(newSortBy)
      setInternalSortOrder(newSortOrder)
    }
    // Reset to first page when sorting changes
    const newPage = 1
    if (onPageChange) {
      onPageChange(newPage)
    } else {
      setInternalPage(newPage)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage)
    } else {
      setInternalPage(newPage)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize)
    } else {
      setInternalPageSize(newPageSize)
    }
    // Reset to first page when page size changes
    const newPage = 1
    if (onPageChange) {
      onPageChange(newPage)
    } else {
      setInternalPage(newPage)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {config.filters && config.filters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {config.filters.map((filter) => (
            <div key={filter.key} className="flex items-center gap-2">
              {filter.type === 'text' && (
                <Input
                  placeholder={filter.placeholder || `Filter by ${filter.label}...`}
                  value={(filterValues[filter.key] as string) || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="h-8 w-[200px]"
                />
              )}
              {filter.type === 'select' && filter.options && (
                <Select
                  value={(filterValues[filter.key] as string) || undefined}
                  onValueChange={(value) => handleFilterChange(filter.key, value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="h-8 w-[180px]">
                    <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {filter.options
                      .filter((option) => option.value !== '' && option.value !== 'all')
                      .map((option) => (
                        <SelectItem key={String(option.value)} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Global search */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search all columns..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-8 w-[250px]"
        />

        {/* Bulk actions */}
        {config.bulkActions && config.bulkActions.length > 0 && selectedRows.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedRows.length} selected
            </span>
            {config.bulkActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={() => handleBulkAction(action)}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </Button>
              )
            })}
          </div>
        )}
      </div>

          {/* Table */}
          <div className="rounded-md border border-border/50 gradient-table overflow-hidden">
            <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="gradient-table-header border-0">
                {headerGroup.headers.map((header) => {
                  const isSortable = config.sortableColumns?.includes(header.column.id) || false
                  return (
                    <TableHead key={header.id} className="text-xs font-semibold text-foreground/90 py-3 px-4">
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-2">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {isSortable && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleSortChange(header.column.id)}
                            >
                              {sorting.find((s) => s.id === header.column.id)?.desc ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : sorting.find((s) => s.id === header.column.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={finalColumns.length} className="h-24 text-center text-muted-foreground/60">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      onClick={() => config.onRowClick?.(row.original)}
                      className={cn(
                        'gradient-table-row',
                        config.onRowClick ? 'cursor-pointer' : '',
                        row.getIsSelected() && 'bg-primary/5'
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2.5 px-4 text-sm">
                      {config.renderCell
                        ? config.renderCell(
                            cell.column.id,
                            cell.getValue(),
                            row.original
                          )
                        : flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={finalColumns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm">Page</span>
            <Input
              type="number"
              min={1}
              max={Math.ceil(total / pageSize)}
              value={page}
              onChange={(e) => handlePageChange(Math.max(1, Math.min(Math.ceil(total / pageSize), Number(e.target.value))))}
              className="h-8 w-16"
            />
            <span className="text-sm">of {Math.ceil(total / pageSize)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.min(Math.ceil(total / pageSize), page + 1))}
            disabled={page >= Math.ceil(total / pageSize)}
          >
            Next
          </Button>
          <Select value={String(pageSize)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmDialog(null)
            }
          }}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          description={confirmDialog.description}
          variant={confirmDialog.variant}
          confirmLabel={confirmDialog.variant === 'destructive' ? 'Delete' : 'Confirm'}
        />
      )}
    </div>
  )
}

