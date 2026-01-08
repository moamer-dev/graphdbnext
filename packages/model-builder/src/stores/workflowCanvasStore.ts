'use client'

import { create } from 'zustand'

export type WorkflowNodeKind = 'trigger' | 'condition' | 'action'
export type WorkflowNodeType =
  | 'trigger:xml-start'
  | 'condition:has-attribute'
  | 'condition:has-text'
  | 'condition:has-children'
  | 'action:create-node'
  | 'action:create-relationship'
  | 'action:set-property'
  | 'action:skip'
  | 'action:create-node-text'
  | 'action:create-node-tokens'
  | 'tool:if'
  | 'tool:switch'
  | 'tool:loop'
  | 'tool:merge'
  | 'tool:filter'
  | 'tool:delay'

export interface WorkflowCanvasNode {
  id: string
  kind: WorkflowNodeKind
  type: WorkflowNodeType
  label: string
  targetNodeId?: string
  config: Record<string, any>
  position: { x: number; y: number }
}

export interface WorkflowCanvasEdge {
  id: string
  source: string
  target: string
}

interface WorkflowCanvasState {
  nodes: WorkflowCanvasNode[]
  edges: WorkflowCanvasEdge[]
  selectedNodeId: string | null
  addNode: (node: Omit<WorkflowCanvasNode, 'id'>) => string
  updateNode: (id: string, updates: Partial<WorkflowCanvasNode>) => void
  deleteNode: (id: string) => void
  addEdge: (edge: Omit<WorkflowCanvasEdge, 'id'>) => string
  deleteEdge: (id: string) => void
  selectNode: (id: string | null) => void
  clear: () => void
}

const uid = () => `wfn_${Math.random().toString(36).slice(2, 8)}`

export const useWorkflowCanvasStore = create<WorkflowCanvasState>((set) => ({
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
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
    }))
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

