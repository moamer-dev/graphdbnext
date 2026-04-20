'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { resourceHooks } from '@/hooks/react-query'
import { User as UserType } from '@/resources/UserResource'

import { useSession } from 'next-auth/react'

export function useUserEditHandlers(user: UserType | undefined) {
    const { data: session } = useSession()
    const updateUser = resourceHooks.users.useUpdate()

    const formState = useMemo(() => {
        const authRole = (session?.user as any)?.role || 'USER'
        
        if (!user) {
            return {
                name: '',
                role: authRole,
                emailVerified: false
            }
        }
        return {
            name: user.name || '',
            role: user.globalRoles?.[0]?.role?.name || authRole,
            emailVerified: !!user.emailVerified
        }
    }, [user, session])

    const [name, setName] = useState(formState.name)
    const [role, setRole] = useState<string>(formState.role)
    const [emailVerified, setEmailVerified] = useState(formState.emailVerified)
    const [isActive, setIsActive] = useState(user?.isActive ?? true)
    const [password, setPassword] = useState('')

    useEffect(() => {
        setName(formState.name)
        setRole(formState.role)
        setEmailVerified(formState.emailVerified)
        setIsActive(user?.isActive ?? true)
    }, [formState, user?.isActive])

    const handleSave = async () => {
        if (!user) return

        try {
            await updateUser.mutateAsync({
                id: user.id,
                data: {
                    name: name || null,
                    role,
                    emailVerified: emailVerified ? new Date().toISOString() : null,
                    isActive,
                    ...(password && { password })
                }
            })
            toast.success('User updated successfully')
            setPassword('') // Clear password field after success
        } catch (error) {
            console.error('Error updating user:', error)
            toast.error('Failed to update user')
        }
    }

    const isSaving = updateUser.isPending
    const isSelf = session?.user?.id === user?.id

    return {
        name,
        setName,
        role,
        setRole,
        emailVerified,
        setEmailVerified,
        isActive,
        setIsActive,
        password,
        setPassword,
        isSelf,
        handleSave,
        isSaving
    }
}
