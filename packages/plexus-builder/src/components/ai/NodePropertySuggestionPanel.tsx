'use client'

import { Button } from '../ui/button'
import { Sparkles, Loader2, Check, Plus, X, RotateCcw } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { useNodePropertySuggestion } from '../../hooks'
import { useAiStore } from '../../stores/aiStore'
import type { Node } from '../../types'

interface NodePropertySuggestionPanelProps {
  node: Node | null
  onApply: (properties: Array<{
    key: string
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
    required: boolean
    description?: string
  }>) => void
  onRemove: (keys: string | string[]) => void
}

export function NodePropertySuggestionPanel({
  node,
  onApply,
  onRemove,
}: NodePropertySuggestionPanelProps) {
  const {
    suggestions,
    isLoading,
    error,
    isEnabled,
    isReady,
    settings,
    handleGetSuggestions,
    handleApplyProperties
  } = useNodePropertySuggestion({ node, onApply })

  const clearNodeSuggestions = useAiStore((state) => state.clearNodeSuggestions)

  if (!isEnabled || !node) {
    return null
  }

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
            <span className="text-xs font-semibold">AI Property Suggestions</span>
          </div>
          <div className="flex items-center gap-1">
            {suggestions && !isLoading && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => node && clearNodeSuggestions(node.id)} 
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                title="Reset suggestions"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            {!suggestions && !isLoading && (
              <Button size="sm" variant="outline" onClick={handleGetSuggestions} className="h-6 px-2 text-[10px]">
                Generate
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-[10px] text-muted-foreground">Analyzing node ontology...</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/5 text-destructive text-[10px] border border-destructive/10 rounded">
              {error}
            </div>
          )}

          {!isLoading && !error && !suggestions && (
            <div className="py-8 text-center px-4">
              <p className="text-[10px] text-muted-foreground">Click generate to get suggestions</p>
            </div>
          )}

          {suggestions && (
            <div className="space-y-3">
              {(!suggestions.recommended || suggestions.recommended.length === 0) && 
               (!suggestions.suggestions || suggestions.suggestions.length === 0) ? (
                <div className="py-8 text-center px-4">
                  <p className="text-[10px] text-muted-foreground">No suggestions found for this node.</p>
                  <Button size="sm" variant="outline" onClick={handleGetSuggestions} className="h-6 px-2 text-[10px] mt-2">
                    Try Again
                  </Button>
                </div>
              ) : (
                <>
                  {suggestions.recommended && suggestions.recommended.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold text-primary uppercase">Recommended</span>
                        <div className="flex items-center gap-2">
                          {suggestions.recommended.some(p => node.properties.some(np => np.key === p.key)) && (
                            <Button 
                              size="sm" 
                              variant="link" 
                              onClick={() => onRemove(suggestions.recommended!.map(p => p.key))}
                              className="h-auto p-0 text-[10px] text-muted-foreground hover:text-red-500"
                            >
                              Remove All
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="link" 
                            onClick={() => handleApplyProperties(suggestions!.recommended!)}
                            className="h-auto p-0 text-[10px]"
                          >
                            Apply All
                          </Button>
                        </div>
                      </div>
                      {suggestions.recommended.map((prop, idx) => {
                        const isAdded = node.properties.some(p => p.key === prop.key);
                        return (
                          <div key={idx} className="group flex items-center justify-between p-2 rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] font-medium truncate ${isAdded ? 'text-muted-foreground' : ''}`}>{prop.key}</span>
                                <span className="text-[9px] text-muted-foreground shrink-0">({prop.type})</span>
                              </div>
                              {prop.description && <p className="text-[9px] text-muted-foreground truncate">{prop.description}</p>}
                            </div>
                            <div className="flex items-center gap-1">
                              {isAdded && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onRemove(prop.key)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove property"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isAdded}
                                onClick={() => handleApplyProperties([prop])}
                                className={`h-6 px-1.5 p-0 transition-opacity ${isAdded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                              >
                                {isAdded ? (
                                  <div className="flex items-center gap-1 text-emerald-600">
                                    <Check className="h-3 w-3" />
                                    <span className="text-[9px] font-medium">Added</span>
                                  </div>
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {suggestions.suggestions && suggestions.suggestions.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">Other Suggestions</span>
                      {suggestions.suggestions
                        .filter(s => !suggestions.recommended?.some(r => r.key === s.key))
                        .map((prop, idx) => {
                          const isAdded = node.properties.some(p => p.key === prop.key);
                          return (
                            <div key={idx} className="group flex items-center justify-between p-2 rounded-md border hover:bg-muted/30 transition-colors">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[11px] font-medium truncate ${isAdded ? 'text-muted-foreground' : ''}`}>{prop.key}</span>
                                  <span className="text-[9px] text-muted-foreground shrink-0">({prop.type})</span>
                                </div>
                              </div>
                                <div className="flex items-center gap-1">
                                {isAdded && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onRemove(prop.key)}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove property"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isAdded}
                                  onClick={() => handleApplyProperties([prop])}
                                  className={`h-6 px-1.5 p-0 transition-opacity ${isAdded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                >
                                  {isAdded ? (
                                    <div className="flex items-center gap-1 text-emerald-600">
                                      <Check className="h-3 w-3" />
                                      <span className="text-[9px] font-medium">Added</span>
                                    </div>
                                  ) : (
                                    <Plus className="h-3 w-3" />
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
