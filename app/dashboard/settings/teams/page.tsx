'use client'

import React from 'react'
import { DataTable } from '@/components/data-table/DataTable'
import { useResourceTable } from '@/hooks/view/useResourceTable'
import { resourceHooks } from '@/hooks/react-query'
import { TeamResource } from '@/resources/TeamResource'
import { Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateTeamDialog } from '@/components/dashboard/CreateModals'
import { EditTeamDialog } from '@/components/dashboard/EditModals'
import { ViewTeamDialog } from '@/components/dashboard/ViewModals'

export default function TeamsPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [viewingId, setViewingId] = React.useState<string | null>(null)

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
    resource: TeamResource,
    useList: resourceHooks.teams.useList,
    useDelete: resourceHooks.teams.useDelete,
    useBulkDelete: resourceHooks.teams.useBulkDelete,
    isAdmin: true, // Allow management
    onView: (id) => setViewingId(id),
    onEdit: (id) => setEditingId(id)
  })

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="relative">
                Team Management
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
              </span>
            </h1>
            <p className="text-xs mt-1.5 text-muted-foreground/70">
              Manage your organizational units and collaborative spaces
            </p>
          </div>
          <div>
            <Button size="sm" className="h-8 gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </div>
        </div>
      </div>

      <CreateTeamDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditTeamDialog 
        id={editingId || ''} 
        open={!!editingId} 
        onOpenChange={(open) => !open && setEditingId(null)} 
      />
      <ViewTeamDialog 
        id={viewingId || ''} 
        open={!!viewingId} 
        onOpenChange={(open) => !open && setViewingId(null)} 
      />
      
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
