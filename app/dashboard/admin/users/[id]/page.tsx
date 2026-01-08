'use client'

import { useParams, useRouter } from 'next/navigation'
import { resourceHooks } from '@/lib/react-query/hooks'
import { UserResource, type User as UserType } from '@/lib/resources/UserResource'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, User, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'

export default function ViewUserPage () {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  // React Query hooks
  const { data: userData, isLoading, error } = resourceHooks.users.useSingle(userId)
  const updateUser = resourceHooks.users.useUpdate()

  // useResource extracts data from API response { user: User } -> { data: User }
  const user = userData?.data as UserType | undefined

  // Derive form state from user data - use this directly for form inputs
  const formState = useMemo(() => {
    if (!user) {
      return {
        name: '',
        role: 'USER' as const,
        emailVerified: false
      }
    }
    return {
      name: user.name || '',
      role: user.role,
      emailVerified: !!user.emailVerified
    }
  }, [user])

  // Local state for form inputs (allows editing)
  const [name, setName] = useState(formState.name)
  const [role, setRole] = useState<'USER' | 'ADMIN'>(formState.role)
  const [emailVerified, setEmailVerified] = useState(formState.emailVerified)

  // Update local state when formState changes (user data loads)
  useEffect(() => {
    setName(formState.name)
    setRole(formState.role)
    setEmailVerified(formState.emailVerified)
  }, [formState])

  const handleSave = async () => {
    if (!user) return

    try {
      await updateUser.mutateAsync({
        id: userId,
        data: {
          name: name || null,
          role,
          emailVerified: emailVerified ? new Date().toISOString() : null
        }
      })
      toast.success('User updated successfully')
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

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
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(UserResource.LIST_PATH)}
              className="h-7 text-xs hover:bg-muted/40"
            >
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Back to Users
            </Button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="relative">
                  {user.email}
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
                </span>
              </h1>
              <p className="text-xs mt-1.5 text-muted-foreground/70">
                User account details and settings
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateUser.isPending}
            className="h-7 text-xs border-border/40 bg-muted/30 hover:bg-muted/50 backdrop-blur-sm"
          >
            {updateUser.isPending ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 mr-1.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="h-8 text-xs bg-muted/30 border-border/40 backdrop-blur-sm"
            />
            <p className="text-xs text-muted-foreground/70">Email cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="User name"
              className="h-8 text-xs bg-muted/30 border-border/40 backdrop-blur-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="text-xs font-medium">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as 'USER' | 'ADMIN')}>
              <SelectTrigger id="role" className="h-8 text-xs bg-muted/30 border-border/40 backdrop-blur-sm" suppressHydrationWarning>
                <SelectValue suppressHydrationWarning />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailVerified" className="text-xs font-medium">Email Verified</Label>
            <Select 
              value={emailVerified ? 'true' : 'false'} 
              onValueChange={(value) => setEmailVerified(value === 'true')}
            >
              <SelectTrigger id="emailVerified" className="h-8 text-xs bg-muted/30 border-border/40 backdrop-blur-sm" suppressHydrationWarning>
                <SelectValue suppressHydrationWarning />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Not Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border/30">
          <div className="p-3 bg-muted/20 rounded-md border border-border/20 backdrop-blur-sm">
            <div className="text-xs text-muted-foreground/70 mb-1">User ID</div>
            <div className="font-mono text-xs font-semibold truncate">{user.id}</div>
          </div>
          <div className="p-3 bg-muted/20 rounded-md border border-border/20 backdrop-blur-sm">
            <div className="text-xs text-muted-foreground/70 mb-1">Created</div>
            <div className="text-xs font-semibold">{new Date(user.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="p-3 bg-muted/20 rounded-md border border-border/20 backdrop-blur-sm">
            <div className="text-xs text-muted-foreground/70 mb-1">Last Updated</div>
            <div className="text-xs font-semibold">{new Date(user.updatedAt).toLocaleDateString()}</div>
          </div>
          <div className="p-3 bg-muted/20 rounded-md border border-border/20 backdrop-blur-sm">
            <div className="text-xs text-muted-foreground/70 mb-1">Status</div>
            <Badge variant={emailVerified ? 'default' : 'outline'} className="text-[10px] px-1.5 py-0.5">
              {emailVerified ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

