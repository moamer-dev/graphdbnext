import { useAISettings, useAIFeature } from '../../ai/config'
import { suggestRelationships } from '../../ai/agents/RelationshipRecommendationAgent'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { toast } from '../../utils/toast'
import { useAiStore } from '../../stores/aiStore'

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
  const relationshipRecommendations = useAiStore((state) => state.relationshipRecommendations)
  const globalLoading = useAiStore((state) => state.isLoading)
  const globalError = useAiStore((state) => state.error)
  const setRelationshipRecommendations = useAiStore((state) => state.setRelationshipRecommendations)
  const setLoading = useAiStore((state) => state.setLoading)
  const setError = useAiStore((state) => state.setError)
  
  const relId = fromNodeId && toNodeId ? `${fromNodeId}-${toNodeId}` : null
  const recommendations = relId ? relationshipRecommendations[relId] : null
  const isLoading = relId ? !!globalLoading[relId] : false
  const error = relId ? globalError[relId] : null

  const { settings, isReady } = useAISettings()
  const isEnabled = useAIFeature('relationshipRecommendation')
  const { nodes, relationships } = useModelBuilderStore()

  const fromNode = fromNodeId ? nodes.find((n) => n.id === fromNodeId) : null
  const toNode = toNodeId ? nodes.find((n) => n.id === toNodeId) : null

  const handleGetRecommendations = async () => {
    if (!fromNode || !toNode || !isReady || !settings.enabled || !relId) return

    setLoading(relId, true)
    setError(relId, null)

    try {
      const existingRels = relationships.filter(
        (r) => r.from === fromNode.id && r.to === toNode.id
      )
      const result = await suggestRelationships(fromNode, toNode, existingRels, undefined, settings)
      setRelationshipRecommendations(relId, result)
    } catch (err) {
      setError(relId, err instanceof Error ? err.message : 'Failed to get recommendations')
    } finally {
      setLoading(relId, false)
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

