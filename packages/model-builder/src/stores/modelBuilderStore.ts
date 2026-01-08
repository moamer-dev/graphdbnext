'use client'

import { create } from 'zustand'
import { arrayMove } from '@dnd-kit/sortable'
import type { Node, Relationship, ModelBuilderState, NodeGroup, RelationshipType } from '../types'

interface ModelBuilderActions {
  // Node actions
  addNode: (node: Omit<Node, 'id' | 'position'>) => string
  updateNode: (id: string, updates: Partial<Node>) => void
  deleteNode: (id: string) => void
  setNodePosition: (id: string, position: { x: number; y: number }) => void
  reorderNodes: (activeId: string, overId: string) => void

  // Relationship actions
  addRelationship: (relationship: Omit<Relationship, 'id'>) => string
  updateRelationship: (id: string, updates: Partial<Relationship>, updateAllWithType?: boolean, oldType?: string) => void
  deleteRelationship: (id: string) => void

  // Relationship type actions
  addRelationshipType: (type: RelationshipType) => void
  getRelationshipType: (type: string) => RelationshipType | undefined

  // Selection
  selectNode: (id: string | null) => void
  selectRelationship: (id: string | null) => void

  // Metadata
  updateMetadata: (metadata: Partial<ModelBuilderState['metadata']>) => void

  // Group actions
  addGroup: (name: string) => string
  updateGroup: (id: string, updates: Partial<NodeGroup>) => void
  deleteGroup: (id: string, deleteNodes?: boolean) => void
  toggleGroup: (id: string) => void
  reorderUngroupedNodes: (activeId: string, overId: string) => void
  moveNodeToGroup: (nodeId: string, groupId: string | null) => void

  // Bulk operations
  clear: () => void
  loadState: (state: Partial<ModelBuilderState>) => void
  organizeLayout: () => void

  // Validation
  validate: () => { valid: boolean; errors: string[] }

  // Visibility
  setHideUnconnectedNodes: (hide: boolean) => void

  // Root node management
  // Root node management
  setRootNodeId: (nodeId: string | null) => void

  // Semantic
  // Semantic
  setSelectedOntologyId: (ontologyId: string | null) => void
  setIsSemanticEnabled: (enabled: boolean) => void
}

export type ModelBuilderStore = ModelBuilderState & ModelBuilderActions

const initialState: ModelBuilderState = {
  nodes: [],
  relationships: [],
  relationshipTypes: [],
  groups: [],
  selectedNode: null,
  selectedRelationship: null,
  hideUnconnectedNodes: false,
  rootNodeId: null,
  selectedOntologyId: null,
  isSemanticEnabled: false,
  metadata: {
    name: '',
    description: '',
    version: '1.0.0'
  }
}

