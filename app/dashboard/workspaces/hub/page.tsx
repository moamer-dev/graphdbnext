'use client'

import React, { useState, useEffect } from 'react'
import { resourceHooks } from '@/hooks/react-query'
import { 
  Briefcase, 
  Layout, 
  Users, 
  User
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { HubPanel } from '@/components/dashboard/workspace-hub/HubPanel'
import { HubItem } from '@/components/dashboard/workspace-hub/HubItem'
import { MemberItem } from '@/components/dashboard/workspace-hub/MemberItem'
import { 
  CreateWorkspaceDialog, 
  CreateProjectDialog, 
  CreateTeamDialog,
  AddMemberDialog
} from '@/components/dashboard/CreateModals'
import { useQueryClient } from '@tanstack/react-query'

export default function WorkspaceHubPage() {
  const queryClient = useQueryClient()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const [workspaceSearch, setWorkspaceSearch] = useState('')
  const [projectSearch, setProjectSearch] = useState('')
  const [teamSearch, setTeamSearch] = useState('')
  const [memberSearch, setMemberSearch] = useState('')

  // Creation State
  const [isWorkspaceCreateOpen, setIsWorkspaceCreateOpen] = useState(false)
  const [isProjectCreateOpen, setIsProjectCreateOpen] = useState(false)
  const [isTeamCreateOpen, setIsTeamCreateOpen] = useState(false)
  const [isMemberAddOpen, setIsMemberAddOpen] = useState(false)

  // Fetch Workspaces (Always Global for Hub)
  const { data: workspacesData, isLoading: loadingWorkspaces } = resourceHooks.workspaces.useList({
    page: 1,
    pageSize: 100,
    query: workspaceSearch,
    filters: { isGlobal: 'true' }
  } as any)
  const workspaces = workspacesData?.data || []

  // Fetch Projects for Selected Workspace
  const { data: projectsData, isLoading: loadingProjects } = resourceHooks.projects.useList({
    page: 1,
    pageSize: 100,
    query: projectSearch,
    filters: { 
      workspaceId: selectedWorkspaceId || undefined,
      isGlobal: 'true'
    }
  } as any, { enabled: !!selectedWorkspaceId })
  const projects = projectsData?.data || []

  // Fetch Team for Selected Project (via single project fetch)
  const { data: projectDetail, isLoading: loadingProjectDetail } = resourceHooks.projects.useSingle(
    selectedProjectId as string, 
    !!selectedProjectId
  )
  const teamIdFromProject = projectDetail?.data?.teamId
  
  // Update selectedTeamId when projectDetail changes
  useEffect(() => {
    if (teamIdFromProject) {
      setSelectedTeamId(teamIdFromProject)
    } else {
        setSelectedTeamId(null)
    }
  }, [teamIdFromProject])

  // Fetch Team Details (Members)
  const { data: teamDetail, isLoading: loadingTeamDetail } = resourceHooks.teams.useSingle(
    selectedTeamId as string,
    !!selectedTeamId
  )
  const team = teamDetail?.data
  const rawMembers = team?.members || []
  
  // Local Filtering for Team (since it's a single fetch)
  const teamMatches = !teamSearch || team?.name.toLowerCase().includes(teamSearch.toLowerCase()) || team?.description?.toLowerCase().includes(teamSearch.toLowerCase())
  const displayedTeam = teamMatches ? team : null

  // Local Filtering for Members
  const filteredMembers = rawMembers.filter((m: any) => {
    if (!memberSearch) return true
    const search = memberSearch.toLowerCase()
    return (
        m.user?.name?.toLowerCase().includes(search) || 
        m.user?.email?.toLowerCase().includes(search) ||
        m.role?.toLowerCase().includes(search)
    )
  })

  const handleWorkspaceSelect = (id: string) => {
    setSelectedWorkspaceId(id)
    setSelectedProjectId(null)
    setSelectedTeamId(null)
  }

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background/50 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0 bg-background/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
            <Layout className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground/90">Workspace Explorer Hub</h1>
            <p className="text-xs text-muted-foreground/70 font-medium">Visual hierarchical navigation of your platform resources</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="bg-background/50 border-primary/20 text-primary px-3 py-1 text-[10px] uppercase tracking-wider font-bold">Live Context</Badge>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Panel 1: Workspaces */}
        <HubPanel 
          title="Workspaces" 
          icon={<Briefcase className="h-4 w-4" />}
          loading={loadingWorkspaces}
          count={workspaces.length}
          searchValue={workspaceSearch}
          onSearchChange={setWorkspaceSearch}
          onAddClick={() => setIsWorkspaceCreateOpen(true)}
        >
          {workspaces.map((ws: any) => (
            <HubItem 
              key={ws.id}
              title={ws.name}
              isActive={selectedWorkspaceId === ws.id}
              onClick={() => handleWorkspaceSelect(ws.id)}
              badge={ws.isActive ? "Active" : "Inactive"}
            />
          ))}
        </HubPanel>

        {/* Panel 2: Projects */}
        <HubPanel 
          title="Projects" 
          icon={<Layout className="h-4 w-4" />}
          loading={loadingProjects}
          emptyText={!selectedWorkspaceId ? "Select a workspace to view projects" : "No projects found"}
          count={projects.length}
          isVisible={!!selectedWorkspaceId}
          searchValue={projectSearch}
          onSearchChange={setProjectSearch}
          onAddClick={!!selectedWorkspaceId ? () => setIsProjectCreateOpen(true) : undefined}
        >
          {projects.map((p: any) => (
            <HubItem 
              key={p.id}
              title={p.name}
              isActive={selectedProjectId === p.id}
              onClick={() => handleProjectSelect(p.id)}
              badge={p.isActive ? "Live" : "Inactive"}
            />
          ))}
        </HubPanel>

        {/* Panel 3: Teams */}
        <HubPanel 
          title="Associated Team" 
          icon={<Users className="h-4 w-4" />}
          loading={loadingProjectDetail}
          emptyText={!selectedProjectId ? "Select a project to see its team" : "No team assigned"}
          isVisible={!!selectedProjectId}
          searchValue={teamSearch}
          onSearchChange={setTeamSearch}
          onAddClick={!!selectedProjectId && !displayedTeam ? () => setIsTeamCreateOpen(true) : undefined}
        >
          {displayedTeam ? (
            <HubItem 
              key={displayedTeam.id}
              title={displayedTeam.name}
              isActive={true}
              onClick={() => {}}
              badge={displayedTeam.isActive ? "Active" : "Inactive"}
              noArrow
            />
          ) : null}
        </HubPanel>

        {/* Panel 4: Members */}
        <HubPanel 
          title="Team Members" 
          icon={<User className="h-4 w-4" />}
          loading={loadingTeamDetail}
          emptyText={!selectedTeamId ? "Select a team to view members" : "No members found"}
          count={filteredMembers.length}
          isVisible={!!selectedTeamId}
          searchValue={memberSearch}
          onSearchChange={setMemberSearch}
          onAddClick={!!selectedTeamId ? () => setIsMemberAddOpen(true) : undefined}
        >
          {filteredMembers.map((m: any) => (
            <MemberItem key={m.id} member={m} />
          ))}
        </HubPanel>
      </div>

      {/* Creation Dialogs */}
      <CreateWorkspaceDialog 
        open={isWorkspaceCreateOpen} 
        onOpenChange={setIsWorkspaceCreateOpen} 
        redirect={false}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['workspaces', 'list'] })
        }}
      />
      <CreateProjectDialog 
        open={isProjectCreateOpen} 
        onOpenChange={setIsProjectCreateOpen} 
        redirect={false}
        defaultWorkspaceId={selectedWorkspaceId || undefined}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['projects', 'list'] })
          if (selectedWorkspaceId) {
            queryClient.invalidateQueries({ queryKey: ['workspaces', 'detail', selectedWorkspaceId] })
          }
        }}
      />
      <CreateTeamDialog 
        open={isTeamCreateOpen} 
        onOpenChange={setIsTeamCreateOpen} 
        redirect={false}
        defaultProjectId={selectedProjectId || undefined}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['teams', 'list'] })
          if (selectedProjectId) {
            queryClient.invalidateQueries({ queryKey: ['projects', 'detail', selectedProjectId] })
          }
        }}
      />
      <AddMemberDialog 
        open={isMemberAddOpen} 
        onOpenChange={setIsMemberAddOpen}
        teamId={selectedTeamId || undefined}
        onSuccess={() => {
          if (selectedTeamId) {
            queryClient.invalidateQueries({ queryKey: ['teams', 'detail', selectedTeamId] })
          }
        }}
      />
    </div>
  )
}
