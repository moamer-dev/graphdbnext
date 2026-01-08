import { useState, useEffect } from 'react'
import { useAISettings, useAIFeature } from '../../ai/config'
import { suggestRelationships, type RelationshipRecommendation } from '../../ai/agents/RelationshipRecommendationAgent'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { toast } from '../../utils/toast'

interface UseRelationshipRecommendationProps {
  fromNodeId: string | null
  toNodeId: string | null
  onApply: (suggestion: {
    type: string
    cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-many'
    properties?: Array<{ key: string; type: 'string' | 'number' | 'boolean' | 'date'; required?: boolean }>
  }) => void
}

export function useRelationshipRecommendation({ fromNodeId, toNodeId, onApply }: UseRelationshipRecommendationProps) {
  const [recommendations, setRecommendations] = useState<RelationshipRecommendation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { settings, isReady } = useAISettings()
  const isEnabled = useAIFeature('relationshipRecommendation')
  const { nodes, relationships } = useModelBuilderStore()

  const fromNode = fromNodeId ? nodes.find((n) => n.id === fromNodeId) : null
  const toNode = toNodeId ? nodes.find((n) => n.id === toNodeId) : null

  useEffect(() => {
    setRecommendations(null)
    setError(null)
  }, [fromNodeId, toNodeId])

  const handleGetRecommendations = async () => {
    if (!fromNode || !toNode || !isReady || !settings.enabled) return

    setIsLoading(true)
    setError(null)
    setRecommendations(null)

    try {
      const existingRels = relationships.filter(
        (r) => r.from === fromNode.id && r.to === toNode.id
      )
      const result = await suggestRelationships(fromNode, toNode, existingRels, undefined, settings)
      setRecommendations(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplySuggestion = (suggestion: {
    type: string
    cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many'
  }) => {
    onApply({
      type: suggestion.type,
      cardinality: suggestion.cardinality,
      properties: undefined,
    })
    toast.success(`Applied ${suggestion.type} relationship`)
  }

  return {
    recommendations,
    isLoading,
    error,
    isEnabled,
    isReady,
    settings,
    fromNode,
    toNode,
    handleGetRecommendations,
    handleApplySuggestion
  }
}

