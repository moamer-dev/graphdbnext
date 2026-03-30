'use client'

import { Button } from '../ui/button'
import { Sparkles, Loader2, Check, Plus, X, RotateCcw } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { useRelationshipRecommendation } from '../../hooks'
import { useAiStore } from '../../stores/aiStore'

interface RelationshipRecommendationPanelProps {
  fromNodeId: string | null
  toNodeId: string | null
  currentType?: string
  currentCardinality?: string
  onApply: (suggestion: {
    type: string
    cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-many'
    properties?: Array<{ key: string; type: 'string' | 'number' | 'boolean' | 'date'; required?: boolean }>
  }) => void
  onRemove: () => void
}

export function RelationshipRecommendationPanel({
  fromNodeId,
  toNodeId,
  currentType,
  currentCardinality,
  onApply,
  onRemove,
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

  const clearRelationshipRecommendations = useAiStore((state) => state.clearRelationshipRecommendations)

  if (!isEnabled || !fromNode || !toNode) {
    return null
  }

  const relId = fromNodeId && toNodeId ? `${fromNodeId}-${toNodeId}` : null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-primary hover:text-primary transition-colors gap-1.5"
          disabled={!isReady || !settings.enabled || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          <span>AI Suggest</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
        <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">AI Relationship Suggestions</span>
          </div>
          <div className="flex items-center gap-1">
            {recommendations && !isLoading && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => relId && clearRelationshipRecommendations(relId)} 
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                title="Reset suggestions"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            {!recommendations && !isLoading && (
              <Button size="sm" variant="outline" onClick={handleGetRecommendations} className="h-6 px-2 text-[10px]">
                Generate
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-[10px] text-muted-foreground">Analyzing path ontology...</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/5 text-destructive text-[10px] border border-destructive/10 rounded">
              {error}
            </div>
          )}

          {!isLoading && !error && !recommendations && (
            <div className="py-8 text-center px-4">
               <p className="text-[10px] text-muted-foreground italic mb-1">
                {fromNode.label} → {toNode.label}
              </p>
              <p className="text-[10px] text-muted-foreground">Click generate to get recommendations</p>
            </div>
          )}

          {recommendations && (
            <div className="space-y-3">
              {!recommendations.recommended && 
               (!recommendations.suggestions || recommendations.suggestions.length === 0) ? (
                <div className="py-8 text-center px-4">
                  <p className="text-[10px] text-muted-foreground italic mb-2">
                    {fromNode?.label} → {toNode?.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">No recommendations found for this pair.</p>
                  <Button size="sm" variant="outline" onClick={handleGetRecommendations} className="h-6 px-2 text-[10px] mt-2">
                    Try Again
                  </Button>
                </div>
              ) : (
                <>
                  {recommendations.recommended && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold text-primary uppercase">Best Choice</span>
                      </div>
                      {(() => {
                        const suggestion = recommendations.recommended;
                        const isAdded = suggestion.type === currentType && suggestion.cardinality === currentCardinality;
                        return (
                          <div className="group flex items-center justify-between p-2 rounded-md border bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] font-bold truncate ${isAdded ? 'text-muted-foreground' : 'text-primary'}`}>
                                  {suggestion.type}
                                </span>
                                <span className="text-[9px] text-muted-foreground shrink-0 italic">({suggestion.cardinality})</span>
                              </div>
                              <p className="text-[9px] text-muted-foreground truncate leading-relaxed">
                                {suggestion.reasoning}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {isAdded && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={onRemove}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Clear suggestion"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isAdded}
                                onClick={() => handleApplySuggestion(suggestion)}
                                className={`h-6 px-1.5 p-0 transition-opacity ${isAdded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                              >
                                {isAdded ? (
                                  <div className="flex items-center gap-1 text-emerald-600">
                                    <Check className="h-3 w-3" />
                                    <span className="text-[9px] font-medium">Added</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <Plus className="h-3 w-3" />
                                    <span className="text-[9px] font-medium">Apply</span>
                                  </div>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {recommendations.suggestions && recommendations.suggestions.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">Alternatives</span>
                      {recommendations.suggestions
                        .filter((s) => s.type !== recommendations.recommended?.type)
                        .map((suggestion, idx) => {
                          const isAdded = suggestion.type === currentType && suggestion.cardinality === currentCardinality;
                          return (
                            <div key={idx} className="group flex items-center justify-between p-2 rounded-md border hover:bg-muted/30 transition-colors">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[11px] font-semibold truncate ${isAdded ? 'text-muted-foreground' : ''}`}>
                                    {suggestion.type}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground shrink-0 italic">({suggestion.cardinality})</span>
                                </div>
                                <p className="text-[9px] text-muted-foreground truncate leading-relaxed">
                                  {suggestion.reasoning}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {isAdded && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={onRemove}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Clear suggestion"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isAdded}
                                  onClick={() => handleApplySuggestion(suggestion)}
                                  className={`h-6 px-1.5 p-0 transition-opacity ${isAdded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                >
                                  {isAdded ? (
                                    <div className="flex items-center gap-1 text-emerald-600">
                                      <Check className="h-3 w-3" />
                                      <span className="text-[9px] font-medium">Added</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <Plus className="h-3 w-3" />
                                      <span className="text-[9px] font-medium">Apply</span>
                                    </div>
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
