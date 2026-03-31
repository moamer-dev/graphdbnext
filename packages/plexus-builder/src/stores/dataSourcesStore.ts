import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DataSource {
  id: string
  name: string
  data: any
  toolId?: string
  timestamp: number
}

interface DataSourcesState {
  sources: Record<string, DataSource>
  setSource: (name: string, data: any, toolId?: string) => void
  removeSource: (name: string) => void
  getSource: (name: string) => DataSource | undefined
  getAllSources: () => DataSource[]
}

export const useDataSourcesStore = create<DataSourcesState>()(
  persist(
    (set, get) => ({
      sources: {},
      
      setSource: (name, data, toolId) => {
        const id = name.toLowerCase().replace(/[^a-z0-9_]/g, '_')
        set((state) => ({
          sources: {
            ...state.sources,
            [id]: {
              id,
              name,
              data,
              toolId,
              timestamp: Date.now()
            }
          }
        }))
      },

      removeSource: (id) => {
        set((state) => {
          const newSources = { ...state.sources }
          delete newSources[id]
          return { sources: newSources }
        })
      },

      getSource: (id) => {
        return get().sources[id]
      },

      getAllSources: () => {
        return Object.values(get().sources)
      }
    }),
    {
      name: 'plexus-data-sources'
    }
  )
)
