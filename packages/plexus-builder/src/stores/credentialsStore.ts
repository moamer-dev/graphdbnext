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
  storageSource: 'local' | 'db'
  workspaceId?: string | null
  createdAt: number
  updatedAt: number
  isActive?: boolean
}

interface CredentialsStore {
  credentials: ApiCredential[]
  
  // Actions
  setCredentials: (credentials: ApiCredential[]) => void
  addCredential: (credential: Omit<ApiCredential, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: number; updatedAt?: number }) => void
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
    const newCredential: ApiCredential = {
      ...credential,
      id: credential.id || Math.random().toString(36).substr(2, 9),
      createdAt: credential.createdAt || Date.now(),
      updatedAt: credential.updatedAt || Date.now()
    } as ApiCredential
    
    set((state) => ({
      credentials: [...state.credentials, newCredential]
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
    if (!type) return get().credentials
    return get().credentials.filter((cred) => cred.type === type)
  }
}))

