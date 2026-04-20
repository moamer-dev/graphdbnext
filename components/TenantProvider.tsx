'use client'

import React, { useEffect, useState } from 'react'
import { useTenantStore } from '@/stores/tenantStore'
import { useSession } from 'next-auth/react'
import { TeamResource } from '@/resources/TeamResource'
import { ProjectResource } from '@/resources/ProjectResource'
import { WorkspaceResource } from '@/resources/WorkspaceResource'

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
        const teamRes = await fetch(TeamResource.BASE_PATH)
        const teamResult = await teamRes.json()
        const teams = teamResult.data || []

        if (teams.length > 0) {
          const currentTeamId = activeTeamId || teams[0].id
          if (!activeTeamId) setActiveTeam(teams[0].id)

          // 2. Fetch Projects for current team
          const projectRes = await fetch(`${ProjectResource.BASE_PATH}?teamId=${currentTeamId}`)
          const projectResult = await projectRes.json()
          const projects = projectResult.data || []

          if (projects.length > 0) {
            const currentProjectId = activeProjectId || projects[0].id
            if (!activeProjectId) setActiveProject(projects[0].id)

            // 3. Fetch Workspaces for current project
            const workspaceRes = await fetch(`${WorkspaceResource.BASE_PATH}?projectId=${currentProjectId}`)
            const workspaceResult = await workspaceRes.json()
            const workspaces = workspaceResult.data || []

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
