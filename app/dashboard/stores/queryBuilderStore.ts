'use client'

import { create } from 'zustand'
import { QueryBuilderService, QueryNode, QueryRelationship, QueryCondition } from '@/lib/services/QueryBuilderService'

export interface QueryConditionType {
  id: string
  type: 'node' | 'relationship' | 'property' | 'path'
  nodeId?: string
  property?: string
  operator?: string
  value?: string
  enabled?: boolean
}

interface QueryBuilderStore {
  // Core Query State
  matchNodes: QueryNode[]
  matchRelationships: QueryRelationship[]
  conditions: QueryConditionType[]
  returnFields: string[]
  limit: string
  limitMode: 'rows' | 'nodes'
  
  // Internal Counters
  nodeIdCounter: number
  relationshipIdCounter: number
  
  // UI State
  restorationComplete: boolean
  
  // Actions - Node Management
  addMultipleNodes: (labels: string[]) => void
  removeNode: (id: string) => void
  reorderNodes: (draggedIndex: number, dropIndex: number) => void
  updateNode: (id: string, updates: Partial<QueryNode>) => void
  
  // Actions - Relationship Management
  addRelationship: () => void
  removeRelationship: (id: string) => void
  updateRelationship: (id: string, updates: Partial<QueryRelationship>) => void
  
  // Actions - Condition Management
  addCondition: () => void
  removeCondition: (id: string) => void
  updateCondition: (id: string, updates: Partial<QueryConditionType>) => void
  
  // Actions - Return Fields
  setReturnFields: (fields: string[]) => void
  
  // Actions - Limit
  setLimit: (limit: string) => void
  setLimitMode: (mode: 'rows' | 'nodes') => void
  
  // Actions - State Management
  setRestorationComplete: (complete: boolean) => void
  loadState: (state: {
    nodes: QueryNode[]
    relationships: QueryRelationship[]
    conditions: QueryConditionType[]
    returnFields: string[]
    limit: string
    limitMode?: 'rows' | 'nodes'
    nodeIdCounter: number
    relationshipIdCounter: number
  }) => void
  reset: () => void
  
  // Query Generation
  generateQuery: () => string
}

const initialState = {
  matchNodes: [] as QueryNode[],
  matchRelationships: [] as QueryRelationship[],
  conditions: [] as QueryConditionType[],
  returnFields: [] as string[],
  limit: '10',
  limitMode: 'rows' as 'rows' | 'nodes',
  nodeIdCounter: 2,
  relationshipIdCounter: 1,
  restorationComplete: false
}

const queryBuilderService = new QueryBuilderService()

