import { useState, useEffect } from 'react'
import { useAISettings, useAIFeature } from '../../ai/config'
import { suggestNodeProperties, type NodePropertySuggestion } from '../../ai/agents/NodePropertySuggestionAgent'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useAiStore } from '../../stores/aiStore'
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
  const nodeSuggestions = useAiStore((state) => state.nodeSuggestions)
  const globalLoading = useAiStore((state) => state.isLoading)
  const globalError = useAiStore((state) => state.error)
  const setNodeSuggestions = useAiStore((state) => state.setNodeSuggestions)
  const setLoading = useAiStore((state) => state.setLoading)
  const setError = useAiStore((state) => state.setError)
  
  const suggestions = (node && node.id) ? nodeSuggestions[node.id] : null
  const isLoading = (node && node.id) ? !!globalLoading[node.id] : false
  const error = (node && node.id) ? globalError[node.id] : null

  const { settings, isReady } = useAISettings()
  const isEnabled = useAIFeature('nodePropertySuggestion')
  const { nodes } = useModelBuilderStore()

  const handleGetSuggestions = async () => {
    if (!node?.id || !isReady || !settings?.enabled) return

    setLoading(node.id, true)
    setError(node.id, null)

    try {
      const result = await suggestNodeProperties(node, nodes, undefined, settings)
      setNodeSuggestions(node.id, result)
    } catch (err) {
      setError(node.id, err instanceof Error ? err.message : 'Failed to get suggestions')
    } finally {
      if (node?.id) {
        setLoading(node.id, false)
      }
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

