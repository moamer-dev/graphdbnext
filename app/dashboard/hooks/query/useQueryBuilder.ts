import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { convertCypherToBuilderState } from '@/lib/utils/cypherToBuilder'
import { QueryNode, QueryRelationship } from '@/lib/services/QueryBuilderService'
import { useQueryBuilderStore } from '@/app/dashboard/stores/queryBuilderStore'
import type { QueryConditionType } from '@/app/dashboard/stores/queryBuilderStore'

interface UseQueryBuilderProps {
  onQueryGenerate: (query: string) => void
  onExecute?: (query: string) => void
  initialCypherQuery?: string
}

export type { QueryConditionType } from '@/app/dashboard/stores/queryBuilderStore'

export const operators = [
  { value: '=', label: 'Equals (=)' },
  { value: '<>', label: 'Not equals (≠)' },
  { value: '>', label: 'Greater than (>)' },
  { value: '<', label: 'Less than (<)' },
  { value: '>=', label: 'Greater or equal (≥)' },
  { value: '<=', label: 'Less or equal (≤)' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'STARTS WITH', label: 'Starts with' },
  { value: 'ENDS WITH', label: 'Ends with' }
]

export function useQueryBuilder ({ onQueryGenerate, onExecute, initialCypherQuery }: UseQueryBuilderProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Use store for core state
  const matchNodes = useQueryBuilderStore(state => state.matchNodes)
  const matchRelationships = useQueryBuilderStore(state => state.matchRelationships)
  const conditions = useQueryBuilderStore(state => state.conditions)
  const returnFields = useQueryBuilderStore(state => state.returnFields)
  const limit = useQueryBuilderStore(state => state.limit)
  const limitMode = useQueryBuilderStore(state => state.limitMode)
  const restorationComplete = useQueryBuilderStore(state => state.restorationComplete)
  
  // Store actions
  const addMultipleNodes = useQueryBuilderStore(state => state.addMultipleNodes)
  const removeNode = useQueryBuilderStore(state => state.removeNode)
  const reorderNodes = useQueryBuilderStore(state => state.reorderNodes)
  const addRelationship = useQueryBuilderStore(state => state.addRelationship)
  const removeRelationship = useQueryBuilderStore(state => state.removeRelationship)
  const updateRelationship = useQueryBuilderStore(state => state.updateRelationship)
  const addCondition = useQueryBuilderStore(state => state.addCondition)
  const removeCondition = useQueryBuilderStore(state => state.removeCondition)
  const updateCondition = useQueryBuilderStore(state => state.updateCondition)
  const setReturnFields = useQueryBuilderStore(state => state.setReturnFields)
  const setLimit = useQueryBuilderStore(state => state.setLimit)
  const setLimitMode = useQueryBuilderStore(state => state.setLimitMode)
  const setRestorationComplete = useQueryBuilderStore(state => state.setRestorationComplete)
  const loadState = useQueryBuilderStore(state => state.loadState)
  const generateQuery = useQueryBuilderStore(state => state.generateQuery)
  
  // Refs for managing state updates
  const isUpdatingFromUrl = useRef(false)
  const isInitialMount = useRef(true)
  const shouldAutoExecute = useRef(false)
  const hasAutoExecuted = useRef(false)
  const lastSerializedState = useRef<string | null>(null)
  const previousEnabledStates = useRef<string>('')
  const isExecutingEnabledChange = useRef(false)
  const onExecuteRef = useRef(onExecute)
  
  // UI state (keep in hook - component-specific)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [draggedNodeIndex, setDraggedNodeIndex] = useState<number | null>(null)
  const [dragOverNodeIndex, setDragOverNodeIndex] = useState<number | null>(null)
  
  // Keep onExecute ref in sync
  useEffect(() => {
    onExecuteRef.current = onExecute
  }, [onExecute])

  // Deserialize query builder state from URL
  const deserializeState = useCallback((encoded: string) => {
    try {
      const state = JSON.parse(atob(encoded))
      let nodeCounter = 1
      let relCounter = 1
      let condCounter = 1
      
      // Reconstruct nodes with IDs
      const nodes = state.n?.map((n: { l?: string, a: string }) => ({
        id: `node_${nodeCounter++}`,
        label: n.l,
        alias: n.a || `n${nodeCounter}`
      })) || []
      
      // Reconstruct relationships - map indices back to node IDs
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
      }).filter(Boolean) as QueryRelationship[] || []
      
      // Reconstruct conditions - map indices back to node IDs
      const conds = state.c?.map((c: { n: number, p?: string, o?: string, v?: string, e?: boolean }) => {
        const node = nodes[c.n]
        if (!node || c.n < 0) return null
        return {
          id: `cond_${condCounter++}`,
          type: 'property' as const,
          nodeId: node.id,
          property: c.p,
          operator: c.o,
          value: c.v,
          enabled: c.e !== undefined ? c.e : true
        }
      }).filter(Boolean) as QueryConditionType[] || []
      
      return {
        nodes,
        relationships,
        conditions: conds,
        returnFields: state.f || [],
        limit: state.l || '10',
        limitMode: state.lm || 'rows',
        nodeIdCounter: nodeCounter,
        relationshipIdCounter: relCounter
      }
    } catch (error) {
      console.error('Error deserializing state:', error)
      return null
    }
  }, [])

  // Serialize state to URL
  const serializeState = useCallback((state: {
    nodes: QueryNode[]
    relationships: QueryRelationship[]
    conditions: QueryConditionType[]
    returnFields: string[]
    limit: string
    limitMode?: 'rows' | 'nodes'
  }) => {
    try {
      const nodeIdToIndex = new Map<string, number>()
      state.nodes.forEach((node, index) => {
        nodeIdToIndex.set(node.id, index)
      })

      const serialized = {
        n: state.nodes.map(n => ({ l: n.label, a: n.alias })),
        r: state.relationships.map(r => ({
          t: r.type,
          f: nodeIdToIndex.get(r.from) ?? -1,
          to: nodeIdToIndex.get(r.to) ?? -1,
          a: r.alias,
          m: r.matchType,
          e: r.enabled
        })),
        c: state.conditions.map(c => ({
          n: nodeIdToIndex.get(c.nodeId || '') ?? -1,
          p: c.property,
          o: c.operator,
          v: c.value,
          e: c.enabled
        })),
        f: state.returnFields,
        l: state.limit,
        lm: state.limitMode || 'rows'
      }
      return btoa(JSON.stringify(serialized))
    } catch (error) {
      console.error('Error serializing state:', error)
      return null
    }
  }, [])

  // Track processed initialCypherQuery to prevent infinite loops
  const processedCypherQueryRef = useRef<string | undefined>(undefined)
  const hasProcessedInitialQuery = useRef(false)

  // Load state from URL on mount or convert from Cypher query
  useEffect(() => {
    // Skip if we've already processed the initial query
    if (hasProcessedInitialQuery.current) {
      return
    }

    // Only process initialCypherQuery if it's new and different from what we've already processed
    if (initialCypherQuery && initialCypherQuery !== processedCypherQueryRef.current) {
      const converted = convertCypherToBuilderState(initialCypherQuery)
      if (converted) {
        processedCypherQueryRef.current = initialCypherQuery
        hasProcessedInitialQuery.current = true
        isUpdatingFromUrl.current = true
        shouldAutoExecute.current = true
        setRestorationComplete(false)
        hasAutoExecuted.current = false
        
        loadState({
          nodes: converted.nodes,
          relationships: converted.relationships,
          conditions: converted.conditions,
          returnFields: converted.returnFields,
          limit: converted.limit,
          limitMode: (converted as { limitMode?: 'rows' | 'nodes' }).limitMode || 'rows',
          nodeIdCounter: converted.nodeIdCounter,
          relationshipIdCounter: converted.relationshipIdCounter
        })
        
        const serialized = serializeState({
          nodes: converted.nodes,
          relationships: converted.relationships,
          conditions: converted.conditions,
          returnFields: converted.returnFields,
          limit: converted.limit,
          limitMode: (converted as { limitMode?: 'rows' | 'nodes' }).limitMode || 'rows'
        })
        
        if (serialized) {
          lastSerializedState.current = serialized
          
          const currentParams = new URLSearchParams(window.location.search)
          currentParams.set('mode', 'builder')
          if (converted.nodes.length > 0 || converted.relationships.length > 0 || converted.conditions.length > 0) {
            currentParams.set('builder', serialized)
          }
          currentParams.delete('cypher')
          const newUrl = currentParams.toString() ? `?${currentParams.toString()}` : window.location.pathname
          router.replace(newUrl, { scroll: false })
        }
        
        setTimeout(() => {
          setRestorationComplete(true)
          isInitialMount.current = false
          isUpdatingFromUrl.current = false
        }, 100)
        return
      }
    }

    // Only load from URL if we haven't just processed a Cypher query
    if (!initialCypherQuery || initialCypherQuery === processedCypherQueryRef.current) {
      const builderState = searchParams.get('builder')
      if (builderState) {
        const restored = deserializeState(builderState)
        if (restored) {
          hasProcessedInitialQuery.current = true
          isUpdatingFromUrl.current = true
          shouldAutoExecute.current = true
          setRestorationComplete(false)
          hasAutoExecuted.current = false
          
          loadState(restored)
          
          setTimeout(() => {
            setRestorationComplete(true)
            isInitialMount.current = false
          }, 100)
          return
        }
      }
    }
    
    if (isInitialMount.current) {
      hasProcessedInitialQuery.current = true
      isInitialMount.current = false
      setRestorationComplete(true)
    }
  }, [initialCypherQuery, deserializeState, serializeState, router, loadState, setRestorationComplete, searchParams])

  // Update URL when state changes (but not during initial mount or URL restoration)
  useEffect(() => {
    if (isInitialMount.current || isUpdatingFromUrl.current || !restorationComplete) {
      if (isUpdatingFromUrl.current) {
        isUpdatingFromUrl.current = false
      }
      return
    }

    const serialized = serializeState({
      nodes: matchNodes,
      relationships: matchRelationships,
      conditions,
      returnFields,
      limit,
      limitMode
    })
    
    if (serialized && serialized !== lastSerializedState.current) {
      lastSerializedState.current = serialized
      
      const currentParams = new URLSearchParams(window.location.search)
      currentParams.set('mode', 'builder')
      
      if (matchNodes.length > 0 || matchRelationships.length > 0 || conditions.length > 0) {
        currentParams.set('builder', serialized)
      } else {
        currentParams.delete('builder')
      }
      const newUrl = currentParams.toString() ? `?${currentParams.toString()}` : window.location.pathname
      router.replace(newUrl, { scroll: false })
    }
  }, [matchNodes, matchRelationships, conditions, returnFields, limit, limitMode, restorationComplete, serializeState, router])

  // Auto-generate query whenever state changes
  useEffect(() => {
    if (isInitialMount.current) {
      return
    }
    
    const query = generateQuery()
    onQueryGenerate(query)
  }, [matchNodes, matchRelationships, conditions, returnFields, limit, limitMode, generateQuery, onQueryGenerate])

  // Auto-execute after restoration
  useEffect(() => {
    if (restorationComplete && shouldAutoExecute.current && onExecuteRef.current && !hasAutoExecuted.current) {
      const timeoutId = setTimeout(() => {
        if (!hasAutoExecuted.current && shouldAutoExecute.current) {
          hasAutoExecuted.current = true
          shouldAutoExecute.current = false
          const finalQuery = generateQuery()
          onExecuteRef.current?.(finalQuery)
        }
      }, 150)
      
      return () => clearTimeout(timeoutId)
    }
  }, [restorationComplete, matchNodes, matchRelationships, conditions, returnFields, limit, generateQuery])

  // Auto-execute query when relationship enabled state changes
  const enabledStatesString = useMemo(() => {
    return matchRelationships.map(r => `${r.id}:${r.enabled !== false}`).join(',')
  }, [matchRelationships])
  
  useEffect(() => {
    if (isInitialMount.current || isUpdatingFromUrl.current || !onExecuteRef.current || isExecutingEnabledChange.current) {
      if (!isExecutingEnabledChange.current) {
        previousEnabledStates.current = enabledStatesString
      }
      return
    }
    
    if (previousEnabledStates.current !== enabledStatesString && previousEnabledStates.current !== '') {
      isExecutingEnabledChange.current = true
      const timeoutId = setTimeout(() => {
        const query = generateQuery()
        onExecuteRef.current?.(query)
        setTimeout(() => {
          isExecutingEnabledChange.current = false
          previousEnabledStates.current = enabledStatesString
        }, 200)
      }, 150)
      
      return () => {
        clearTimeout(timeoutId)
        isExecutingEnabledChange.current = false
      }
    }
    
    previousEnabledStates.current = enabledStatesString
  }, [enabledStatesString, generateQuery])

  // Auto-execute query when condition enabled state changes
  const conditionEnabledStatesString = useMemo(() => {
    return conditions.map(c => `${c.id}:${c.enabled !== false}`).join(',')
  }, [conditions])
  
  useEffect(() => {
    if (isInitialMount.current || isUpdatingFromUrl.current || !onExecuteRef.current || isExecutingEnabledChange.current) {
      if (!isExecutingEnabledChange.current) {
        previousEnabledStates.current = conditionEnabledStatesString
      }
      return
    }
    
    if (previousEnabledStates.current !== conditionEnabledStatesString && previousEnabledStates.current !== '') {
      isExecutingEnabledChange.current = true
      const timeoutId = setTimeout(() => {
        const query = generateQuery()
        onExecuteRef.current?.(query)
        setTimeout(() => {
          isExecutingEnabledChange.current = false
          previousEnabledStates.current = conditionEnabledStatesString
        }, 200)
      }, 150)
      
      return () => {
        clearTimeout(timeoutId)
        isExecutingEnabledChange.current = false
      }
    }
    
    previousEnabledStates.current = conditionEnabledStatesString
  }, [conditionEnabledStatesString, generateQuery])

  // Execute handler
  const handleExecute = useCallback(() => {
    const query = generateQuery()
    onExecuteRef.current?.(query)
  }, [generateQuery])

  return {
    // State
    matchNodes,
    matchRelationships,
    conditions,
    returnFields,
    limit,
    limitMode,
    popoverOpen,
    draggedFieldIndex,
    dragOverIndex,
    draggedNodeIndex,
    dragOverNodeIndex,
    
    // Setters
    setReturnFields,
    setLimit,
    setLimitMode,
    setPopoverOpen,
    setDraggedFieldIndex,
    setDragOverIndex,
    setDraggedNodeIndex,
    setDragOverNodeIndex,
    
    // Actions
    addMultipleNodes,
    removeNode,
    reorderNodes,
    addRelationship,
    removeRelationship,
    updateRelationship,
    addCondition,
    removeCondition,
    updateCondition,
    handleExecute,
    generateQuery,
  }
}