export const useQueryBuilderStore = create<QueryBuilderStore>((set, get) => ({
  ...initialState,
  
  // Node Management
  addMultipleNodes: (labels: string[]) => {
    const state = get()
    const nodesWithoutPlaceholder = state.matchNodes.filter(n => n.label !== undefined)
    const existingAliases = new Set(nodesWithoutPlaceholder.map(n => n.alias))
    
    const newNodes = labels.map((label, idx) => {
      let alias: string
      if (nodesWithoutPlaceholder.length === 0 && idx === 0) {
        alias = 'n'
      } else {
        let aliasCharCode = 97
        let attempts = 0
        while (existingAliases.has(String.fromCharCode(aliasCharCode)) && attempts < 26) {
          aliasCharCode++
          attempts++
        }
        alias = String.fromCharCode(aliasCharCode)
      }
      existingAliases.add(alias)
      return { id: `node_${state.nodeIdCounter + idx}`, alias, label }
    })
    
    const updatedNodes = [...nodesWithoutPlaceholder, ...newNodes]
    
    set((prev) => {
      const filteredFields = prev.returnFields.filter(f => f !== '0')
      const newIndices = newNodes.map((_, idx) => String(nodesWithoutPlaceholder.length + idx))
      return {
        matchNodes: updatedNodes,
        nodeIdCounter: prev.nodeIdCounter + labels.length,
        returnFields: [...filteredFields, ...newIndices]
      }
    })
  },
  
  removeNode: (id: string) => {
    const state = get()
    const nodeIndex = state.matchNodes.findIndex(n => n.id === id)
    
    set((prev) => {
      const updatedNodes = prev.matchNodes.filter(n => n.id !== id)
      const updatedRelationships = prev.matchRelationships.filter(r => r.from !== id && r.to !== id)
      
      let updatedReturnFields = prev.returnFields
      if (nodeIndex >= 0) {
        updatedReturnFields = prev.returnFields
          .filter(f => f !== nodeIndex.toString())
          .map(f => {
            const idx = parseInt(f)
            if (!isNaN(idx) && idx > nodeIndex) {
              return (idx - 1).toString()
            }
            return f
          })
      }
      
      return {
        matchNodes: updatedNodes,
        matchRelationships: updatedRelationships,
        returnFields: updatedReturnFields
      }
    })
  },
  
  reorderNodes: (draggedIndex: number, dropIndex: number) => {
    set((prev) => {
      const newNodes = [...prev.matchNodes]
      const [removed] = newNodes.splice(draggedIndex, 1)
      newNodes.splice(dropIndex, 0, removed)
      
      // Update returnFields indices to match new positions
      const updatedReturnFields = prev.returnFields.map(fieldIndex => {
        const fieldIdx = parseInt(fieldIndex)
        if (isNaN(fieldIdx)) return fieldIndex
        
        // Adjust indices based on the move
        if (draggedIndex < dropIndex) {
          // Moving forward
          if (fieldIdx === draggedIndex) {
            return dropIndex.toString()
          } else if (fieldIdx > draggedIndex && fieldIdx <= dropIndex) {
            return (fieldIdx - 1).toString()
          }
        } else {
          // Moving backward
          if (fieldIdx === draggedIndex) {
            return dropIndex.toString()
          } else if (fieldIdx >= dropIndex && fieldIdx < draggedIndex) {
            return (fieldIdx + 1).toString()
          }
        }
        return fieldIndex
      })
      
      return {
        matchNodes: newNodes,
        returnFields: updatedReturnFields
      }
    })
  },
  
  updateNode: (id: string, updates: Partial<QueryNode>) => {
    set((prev) => ({
      matchNodes: prev.matchNodes.map(n => n.id === id ? { ...n, ...updates } : n)
    }))
  },
  
  // Relationship Management
  addRelationship: () => {
    const state = get()
    if (state.matchNodes.length < 2) return
    
    const from = state.matchNodes[0].id
    const to = state.matchNodes[1].id
    const newId = `rel_${state.relationshipIdCounter}`
    
    const existingAliases = new Set(state.matchRelationships.map(r => r.alias).filter(Boolean))
    let aliasNum = 1
    while (existingAliases.has(`r${aliasNum}`)) {
      aliasNum++
    }
    
    set((prev) => ({
      matchRelationships: [...prev.matchRelationships, {
        id: newId,
        from,
        to,
        alias: `r${aliasNum}`,
        matchType: prev.matchRelationships.length > 0 ? 'OPTIONAL_MATCH' : undefined,
        enabled: true
      }],
      relationshipIdCounter: prev.relationshipIdCounter + 1
    }))
  },
  
  removeRelationship: (id: string) => {
    set((prev) => ({
      matchRelationships: prev.matchRelationships.filter(r => r.id !== id)
    }))
  },
  
  updateRelationship: (id: string, updates: Partial<QueryRelationship>) => {
    set((prev) => ({
      matchRelationships: prev.matchRelationships.map(r => {
        if (r.id !== id) return r
        
        const updated = { ...r, ...updates }
        
        if (updates.from !== undefined || updates.to !== undefined) {
          // Clear the type when nodes change
          updated.type = undefined
        }
        
        return updated
      })
    }))
  },
  
  // Condition Management
  addCondition: () => {
    const state = get()
    const defaultNodeId = state.matchNodes.length > 0 ? state.matchNodes[0].id : undefined
    const newId = `cond_${state.relationshipIdCounter}`
    
    set((prev) => ({
      conditions: [...prev.conditions, {
        id: newId,
        type: 'property' as const,
        nodeId: defaultNodeId,
        operator: '='
      }],
      relationshipIdCounter: prev.relationshipIdCounter + 1
    }))
  },
  
  removeCondition: (id: string) => {
    set((prev) => ({
      conditions: prev.conditions.filter(c => c.id !== id)
    }))
  },
  
  updateCondition: (id: string, updates: Partial<QueryConditionType>) => {
    set((prev) => ({
      conditions: prev.conditions.map(c => c.id === id ? { ...c, ...updates } : c)
    }))
  },
  
  // Return Fields
  setReturnFields: (fields: string[]) => {
    set({ returnFields: fields })
  },
  
  // Limit
  setLimit: (limit: string) => {
    set({ limit })
  },
  
  setLimitMode: (mode: 'rows' | 'nodes') => {
    set({ limitMode: mode })
  },
  
  // State Management
  setRestorationComplete: (complete: boolean) => {
    set({ restorationComplete: complete })
  },
  
  loadState: (state) => {
    set({
      matchNodes: state.nodes,
      matchRelationships: state.relationships,
      conditions: state.conditions,
      returnFields: state.returnFields,
      limit: state.limit,
      limitMode: state.limitMode || 'rows',
      nodeIdCounter: state.nodeIdCounter,
      relationshipIdCounter: state.relationshipIdCounter,
      restorationComplete: false
    })
  },
  
  reset: () => {
    set(initialState)
  },
  
  // Query Generation
  generateQuery: () => {
    const state = get()
    // Filter out disabled conditions (similar to how relationships are filtered)
    const enabledConditions = state.conditions.filter(cond => cond.enabled !== false)
    const builderState = {
      nodes: state.matchNodes,
      relationships: state.matchRelationships,
      conditions: enabledConditions.map(c => ({
        id: c.id,
        type: c.type,
        nodeId: c.nodeId,
        property: c.property,
        operator: c.operator,
        value: c.value
      })) as QueryCondition[],
      returnFields: state.returnFields,
      limit: state.limit,
      limitMode: state.limitMode
    }
    return queryBuilderService.generateQuery(builderState)
  }
}))

