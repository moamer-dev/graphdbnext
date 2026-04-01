import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface TenantState {
  activeTeamId: string | null
  activeProjectId: string | null
  activeWorkspaceId: string | null
  
  // Actions
  setActiveTeam: (id: string | null) => void
  setActiveProject: (id: string | null) => void
  setActiveWorkspace: (id: string | null) => void
  
  // Reset
  reset: () => void
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeTeamId: null,
      activeProjectId: null,
      activeWorkspaceId: null,

      setActiveTeam: (id) => set({ 
        activeTeamId: id,
        activeProjectId: null, // Reset project when team changes
        activeWorkspaceId: null // Reset workspace when team changes
      }),
      
      setActiveProject: (id) => set({ 
        activeProjectId: id,
        activeWorkspaceId: null // Reset workspace when project changes
      }),
      
      setActiveWorkspace: (id) => set({ 
        activeWorkspaceId: id 
      }),

      reset: () => set({ 
        activeTeamId: null, 
        activeProjectId: null, 
        activeWorkspaceId: null 
      }),
    }),
    {
      name: 'plexus-tenant-context',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
