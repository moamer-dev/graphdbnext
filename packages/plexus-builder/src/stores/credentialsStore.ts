'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CredentialType = 
  | 'orcid'
  | 'geonames'
  | 'europeana'
  | 'getty'
  | 'custom'

export interface ApiCredential {
  id: string
  name: string
  type: CredentialType
  data: Record<string, string> // Encrypted or plain (for now plain, can add encryption later)
  createdAt: number
  updatedAt: number
}

interface CredentialsStore {
  credentials: ApiCredential[]
  addCredential: (credential: Omit<ApiCredential, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateCredential: (id: string, updates: Partial<Omit<ApiCredential, 'id' | 'createdAt'>>) => void
  deleteCredential: (id: string) => void
  getCredential: (id: string) => ApiCredential | undefined
  getCredentialsByType: (type: CredentialType) => ApiCredential[]
}

export const useCredentialsStore = create<CredentialsStore>()(
  persist(
    (set, get) => ({
      credentials: [],

      addCredential: (credential) => {
        const id = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const now = Date.now()
        const newCredential: ApiCredential = {
          ...credential,
          id,
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({
          credentials: [...state.credentials, newCredential]
        }))
        return id
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
    }),
    {
      name: 'api-credentials-storage',
      version: 1
    }
  )
)

