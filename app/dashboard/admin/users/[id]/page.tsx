'use client'

import { useParams, useRouter } from 'next/navigation'
import { resourceHooks } from '@/hooks/react-query'
import { UserResource, type User as UserType } from '@/resources/UserResource'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, User, Save, Shield, Mail, Calendar, Clock, Fingerprint } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { signOut, useSession } from 'next-auth/react'

export default function ViewUserPage () {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const { data: session } = useSession()

  // React Query hooks
  const { data: userData, isLoading, error } = resourceHooks.users.useSingle(userId)
  const updateUser = resourceHooks.users.useUpdate()

  // Fetch global roles for the dropdown
  const [globalRoles, setGlobalRoles] = useState<any[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)

  useEffect(() => {
    fetch('/api/admin/roles?global=true')
      .then(res => res.json())
      .then(json => {
          // Access standardized { data: [...] } structure
          setGlobalRoles(json.data || [])
      })
      .catch(console.error)
      .finally(() => setLoadingRoles(false))
  }, [])

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
  const [role, setRole] = useState<string>(formState.role)
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
    <div className="space-y-6 mt-6">
      <div className="gradient-header-minimal pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(UserResource.LIST_PATH)}
              className="h-8 text-xs hover:bg-muted/40"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <span className="relative">
                  {user.email}
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></span>
                </span>
              </h1>
              <p className="text-sm mt-2 text-muted-foreground">
                Manage user account details and permissions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs px-2 py-1">
              <Shield className="h-3 w-3 mr-1" />
              {role}
            </Badge>
            <Button
              onClick={handleSave}
              disabled={updateUser.isPending}
              className="h-8 text-sm"
            >
              {updateUser.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>
              Edit basic user details and account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="h-10 text-sm"
                />
                <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter user name"
                  className="h-10 text-sm"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="role" className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  User Role
                </Label>
                <Select value={role} onValueChange={(value) => setRole(value)}>
                  <SelectTrigger id="role" className="h-10 text-sm" suppressHydrationWarning>
                    <SelectValue suppressHydrationWarning />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingRoles ? (
                        <div className="p-2 text-xs text-muted-foreground flex items-center gap-2">
                             <Loader2 className="h-3 w-3 animate-spin"/> Loading roles...
                        </div>
                    ) : globalRoles.length > 0 ? (
                        globalRoles.map((r: any) => (
                            <SelectItem key={r.id} value={r.name}>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    {r.name}
                                </div>
                            </SelectItem>
                        ))
                    ) : (
                        // Fallback to basic roles if none in DB
                        <>
                            <SelectItem value="USER">Standard User</SelectItem>
                            <SelectItem value="ADMIN">Administrator</SelectItem>
                        </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {role === 'ADMIN' 
                    ? 'Full access to all features and settings'
                    : 'Limited access to basic features'
                  }
                </p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="emailVerified" className="text-sm font-medium">Email Verification</Label>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="emailVerified"
                    checked={emailVerified}
                    onCheckedChange={setEmailVerified}
                  />
                  <Label htmlFor="emailVerified" className="text-sm">
                    {emailVerified ? 'Email verified' : 'Email not verified'}
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {emailVerified 
                    ? 'User has verified their email address'
                    : 'User needs to verify their email address'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Metadata</CardTitle>
            <CardDescription>
              System information and account timestamps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <div className="p-2 bg-primary/10 rounded">
                  <Fingerprint className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">User ID</div>
                  <div className="font-mono text-sm font-semibold truncate">{user.id}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <div className="p-2 bg-blue-500/10 rounded">
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Created</div>
                  <div className="text-sm font-semibold">{new Date(user.createdAt).toLocaleDateString()}</div>
                  <div className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <div className="p-2 bg-green-500/10 rounded">
                  <Clock className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Last Updated</div>
                  <div className="text-sm font-semibold">{new Date(user.updatedAt).toLocaleDateString()}</div>
                  <div className="text-xs text-muted-foreground">{new Date(user.updatedAt).toLocaleTimeString()}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <div className="p-2 bg-orange-500/10 rounded">
                  <Mail className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Email Status</div>
                  <Badge variant={emailVerified ? 'default' : 'outline'} className="text-xs">
                    {emailVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

