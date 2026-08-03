import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Search, UserPlus, Mail, Loader2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTeamCreate, useProjectCreate, useWorkspaceCreate } from '@/hooks/useCollaborativeCreate'
import { TeamFormView, ProjectFormView, WorkspaceFormView } from './CollaborativeForms'
import { RoleResource } from '@/resources/RBACResource'

interface CreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirect?: boolean
  onSuccess?: (data: any) => void
  defaultProjectId?: string
  defaultWorkspaceId?: string
}

export function CreateTeamDialog({ open, onOpenChange, redirect, onSuccess, defaultProjectId }: CreateModalProps) {
  const { form, onSubmit, isSubmitting } = useTeamCreate((data) => {
    onOpenChange(false)
    onSuccess?.(data)
  }, { redirect, defaultProjectId })
  
  useEffect(() => {
    if (open) form.reset()
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] shadow-none border-2">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Organize your projects and members into a new collaborative team.
          </DialogDescription>
        </DialogHeader>
        <TeamFormView form={form} onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  )
}

export function CreateProjectDialog({ open, onOpenChange, redirect, onSuccess, defaultWorkspaceId }: CreateModalProps) {
  const { form, onSubmit, isSubmitting } = useProjectCreate((data) => {
    onOpenChange(false)
    onSuccess?.(data)
  }, { redirect, defaultWorkspaceId })

  useEffect(() => {
    if (open) form.reset()
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] shadow-none border-2">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Start a new project within your current team.
          </DialogDescription>
        </DialogHeader>
        <ProjectFormView form={form} onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  )
}

export function CreateWorkspaceDialog({ open, onOpenChange, redirect, onSuccess }: CreateModalProps) {
  const { form, onSubmit, isSubmitting } = useWorkspaceCreate((data) => {
    onOpenChange(false)
    onSuccess?.(data)
  }, { redirect })

  useEffect(() => {
    if (open) form.reset()
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] shadow-none border-2">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Provision a specific co-working environment.
          </DialogDescription>
        </DialogHeader>
        <WorkspaceFormView form={form} onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  )
}

export function AddMemberDialog({ open, onOpenChange, teamId, onSuccess }: CreateModalProps & { teamId?: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('none')
  const [searching, setSearching] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchRoles()
      setSearchQuery('')
      setSearchResults([])
      setSelectedRole('none')
    }
  }, [open])

  const fetchRoles = async () => {
    try {
      const res = await fetch(RoleResource.BASE_PATH)
      if (res.ok) {
        const data = await res.json()
        setRoles(data.data || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const searchUsers = async (q: string) => {
    if (q.length < 2 || !teamId) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/potential-members?search=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && !searchQuery.includes('@')) searchUsers(searchQuery)
      else setSearchResults([])
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const addMember = async (userId: string) => {
    if (!teamId) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, userId, roleId: selectedRole !== 'none' ? selectedRole : undefined })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to add member')
      }
      
      toast.success('Member added successfully')
      onSuccess?.(null)
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendInvite = async () => {
    if (!teamId || !searchQuery.includes('@')) return
    setInviting(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: searchQuery, roleId: selectedRole !== 'none' ? selectedRole : undefined })
      })

      if (!res.ok) throw new Error('Failed to send invitation')
      
      toast.success(`Invitation sent to ${searchQuery}`)
      onSuccess?.(null)
      onOpenChange(false)
    } catch (err) {
      toast.error('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-2 shadow-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Search for registered users or send an email invitation to join this team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or type email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 ring-offset-background focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">
                Assign Team Role (Optional)
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-10 bg-muted/30 border-none shadow-none focus:ring-0">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Member (No Specific Role)</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {searching && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {searchResults.map(user => (
                <div key={user.id} className="p-3 flex items-center justify-between rounded-xl border bg-muted/5 hover:bg-muted/20 transition-all group">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 ring-2 ring-background">
                      <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                        {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    onClick={() => addMember(user.id)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  </Button>
                </div>
              ))}

              {searchQuery.includes('@') && !searching && searchResults.length === 0 && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3 text-center">
                  <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">User not found</p>
                    <p className="text-[10px] text-muted-foreground italic">
                      This person isn't on the platform yet. Send them an invite?
                    </p>
                  </div>
                  <Button 
                    className="w-full font-bold h-9" 
                    onClick={sendInvite}
                    disabled={inviting}
                  >
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    Send Email Invitation
                  </Button>
                </div>
              )}

              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && !searchQuery.includes('@') && (
                <div className="p-6 text-center text-[10px] text-muted-foreground italic bg-muted/5 rounded-xl border border-dashed">
                  No matching registered users found.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
