'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/data-table/DataTable'
import { useResourceTable } from '@/hooks/view/useResourceTable'
import { resourceHooks, queryClient, queryKeys } from '@/hooks/react-query'
import { RoleResource, Role, Permission } from '@/resources/RBACResource'
import { Shield, ShieldCheck, ShieldAlert, Lock, UserCog, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RoleFormValues, RoleSchema } from '@/resources/RBACResource'

const RESOURCES = ['MODEL', 'WORKSPACE', 'CREDENTIAL', 'PROJECT', 'TEAM'] as const
const ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'] as const

export default function RolesAdminPage() {
  const isAdmin = true
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [permissionsBuffer, setPermissionsBuffer] = useState<any[]>([])
  const [isPending, setIsPending] = useState(false)
  
  const { 
    data, 
    loading,
  } = useResourceTable({
    resource: RoleResource as any,
    useList: resourceHooks.roles.useList,
    useDelete: resourceHooks.roles.useDelete,
    isAdmin
  })

  // Find the selected role from the current data to keep it in sync
  const selectedRole = data.find(r => r.id === selectedRoleId) || null

  const updateRoleMutation = resourceHooks.roles.useUpdate()
  const createRoleMutation = resourceHooks.roles.useCreate()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const createForm = useForm<RoleFormValues>({
      resolver: zodResolver(RoleSchema),
      defaultValues: { name: '', teamId: null }
  })

  const editForm = useForm<RoleFormValues>({
      resolver: zodResolver(RoleSchema),
      defaultValues: { name: '', teamId: null }
  })

  // Set edit form values and sync permissions buffer when selectedRole changes
  useEffect(() => {
    if (selectedRole) {
        editForm.setValue('name', selectedRole.name || '')
        // Initialize buffer with current permissions
        setPermissionsBuffer(selectedRole.permissions || [])
    } else {
        editForm.reset()
        setPermissionsBuffer([])
    }
  }, [selectedRole?.id, editForm])

  const handleCreateRole = async (values: RoleFormValues) => {
      try {
          await createRoleMutation.mutateAsync(values as any)
          setIsCreateOpen(false)
          createForm.reset()
          queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
      } catch (e) {
          console.error(e)
      }
  }

  const handleUpdateRoleName = async (values: RoleFormValues) => {
      if (!selectedRole) return
      try {
          await updateRoleMutation.mutateAsync({
              id: selectedRole.id,
              data: { name: values.name } as any
          })
          setIsEditOpen(false)
          queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
      } catch (e) {
          console.error(e)
      }
  }

  const handlePermissionToggle = (resource: string, action: string) => {
    setPermissionsBuffer(prev => {
        const existingIndex = prev.findIndex(p => p.resource === resource && p.action === action)
        
        if (existingIndex >= 0) {
            // Toggle the isActive state
            const next = [...prev]
            next[existingIndex] = {
                ...next[existingIndex],
                isActive: !next[existingIndex].isActive
            }
            return next
        } else {
            // Add new active permission
            return [...prev, { resource, action, isActive: true }]
        }
    })
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return
    
    setIsPending(true)
    try {
        // Send only the necessary fields
        const permissionsToSave = permissionsBuffer.map(p => ({
            resource: p.resource,
            action: p.action,
            isActive: p.isActive
        }))

        await updateRoleMutation.mutateAsync({
            id: selectedRole.id,
            data: { permissions: permissionsToSave } as any
        })
        
        toast.success('Permissions saved successfully')
        queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
    } catch (e) {
        console.error(e)
        toast.error('Failed to save permissions')
    } finally {
        setIsPending(false)
    }
  }

  // Check if buffer differs from current role permissions
  const hasChanges = selectedRole && JSON.stringify(
    permissionsBuffer.filter(p => p.isActive).map(p => ({ r: p.resource, a: p.action })).sort((a,b) => (a.r+a.a).localeCompare(b.r+b.a))
  ) !== JSON.stringify(
    (selectedRole.permissions || []).filter(p => p.isActive).map(p => ({ r: p.resource, a: p.action })).sort((a,b) => (a.r+a.a).localeCompare(b.r+b.a))
  )
  return (
    <div className="space-y-4 mt-4">
      {/* Create Role Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>Define a new security profile for your platform.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Role Name</Label>
                    <Input {...createForm.register('name')} placeholder="e.g. Moderator" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={createForm.handleSubmit(handleCreateRole)} disabled={createRoleMutation.isPending}>
                    {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Role Name</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-name">Role Name</Label>
                    <Input {...editForm.register('name')} placeholder="e.g. Admin" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={editForm.handleSubmit(handleUpdateRoleName)} disabled={updateRoleMutation.isPending}>
                    {updateRoleMutation.isPending ? 'Saving...' : 'Save Name'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
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
              Define team roles and manage granular resource access control
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setIsCreateOpen(true)}>
             <Lock className="h-3.5 w-3.5" />
             Create New Role
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Roles Sidebar */}
         <div className="md:col-span-1 space-y-2">
            {loading ? (
                <div className="text-xs text-muted-foreground p-4">Loading roles...</div>
            ) : data.map(role => (
                <div 
                    key={role.id} 
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        selectedRole?.id === role.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border/50 hover:border-border'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <UserCog className={`h-4 w-4 ${selectedRole?.id === role.id ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">{role.name}</span>
                    </div>
                </div>
            ))}
         </div>

         {/* Permissions Matrix */}
         <div className="md:col-span-3">
            {selectedRole ? (
                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-md flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    {selectedRole.name} Permissions
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Customize what this role can do across the collaborative environment
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasChanges && (
                                    <Button 
                                        variant="default" 
                                        size="sm"
                                        className="h-8 shadow-sm"
                                        onClick={handleSavePermissions}
                                        disabled={isPending || updateRoleMutation.isPending}
                                    >
                                        {isPending ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                )}
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-8"
                                    onClick={() => setIsEditOpen(true)}
                                >
                                    Edit Role Name
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border border-border/50 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="p-3 text-left font-semibold text-xs uppercase tracking-wider">Resource</th>
                                        {ACTIONS.map(action => (
                                            <th key={action} className="p-3 text-center font-semibold text-xs uppercase tracking-wider">{action}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {RESOURCES.map(resource => (
                                        <tr key={resource} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-3 font-medium text-xs text-muted-foreground">{resource}</td>
                                            {ACTIONS.map(action => {
                                                const hasPermission = permissionsBuffer.some(p => 
                                                    p.resource === resource && p.action === action && p.isActive
                                                )
                                                return (
                                                    <td key={action} className="p-3 text-center">
                                                        <Checkbox 
                                                            checked={!!hasPermission} 
                                                            onCheckedChange={() => handlePermissionToggle(resource, action)}
                                                            className="data-[state=checked]:bg-primary transition-all scale-110"
                                                        />
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-muted/10 text-muted-foreground">
                    <ShieldAlert className="h-10 w-10 mb-4 opacity-20" />
                    <p className="text-sm">Select a role from the sidebar to manage permissions</p>
                </div>
            )}
         </div>
      </div>
    </div>
  )
}
