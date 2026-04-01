'use client'

import { create } from 'zustand'

export type CredentialType = 
  | 'orcid'
  | 'geonames'
  | 'europeana'
  | 'getty'
  | 'apiKey'
  | 'bearer'
  | 'basic'
  | 'custom'

export interface ApiCredential {
  id: string
  name: string
  type: CredentialType
  data: Record<string, string> // Encrypted or plain
  createdAt: number
  updatedAt: number
  isActive?: boolean
}

interface CredentialsStore {
  credentials: ApiCredential[]
  
  // Actions
  setCredentials: (credentials: ApiCredential[]) => void
  addCredential: (credential: ApiCredential) => void
  updateCredential: (id: string, updates: Partial<ApiCredential>) => void
  deleteCredential: (id: string) => void
  getCredential: (id: string) => ApiCredential | undefined
  getCredentialsByType: (type: CredentialType) => ApiCredential[]
}

export const useCredentialsStore = create<CredentialsStore>((set, get) => ({
  credentials: [],

  setCredentials: (credentials) => {
    set({ credentials })
  },

  addCredential: (credential) => {
    set((state) => ({
      credentials: [...state.credentials, credential]
    }))
  },

  updateCredential: (id, updates) => {
    set((state) => ({
      credentials: state.credentials.map((cred) =>
        cred.id === id
          ? { ...cred, ...updates, updatedAt: Date.now() }
          : cred
      )
    }))
  },

  deleteCredential: (id) => {
    set((state) => ({
      credentials: state.credentials.filter((cred) => cred.id !== id)
    }))
  },

  getCredential: (id) => {
    return get().credentials.find((cred) => cred.id === id)
  },

  getCredentialsByType: (type) => {
    return get().credentials.filter((cred) => cred.type === type)
  }
}))

