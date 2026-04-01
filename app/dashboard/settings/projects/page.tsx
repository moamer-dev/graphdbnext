'use client'

import React from 'react'
import { DataTable } from '@/components/data-table/DataTable'
import { useResourceTable } from '@/hooks/view/useResourceTable'
import { resourceHooks } from '@/hooks/react-query'
import { ProjectResource } from '@/resources/ProjectResource'
import { useTenantStore } from '@/stores/tenantStore'
import { FolderKanban, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateProjectDialog } from '@/components/dashboard/CreateModals'
import { EditProjectDialog } from '@/components/dashboard/EditModals'
import { ViewProjectDialog } from '@/components/dashboard/ViewModals'

export default function ProjectsPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [viewingId, setViewingId] = React.useState<string | null>(null)
  const { activeTeamId } = useTenantStore()
  
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
    resource: ProjectResource,
    useList: resourceHooks.projects.useList,
    useDelete: resourceHooks.projects.useDelete,
    useBulkDelete: resourceHooks.projects.useBulkDelete,
    initialFilters: { teamId: activeTeamId },
    isAdmin: true,
    onView: (id) => setViewingId(id),
    onEdit: (id) => setEditingId(id)
  })

  // Note: Admins can see all projects regardless of team selection
  // Standard users will be filtered based on the teamId passed from switchers

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              <span className="relative">
                Project Management
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
              </span>
            </h1>
            <p className="text-xs mt-1.5 text-muted-foreground/70">
              Manage projects and collaborative structural definitions for your team
            </p>
          </div>
          <div>
            <Button size="sm" className="h-8 gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>
        </div>
      </div>
      
      <CreateProjectDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditProjectDialog 
        id={editingId || ''} 
        open={!!editingId} 
        onOpenChange={(open) => !open && setEditingId(null)} 
      />
      <ViewProjectDialog 
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
