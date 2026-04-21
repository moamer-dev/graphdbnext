'use client'

import React from 'react'
import { DataTable } from '@/components/data-table/DataTable'
import { useResourceTable } from '@/hooks/view/useResourceTable'
import { resourceHooks } from '@/hooks/react-query'
import { CredentialResource } from '@/resources/CredentialResource'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { Loader2, Key, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { useRBAC } from '@/hooks/useRBAC'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CredentialsManager } from '@/packages/plexus-builder/src/components/shared/CredentialsManager'
import { useTenantStore } from '@/stores/tenantStore'
import { useUIStore } from '@/stores/uiStore'

export default function CredentialsPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  
  const { data: session, status } = useSession()
  const { can } = useRBAC()
  const { activeWorkspaceId } = useTenantStore()
  const { resourceScope } = useUIStore()
  
  const isAdmin = session?.user?.role === 'ADMIN'
  
  // Fetch workspaces for assignment
  const { data: workspacesData } = resourceHooks.workspaces.useList({ pageSize: 1000 })
  const workspaces = (workspacesData?.data || []).map((ws: any) => ({ id: ws.id, name: ws.name }))

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
    onFiltersChange,
    refetch
  } = useResourceTable({
    resource: CredentialResource,
    useList: resourceHooks.credentials.useList,
    useDelete: resourceHooks.credentials.useDelete,
    useBulkDelete: resourceHooks.credentials.useBulkDelete,
    isAdmin,
    userId: session?.user?.id,
    scope: resourceScope,
    onView: (id: string) => {}, 
    onEdit: (id: string) => setEditingId(id)
  })

  // Persistence implementation 
  const createMutation = resourceHooks.credentials.useCreate()
  const updateMutation = resourceHooks.credentials.useUpdate()
  const deleteMutation = resourceHooks.credentials.useDelete()

  const persistence = {
    onLoad: async () => [], // Not needed for the create form
    onSave: async (cred: any) => {
      await createMutation.mutateAsync(cred)
      refetch()
    },
    onUpdate: async (id: string, cred: any) => {
      await updateMutation.mutateAsync({ id, data: cred })
      refetch()
    },
    onDelete: async (id: string) => {
      await deleteMutation.mutateAsync(id)
      refetch()
    },
    activeWorkspaceId
  }

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
              <Key className="h-4 w-4" />
              <span className="relative">
                API Credentials
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
              </span>
            </h1>
            <p className="text-xs mt-1.5 text-muted-foreground/70">
              Manage secure authentication keys for research and external API integrations
            </p>
          </div>
          <div className="flex items-center gap-3">
            {can('CREATE', CredentialResource.RESOURCE_NAME) && (
              <Button size="sm" className="h-8 gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Credential
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Credential</DialogTitle>
            <DialogDescription>
              Add a new API credential to the database.
            </DialogDescription>
          </DialogHeader>
          <CredentialsManager 
            persistence={persistence} 
            mode="create" 
            forceStorageSource="db"
            workspaces={workspaces}
            onSuccess={() => {
                setIsCreateOpen(false)
                refetch()
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal - we reuse the manager for editing for now, but with create mode logic */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Credential</DialogTitle>
            <DialogDescription>
              Update the settings for this credential.
            </DialogDescription>
          </DialogHeader>
          {editingId && (
            <CredentialsManager 
                persistence={persistence}
                mode="edit" 
                initialEditingId={editingId}
                forceStorageSource="db"
                workspaces={workspaces}
                onSuccess={() => {
                    setEditingId(null)
                    refetch()
                }}
                onCancel={() => setEditingId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <div className="min-h-[400px]">
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
