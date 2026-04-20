'use client'
import React from 'react'
import { cn } from '@/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ChevronDown, 
  Search,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { TableConfig, BulkAction } from '@/resources/TableConfig'
import { useRBAC } from '@/hooks/useRBAC'

interface DataGridProps<T> {
  config: TableConfig<T>
  data: T[]
  total: number
  page: number
  pageSize: number
  filters?: Record<string, unknown>
  loading?: boolean
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onFiltersChange?: (filters: Record<string, unknown>) => void
  renderCard: (item: T, options: { isSelected: boolean; onSelect: (val: boolean) => void }) => React.ReactNode
}

export function DataGrid<T extends { id: string }>({
  config,
  data,
  total,
  page,
  pageSize,
  filters: filterValues = {},
  loading = false,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
  renderCard
}: DataGridProps<T>) {
  const { can } = useRBAC()
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  const toggleSelect = (id: string, selected: boolean) => {
    const next = new Set(selectedIds)
    if (selected) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
  }

  const toggleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(data.map(item => item.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleBulkAction = async (action: BulkAction<T>) => {
    const selectedRows = data.filter(item => selectedIds.has(item.id))
    await action.action(selectedRows)
    setSelectedIds(new Set())
  }

  const handleFilterChange = (key: string, value: unknown) => {
    const newFilters = { ...filterValues }
    if (value === '' || value === null || value === undefined || value === 'all') {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    onFiltersChange?.(newFilters)
    onPageChange?.(1)
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
      {/* Search and Filters - Reused from DataTable style but adapted for Grid */}
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

        <div className="flex items-center gap-2">
            {config.enableRowSelection && data.length > 0 && (
                <div className="flex items-center gap-2 border rounded-md px-3 h-9 bg-background mr-2">
                    <Checkbox 
                        checked={selectedIds.size === data.length && data.length > 0} 
                        onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-xs font-medium text-muted-foreground">Select All</span>
                </div>
            )}
            {allFilters.length > 0 && (
                <div className="flex items-center gap-2">
                    {allFilters.map((filter) => (
                        <div key={filter.key}>
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
                            {filter.type === 'date' && (
                                <Input
                                    type="date"
                                    className="h-9 w-[150px]"
                                    placeholder={filter.label}
                                    value={(filterValues[filter.key] as string) || ''}
                                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                />
                            )}
                            {filter.type === 'boolean' && (
                                <div className="flex items-center gap-2 px-2 py-1 h-9 rounded-md border border-input bg-background/50">
                                    <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{filter.label}</Label>
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
      </div>

      {/* Bulk Actions */}
      <div className={cn(
          "flex items-center gap-2 transition-all duration-300 overflow-hidden px-1 h-9",
          selectedIds.size > 0 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      )}>
          {config.bulkActions?.filter(action => {
            if (action.permission) {
              const resource = action.permission.resource || config.resourceName.toUpperCase()
              if (!can(action.permission.action, resource)) return false
            }
            return true
          }).map((action, i) => {
            const Icon = action.icon
            return (
              <Button
                key={i}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => handleBulkAction(action)}
                className="h-8 shadow-sm"
              >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {action.label} ({selectedIds.size})
              </Button>
            )
          })}
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: pageSize }).map((_, i) => (
            <Card key={i} className="h-48 animate-pulse border-dashed">
                <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="space-y-2 pt-4">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                    </div>
                </CardContent>
            </Card>
          ))
        ) : data.length > 0 ? (
          data.map((item) => renderCard(item, {
              isSelected: selectedIds.has(item.id),
              onSelect: (val) => toggleSelect(item.id, val)
          }))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center h-48 rounded-lg border border-dashed bg-muted/10 text-muted-foreground gap-2">
            <AlertCircle className="h-8 w-8 opacity-20" />
            <span>No results found.</span>
          </div>
        )}
      </div>

      {/* Pagination - Simplified for Grid but consistent with Table */}
      <div className="flex items-center justify-between px-2 pt-4">
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, total)}</span> of <span className="font-medium">{total}</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(page - 1)}
                    disabled={page <= 1}
                    className="h-8 w-8 p-0"
                >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                </Button>
                <span className="text-xs font-medium">Page {page} of {Math.ceil(total / pageSize)}</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(page + 1)}
                    disabled={page >= Math.ceil(total / pageSize)}
                    className="h-8 w-8 p-0"
                >
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                </Button>
            </div>
        </div>
      </div>
    </div>
  )
}
