'use client'

import { create } from 'zustand'

export type ActionNodeType =
  | 'action:create-node'
  | 'action:create-relationship'
  | 'action:set-property'
  | 'action:skip'
  | 'action:create-node-text'
  | 'action:create-node-tokens'
  | 'action:process-children'
  | 'action:extract-property'
  | 'action:transform-text'
  | 'action:extract-text'
  | 'action:create-annotation'
  | 'action:create-reference'
  | 'action:defer-relationship'
  | 'action:extract-xml-content'
  | 'action:create-text-node'
  | 'action:create-token-nodes'
  | 'action:create-node-with-attributes'
  | 'action:create-node-complete'
  | 'action:extract-and-normalize-attributes'
  | 'action:create-annotation-nodes'
  | 'action:create-reference-chain'
  | 'action:merge-children-text'
  | 'action:create-conditional-node'
  | 'action:extract-and-compute-property'
  | 'action:create-node-with-filtered-children'
  | 'action:normalize-and-deduplicate'
  | 'action:create-hierarchical-nodes'
  | 'action:group'
  | 'action:copy-property'
  | 'action:merge-properties'
  | 'action:split-property'
  | 'action:format-property'
  | 'action:update-relationship'
  | 'action:delete-relationship'
  | 'action:reverse-relationship'
  | 'action:update-node'
  | 'action:delete-node'
  | 'action:clone-node'
  | 'action:merge-nodes'
  | 'action:validate-node'
  | 'action:validate-relationship'
  | 'action:report-error'
  | 'action:add-metadata'
  | 'action:tag-node'
  | 'action:set-timestamp'

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

