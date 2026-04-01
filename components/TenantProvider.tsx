'use client'

import React, { useEffect, useState } from 'react'
import { useTenantStore } from '@/stores/tenantStore'
import { useSession } from 'next-auth/react'

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { 
    activeTeamId, 
    activeProjectId, 
    activeWorkspaceId,
    setActiveTeam,
    setActiveProject,
    setActiveWorkspace
  } = useTenantStore()
  
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) return

    const initializeTenant = async () => {
      try {
        // 1. Fetch Teams
        const teamRes = await fetch('/api/teams')
        const teams = await teamRes.json()

        if (teams.length > 0) {
          const currentTeamId = activeTeamId || teams[0].id
          if (!activeTeamId) setActiveTeam(teams[0].id)

          // 2. Fetch Projects for current team
          const projectRes = await fetch(`/api/projects?teamId=${currentTeamId}`)
          const projects = await projectRes.json()

          if (projects.length > 0) {
            const currentProjectId = activeProjectId || projects[0].id
            if (!activeProjectId) setActiveProject(projects[0].id)

            // 3. Fetch Workspaces for current project
            const workspaceRes = await fetch(`/api/workspaces?projectId=${currentProjectId}`)
            const workspaces = await workspaceRes.json()

            if (workspaces.length > 0) {
              if (!activeWorkspaceId) setActiveWorkspace(workspaces[0].id)
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize tenant context:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeTenant()
  }, [session, activeTeamId, activeProjectId, activeWorkspaceId, setActiveTeam, setActiveProject, setActiveWorkspace])

  return (
    <>
      {children}
    </>
  )
}
