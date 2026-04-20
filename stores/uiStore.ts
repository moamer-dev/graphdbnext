import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewType = 'table' | 'grid'
export type ResourceScope = 'all' | 'member'

interface UIState {
  dashboardView: ViewType
  setDashboardView: (view: ViewType) => void
  resourceScope: ResourceScope
  setResourceScope: (scope: ResourceScope) => void
  tableVisibility: Record<string, Record<string, boolean>>
  setTableVisibility: (resource: string, visibility: Record<string, boolean>) => void
  userEditTab: string
  setUserEditTab: (tab: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      dashboardView: 'table',
      setDashboardView: (view) => set({ dashboardView: view }),
      resourceScope: 'all',
      setResourceScope: (scope) => set({ resourceScope: scope }),
      tableVisibility: {},
      setTableVisibility: (resource, visibility) => set((state) => ({
        tableVisibility: {
          ...state.tableVisibility,
          [resource]: visibility
        }
      })),
      userEditTab: 'profile',
      setUserEditTab: (tab) => set({ userEditTab: tab }),
    }),
    {
      name: 'ui-storage',
    }
  )
)
