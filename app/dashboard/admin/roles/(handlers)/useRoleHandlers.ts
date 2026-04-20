'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { UseFormReturn } from 'react-hook-form'
import { queryClient, queryKeys, resourceHooks } from '@/hooks/react-query'
import { RoleFormValues, Role } from '@/resources/RBACResource'

interface UseRoleHandlersProps {
    selectedRole: Role | null
    createForm: UseFormReturn<RoleFormValues>
    editForm: UseFormReturn<RoleFormValues>
    setIsCreateOpen: (open: boolean) => void
    setIsEditOpen: (open: boolean) => void
    permissionsBuffer: any[]
    setPermissionsBuffer: React.Dispatch<React.SetStateAction<any[]>>
}

export function useRoleHandlers({
    selectedRole,
    createForm,
    editForm,
    setIsCreateOpen,
    setIsEditOpen,
    permissionsBuffer,
    setPermissionsBuffer
}: UseRoleHandlersProps) {
    const [isSavingPermissions, setIsSavingPermissions] = useState(false)
    
    const createRoleMutation = resourceHooks.roles.useCreate()
    const updateRoleMutation = resourceHooks.roles.useUpdate()

    const handleCreateRole = async (values: RoleFormValues) => {
        try {
            await createRoleMutation.mutateAsync(values as any)
            setIsCreateOpen(false)
            createForm.reset()
            queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
            toast.success('Role created successfully')
        } catch (e) {
            console.error(e)
            toast.error('Failed to create role')
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
            toast.success('Role renamed successfully')
        } catch (e) {
            console.error(e)
            toast.error('Failed to rename role')
        }
    }

    const handlePermissionChange = useCallback((resource: string, action: string, scope: string | null) => {
        setPermissionsBuffer(prev => {
            const otherPermissions = prev.filter(p => !(p.resource === resource && p.action === action))
            
            if (scope === null || scope === 'NONE') {
                const currentItem = prev.find(p => p.resource === resource && p.action === action)
                if (currentItem) {
                    return [...otherPermissions, { ...currentItem, isActive: false }]
                }
                return otherPermissions
            }

            const existing = prev.find(p => p.resource === resource && p.action === action)
            const newItem = {
                ...(existing || {}),
                resource,
                action,
                scope,
                isActive: true
            }

            return [...otherPermissions, newItem]
        })
    }, [setPermissionsBuffer])

    const handleSavePermissions = async () => {
        if (!selectedRole) return
        
        setIsSavingPermissions(true)
        try {
            const permissionsToSave = permissionsBuffer.map(p => ({
                resource: p.resource,
                action: p.action,
                scope: p.scope || 'SELF',
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
            setIsSavingPermissions(false)
        }
    }

    return {
        handleCreateRole,
        handleUpdateRoleName,
        handlePermissionChange,
        handleSavePermissions,
        isCreating: createRoleMutation.isPending,
        isUpdating: updateRoleMutation.isPending,
        isSavingPermissions
    }
}
