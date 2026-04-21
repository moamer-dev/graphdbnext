'use client'

import { useState, useEffect } from 'react'
import { useResourceTable } from '@/hooks/view/useResourceTable'
import { resourceHooks } from '@/hooks/react-query'
import { RoleResource, Role } from '@/resources/RBACResource'
import { Shield, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RoleFormValues, RoleSchema } from '@/resources/RBACResource'
import { RoleSelector } from '@/components/rbac/RoleSelector'
import { PermissionTable } from '@/components/rbac/PermissionTable'
import { RoleDialogs } from '@/components/rbac/RoleDialogs'
import { useRoleHandlers } from './(handlers)/useRoleHandlers'

const RESOURCES = ['MODEL', 'WORKSPACE', 'CREDENTIAL', 'PROJECT', 'TEAM', 'SAVED_QUERY', 'WORKFLOW', 'DATA_SOURCE', 'DATA_SOURCE_PAGE', 'DATABASE', 'QUERY', 'ANALYTICS'] as const
const ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'ACCESS'] as const
const SCOPES = ['SELF', 'TEAM', 'ALL'] as const

export default function RolesAdminPage() {
  const [selectedResource, setSelectedResource] = useState<string | null>(null)
  const isAdmin = true
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [permissionsBuffer, setPermissionsBuffer] = useState<any[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  
  const { 
    data: roles = [], 
    loading: loadingRoles,
  } = useResourceTable<Role>({
    resource: RoleResource as any,
    useList: (resourceHooks as any).roles.useList,
    useDelete: (resourceHooks as any).roles.useDelete,
    useBulkDelete: (resourceHooks as any).roles.useBulkDelete,
    isAdmin
  })

  const selectedRole = roles.find(r => r.id === selectedRoleId) || null

  const createForm = useForm<RoleFormValues>({
      resolver: zodResolver(RoleSchema),
      defaultValues: { name: '', teamId: null }
  })

  const editForm = useForm<RoleFormValues>({
      resolver: zodResolver(RoleSchema),
      defaultValues: { name: '', teamId: null }
  })

  const [lastInitializedId, setLastInitializedId] = useState<string | null>(null)

  const { handleCreateRole, handleUpdateRoleName, handlePermissionChange, handleSavePermissions, isCreating, isUpdating, isSavingPermissions } = useRoleHandlers({
    selectedRole,
    createForm,
    editForm,
    setIsCreateOpen,
    setIsEditOpen,
    permissionsBuffer,
    setPermissionsBuffer
  })

  useEffect(() => {
    if (selectedRole && selectedRole.id !== lastInitializedId) {
        editForm.setValue('name', selectedRole.name || '')
        setPermissionsBuffer(selectedRole.permissions || [])
        setLastInitializedId(selectedRole.id)
    } else if (!selectedRole && lastInitializedId !== null) {
        editForm.reset()
        setPermissionsBuffer([])
        setLastInitializedId(null)
    }
  }, [selectedRole, editForm, lastInitializedId])

  const hasChanges = selectedRole && JSON.stringify(
    permissionsBuffer.filter(p => p.isActive).map(p => ({ r: p.resource, a: p.action, s: p.scope })).sort((a,b) => (a.r+a.a).localeCompare(b.r+b.a))
  ) !== JSON.stringify(
    (selectedRole.permissions || []).filter(p => p.isActive).map(p => ({ r: p.resource, a: p.action, s: p.scope })).sort((a,b) => (a.r+a.a).localeCompare(b.r+b.a))
  )

  return (
    <div className="space-y-4 mt-4">
      <RoleDialogs 
        isCreateOpen={isCreateOpen}
        setIsCreateOpen={setIsCreateOpen}
        isEditOpen={isEditOpen}
        setIsEditOpen={setIsEditOpen}
        createForm={createForm}
        editForm={editForm}
        onCreate={handleCreateRole}
        onEdit={handleUpdateRoleName}
        createLoading={isCreating}
        editLoading={isUpdating}
      />

      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="relative">
                Roles & Permissions
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
              </span>
            </h1>
            <p className="text-xs mt-1.5 text-muted-foreground/70">
              Manage security roles and granular resource access control
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10" onClick={() => setIsCreateOpen(true)}>
             <Lock className="h-3.5 w-3.5" />
             Create New Role
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        <RoleSelector 
            roles={roles}
            selectedRoleId={selectedRoleId}
            selectedResource={selectedResource}
            loadingRoles={loadingRoles}
            onRoleSelect={(val) => {
                setSelectedRoleId(val)
                setSelectedResource(null)
            }}
            onResourceSelect={setSelectedResource}
            onEditRoleName={() => setIsEditOpen(true)}
            resources={RESOURCES}
        />

        <PermissionTable 
            selectedRole={selectedRole}
            selectedResource={selectedResource}
            permissionsBuffer={permissionsBuffer}
            onPermissionChange={handlePermissionChange}
            onSave={handleSavePermissions}
            isPending={isSavingPermissions}
            hasChanges={!!hasChanges}
            actions={ACTIONS}
            scopes={SCOPES}
        />
      </div>
    </div>
  )
}
