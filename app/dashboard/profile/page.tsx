'use client'

import { useSession } from 'next-auth/react'
import { resourceHooks } from '@/hooks/react-query'
import { type User as UserType } from '@/resources/UserResource'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User as UserIcon, Layout } from 'lucide-react'
import { useUserEditHandlers } from '../admin/users/(handlers)/useUserEditHandlers'
import { UserHeader } from '@/components/admin/users/UserHeader'
import { UserInfoCard } from '@/components/admin/users/UserInfoCard'
import { UserResourcesTabs } from '@/components/admin/users/UserResourcesTabs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUIStore } from '@/stores/uiStore'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const userId = session?.user?.id
  const { userEditTab, setUserEditTab } = useUIStore()

  const { data: userData, isLoading, error } = resourceHooks.users.useSingle(userId || '')
  
  const { data: globalRolesData, isLoading: loadingRoles } = resourceHooks.roles.useList({
    page: 1,
    pageSize: 100,
    sortBy: 'name',
    sortOrder: 'asc'
  }, { enabled: !!userId })

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

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session || error || !user) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertDescription>
          {!session ? 'You must be logged in to view this page' : 'Profile not found'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 mt-6 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Personal Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your account settings and view your resources</p>
      </div>

      <UserHeader 
        user={user}
        role={role}
        onSave={handleSave}
        isSaving={isSaving}
        isProfileView={true}
      />

      <Tabs value={userEditTab} onValueChange={setUserEditTab} className="w-full">
        <div className="flex items-center justify-between border-b border-border/50 mb-6">
            <TabsList className="bg-muted/50 h-10 w-fit justify-start gap-1 p-1 rounded-lg border border-border/20">
                <TabsTrigger 
                    value="profile" 
                    className="h-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md px-4 text-xs font-semibold transition-all"
                >
                    <UserIcon className="h-3.5 w-3.5 mr-2" />
                    Account Profile
                </TabsTrigger>
                <TabsTrigger 
                    value="resources" 
                    className="h-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md px-4 text-xs font-semibold transition-all"
                >
                    <Layout className="h-3.5 w-3.5 mr-2" />
                    My Resources
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
                isSelf={true}
                globalRoles={globalRoles}
                loadingRoles={loadingRoles}
                isProfileView={true}
            />
        </TabsContent>

        <TabsContent value="resources" className="mt-0 outline-none">
            <UserResourcesTabs user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