export const useModelBuilderStore = create<ModelBuilderStore>((set, get) => ({
  ...initialState,

  addNode: (nodeData: Omit<Node, 'id' | 'position'>): string => {
    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const state = get()
    // Set order for ungrouped nodes: find max order from groups and ungrouped nodes, add 1
    let maxOrder = -1
    state.groups.forEach((g) => {
      if (g.order > maxOrder) maxOrder = g.order
    })
    state.nodes.filter((n: Node) => !n.groupId && n.order !== undefined).forEach((n: Node) => {
      if (n.order! > maxOrder) maxOrder = n.order!
    })
    const order = nodeData.groupId ? undefined : maxOrder + 1
    const newNode: Node = {
      ...nodeData,
      id,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      order
    }
    set((state: ModelBuilderState) => ({
      nodes: [...state.nodes, newNode]
    }))
    return id
  },

  updateNode: (id: string, updates: Partial<Node>): void => {
    set((state: ModelBuilderState) => ({
      nodes: state.nodes.map((node: Node) =>
        node.id === id ? { ...node, ...updates } : node
      )
    }))
  },

  deleteNode: (id: string): void => {
    set((state: ModelBuilderState) => ({
      nodes: state.nodes.filter((node: Node) => node.id !== id),
      relationships: state.relationships.filter(
        (rel: Relationship) => rel.from !== id && rel.to !== id
      ),
      selectedNode: state.selectedNode === id ? null : state.selectedNode
    }))
  },

  setNodePosition: (id: string, position: { x: number; y: number }): void => {
    set((state: ModelBuilderState) => ({
      nodes: state.nodes.map((node: Node) =>
        node.id === id ? { ...node, position } : node
      )
    }))
  },

  reorderNodes: (activeId: string, overId: string): void => {
    console.log('reorderNodes called:', { activeId, overId })
    set((state: ModelBuilderState) => {
      const nodes = [...state.nodes]
      const activeIndex = nodes.findIndex((node: Node) => node.id === activeId)
      const overIndex = nodes.findIndex((node: Node) => node.id === overId)

      console.log('Indices:', { activeIndex, overIndex })

      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
        console.log('Invalid indices, returning state')
        return state
      }

      const activeNode = nodes[activeIndex]
      const overNode = nodes[overIndex]

      console.log('Nodes:', {
        active: { id: activeNode.id, groupId: activeNode.groupId },
        over: { id: overNode.id, groupId: overNode.groupId }
      })

      // Only reorder if both nodes are in the same group (or both ungrouped)
      if (activeNode.groupId === overNode.groupId) {
        // Create new array with reordered items (immutable)
        const newNodes = [...nodes]
        const [removed] = newNodes.splice(activeIndex, 1)
        newNodes.splice(overIndex, 0, removed)
        console.log('Reordered nodes:', newNodes.map(n => ({ id: n.id, label: n.label })))
        return { ...state, nodes: newNodes }
      }

      console.log('Nodes not in same group, returning state')
      return state
    })
  },

  addRelationship: (relData: Omit<Relationship, 'id'>): string => {
    const id = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newRel: Relationship = {
      ...relData,
      id
    }
    set((state: ModelBuilderState) => {
      // Add relationship type if it doesn't exist
      const existingType = state.relationshipTypes.find((rt: RelationshipType) => rt.type === relData.type)
      const updatedRelationshipTypes = existingType
        ? state.relationshipTypes
        : [
          ...state.relationshipTypes,
          {
            type: relData.type,
            properties: relData.properties,
            cardinality: relData.cardinality
          }
        ]

      return {
        relationships: [...state.relationships, newRel],
        relationshipTypes: updatedRelationshipTypes
      }
    })
    return id
  },

  updateRelationship: (id: string, updates: Partial<Relationship>, updateAllWithType?: boolean, oldType?: string): void => {
    set((state: ModelBuilderState) => {
      const relationship = state.relationships.find((rel: Relationship) => rel.id === id)
      if (!relationship) return state

      const oldTypeToUse = oldType || relationship.type
      const newType = updates.type

      // Update relationships
      const updatedRelationships = state.relationships.map((rel: Relationship) => {
        // If updateAllWithType is true and this relationship has the same type, update it
        if (updateAllWithType && oldTypeToUse && newType && rel.type === oldTypeToUse) {
          // For other relationships, only update the type
          if (rel.id === id) {
            return { ...rel, ...updates }
          } else {
            return { ...rel, type: newType }
          }
        }
        // Otherwise, only update the specific relationship
        return rel.id === id ? { ...rel, ...updates } : rel
      })

      // Update relationshipTypes if type was changed
      let updatedRelationshipTypes = state.relationshipTypes
      if (newType && oldTypeToUse !== newType) {
        // Remove old type if no relationships use it anymore
        const oldTypeStillUsed = updatedRelationships.some((rel: Relationship) => rel.type === oldTypeToUse)
        if (!oldTypeStillUsed) {
          updatedRelationshipTypes = updatedRelationshipTypes.filter((rt: RelationshipType) => rt.type !== oldTypeToUse)
        }

        // Add new type if it doesn't exist
        const newTypeExists = updatedRelationshipTypes.some((rt: RelationshipType) => rt.type === newType)
        if (!newTypeExists) {
          const updatedRel = updatedRelationships.find((r: Relationship) => r.id === id)
          updatedRelationshipTypes = [
            ...updatedRelationshipTypes,
            {
              type: newType,
              properties: updatedRel?.properties,
              cardinality: updatedRel?.cardinality
            }
          ]
        }
      }

      return {
        relationships: updatedRelationships,
        relationshipTypes: updatedRelationshipTypes
      }
    })
  },

  deleteRelationship: (id: string): void => {
    set((state: ModelBuilderState) => ({
      relationships: state.relationships.filter((rel: Relationship) => rel.id !== id),
      selectedRelationship: state.selectedRelationship === id ? null : state.selectedRelationship
    }))
  },

  selectNode: (id: string | null): void => {
    set((state: ModelBuilderState) => ({
      selectedNode: id,
      // Only clear relationship when selecting a node (not when clearing)
      selectedRelationship: id ? null : state.selectedRelationship
    }))
    setTimeout(() => {
    }, 0)
  },

  selectRelationship: (id: string | null): void => {
    set((state: ModelBuilderState) => ({
      selectedRelationship: id,
      // Only clear node when selecting a relationship; keep current node when clearing
      selectedNode: id ? null : state.selectedNode
    }))
  },

  updateMetadata: (metadata: Partial<ModelBuilderState['metadata']>): void => {
    set((state: ModelBuilderState) => ({
      metadata: { ...state.metadata, ...metadata }
    }))
  },

  addGroup: (name: string): string => {
    const id = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const state = get()
    // Groups use simple creation order (not orderable)
    // Groups are open by default
    const order = state.groups.length
    const newGroup: NodeGroup = {
      id,
      name: name.trim(),
      collapsed: false, // Open by default
      order
    }
    set((state: ModelBuilderStore) => ({
      groups: [...state.groups, newGroup]
    }))
    return id
  },

  updateGroup: (id: string, updates: Partial<NodeGroup>): void => {
    set((state: ModelBuilderStore) => ({
      groups: state.groups.map((group: NodeGroup) =>
        group.id === id ? { ...group, ...updates } : group
      )
    }))
  },

  deleteGroup: (id: string, deleteNodes: boolean = false): void => {
    set((state: ModelBuilderStore) => {
      const newGroups = state.groups.filter((group: NodeGroup) => group.id !== id)

      let newNodes: Node[]
      if (deleteNodes) {
        // Delete the group and all its nodes
        newNodes = state.nodes.filter((node: Node) => node.groupId !== id)
      } else {
        // Delete the group but keep nodes (ungroup them)
        newNodes = state.nodes.map((node: Node) =>
          node.groupId === id ? { ...node, groupId: undefined } : node
        )
      }

      return { ...state, groups: newGroups, nodes: newNodes }
    })
  },

  toggleGroup: (id: string): void => {
    set((state: ModelBuilderStore) => ({
      groups: state.groups.map((group: NodeGroup) =>
        group.id === id ? { ...group, collapsed: !group.collapsed } : group
      )
    }))
  },

  reorderGroups: (activeId: string, overId: string): void => {
    set((state: ModelBuilderStore) => {
      const groups = [...state.groups]
      const activeIndex = groups.findIndex((group: NodeGroup) => group.id === activeId)
      const overIndex = groups.findIndex((group: NodeGroup) => group.id === overId)

      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
        return state
      }

      const newGroups = [...groups]
      const [removed] = newGroups.splice(activeIndex, 1)
      newGroups.splice(overIndex, 0, removed)
      // Update order values
      newGroups.forEach((group: NodeGroup, index: number) => {
        group.order = index
      })
      return { ...state, groups: newGroups }
    })
  },

  reorderUngroupedNodes: (activeId: string, overId: string): void => {
    set((state: ModelBuilderStore) => {
      const activeNode = state.nodes.find((n: Node) => n.id === activeId && !n.groupId)
      const overNode = state.nodes.find((n: Node) => n.id === overId && !n.groupId)

      if (!activeNode || !overNode || activeNode.order === undefined || overNode.order === undefined) {
        return state
      }

      // Swap orders: set active node's order to over node's order
      const targetOrder = overNode.order

      // Update all ungrouped nodes to shift orders
      const newNodes = state.nodes.map((n: Node) => {
        if (n.groupId) return n // Don't change grouped nodes
        if (n.id === activeId) {
          return { ...n, order: targetOrder }
        }
        // Shift nodes between active and target positions
        if (activeNode.order! < targetOrder) {
          // Moving down: shift nodes up
          if (n.order !== undefined && n.order > activeNode.order! && n.order <= targetOrder) {
            return { ...n, order: n.order - 1 }
          }
        } else {
          // Moving up: shift nodes down
          if (n.order !== undefined && n.order >= targetOrder && n.order < activeNode.order!) {
            return { ...n, order: n.order + 1 }
          }
        }
        return n
      })

      return { ...state, nodes: newNodes }
    })
  },

  moveNodeToGroup: (nodeId: string, groupId: string | null): void => {
    set((state: ModelBuilderStore) => {
      const node = state.nodes.find((n: Node) => n.id === nodeId)
      if (!node) {
        return state
      }

      // If moving to a group, set groupId and remove order (nodes in groups don't have order)
      // If moving to ungrouped, remove groupId and set order
      const newNodes = state.nodes.map((n: Node) => {
        if (n.id === nodeId) {
          if (groupId) {
            // Moving to a group
            return { ...n, groupId, order: undefined }
          } else {
            // Moving to ungrouped - calculate order
            const ungroupedNodes = state.nodes.filter((n: Node) => !n.groupId && n.id !== nodeId)
            const maxOrder = ungroupedNodes.length > 0
              ? Math.max(...ungroupedNodes.map((n: Node) => n.order ?? -1))
              : -1
            return { ...n, groupId: undefined, order: maxOrder + 1 }
          }
        }
        return n
      })

      return { ...state, nodes: newNodes }
    })
  },

  moveGroupBeforeNode: (groupId: string, nodeId: string): void => {
    set((state: ModelBuilderStore) => {
      const group = state.groups.find((g) => g.id === groupId)
      const node = state.nodes.find((n: Node) => n.id === nodeId && !n.groupId)

      if (!group || !node || node.order === undefined) {
        return state
      }

      // Set group order to node order (this positions it before the node)
      const targetOrder = node.order

      // Update all groups and ungrouped nodes to shift orders
      const newGroups = state.groups.map((g) => {
        if (g.id === groupId) {
          return { ...g, order: targetOrder }
        }
        // Shift groups that are at or after target position
        if (g.order >= targetOrder) {
          return { ...g, order: g.order + 1 }
        }
        return g
      })

      const newNodes = state.nodes.map((n: Node) => {
        if (n.groupId) return n // Don't change grouped nodes
        // Shift ungrouped nodes that are at or after target position
        if (n.order !== undefined && n.order >= targetOrder) {
          return { ...n, order: n.order + 1 }
        }
        return n
      })

      return { ...state, groups: newGroups, nodes: newNodes }
    })
  },

  moveNodeBeforeGroup: (nodeId: string, groupId: string): void => {
    set((state: ModelBuilderStore) => {
      const node = state.nodes.find((n: Node) => n.id === nodeId && !n.groupId)
      const group = state.groups.find((g) => g.id === groupId)

      if (!node || !group || node.order === undefined) {
        return state
      }

      // Set node order to group order (this positions it before the group)
      const targetOrder = group.order

      // Update all groups and ungrouped nodes to shift orders
      const newGroups = state.groups.map((g) => {
        // Shift groups that are at or after target position
        if (g.order >= targetOrder) {
          return { ...g, order: g.order + 1 }
        }
        return g
      })

      const newNodes = state.nodes.map((n: Node) => {
        if (n.groupId) return n // Don't change grouped nodes
        if (n.id === nodeId) {
          return { ...n, order: targetOrder }
        }
        // Shift ungrouped nodes that are at or after target position
        if (n.order !== undefined && n.order >= targetOrder) {
          return { ...n, order: n.order + 1 }
        }
        return n
      })

      return { ...state, groups: newGroups, nodes: newNodes }
    })
  },

  addRelationshipType: (type: RelationshipType): void => {
    set((state: ModelBuilderState) => {
      const existing = state.relationshipTypes.find((rt: RelationshipType) => rt.type === type.type)
      if (existing) {
        return state
      }
      return {
        relationshipTypes: [...state.relationshipTypes, type]
      }
    })
  },

  getRelationshipType: (type: string): RelationshipType | undefined => {
    return get().relationshipTypes.find((rt: RelationshipType) => rt.type === type)
  },

  clear: (): void => {
    set(initialState)
  },

  loadState: (state: Partial<ModelBuilderState>): void => {
    set((current: ModelBuilderState) => {
      // Extract unique relationship types from loaded relationships
      const relationshipTypesSet = new Set<string>()
      const relationshipTypes: RelationshipType[] = []

      if (state.relationships) {
        state.relationships.forEach((rel: Relationship) => {
          if (!relationshipTypesSet.has(rel.type)) {
            relationshipTypesSet.add(rel.type)
            relationshipTypes.push({
              type: rel.type,
              properties: rel.properties,
              cardinality: rel.cardinality
            })
          }
        })
      }

      return {
        ...current,
        ...state,
        relationshipTypes: relationshipTypes.length > 0 ? relationshipTypes : (state.relationshipTypes || current.relationshipTypes)
      }
    })
  },

  organizeLayout: (): void => {
    const state = get()
    // Import layout utility dynamically to avoid circular dependencies
    import('../utils/layout').then(({ calculateHierarchicalLayout }) => {
      const positions = calculateHierarchicalLayout(state.nodes, state.relationships)
      const updatedNodes = state.nodes.map((node: Node) => {
        const newPosition = positions.get(node.id)
        return newPosition ? { ...node, position: newPosition } : node
      })
      set({ nodes: updatedNodes })
    })
  },

  validate: (): { valid: boolean; errors: string[] } => {
    const state = get()
    const errors: string[] = []

    if (!state.metadata.name.trim()) {
      errors.push('Model name is required')
    }

    if (state.nodes.length === 0) {
      errors.push('At least one node is required')
    }

    // Validate relationships reference existing nodes
    const nodeIds = new Set(state.nodes.map((n: Node) => n.id))
    state.relationships.forEach((rel: Relationship) => {
      if (!nodeIds.has(rel.from)) {
        errors.push(`Relationship "${rel.type}" references non-existent node: ${rel.from}`)
      }
      if (!nodeIds.has(rel.to)) {
        errors.push(`Relationship "${rel.type}" references non-existent node: ${rel.to}`)
      }
    })

    // Validate node properties
    state.nodes.forEach((node: Node) => {
      if (!node.label.trim()) {
        errors.push(`Node "${node.id}" must have a label`)
      }
      if (!node.type.trim()) {
        errors.push(`Node "${node.id}" must have a type`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  },

  setHideUnconnectedNodes: (hide: boolean) => {
    set({ hideUnconnectedNodes: hide })
  },

  setRootNodeId: (nodeId: string | null) => {
    // Ensure only one root node exists
    set({ rootNodeId: nodeId })
  },

  setSelectedOntologyId: (ontologyId: string | null) => {
    set({ selectedOntologyId: ontologyId })
  },

  setIsSemanticEnabled: (enabled: boolean) => {
    set({ isSemanticEnabled: enabled })
  }
}))

