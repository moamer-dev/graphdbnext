'use client'

import { create } from 'zustand'
import type { NodePropertySuggestion } from '../ai/agents/NodePropertySuggestionAgent'
import type { RelationshipRecommendation } from '../ai/agents/RelationshipRecommendationAgent'

interface AiState {
  nodeSuggestions: Record<string, NodePropertySuggestion> // nodeId -> suggestions
  relationshipRecommendations: Record<string, RelationshipRecommendation> // edgeId -> recommendations
  isLoading: Record<string, boolean>
  error: Record<string, string | null>
}

interface AiActions {
  setNodeSuggestions: (nodeId: string, suggestions: NodePropertySuggestion) => void
  setRelationshipRecommendations: (edgeId: string, recommendations: RelationshipRecommendation) => void
  setLoading: (id: string, isLoading: boolean) => void
  setError: (id: string, error: string | null) => void
  clearNodeSuggestions: (nodeId: string) => void
  clearRelationshipRecommendations: (edgeId: string) => void
  clearAll: () => void
}

export type AiStore = AiState & AiActions

export const useAiStore = create<AiStore>((set) => ({
  nodeSuggestions: {},
  relationshipRecommendations: {},
  isLoading: {},
  error: {},

  setNodeSuggestions: (nodeId, suggestions) =>
    set((state) => ({
      nodeSuggestions: { ...state.nodeSuggestions, [nodeId]: suggestions }
    })),

  setRelationshipRecommendations: (edgeId, recommendations) =>
    set((state) => ({
      relationshipRecommendations: { ...state.relationshipRecommendations, [edgeId]: recommendations }
    })),

  setLoading: (id, isLoading) =>
    set((state) => ({
      isLoading: { ...state.isLoading, [id]: isLoading }
    })),

  setError: (id, error) =>
    set((state) => ({
      error: { ...state.error, [id]: error }
    })),

  clearNodeSuggestions: (nodeId) =>
    set((state) => {
      const { [nodeId]: _, ...rest } = state.nodeSuggestions
      return { nodeSuggestions: rest }
    }),

  clearRelationshipRecommendations: (edgeId) =>
    set((state) => {
      const { [edgeId]: _, ...rest } = state.relationshipRecommendations
      return { relationshipRecommendations: rest }
    }),

  clearAll: () => set({ nodeSuggestions: {}, relationshipRecommendations: {}, isLoading: {}, error: {} })
}))
