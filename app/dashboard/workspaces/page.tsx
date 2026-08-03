'use client'

import { Layers, Plus, Loader2, Layout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/DataTable'
import { useResourcePage } from '@/hooks/view/useResourcePage'
import { resourceHooks } from '@/hooks/react-query'
import { WorkspaceResource } from '@/resources/WorkspaceResource'
import { useTenantStore } from '@/stores/tenantStore'
import { CreateWorkspaceDialog } from '@/components/dashboard/CreateModals'
import { EditWorkspaceDialog } from '@/components/dashboard/EditModals'
import { ViewWorkspaceDialog } from '@/components/dashboard/ViewModals'
import { ViewSwitcher } from '@/components/data-table/ViewSwitcher'
import { DataGrid } from '@/components/data-table/DataGrid'
import { ResourceCard } from '@/components/dashboard/ResourceCard'
import { useRouter } from 'next/navigation'

export default function WorkspacesPage() {
  const router = useRouter()
  const { activeProjectId } = useTenantStore()
  
  const { 
    config, data, total, loading, page, pageSize, sortBy, sortOrder, filters, onPageChange, onPageSizeChange, onSortChange, onFiltersChange,
    status, isCreateOpen, setIsCreateOpen, editingId, setEditingId, viewingId, setViewingId, 
    handleView, getGridActions, currentView, can
  } = useResourcePage({
    resource: WorkspaceResource,
    useList: resourceHooks.workspaces.useList,
    useDelete: resourceHooks.workspaces.useDelete,
    useBulkDelete: resourceHooks.workspaces.useBulkDelete,
    initialFilters: { projectId: activeProjectId }
  })

  if (status === 'loading') {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="relative">
                Workspace Management
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
              </span>
            </h1>
            <p className="text-xs mt-1.5 text-muted-foreground/70">
              Manage specific co-working environments for your models and data sources
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-px bg-border/40 mx-1 shrink-0" />
            <ViewSwitcher />
            {can('CREATE', WorkspaceResource.RESOURCE_NAME) && (
              <Button size="sm" className="h-8 gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Workspace
              </Button>
            )}
            <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                onClick={() => router.push('/dashboard/workspaces/hub')}
            >
                <Layout className="h-4 w-4" />
                Workspace Hub
            </Button>
          </div>
        </div>
      </div>

      <CreateWorkspaceDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditWorkspaceDialog 
        id={editingId || ''} 
        open={!!editingId} 
        onOpenChange={(open) => !open && setEditingId(null)} 
      />
      <ViewWorkspaceDialog 
        id={viewingId || ''} 
        open={!!viewingId} 
        onOpenChange={(open) => !open && setViewingId(null)} 
      />
      
      <div className="min-h-[400px]">
        {currentView === 'table' ? (
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
        ) : (
          <DataGrid
            config={config}
            data={data}
            total={total}
            loading={loading}
            page={page}
            pageSize={pageSize}
            filters={filters}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            onFiltersChange={onFiltersChange}
            renderCard={(item: any, { isSelected, onSelect }) => (
              <ResourceCard
                key={item.id}
                item={item}
                resourceName={WorkspaceResource.RESOURCE_NAME}
                title={item.name}
                description={item.description}
                status={item.isActive}
                date={item.createdAt}
                creator={item.creator?.name}
                isSelected={isSelected}
                onSelect={onSelect}
                onClick={() => handleView(item.id)}
                actions={getGridActions(item)}
              />
            )}
          />
        )}
      </div>
    </div>
  )
}
