import { create } from 'zustand'

export type WorkflowStepKind = 'condition' | 'action'

export type WorkflowStepType =
  | 'has-attribute'
  | 'has-text'
  | 'has-children'
  | 'create-node'
  | 'create-relationship'
  | 'create-text-node'
  | 'create-node-text'
  | 'create-node-tokens'
  | 'set-property'
  | 'skip'

export type WorkflowStepGuard = 'always' | 'ifTrue' | 'ifFalse'

export interface WorkflowStep {
  id: string
  kind: WorkflowStepKind
  type: WorkflowStepType
  guard?: WorkflowStepGuard
  config: Record<string, any>
}

interface WorkflowState {
  stepsByNodeId: Record<string, WorkflowStep[]>
  addStep: (nodeId: string, step: Omit<WorkflowStep, 'id'>) => string
  updateStep: (nodeId: string, stepId: string, updates: Partial<WorkflowStep>) => void
  deleteStep: (nodeId: string, stepId: string) => void
  setSteps: (nodeId: string, steps: WorkflowStep[]) => void
}

const uid = () => `wf_${Math.random().toString(36).slice(2, 8)}`

export const useWorkflowStore = create<WorkflowState>((set) => ({
  stepsByNodeId: {},

  addStep: (nodeId, step) => {
    const id = uid()
    set((state) => {
      const existing = state.stepsByNodeId[nodeId] || []
      return {
        stepsByNodeId: {
          ...state.stepsByNodeId,
          [nodeId]: [...existing, { ...step, id }]
        }
      }
    })
    return id
  },

  updateStep: (nodeId, stepId, updates) => {
    set((state) => {
      const list = state.stepsByNodeId[nodeId] || []
      return {
        stepsByNodeId: {
          ...state.stepsByNodeId,
          [nodeId]: list.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
        }
      }
    })
  },

  deleteStep: (nodeId, stepId) => {
    set((state) => {
      const list = state.stepsByNodeId[nodeId] || []
      return {
        stepsByNodeId: {
          ...state.stepsByNodeId,
          [nodeId]: list.filter((s) => s.id !== stepId)
        }
      }
    })
  },

  setSteps: (nodeId, steps) => {
    set((state) => ({
      stepsByNodeId: {
        ...state.stepsByNodeId,
        [nodeId]: steps
      }
    }))
  }
}))

