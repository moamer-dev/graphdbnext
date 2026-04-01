'use client'

import React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  ArrowUpDown, 
  Search,
  Settings2,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { cn } from '@/utils'
import type { TableConfig, BulkAction } from '@/resources/TableConfig'

interface DataTableProps<T> {
  config: TableConfig<T>
  data: T[]
  total: number
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, unknown>
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onFiltersChange?: (filters: Record<string, unknown>) => void
}

export function DataTable<T>({
  config,
  data,
  total,
  page,
  pageSize,
  sortBy,
  sortOrder,
  filters: filterValues = {},
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onFiltersChange,
}: DataTableProps<T>) {
  // Local state for table features if not controlled externally
  const [internalPage, setInternalPage] = React.useState(page)
  const [internalPageSize, setInternalPageSize] = React.useState(pageSize)
  const [internalSortBy, setInternalSortBy] = React.useState<string | undefined>(sortBy)
  const [internalSortOrder, setInternalSortOrder] = React.useState<'asc' | 'desc' | undefined>(sortOrder)
  const [internalFilters, setInternalFilters] = React.useState<Record<string, unknown>>(filterValues)

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  // Sync sorting state
  const sorting: SortingState = React.useMemo(() => {
    const sBy = sortBy || internalSortBy
    const sOrder = sortOrder || internalSortOrder
    if (sBy) {
      return [{ id: sBy, desc: sOrder === 'desc' }]
    }
    return []
  }, [sortBy, internalSortBy, sortOrder, internalSortOrder])

  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void | Promise<void>
    variant?: 'default' | 'destructive'
  } | null>(null)

  // Save/Load column visibility
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`column-visibility-${config.name}`)
      if (saved) {
        try {
          setColumnVisibility(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to load column visibility', e)
        }
      }
    }
  }, [config.name])

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`column-visibility-${config.name}`, JSON.stringify(columnVisibility))
    }
  }, [columnVisibility, config.name])

  // Process columns with selection
  const columnsWithSelection = React.useMemo<ColumnDef<T>[]>(() => {
    if (!config.enableRowSelection) return config.columns

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

  // Final columns with actions
  const finalColumns = React.useMemo<ColumnDef<T>[]>(() => {
    if (!config.rowActions || config.rowActions.length === 0) return columnsWithSelection

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
                  return (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => {
                        if (action.requiresConfirmation) {
                          setConfirmDialog({
                            open: true,
                            title: action.label,
                            description: typeof action.confirmationMessage === 'function' ? action.confirmationMessage(item) : (action.confirmationMessage || 'Are you sure?'),
                            onConfirm: () => action.action(item),
                            variant: action.variant === 'destructive' ? 'destructive' : 'default'
                          })
                        } else {
                          action.action(item)
                        }
                      }}
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      if (newSorting.length > 0) {
        const sort = newSorting[0]
        handleSortChange(sort.id)
      }
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
        description: action.confirmationMessage || `Are you sure you want to perform this action on ${selectedRows.length} items?`,
        onConfirm: async () => {
          await action.action(selectedRows)
          setRowSelection({})
        },
        variant: action.variant === 'destructive' ? 'destructive' : 'default'
      })
    } else {
      await action.action(selectedRows)
      setRowSelection({})
    }
  }

  const handleFilterChange = (key: string, value: unknown) => {
    const newFilters = { ...filterValues }
    if (value === '' || value === null || value === undefined || value === 'all') {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    
    if (onFiltersChange) onFiltersChange(newFilters)
    else setInternalFilters(newFilters)
    
    // Reset to page 1
    if (onPageChange) onPageChange(1)
    else setInternalPage(1)
  }

  const handleSortChange = (columnId: string) => {
    const currentSort = sorting.find((s) => s.id === columnId)
    const newSortOrder = currentSort && !currentSort.desc ? 'desc' : 'asc'

    if (onSortChange) onSortChange(columnId, newSortOrder)
    else {
      setInternalSortBy(columnId)
      setInternalSortOrder(newSortOrder)
    }
    
    if (onPageChange) onPageChange(1)
    else setInternalPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (onPageChange) onPageChange(newPage)
    else setInternalPage(newPage)
  }

  const handlePageSizeChange = (size: number) => {
    if (onPageSizeChange) onPageSizeChange(size)
    else setInternalPageSize(size)
    
    if (onPageChange) onPageChange(1)
    else setInternalPage(1)
  }

  const isSearchable = config.columns.some((col: any) => col.searchable)

  const allFilters = React.useMemo(() => {
    const filters = [...(config.filters || [])]
    config.columns.forEach((col: any) => {
      if (col.filterable) {
        const key = col.id || col.accessorKey
        if (key && !filters.find((f) => f.key === key)) {
          filters.push({
            key,
            label: typeof col.header === 'string' ? col.header : key,
            type: col.filterType || 'text',
            options: col.filterOptions
          })
        }
      }
    })
    return filters
  }, [config.filters, config.columns])

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-grow max-w-sm">
          {isSearchable && (
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={(filterValues.search as string) || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}
        </div>

        {allFilters.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {allFilters.map((filter) => (
              <div key={filter.key} className="flex items-center gap-2">
                {filter.type === 'text' && (
                  <Input
                    placeholder={filter.placeholder || `Filter ${filter.label}`}
                    value={(filterValues[filter.key] as string) || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="h-9 w-[180px]"
                  />
                )}
                {filter.type === 'date' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{filter.label}:</span>
                    <Input
                      type="date"
                      value={(filterValues[filter.key] as string) || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="h-9 w-[150px] text-xs"
                    />
                  </div>
                )}
                {filter.type === 'select' && filter.options && (
                  <Select
                    value={(filterValues[filter.key] as string) || undefined}
                    onValueChange={(value) => handleFilterChange(filter.key, value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-9 min-w-[130px]">
                      <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {filter.label}</SelectItem>
                      {filter.options.map((opt) => (
                        <SelectItem key={String(opt.value)} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {filter.type === 'boolean' && (
                  <div className="flex items-center gap-2 px-2 py-1 h-9 rounded-md border border-input">
                    <span className="text-xs text-muted-foreground">{filter.label}</span>
                    <Switch
                      checked={!!filterValues[filter.key]}
                      onCheckedChange={(checked) => handleFilterChange(filter.key, checked)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table Controls */}
      <div className="flex items-center justify-end gap-2 px-1">
        <div className={cn(
          "flex items-center gap-2 transition-all duration-300 overflow-hidden",
          selectedRows.length > 0 ? "max-w-md opacity-100" : "max-w-0 opacity-0"
        )}>
          {config.bulkActions?.map((action, i) => {
            const Icon = action.icon
            return (
              <Button
                key={i}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => handleBulkAction(action)}
                className="h-8 shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {action.label} ({selectedRows.length})
              </Button>
            )
          })}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 ml-auto">
              <Settings2 className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[150px]">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Actual Table */}
      <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortable = (header.column.columnDef as any).sortable;
                  return (
                    <TableHead key={header.id} className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            "flex items-center gap-2",
                            sortable && "cursor-pointer select-none hover:text-foreground transition-colors"
                          )}
                          onClick={sortable ? () => handleSortChange(header.column.id) : undefined}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortable && (
                            <div className="flex flex-col">
                              {sorting.find(s => s.id === header.column.id)?.desc ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : sorting.find(s => s.id === header.column.id) ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                              )}
                            </div>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/30 transition-colors border-b last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={finalColumns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <AlertCircle className="h-8 w-8 opacity-20" />
                    <span>No results found.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, total)}</span> of <span className="font-medium">{total}</span> results
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => handlePageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent align="end">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <div className="flex items-center justify-center text-sm font-medium">
              Page {page} of {Math.ceil(total / pageSize)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDialog?.onConfirm}
              className={confirmDialog?.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
