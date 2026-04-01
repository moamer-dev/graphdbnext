'use client'

import React, { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTenantStore } from '@/stores/tenantStore'
import { Building2, FolderKanban, Layers } from 'lucide-react'
import { Skeleton } from './ui/skeleton'

export function TenantSwitchers() {
  const { 
    activeTeamId, 
    setActiveTeam,
    activeProjectId,
    setActiveProject,
    activeWorkspaceId,
    setActiveWorkspace
  } = useTenantStore()

  const [teams, setTeams] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch Teams
  useEffect(() => {
    fetch('/api/teams')
      .then(res => res.json())
      .then(json => setTeams(json.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Fetch Projects when Team changes (or on mount)
  useEffect(() => {
    // If we have a team, fetch that team's projects. 
    // If not, fetch "Independent / Personal" projects (teamId=null)
    setLoading(true)
    const url = activeTeamId ? `/api/projects?teamId=${activeTeamId}` : '/api/projects?teamId=null'
    
    fetch(url)
      .then(res => res.json())
      .then(json => setProjects(json.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeTeamId])

  // Fetch Workspaces when Project changes
  useEffect(() => {
    if (!activeProjectId) return
    setLoading(true)
    fetch(`/api/workspaces?projectId=${activeProjectId}`)
      .then(res => res.json())
      .then(json => setWorkspaces(json.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeProjectId])

  if (loading && !teams.length) {
    return <div className="flex gap-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /></div>
  }

  return (
    <div className="flex items-center gap-2">
      {/* Team Switcher */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 border border-border/50 rounded-md">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={activeTeamId || "unassigned"} onValueChange={(v) => setActiveTeam(v === "unassigned" ? null : v)}>
          <SelectTrigger className="h-7 border-none bg-transparent hover:bg-transparent focus:ring-0 p-0 pr-2 min-w-[80px] max-w-[120px] text-xs font-medium">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned" className="text-xs italic opacity-70">Personal / No Team</SelectItem>
            {teams.map(team => (
              <SelectItem key={team.id} value={team.id} className="text-xs">{team.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-muted-foreground font-light px-0.5 opacity-30 select-none">/</div>

      {/* Project Switcher */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 border border-border/50 rounded-md">
        <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={activeProjectId || undefined} onValueChange={setActiveProject}>
          <SelectTrigger className="h-7 border-none bg-transparent hover:bg-transparent focus:ring-0 p-0 pr-2 min-w-[80px] max-w-[120px] text-xs font-medium">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id} className="text-xs">{project.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-muted-foreground font-light px-0.5 opacity-30 select-none">/</div>

      {/* Workspace Switcher */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 border border-border/50 rounded-md">
        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={activeWorkspaceId || undefined} onValueChange={setActiveWorkspace} disabled={!activeProjectId}>
          <SelectTrigger className="h-7 border-none bg-transparent hover:bg-transparent focus:ring-0 p-0 pr-2 min-w-[80px] max-w-[120px] text-xs font-medium">
            <SelectValue placeholder="Workspace" />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map(workspace => (
              <SelectItem key={workspace.id} value={workspace.id} className="text-xs">{workspace.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
