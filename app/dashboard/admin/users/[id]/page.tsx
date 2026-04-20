'use client'

import { useParams } from 'next/navigation'
import { resourceHooks } from '@/hooks/react-query'
import { type User as UserType } from '@/resources/UserResource'
import { RoleResource } from '@/resources/RBACResource'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useUserEditHandlers } from '../(handlers)/useUserEditHandlers'
import { UserHeader } from '@/components/admin/users/UserHeader'
import { UserInfoCard } from '@/components/admin/users/UserInfoCard'
import { UserResourcesTabs } from '@/components/admin/users/UserResourcesTabs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Layout } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

export default function ViewUserPage () {
  const params = useParams()
  const userId = params.id as string
  const { userEditTab, setUserEditTab } = useUIStore()

  const { data: userData, isLoading, error } = resourceHooks.users.useSingle(userId)
  
  const { data: globalRolesData, isLoading: loadingRoles } = resourceHooks.roles.useList({
    page: 1,
    pageSize: 100,
    sortBy: 'name',
    sortOrder: 'asc'
  })

  const globalRoles = globalRolesData?.data || []

  const user = userData?.data as UserType | undefined
  const { 
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
  } = useUserEditHandlers(user)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <Alert>
        <AlertDescription>User not found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 mt-6 pb-12">
      <UserHeader 
        user={user}
        role={role}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <Tabs value={userEditTab} onValueChange={setUserEditTab} className="w-full">
        <div className="flex items-center justify-between border-b border-border/50 mb-6">
            <TabsList className="bg-muted/50 h-10 w-fit justify-start gap-1 p-1 rounded-lg border border-border/20">
                <TabsTrigger 
                    value="profile" 
                    className="h-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md px-4 text-xs font-semibold transition-all"
                >
                    <User className="h-3.5 w-3.5 mr-2" />
                    Account Profile
                </TabsTrigger>
                <TabsTrigger 
                    value="resources" 
                    className="h-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md px-4 text-xs font-semibold transition-all"
                >
                    <Layout className="h-3.5 w-3.5 mr-2" />
                    Ownership & Resources
                </TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="profile" className="mt-0 outline-none">
            <UserInfoCard 
                user={user}
                name={name}
                setName={setName}
                role={role}
                setRole={setRole}
                emailVerified={emailVerified}
                setEmailVerified={setEmailVerified}
                isActive={isActive}
                setIsActive={setIsActive}
                password={password}
                setPassword={setPassword}
                isSelf={isSelf}
                globalRoles={globalRoles}
                loadingRoles={loadingRoles}
            />
        </TabsContent>

        <TabsContent value="resources" className="mt-0 outline-none">
            <UserResourcesTabs user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

