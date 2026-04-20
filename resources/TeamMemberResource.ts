import { z } from 'zod'

export const TeamMemberSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  roleId: z.string().optional().nullable(),
})

export type TeamMemberFormValues = z.infer<typeof TeamMemberSchema>

export const TeamMemberResource = {
  NAME: 'TeamMember',
  resourceName: 'TeamMember',
  BASE_PATH: '/api/team-members',

  HOOK_CONFIG: {
    workspaceScoped: false
  }
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  roleId: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    image?: string | null
  }
  role?: {
    id: string
    name: string
  } | null
}
