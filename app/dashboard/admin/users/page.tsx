'use client'

import { DataTable } from '@/components/data-table/DataTable'
import { useResourceTable } from '@/app/dashboard/hooks/view/useResourceTable'
import { resourceHooks } from '@/lib/react-query/hooks'
import { UserResource } from '@/lib/resources/UserResource'
import { Users } from 'lucide-react'

export default function UsersPage () {
  // Middleware guarantees admin access, so we can assume isAdmin = true
  const isAdmin = true

  // Use generic hooks directly - no custom hook files needed!
  const { 
    config, 
    data, 
    total, 
    loading,
    page,
    pageSize,
    sortBy,
    sortOrder,
    filters,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onFiltersChange
  } = useResourceTable({
    resource: UserResource,
    useList: resourceHooks.users.useList,
    useDelete: resourceHooks.users.useDelete,
    isAdmin
  })

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="relative">
                Users
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
              </span>
            </h1>
            <p className="text-xs mt-1.5 text-muted-foreground/70">
              Manage user accounts and permissions
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <DataTable
            config={config}
            data={data}
            total={total}
            loading={loading}
            page={page}
            pageSize={pageSize}
            sortBy={sortBy}
            sortOrder={sortOrder}
            filters={filters}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            onSortChange={onSortChange}
            onFiltersChange={onFiltersChange}
        />
      </div>
    </div>
  )
}

