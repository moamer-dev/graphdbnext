import { useState, useMemo } from 'react'
import { useAISettings } from '../../ai/config'
import type { AIModelProvider, AIModelName } from '../../ai/config/types'

interface UseAISettingsPanelProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function useAISettingsPanel({ open: externalOpen, onOpenChange: externalOnOpenChange }: UseAISettingsPanelProps = {}) {
  const { settings, updateSettings, isReady } = useAISettings()
  const [internalOpen, setInternalOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange ? externalOnOpenChange : setInternalOpen
  
  const isControlled = externalOpen !== undefined || externalOnOpenChange !== undefined

  const initialApiKey = useMemo(() => settings.model.apiKey || '', [settings.model.apiKey])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && isReady) {
      setApiKey(initialApiKey)
    }
  }

  const handleSave = async () => {
    try {
      const trimmedApiKey = apiKey.trim()
      await updateSettings({
        model: {
          ...settings.model,
          apiKey: trimmedApiKey
        }
      })
      setOpen(false)
    } catch (error) {
      console.error('Error saving AI settings:', error)
      throw error
    }
  }

  const handleFeatureToggle = async (feature: keyof typeof settings.features, value: boolean) => {
    await updateSettings({
      features: {
        ...settings.features,
        [feature]: value
      }
    })
  }

  const handleModelChange = async (provider: AIModelProvider, modelName: AIModelName) => {
    await updateSettings({
      model: {
        ...settings.model,
        provider,
        modelName
      }
    })
  }

  const handleEnableToggle = async (checked: boolean) => {
    await updateSettings({ enabled: checked })
    if (checked && !settings.features.enabled) {
      await updateSettings({ features: { ...settings.features, enabled: true } })
    }
  }

  const handleFeaturesToggle = async (checked: boolean) => {
    await updateSettings({
      features: { ...settings.features, enabled: checked }
    })
  }

  const handleBaseUrlChange = (baseUrl: string) => {
    updateSettings({
      model: { ...settings.model, baseUrl }
    })
  }

  const handleTemperatureChange = (temperature: number) => {
    updateSettings({
      model: {
        ...settings.model,
        temperature
      }
    })
  }

  return {
    settings,
    isReady,
    open,
    apiKey,
    setApiKey,
    isControlled,
    handleOpenChange,
    handleSave,
    handleFeatureToggle,
    handleModelChange,
    handleEnableToggle,
    handleFeaturesToggle,
    handleBaseUrlChange,
    handleTemperatureChange
  }
}

