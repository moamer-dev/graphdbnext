'use client'

import { create } from 'zustand'
import { toast } from 'sonner'
import { NodeQueries, RelationshipQueries, CommonQueries } from '@/lib/queries/cypherQueries'

export interface DatabaseStatus {
  success?: boolean
  connected?: boolean
  stats?: {
    nodeCount?: number
    relationshipCount?: number
  }
  error?: string
}

interface DatabaseStore {
  // Node Labels
  nodeLabels: string[]
  nodeLabelsLoading: boolean
  nodeLabelsError: string | null
  fetchNodeLabels: () => Promise<void>
  invalidateNodeLabels: () => void
  
  // Relationship Types (cached by fromLabel-toLabel key)
  relationshipTypes: Record<string, string[]> // key: "fromLabel-toLabel" or "any-any"
  relationshipTypesLoading: Record<string, boolean>
  relationshipTypesError: Record<string, string | null>
  fetchRelationshipTypes: (fromLabel?: string, toLabel?: string) => Promise<void>
  invalidateRelationshipTypes: () => void
  
  // Node Properties (cached by label)
  nodeProperties: Record<string, string[]> // key: label
  nodePropertiesLoading: Record<string, boolean>
  nodePropertiesError: Record<string, string | null>
  fetchNodeProperties: (label: string) => Promise<void>
  invalidateNodeProperties: () => void
  
  // Database Connection
  dbStatus: DatabaseStatus | null
  isInitializing: boolean
  checkStatus: (isInitialCheck?: boolean) => Promise<void>
  
  // Current Query & Results
  currentQuery: string
  queryResults: unknown[] | null
  queryLoading: boolean
  queryError: string | null
  setQuery: (query: string) => void
  executeQuery: (queryToExecute?: string) => Promise<void>
  
  // Loading state for database operations
  loading: boolean
  
  // Graph loading
  loadGraphFromFile: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}

