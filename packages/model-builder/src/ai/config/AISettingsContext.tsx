'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { AISettings, AISettingsStorage } from './types'
import { DEFAULT_AI_SETTINGS } from './types'
import { LocalStorageAISettings } from './storage'

interface AISettingsContextValue {
  settings: AISettings
  updateSettings: (updates: Partial<AISettings>) => Promise<void>
  isFeatureEnabled: (feature: keyof AISettings['features']) => boolean
  reloadSettings: () => Promise<void>
  isReady: boolean
}

const AISettingsContext = createContext<AISettingsContextValue | null>(null)

interface AISettingsProviderProps {
  children: React.ReactNode
  /** Direct settings object - simplest approach. If provided, storage is ignored. */
  settings?: AISettings
  /** Storage implementation - used if settings are not provided directly */
  storage?: AISettingsStorage
  /** Initial/partial settings - merged with loaded settings from storage */
  initialSettings?: Partial<AISettings>
}

export function AISettingsProvider({
  children,
  settings: directSettings,
  storage,
  initialSettings
}: AISettingsProviderProps) {
  // If settings are provided directly, use them (simplest approach)
  const [settings, setSettings] = useState<AISettings>(() => {
    if (directSettings) {
      return directSettings
    }
    return {
      ...DEFAULT_AI_SETTINGS,
      ...initialSettings
    }
  })
  const [isReady, setIsReady] = useState(!!directSettings) // Ready immediately if settings provided directly

  // Update settings when directSettings prop changes
  useEffect(() => {
    if (directSettings) {
      setSettings(directSettings)
      setIsReady(true)
    }
  }, [directSettings])

  const storageImpl = useMemo(
    () => storage || (typeof window !== 'undefined' && !directSettings ? new LocalStorageAISettings() : undefined),
    [storage, directSettings]
  )

  const loadSettings = useCallback(async () => {
    // Skip loading if settings are provided directly
    if (directSettings || !storageImpl) {
      setIsReady(true)
      return
    }

    try {
      const loaded = await storageImpl.getSettings()
      setSettings({
        ...DEFAULT_AI_SETTINGS,
        ...loaded,
        ...initialSettings
      })
    } catch (error) {
      console.error('Error loading AI settings:', error)
      setSettings({
        ...DEFAULT_AI_SETTINGS,
        ...initialSettings
      })
    } finally {
      setIsReady(true)
    }
  }, [storageImpl, initialSettings, directSettings])

  useEffect(() => {
    if (!directSettings) {
      loadSettings()
    }
  }, [loadSettings, directSettings])

  const updateSettings = useCallback(async (updates: Partial<AISettings>) => {
    // If settings are provided directly, throw error (read-only mode)
    if (directSettings) {
      throw new Error(
        'AI settings cannot be modified when provided directly. Update the settings in your parent application.'
      )
    }

    const newSettings: AISettings = {
      ...settings,
      ...updates,
      features: {
        ...settings.features,
        ...updates.features
      },
      model: {
        ...settings.model,
        ...updates.model
      }
    }

    setSettings(newSettings)

    if (storageImpl) {
      try {
        await storageImpl.saveSettings(newSettings)
      } catch (error) {
        console.error('Error saving AI settings:', error)
        setSettings(settings)
        throw error
      }
    }
  }, [settings, storageImpl, directSettings])

  const reloadSettings = useCallback(async () => {
    await loadSettings()
  }, [loadSettings])

  const isFeatureEnabled = useCallback((feature: keyof AISettings['features']): boolean => {
    if (!settings.enabled || !settings.features.enabled) {
      return false
    }
    return settings.features[feature] ?? false
  }, [settings])

  return (
    <AISettingsContext.Provider
      value={{
        settings,
        updateSettings,
        isFeatureEnabled,
        reloadSettings,
        isReady
      }}
    >
      {children}
    </AISettingsContext.Provider>
  )
}

export function useAISettings(): AISettingsContextValue {
  const context = useContext(AISettingsContext)
  if (!context) {
    // Return default settings if no provider - this should not happen if ModelBuilder
    // is wrapped, but provides a safe fallback
    console.warn('useAISettings called without AISettingsProvider. Using default settings.')
    return {
      settings: DEFAULT_AI_SETTINGS,
      updateSettings: async () => {
        console.warn('updateSettings called without AISettingsProvider')
      },
      isFeatureEnabled: () => false,
      reloadSettings: async () => {},
      isReady: true
    }
  }
  return context
}

export function useAIFeature(feature: keyof AISettings['features']): boolean {
  const { isFeatureEnabled } = useAISettings()
  return isFeatureEnabled(feature)
}

