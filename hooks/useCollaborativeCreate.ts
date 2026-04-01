import { z } from 'zod'
import { useResourceForm, useResourceUpdate } from './useResourceForm'
import { useTenantStore } from '@/stores/tenantStore'
import { useMemo } from 'react'

// Team Schema
export const TeamSchema = z.object({
  name: z.string().min(3, 'Team name must be at least 3 characters'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  projectIds: z.array(z.string()).optional(),
  creatorId: z.string().optional()
})

export type TeamFormValues = z.infer<typeof TeamSchema>

export function useTeamCreate(onSuccess?: (data: any) => void) {
  return useResourceForm({
    resourceName: 'teams',
    schema: TeamSchema,
    onSuccess
  })
}

export function useTeamUpdate(id: string, onSuccess?: (data: any) => void) {
  return useResourceUpdate({
    resourceName: 'teams',
    schema: TeamSchema,
    id,
    defaultValues: { name: '', description: '', isActive: true, projectIds: [], creatorId: undefined },
    onSuccess
  })
}

// Project Schema
export const ProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  teamId: z.string().nullable().optional(),
  workspaceIds: z.array(z.string()).optional(),
  creatorId: z.string().optional()
})

export type ProjectFormValues = z.infer<typeof ProjectSchema>

export function useProjectCreate(onSuccess?: (data: any) => void) {
  const { activeTeamId } = useTenantStore()
  
  const defaultValues = useMemo(() => ({
    name: '',
    description: '',
    isActive: true,
    teamId: activeTeamId || null,
    workspaceIds: []
  }), [activeTeamId])

  return useResourceForm({
    resourceName: 'projects',
    schema: ProjectSchema,
    defaultValues,
    onSuccess
  })
}

export function useProjectUpdate(id: string, onSuccess?: (data: any) => void) {
  return useResourceUpdate({
    resourceName: 'projects',
    schema: ProjectSchema,
    id,
    defaultValues: { name: '', description: '', isActive: true, teamId: null, workspaceIds: [], creatorId: undefined },
    onSuccess
  })
}

// Workspace Schema
export const WorkspaceSchema = z.object({
  name: z.string().min(3, 'Workspace name must be at least 3 characters'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  projectIds: z.array(z.string()).optional(),
  creatorId: z.string().optional()
})

export type WorkspaceFormValues = z.infer<typeof WorkspaceSchema>

export function useWorkspaceCreate(onSuccess?: (data: any) => void) {
  const { activeProjectId } = useTenantStore()
  
  const defaultValues = useMemo(() => ({
    name: '',
    description: '',
    isActive: true,
    projectId: activeProjectId || null,
    projectIds: []
  }), [activeProjectId])

  return useResourceForm({
    resourceName: 'workspaces',
    schema: WorkspaceSchema,
    defaultValues,
    onSuccess
  })
}

export function useWorkspaceUpdate(id: string, onSuccess?: (data: any) => void) {
  return useResourceUpdate({
    resourceName: 'workspaces',
    schema: WorkspaceSchema,
    id,
    defaultValues: { name: '', description: '', isActive: true, projectIds: [], creatorId: undefined },
    onSuccess
  })
}
