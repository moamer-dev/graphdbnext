import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface TenantState {
  activeTeamId: string | null
  activeProjectId: string | null
  activeWorkspaceId: string | null
  isGlobalScope: boolean
  
  // Actions
  setActiveTeam: (id: string | null) => void
  setActiveProject: (id: string | null) => void
  setActiveWorkspace: (id: string | null) => void
  setGlobalScope: (isGlobal: boolean) => void
  
  // Reset
  reset: () => void
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeTeamId: null,
      activeProjectId: null,
      activeWorkspaceId: null,
      isGlobalScope: false,

      setActiveTeam: (id) => set({ 
        activeTeamId: id,
      }),
      
      setActiveProject: (id) => set({ 
        activeProjectId: id,
      }),
      
      setActiveWorkspace: (id) => set({ 
        activeWorkspaceId: id 
      }),

      setGlobalScope: (isGlobal) => set({ 
        isGlobalScope: isGlobal,
        // When going into workspace scope, we might want to keep the active workspace
        // When going into global scope, we might want to keep it too but ignore it in filters
      }),

      reset: () => set({ 
        activeTeamId: null, 
        activeProjectId: null, 
        activeWorkspaceId: null,
        isGlobalScope: false
      }),
    }),
    {
      name: 'plexus-tenant-context',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
