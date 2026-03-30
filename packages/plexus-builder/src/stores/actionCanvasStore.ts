'use client'

import { create } from 'zustand'

export type ActionNodeType =
  | 'action:set-property'
  | 'action:create-relationship'
  | 'action:group'
  | 'action:skip'
  | 'action:extract-and-normalize-attributes'
  | 'action:update-node'
  | 'action:delete-node'
  | 'action:create-reference-chain'
  | 'action:format-property'
  | 'action:create-token-nodes'
  | 'action:merge-children-text'
  | 'action:create-text-node'
  | 'action:copy-property'
  | 'action:update-relationship'
  | 'action:extract-and-compute-property'
  | 'action:create-node-with-lookup'
  | 'action:merge-properties'
  | 'action:split-property'
  | 'action:clone-node'
  | 'action:merge-nodes'
  | 'action:create-node-complete'
  | 'action:create-annotation-nodes'
  | 'action:delete-relationship'
  | 'action:reverse-relationship'
  | 'action:defer-relationship'

export interface ActionCanvasNode {
  id: string
  type: ActionNodeType
  label: string
  config: Record<string, unknown>
  position: { x: number; y: number }
  isGroup?: boolean
  children?: string[] // Array of action IDs that belong to this group
  isExpanded?: boolean
  enabled?: boolean // For action groups, whether the group is enabled
}

export interface ActionCanvasEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

interface ActionCanvasState {
  nodes: ActionCanvasNode[]
  edges: ActionCanvasEdge[]
  selectedNodeId: string | null
  addNode: (node: Omit<ActionCanvasNode, 'id'>) => string
  updateNode: (id: string, updates: Partial<ActionCanvasNode>) => void
  deleteNode: (id: string) => void
  addEdge: (edge: Omit<ActionCanvasEdge, 'id'>) => string
  deleteEdge: (id: string) => void
  selectNode: (id: string | null) => void
  clear: () => void
}

const uid = () => `action_${Math.random().toString(36).slice(2, 8)}`

export const useActionCanvasStore = create<ActionCanvasState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  addNode: (node) => {
    const id = uid()
    set((state) => ({ nodes: [...state.nodes, { ...node, id }] }))
    return id
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n))
    }))
  },

  deleteNode: (id) => {
    set((state) => {
      const nodeToDelete = state.nodes.find(n => n.id === id)
      const childrenToDelete = nodeToDelete?.children || []
      
      // Delete the node and all its children
      const nodesToDelete = new Set([id, ...childrenToDelete])
      
      return {
        nodes: state.nodes.filter((n) => !nodesToDelete.has(n.id)),
        edges: state.edges.filter((e) => !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target)),
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
      }
    })
  },

  addEdge: (edge) => {
    const id = uid()
    set((state) => ({ edges: [...state.edges, { ...edge, id }] }))
    return id
  },

  deleteEdge: (id) => {
    set((state) => ({ edges: state.edges.filter((e) => e.id !== id) }))
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  clear: () => set({ nodes: [], edges: [], selectedNodeId: null })
}))

