'use client'

import { create } from 'zustand'

export type ToolNodeType =
  | 'tool:if'
  | 'tool:switch'
  | 'tool:delay'
  | 'tool:http'
  | 'tool:fetch-api'
  | 'tool:webhook'

export interface ToolCanvasNode {
  id: string
  type: ToolNodeType
  label: string
  targetNodeId?: string // Main node this tool is attached to
  config: Record<string, unknown>
  position: { x: number; y: number }
  inputs?: number
  outputs?: Array<{ id: string; label: string }>
}

export interface ToolCanvasEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

interface ToolCanvasState {
  nodes: ToolCanvasNode[]
  edges: ToolCanvasEdge[]
  selectedNodeId: string | null
  addNode: (node: Omit<ToolCanvasNode, 'id'>) => string
  updateNode: (id: string, updates: Partial<ToolCanvasNode>) => void
  deleteNode: (id: string) => void
  addEdge: (edge: Omit<ToolCanvasEdge, 'id'>) => string
  deleteEdge: (id: string) => void
  selectNode: (id: string | null) => void
  clear: () => void
}

const uid = () => `tool_${Math.random().toString(36).slice(2, 8)}`

export const useToolCanvasStore = create<ToolCanvasState>((set) => ({
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

