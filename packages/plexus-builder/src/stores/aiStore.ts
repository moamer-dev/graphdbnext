'use client'

import { create } from 'zustand'
import type { NodePropertySuggestion } from '../ai/agents/NodePropertySuggestionAgent'
import type { RelationshipRecommendation } from '../ai/agents/RelationshipRecommendationAgent'

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: any
}

export interface ChatSession {
  id: string
  title?: string
  agentId: string
  workspaceId: string
  createdAt: number
  updatedAt: number
}

interface AiState {
  // Suggestions (Short-term context)
  nodeSuggestions: Record<string, NodePropertySuggestion> 
  relationshipRecommendations: Record<string, RelationshipRecommendation>
  isLoading: Record<string, boolean>
  error: Record<string, string | null>

  // Conversational History (Long-term persistence)
  sessions: ChatSession[]
  currentSessionId: string | null
  messages: Record<string, ChatMessage[]> // sessionId -> messages
}

interface AiActions {
  setNodeSuggestions: (nodeId: string, suggestions: NodePropertySuggestion) => void
  setRelationshipRecommendations: (edgeId: string, recommendations: RelationshipRecommendation) => void
  setLoading: (id: string, isLoading: boolean) => void
  setError: (id: string, error: string | null) => void
  
  // Chat Actions
  setSessions: (sessions: ChatSession[]) => void
  setCurrentSession: (sessionId: string | null) => void
  setMessages: (sessionId: string, messages: ChatMessage[]) => void
  addMessage: (sessionId: string, message: ChatMessage) => void
  
  clearNodeSuggestions: (nodeId: string) => void
  clearRelationshipRecommendations: (edgeId: string) => void
  clearAll: () => void
}

export type AiStore = AiState & AiActions

export const useAiStore = create<AiStore>((set, get) => ({
  nodeSuggestions: {},
  relationshipRecommendations: {},
  isLoading: {},
  error: {},
  
  sessions: [],
  currentSessionId: null,
  messages: {},

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

  setSessions: (sessions) => set({ sessions }),
  
  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
  
  setMessages: (sessionId, messages) => 
    set((state) => ({
      messages: { ...state.messages, [sessionId]: messages }
    })),
    
  addMessage: (sessionId, message) =>
    set((state) => ({
      messages: { 
        ...state.messages, 
        [sessionId]: [...(state.messages[sessionId] || []), message] 
      }
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

  clearAll: () => set({ 
    nodeSuggestions: {}, 
    relationshipRecommendations: {}, 
    isLoading: {}, 
    error: {},
    sessions: [],
    currentSessionId: null,
    messages: {}
  })
}))
