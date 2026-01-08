'use client'

import { Button } from '../ui/button'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { useRelationshipRecommendation } from '../../hooks'

interface RelationshipRecommendationPanelProps {
  fromNodeId: string | null
  toNodeId: string | null
  onApply: (suggestion: {
    type: string
    cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-many'
    properties?: Array<{ key: string; type: 'string' | 'number' | 'boolean' | 'date'; required?: boolean }>
  }) => void
}

export function RelationshipRecommendationPanel({
  fromNodeId,
  toNodeId,
  onApply,
}: RelationshipRecommendationPanelProps) {
  const {
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
  } = useRelationshipRecommendation({ fromNodeId, toNodeId, onApply })

  if (!isEnabled || !fromNode || !toNode) {
    return null
  }

  return (
    <CollapsibleSection
      title="AI Suggestions"
      defaultOpen={false}
      icon={Sparkles}
      className="border-t pt-4 mt-4"
    >
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex-1" />
        {!isLoading && !recommendations && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGetRecommendations}
            className="h-7 px-2 text-xs"
            disabled={!isReady || !settings.enabled}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Get Suggestions
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-xs text-muted-foreground">Analyzing relationship...</span>
        </div>
      )}

      {error && (
        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
          {error}
        </div>
      )}

      {recommendations && (
        <TooltipProvider>
          <div className="max-h-[300px] overflow-y-auto">
            <div className="space-y-2 pr-2">
              {recommendations.recommended && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 border rounded-lg bg-primary/5 border-primary/20 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-primary">
                              {recommendations.recommended.type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {recommendations.recommended.reasoning.split('.')[0] || recommendations.recommended.reasoning}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApplySuggestion(recommendations.recommended!)
                          }}
                          className="h-7 px-3 text-xs ml-2 shrink-0"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{recommendations.recommended.reasoning}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {recommendations.suggestions
                .filter((s) => s.type !== recommendations.recommended?.type)
                .map((suggestion, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div className="p-3 border rounded-lg cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold">{suggestion.type}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {suggestion.reasoning.split('.')[0] || suggestion.reasoning}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApplySuggestion(suggestion)
                            }}
                            className="h-7 px-3 text-xs ml-2 shrink-0"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{suggestion.reasoning}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
            </div>
          </div>
        </TooltipProvider>
      )}
    </CollapsibleSection>
  )
}

