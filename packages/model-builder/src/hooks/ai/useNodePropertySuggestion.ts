import { useState, useEffect } from 'react'
import { useAISettings, useAIFeature } from '../../ai/config'
import { suggestNodeProperties, type NodePropertySuggestion } from '../../ai/agents/NodePropertySuggestionAgent'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import type { Node } from '../../types'
import { toast } from '../../utils/toast'

interface UseNodePropertySuggestionProps {
  node: Node | null
  onApply: (properties: Array<{
    key: string
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
    required: boolean
    description?: string
  }>) => void
}

export function useNodePropertySuggestion({ node, onApply }: UseNodePropertySuggestionProps) {
  const [suggestions, setSuggestions] = useState<NodePropertySuggestion | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { settings, isReady } = useAISettings()
  const isEnabled = useAIFeature('nodePropertySuggestion')
  const { nodes } = useModelBuilderStore()

  useEffect(() => {
    setSuggestions(null)
    setError(null)
  }, [node?.id])

  const handleGetSuggestions = async () => {
    if (!node || !isReady || !settings.enabled) return

    setIsLoading(true)
    setError(null)
    setSuggestions(null)

    try {
      const result = await suggestNodeProperties(node, nodes, undefined, settings)
      setSuggestions(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyProperties = (propertiesToApply: Array<{
    key: string
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
    required?: boolean
    description?: string
  }>) => {
    onApply(
      propertiesToApply.map((p) => ({
        key: p.key,
        type: p.type,
        required: p.required ?? false,
        description: p.description,
      }))
    )
    toast.success(`Applied ${propertiesToApply.length} property suggestion${propertiesToApply.length > 1 ? 's' : ''}`)
  }

  const allSuggestions = suggestions
    ? [
        ...(suggestions.recommended || []),
        ...suggestions.suggestions.filter(
          (s) => !suggestions.recommended?.some((r) => r.key === s.key)
        ),
      ]
    : []

  return {
    suggestions,
    isLoading,
    error,
    isEnabled,
    isReady,
    settings,
    allSuggestions,
    handleGetSuggestions,
    handleApplyProperties
  }
}

