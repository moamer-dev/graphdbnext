'use client'

import { Button } from '../ui/button'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { useNodePropertySuggestion } from '../../hooks'
import type { Node } from '../../types'

interface NodePropertySuggestionPanelProps {
  node: Node | null
  onApply: (properties: Array<{
    key: string
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
    required: boolean
    description?: string
  }>) => void
}

export function NodePropertySuggestionPanel({
  node,
  onApply,
}: NodePropertySuggestionPanelProps) {
  const {
    suggestions,
    isLoading,
    error,
    isEnabled,
    isReady,
    settings,
    allSuggestions,
    handleGetSuggestions,
    handleApplyProperties
  } = useNodePropertySuggestion({ node, onApply })

  if (!isEnabled || !node) {
    return null
  }

  return (
    <CollapsibleSection
      title="AI Property Suggestions"
      defaultOpen={false}
      icon={Sparkles}
      className="border-t pt-4 mt-4"
    >
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex-1" />
        {!isLoading && !suggestions && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGetSuggestions}
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
          <span className="ml-2 text-xs text-muted-foreground">Analyzing node...</span>
        </div>
      )}

      {error && (
        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
          {error}
        </div>
      )}

      {suggestions && allSuggestions.length > 0 && (
        <TooltipProvider>
          <div className="max-h-[300px] overflow-y-auto">
            <div className="space-y-2 pr-2">
              {suggestions.recommended && suggestions.recommended.length > 0 && (
                <div className="p-3 border rounded-lg bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary">
                      Recommended Properties ({suggestions.recommended.length})
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleApplyProperties(suggestions!.recommended!)}
                      className="h-6 px-2 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Apply All
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {suggestions!.recommended.map((prop, idx) => (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <div className="p-2 border rounded cursor-pointer hover:bg-muted/50 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <span className="font-medium">{prop.key}</span>
                                <span className="text-muted-foreground ml-2">
                                  ({prop.type}{prop.required ? ', required' : ''})
                                </span>
                                {prop.description && (
                                  <p className="text-muted-foreground text-[10px] mt-1 line-clamp-1">
                                    {prop.description}
                                  </p>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleApplyProperties([prop])
                                }}
                                className="h-5 px-2 text-xs ml-2 shrink-0"
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </TooltipTrigger>
                        {prop.description && (
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">{prop.description}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              {suggestions!.suggestions
                .filter((s) => !suggestions!.recommended?.some((r) => r.key === s.key))
                .map((prop, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div className="p-2 border rounded cursor-pointer hover:bg-muted/50 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{prop.key}</span>
                            <span className="text-muted-foreground ml-2">
                              ({prop.type}{prop.required ? ', required' : ''})
                            </span>
                            {prop.description && (
                              <p className="text-muted-foreground text-[10px] mt-1 line-clamp-1">
                                {prop.description}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApplyProperties([prop])
                            }}
                            className="h-5 px-2 text-xs ml-2 shrink-0"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </TooltipTrigger>
                    {prop.description && (
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">{prop.description}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
            </div>
          </div>
        </TooltipProvider>
      )}
    </CollapsibleSection>
  )
}

