import { create } from 'zustand'

export type DataSourceType = 'XML' | 'JSON' | 'API_RESPONSE'
export type StorageType = 'DATABASE' | 'EXTERNAL_S3' | 'LOCAL_FS'

export interface DataSource {
  id: string
  name: string
  type: DataSourceType
  data?: any             // Small direct JSON / API response
  content?: string        // Small direct text (XML, etc)
  fileUrl?: string        // Remote path for large files
  storageType?: StorageType
  size?: number
  structure?: any         // Structural preview for huge files
  toolId?: string
  timestamp: number
}

interface DataSourcesState {
  sources: Record<string, DataSource>
  
  // Actions
  setSources: (sources: DataSource[]) => void
  setSource: (params: Omit<DataSource, 'id' | 'timestamp'> & { id?: string }) => void
  removeSource: (id: string) => void
  getSource: (id: string) => DataSource | undefined
  getAllSources: (filter?: { type?: DataSourceType | DataSourceType[] }) => DataSource[]
}

export const useDataSourcesStore = create<DataSourcesState>((set, get) => ({
  sources: {},
  
  setSources: (sources) => {
    const sourceMap = sources.reduce((acc, src) => ({
      ...acc,
      [src.id]: src
    }), {})
    set({ sources: sourceMap })
  },

  setSource: (params) => {
    const id = params.id || params.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    set((state) => ({
      sources: {
        ...state.sources,
        [id]: {
          ...params,
          id,
          timestamp: Date.now()
        } as DataSource
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

  getAllSources: (filter) => {
    const all = Object.values(get().sources)
    if (!filter?.type) return all
    
    const types = Array.isArray(filter.type) ? filter.type : [filter.type]
    return all.filter(src => types.includes(src.type))
  }
}))

// Useful selectors
export const useXmlSources = () => {
    const sources = useDataSourcesStore((state) => state.sources)
    return Object.values(sources).filter(src => src.type === 'XML')
}
