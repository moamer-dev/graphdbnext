'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Building2, 
  Search, 
  UserPlus, 
  Trash2, 
  Shield, 
  ArrowLeft,
  Loader2,
  Mail,
  MoreVertical,
  ChevronDown,
  Link as LinkIcon,
  Copy,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import Link from 'next/link'
import { TeamResource } from '@/resources/TeamResource'
import { TeamMemberResource } from '@/resources/TeamMemberResource'
import { RoleResource } from '@/resources/RBACResource'
import { UserResource } from '@/resources/UserResource'

interface User {
  id: string
  name: string
  email: string
}

interface Role {
  id: string
  name: string
}

interface TeamMember {
  id: string
  userId: string
  roleId: string | null
  user: User
  role: Role | null
  createdAt: string
}

export default function TeamMembersPage() {
  const [invitations, setInvitations] = useState<any[]>([])
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    fetchTeamAndMembers()
    fetchRoles()
    fetchInvitations()
  }, [teamId])

  const fetchTeamAndMembers = async () => {
    try {
      setLoading(true)
      const teamRes = await fetch(`${TeamResource.BASE_PATH}/${teamId}`)
      if (!teamRes.ok) throw new Error('Failed to fetch team')
      const teamData = await teamRes.json()
      setTeam(teamData.data)

      const membersRes = await fetch(`${TeamMemberResource.BASE_PATH}?teamId=${teamId}`)
      if (!membersRes.ok) throw new Error('Failed to fetch members')
      const membersData = await membersRes.json()
      setMembers(membersData.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load team data')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitations = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/invitations`)
      if (res.ok) {
        const data = await res.json()
        setInvitations(data.data || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await fetch(RoleResource.BASE_PATH)
      if (!res.ok) throw new Error('Failed to fetch roles')
      const data = await res.json()
      setRoles(data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const searchUsers = async (q: string) => {
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/potential-members?search=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setSearchResults(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchUsers(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const addMember = async (userId: string) => {
    try {
      const res = await fetch(TeamMemberResource.BASE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, userId, roleId: selectedRole !== 'none' ? selectedRole : undefined })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to add member')
      }
      
      toast.success('Member added successfully')
      setSearchQuery('')
      setSearchResults([])
      fetchTeamAndMembers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const sendInvite = async (email?: string) => {
    const targetEmail = email || searchQuery
    if (!targetEmail || !targetEmail.includes('@')) {
      toast.error('Please enter a valid email address to invite')
      return
    }

    setInviting(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, roleId: selectedRole !== 'none' ? selectedRole : undefined })
      })

      if (!res.ok) throw new Error('Failed to send invitation')
      
      toast.success(`Invitation sent to ${targetEmail}`)
      setSearchQuery('')
      fetchInvitations()
    } catch (err) {
      toast.error('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)

  const copyInviteLink = (token: string, inviteId: string) => {
    const link = `${window.location.origin}/join/${token}`
    navigator.clipboard.writeText(link)
    setCopiedInviteId(inviteId)
    toast.success('Invitation link copied to clipboard')
    setTimeout(() => setCopiedInviteId(null), 2000)
  }

  const toggleInvitation = async (inviteId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/invitations/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      if (!res.ok) throw new Error('Failed to update invitation')
      fetchInvitations()
      toast.success(isActive ? 'Invitation enabled' : 'Invitation disabled')
    } catch (err) {
      toast.error('Operation failed')
    }
  }

  const deleteInvitation = async (inviteId: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return
    try {
      const res = await fetch(`/api/invitations/${inviteId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete invitation')
      fetchInvitations()
      toast.success('Invitation deleted')
    } catch (err) {
      toast.error('Operation failed')
    }
  }

  const updateMemberRole = async (memberId: string, roleId: string) => {
    try {
      const res = await fetch(`${TeamMemberResource.BASE_PATH}/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId })
      })
      
      if (!res.ok) throw new Error('Failed to update role')
      
      toast.success('Role updated')
      fetchTeamAndMembers()
    } catch (err) {
      toast.error('Failed to update role')
    }
  }

  const removeMember = async (memberId: string) => {
    try {
      const res = await fetch(`${TeamMemberResource.BASE_PATH}/${memberId}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error('Failed to remove member')
      
      toast.success('Member removed')
      fetchTeamAndMembers()
    } catch (err) {
      toast.error('Failed to remove member')
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Teams
        </Button>
      </div>

      <div className="gradient-header-minimal pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span>{team?.name} — Team Members</span>
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              Manage participants and assign roles for discovery collaboration
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Left column: Add/Invite Member */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4 border-primary/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary/80">
              <UserPlus className="h-4 w-4" />
              Add or Invite Member
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name or type email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-muted/30 focus-visible:ring-primary/30"
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
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {searchResults.length > 0 ? (
                <div className="rounded-lg border bg-muted/20 overflow-hidden divide-y divide-border/50">
                  {searchResults.map(user => (
                    <div key={user.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 hover:text-primary hover:bg-primary/10"
                        onClick={() => addMember(user.id)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : searchQuery.includes('@') && !searching ? (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
                    <p className="text-[10px] text-primary/70 font-medium">User not found on platform</p>
                    <Button 
                        className="w-full h-8 text-xs font-bold" 
                        onClick={() => sendInvite()}
                        disabled={inviting}
                    >
                        {inviting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Mail className="h-3 w-3 mr-2" />}
                        Send Email Invite
                    </Button>
                </div>
              ) : searchQuery.length >= 2 && !searching && (
                  <div className="p-4 text-center text-[10px] text-muted-foreground italic bg-muted/10 rounded-lg">
                      No matching registered users found. Try an email address to invite.
                  </div>
              )}
            </div>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4 border-border/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Mail className="h-4 w-4" />
                Pending Invitations ({invitations.length})
              </div>
              <div className="space-y-3">
                {invitations.map(invite => (
                  <div key={invite.id} className={`p-3 rounded-lg border transition-all ${invite.isActive ? 'bg-background border-border/50' : 'bg-muted/20 border-transparent grayscale opacity-60'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold truncate max-w-[120px]">{invite.email}</p>
                      <Badge 
                        variant={invite.status === 'ACCEPTED' ? 'default' : invite.status === 'DECLINED' ? 'destructive' : 'secondary'} 
                        className="text-[8px] h-3.5 px-1 font-bold"
                      >
                        {invite.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded border border-border/20">
                          <LinkIcon className="h-2.5 w-2.5" />
                          <span className="font-mono">join/{invite.token.substring(0, 6)}...</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 hover:bg-primary/10 hover:text-primary" 
                            onClick={() => copyInviteLink(invite.token, invite.id)}
                            title="Copy Join Link"
                        >
                            {copiedInviteId === invite.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => toggleInvitation(invite.id, !invite.isActive)}
                            title={invite.isActive ? 'Disable' : 'Enable'}
                        >
                            <Shield className={`h-3 w-3 ${invite.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => deleteInvitation(invite.id)}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Member List */}
        <div className="md:col-span-3">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden border-border/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-4 pl-6 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Member</TableHead>
                  <TableHead className="py-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Joined</TableHead>
                  <TableHead className="py-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Role</TableHead>
                  <TableHead className="py-4 pr-6 text-right text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={4} className="h-48 text-center text-muted-foreground italic">
                        No members added to this team yet.
                     </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/10 transition-colors group">
                      <TableCell className="py-4 pl-6 flex items-center gap-3">
                        <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm">
                          <AvatarFallback className="bg-primary/5 text-primary font-medium text-xs">
                            {member.user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{member.user.name}</span>
                          <span className="text-[11px] text-muted-foreground">{member.user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-xs text-muted-foreground font-mono">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-4">
                        <Select 
                          value={member.roleId || 'none'} 
                          onValueChange={(val) => updateMemberRole(member.id, val === 'none' ? '' : val)}
                        >
                          <SelectTrigger className="h-8 w-[140px] text-xs bg-muted/20 border-none hover:bg-muted/40 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Member</SelectItem>
                            {roles.map(role => (
                              <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-4 pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Member Access</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer"
                              onClick={() => removeMember(member.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
