import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useDatabase } from '../database/useDatabase'
import { QueryBuilderService, QueryBuilderState } from '@/lib/services/QueryBuilderService'
import { CommonQueries } from '@/lib/queries/cypherQueries'

type QueryMode = 'library' | 'builder' | 'cypher' | 'agent'

export function useQueryView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const {
    loading,
    query,
    setQuery,
    queryResults,
    executeQuery
  } = useDatabase()

  const [mounted, setMounted] = useState(false)
  // Note: activeMode and cypherQuery stay in hook due to complex URL synchronization
  // The queryViewStore is available but we keep URL-synced state here for now
  const [activeMode, setActiveMode] = useState<QueryMode>('library')
  const [cypherQueryForBuilder, setCypherQueryForBuilder] = useState<string | undefined>(undefined)
  const hasAutoExecutedCypher = useRef(false)
  const queryBuilderService = useRef(new QueryBuilderService())

  // Initialize from URL or default to 'library'
  const initialModeRef = useRef<QueryMode | null>(null)
  const initialCypherQueryRef = useRef<string | null>(null)

  if (initialModeRef.current === null) {
    const modeFromUrl = searchParams.get('mode') as QueryMode | null
    const hasBuilder = searchParams.get('builder')
    const cypherQueryFromUrl = searchParams.get('cypher')

    if (hasBuilder && modeFromUrl !== 'builder') {
      initialModeRef.current = 'builder'
    } else {
      initialModeRef.current = (modeFromUrl === 'library' || modeFromUrl === 'builder' || modeFromUrl === 'cypher')
        ? modeFromUrl
        : 'library'
    }

    if (cypherQueryFromUrl) {
      // URLSearchParams.get() already decodes, but handle double-encoding if present
      let decoded = cypherQueryFromUrl
      try {
        // Try decoding once (in case it was double-encoded)
        decoded = decodeURIComponent(cypherQueryFromUrl)
        // Check if it's still encoded (double-encoded case)
        if (decoded.includes('%')) {
          decoded = decodeURIComponent(decoded)
        }
      } catch {
        // If decoding fails, use as-is
      }
      initialCypherQueryRef.current = decoded
    }
  }

  const initialMode = initialModeRef.current

  useEffect(() => {
    setMounted(true)
    setActiveMode(initialMode)
  }, [initialMode])

  // Track if we should auto-execute when switching to cypher mode
  const shouldAutoExecuteOnCypherSwitch = useRef(false)
  const queryToAutoExecute = useRef<string | null>(null)

  // Restore Cypher query from URL and auto-execute if mode is cypher
  useEffect(() => {
    // Only proceed if we're in cypher mode
    if (activeMode === 'cypher') {
      // Check if we have a query from URL (page reload)
      if (initialCypherQueryRef.current && initialCypherQueryRef.current.trim()) {
        // Set the query first
        setQuery(initialCypherQueryRef.current)

        // Auto-execute the query if we haven't already
        if (!hasAutoExecutedCypher.current) {
          hasAutoExecutedCypher.current = true
          // Wait a bit for the query to be set in state and component to be ready
          const timeoutId = setTimeout(async () => {
            // Use the query from ref to ensure we have the latest value
            const queryToExecute = initialCypherQueryRef.current
            if (queryToExecute && queryToExecute.trim()) {
              await executeQuery(queryToExecute)
            }
          }, 300)

          return () => clearTimeout(timeoutId)
        }
      }
      // Check if we have a query to auto-execute from mode switch (builder -> cypher)
      else if (shouldAutoExecuteOnCypherSwitch.current && queryToAutoExecute.current) {
        const queryToExecute = queryToAutoExecute.current
        shouldAutoExecuteOnCypherSwitch.current = false
        queryToAutoExecute.current = null

        // Auto-execute after a short delay
        const timeoutId = setTimeout(async () => {
          if (queryToExecute && queryToExecute.trim()) {
            await executeQuery(queryToExecute)
          }
        }, 300)

        return () => clearTimeout(timeoutId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode])

  // Ensure mode is in URL on mount
  useEffect(() => {
    const modeFromUrl = searchParams.get('mode')
    if (!modeFromUrl) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('mode', initialMode)
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }, [initialMode, router, searchParams])

  // Helper function to deserialize builder state from URL
  const deserializeBuilderState = (encoded: string) => {
    try {
      const state = JSON.parse(atob(encoded))
      let nodeCounter = 1
      let relCounter = 1
      let condCounter = 1

      const nodes = state.n?.map((n: { l?: string, a: string }) => ({
        id: `node_${nodeCounter++}`,
        label: n.l,
        alias: n.a || `n${nodeCounter}`
      })) || []

      const relationships = state.r?.map((r: { t?: string, f: number, to: number, a?: string, m?: 'AND' | 'OR' | 'MATCH' | 'OPTIONAL_MATCH', e?: boolean }) => {
        const fromNode = nodes[r.f]
        const toNode = nodes[r.to]
        if (!fromNode || !toNode || r.f < 0 || r.to < 0) return null
        return {
          id: `rel_${relCounter++}`,
          type: r.t,
          from: fromNode.id,
          to: toNode.id,
          alias: r.a || `r${relCounter}`,
          matchType: r.m,
          enabled: r.e !== undefined ? r.e : true
        }
      }).filter(Boolean) || []

      const conditions = state.c?.map((c: { n: number, p?: string, o?: string, v?: string }) => {
        const node = nodes[c.n]
        if (!node || c.n < 0) return null
        return {
          id: `cond_${condCounter++}`,
          type: 'property' as const,
          nodeId: node.id,
          property: c.p,
          operator: c.o,
          value: c.v
        }
      }).filter((c: { id: string, type: 'property', nodeId: string, property?: string, operator?: string, value?: string } | null): c is { id: string, type: 'property', nodeId: string, property?: string, operator?: string, value?: string } => c !== null) || []

      return {
        nodes,
        relationships,
        conditions,
        returnFields: state.f || [],
        limit: state.l || '10'
      }
    } catch (error) {
      console.error('Error deserializing builder state:', error)
      return null
    }
  }

  const handleModeChange = async (mode: QueryMode) => {
    setActiveMode(mode)
    const params = new URLSearchParams(searchParams.toString())
    params.set('mode', mode)

    if (mode === 'builder' && activeMode === 'cypher' && query.trim()) {
      // Switching from Cypher to Builder - pass the Cypher query
      setCypherQueryForBuilder(query.trim())
      params.delete('cypher')
    } else if (mode === 'cypher' && activeMode === 'builder') {
      // Switching from Builder to Cypher - use the current query if available, otherwise convert from builder state
      let cypherQuery: string | null = null

      // First, check if there's a cypher query in the URL (set when executing from builder)
      const cypherFromUrl = searchParams.get('cypher')
      if (cypherFromUrl) {
        // URLSearchParams.get() already decodes, but handle double-encoding if present
        let decoded = cypherFromUrl
        try {
          // Try decoding once (in case it was double-encoded)
          decoded = decodeURIComponent(cypherFromUrl)
          // Check if it's still encoded (double-encoded case)
          if (decoded.includes('%')) {
            decoded = decodeURIComponent(decoded)
          }
        } catch {
          // If decoding fails, use as-is
        }
        cypherQuery = decoded
      }
      // Second, try to use the current query (which should be the generated query from builder)
      else if (query && query.trim() && query !== CommonQueries.defaultQuery()) {
        cypherQuery = query.trim()
      }
      // Fallback: convert builder state from URL to Cypher query
      else {
        const builderState = searchParams.get('builder')
        if (builderState) {
          const restored = deserializeBuilderState(builderState)
          if (restored) {
            // Convert builder state to Cypher query
            const builderStateForService: QueryBuilderState = {
              nodes: restored.nodes,
              relationships: restored.relationships,
              conditions: restored.conditions.map((c: { id: string, type: 'property', nodeId: string, property?: string, operator?: string, value?: string }) => ({
                id: c.id,
                type: c.type,
                nodeId: c.nodeId,
                property: c.property,
                operator: c.operator,
                value: c.value
              })),
              returnFields: restored.returnFields,
              limit: restored.limit
            }

            cypherQuery = queryBuilderService.current.generateQuery(builderStateForService)
          }
        }
      }

      if (cypherQuery) {
        // Set the query and save to URL
        setQuery(cypherQuery)
        // URLSearchParams.set() already encodes, so don't use encodeURIComponent
        params.set('cypher', cypherQuery)
        params.delete('builder')

        // Mark that we should auto-execute when mode switches to cypher
        shouldAutoExecuteOnCypherSwitch.current = true
        queryToAutoExecute.current = cypherQuery
        hasAutoExecutedCypher.current = false

        // Update URL first
        const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
        router.replace(newUrl, { scroll: false })

        return
      }

      // If no query available, just clean up params
      params.delete('builder')
    } else {
      // Switching to other modes - clean up params
      setCypherQueryForBuilder(undefined)
      if (mode !== 'builder') {
        params.delete('builder')
      }
      if (mode !== 'cypher') {
        params.delete('cypher')
      }
    }

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.push(newUrl, { scroll: false })
  }

  const handleQuerySelect = (selectedQuery: string) => {
    setQuery(selectedQuery)
  }

  const handleExecuteFromBuilder = async (builderQuery: string) => {
    setQuery(builderQuery)
    // Also save to URL so it's available when switching to Cypher tab
    // URLSearchParams.set() already encodes, so don't use encodeURIComponent
    const params = new URLSearchParams(searchParams.toString())
    params.set('cypher', builderQuery.trim())
    router.replace(`?${params.toString()}`, { scroll: false })
    await executeQuery(builderQuery)
  }

  const handleExecuteCypher = async () => {
    const params = new URLSearchParams(searchParams.toString())
    if (query.trim()) {
      // URLSearchParams.set() already encodes, so don't use encodeURIComponent
      params.set('cypher', query.trim())
      params.set('mode', 'cypher')
    } else {
      params.delete('cypher')
    }
    router.replace(`?${params.toString()}`, { scroll: false })
    await executeQuery()
  }

  return {
    mounted,
    activeMode,
    loading,
    query,
    setQuery,
    queryResults,
    cypherQueryForBuilder,
    handleModeChange,
    handleQuerySelect,
    handleExecuteFromBuilder,
    handleExecuteCypher,
    executeQuery
  }
}