export const useDatabaseStore = create<DatabaseStore>((set, get) => ({
  // Initial state
  nodeLabels: [],
  nodeLabelsLoading: false,
  nodeLabelsError: null,
  
  relationshipTypes: {},
  relationshipTypesLoading: {},
  relationshipTypesError: {},
  
  nodeProperties: {},
  nodePropertiesLoading: {},
  nodePropertiesError: {},
  
  dbStatus: null,
  isInitializing: true,
  
  currentQuery: CommonQueries.defaultQuery(),
  queryResults: null,
  queryLoading: false,
  queryError: null,
  
  loading: false,
  
  // Node Labels
  fetchNodeLabels: async () => {
    const state = get()
    if (state.nodeLabelsLoading) return // Prevent duplicate fetches
    
    set({ nodeLabelsLoading: true, nodeLabelsError: null })
    try {
      const query = NodeQueries.getAllLabels()
      
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()
      if (data.success && data.results) {
        const labels = data.results.map((result: { label: string }) => result.label)
        set({ nodeLabels: labels, nodeLabelsLoading: false })
      } else {
        const error = data.error || 'Failed to fetch node labels'
        set({ nodeLabelsError: error, nodeLabelsLoading: false })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch node labels'
      set({ nodeLabelsError: errorMessage, nodeLabelsLoading: false })
      console.error('Error fetching node labels:', error)
    }
  },
  
  invalidateNodeLabels: () => {
    set({ nodeLabels: [], nodeLabelsError: null })
  },
  
  // Relationship Types
  fetchRelationshipTypes: async (fromLabel?: string, toLabel?: string) => {
    const cacheKey = `${fromLabel || 'any'}-${toLabel || 'any'}`
    const state = get()
    
    if (state.relationshipTypesLoading[cacheKey]) return // Prevent duplicate fetches
    if (state.relationshipTypes[cacheKey]) return // Use cache if available
    
    set((prev) => ({
      relationshipTypesLoading: { ...prev.relationshipTypesLoading, [cacheKey]: true },
      relationshipTypesError: { ...prev.relationshipTypesError, [cacheKey]: null }
    }))
    
    try {
      let query = ''
      if (fromLabel && toLabel) {
        query = RelationshipQueries.getTypesByLabels(fromLabel, toLabel)
      } else if (fromLabel) {
        query = RelationshipQueries.getTypesByFromLabel(fromLabel)
      } else {
        query = RelationshipQueries.getAllTypes()
      }

      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      const data = await response.json()
      const types: string[] = []
      if (data.success && data.results) {
        data.results.forEach((result: { relationshipType: string }) => {
          if (result.relationshipType) {
            types.push(result.relationshipType)
          }
        })
      }
      
      set((prev) => ({
        relationshipTypes: { ...prev.relationshipTypes, [cacheKey]: types },
        relationshipTypesLoading: { ...prev.relationshipTypesLoading, [cacheKey]: false }
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch relationship types'
      set((prev) => ({
        relationshipTypesError: { ...prev.relationshipTypesError, [cacheKey]: errorMessage },
        relationshipTypesLoading: { ...prev.relationshipTypesLoading, [cacheKey]: false }
      }))
      console.error('Error fetching relationship types:', error)
    }
  },
  
  invalidateRelationshipTypes: () => {
    set({ relationshipTypes: {}, relationshipTypesError: {} })
  },
  
  // Node Properties
  fetchNodeProperties: async (label: string) => {
    const state = get()
    
    if (state.nodePropertiesLoading[label]) return // Prevent duplicate fetches
    if (state.nodeProperties[label]) return // Use cache if available
    
    set((prev) => ({
      nodePropertiesLoading: { ...prev.nodePropertiesLoading, [label]: true },
      nodePropertiesError: { ...prev.nodePropertiesError, [label]: null }
    }))
    
    try {
      const query = NodeQueries.getPropertiesByLabel(label)
      
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      const data = await response.json()
      const fetchedProperties: string[] = []
      if (data.success && data.results) {
        data.results.forEach((result: { key: string }) => {
          if (result.key) {
            fetchedProperties.push(result.key)
          }
        })
      }
      
      set((prev) => ({
        nodeProperties: { ...prev.nodeProperties, [label]: fetchedProperties },
        nodePropertiesLoading: { ...prev.nodePropertiesLoading, [label]: false }
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch properties for label'
      set((prev) => ({
        nodePropertiesError: { ...prev.nodePropertiesError, [label]: errorMessage },
        nodePropertiesLoading: { ...prev.nodePropertiesLoading, [label]: false }
      }))
      console.error('Error fetching properties for label:', error)
    }
  },
  
  invalidateNodeProperties: () => {
    set({ nodeProperties: {}, nodePropertiesError: {} })
  },
  
  // Database Status
  checkStatus: async (isInitialCheck = false) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/database/status')
      const data = await response.json()
      set({ dbStatus: data, loading: false })
      
      if (isInitialCheck) {
        set({ isInitializing: false })
      }
      
      if (data.connected) {
        if (!isInitialCheck) {
          toast.success('Database connected')
        }
      } else {
        if (!isInitialCheck) {
          toast.error(data.error || 'Database disconnected')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (isInitialCheck) {
        set({ isInitializing: false, loading: false })
      } else {
        set({ loading: false })
        toast.error(errorMessage)
      }
    }
  },
  
  // Query Management
  setQuery: (query: string) => {
    set({ currentQuery: query })
  },
  
  executeQuery: async (queryToExecute?: string) => {
    const state = get()
    set({ queryLoading: true, queryError: null })
    
    try {
      const queryString = queryToExecute ?? state.currentQuery
      
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryString })
      })

      const data = await response.json()

      if (data.success) {
        set({ 
          queryResults: data.results,
          queryLoading: false,
          currentQuery: queryString
        })
        toast.success(`Query executed successfully. Returned ${data.count} results.`)
      } else {
        const error = data.error || 'Query failed'
        set({ queryError: error, queryLoading: false })
        toast.error(error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Query execution failed'
      set({ queryError: errorMessage, queryLoading: false })
      toast.error(errorMessage)
    }
  },
  
  // Load graph from file
  loadGraphFromFile: async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const state = get()
    set({ loading: true })
    
    try {
      const text = await file.text()
      const graph = JSON.parse(text)

      const response = await fetch('/api/database/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Loaded ${data.nodesCreated} nodes and ${data.relationshipsCreated} relationships into the graph database`)
        await state.checkStatus()
        // Invalidate caches when new data is loaded
        state.invalidateNodeLabels()
        state.invalidateRelationshipTypes()
        state.invalidateNodeProperties()
      } else {
        toast.error(data.error || 'Failed to load graph')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load graph'
      toast.error(errorMessage)
    } finally {
      set({ loading: false })
    }
  }
}))

