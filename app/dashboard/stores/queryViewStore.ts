'use client'

import { create } from 'zustand'

type QueryMode = 'library' | 'builder' | 'cypher'

interface QueryViewStore {
  activeMode: QueryMode
  cypherQuery: string
  
  setActiveMode: (mode: QueryMode) => void
  setCypherQuery: (query: string) => void
  reset: () => void
}

const initialState = {
  activeMode: 'library' as QueryMode,
  cypherQuery: ''
}

export const useQueryViewStore = create<QueryViewStore>((set) => ({
  ...initialState,
  
  setActiveMode: (mode) => set({ activeMode: mode }),
  
  setCypherQuery: (query) => set({ cypherQuery: query }),
  
  reset: () => set(initialState)
}))

