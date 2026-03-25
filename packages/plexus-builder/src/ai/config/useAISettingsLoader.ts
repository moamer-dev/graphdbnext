import { useState, useEffect } from 'react'
import type { AISettings } from './types'
import { DEFAULT_AI_SETTINGS } from './types'

/**
 * Simple hook to load AI settings from an API endpoint.
 * Use this when you store settings in a database.
 * 
 * @example
 * ```tsx
 * const settings = useAISettingsLoader('/api/ai-settings')
 * 
 * if (!settings) return <div>Loading...</div>
 * 
 * return (
 *   <AISettingsProvider settings={settings}>
 *     <ModelBuilder />
 *   </AISettingsProvider>
 * )
 * ```
 */
export function useAISettingsLoader(apiUrl: string): AISettings | null {
  const [settings, setSettings] = useState<AISettings | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json() as AISettings
          setSettings(data)
        } else {
          console.warn('Failed to fetch AI settings, using defaults')
          setSettings(DEFAULT_AI_SETTINGS)
        }
      } catch (error) {
        console.error('Error fetching AI settings:', error)
        setSettings(DEFAULT_AI_SETTINGS)
      }
    }

    fetchSettings()
  }, [apiUrl])

  return settings
}

