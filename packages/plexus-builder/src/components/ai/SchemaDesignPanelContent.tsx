'use client'

import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { ScrollArea } from '../ui/scroll-area'
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Lightbulb, RotateCcw } from 'lucide-react'
import { useSchemaDesign } from '../../hooks'
import { MarkdownContent } from './MarkdownContent'

interface SchemaDesignPanelContentProps {
  mode: 'suggest' | 'optimize' | 'validate'
}

export function SchemaDesignPanelContent({ mode }: SchemaDesignPanelContentProps) {
  const {
    description,
    setDescription,
    isLoading,
    suggestion,
    optimization,
    validation,
    error,
    appliedOptimizations,
    isEnabled,
    isReady,
    settings,
    store,
    handleSuggestSchema,
    handleOptimizeSchema,
    handleValidateSchema,
    handleApplySuggestion,
    handleApplyOptimization,
    handleUndoOptimization
  } = useSchemaDesign()

  if (!isEnabled) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Schema Design Agent is not enabled</p>
      </div>
    )
  }

  const getTitle = () => {
    switch (mode) {
      case 'suggest':
        return 'Generate Schema'
      case 'optimize':
        return 'Optimize Schema'
      case 'validate':
        return 'Validate Schema'
    }
  }

  const getDescription = () => {
    switch (mode) {
      case 'suggest':
        return 'Describe the schema you want to create, and AI will suggest nodes and relationships'
      case 'optimize':
        return 'AI will analyze your current schema and suggest improvements'
      case 'validate':
        return 'AI will validate your schema for potential issues and best practices'
    }
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">{getTitle()}</h3>
        <p className="text-xs text-muted-foreground">{getDescription()}</p>
      </div>

      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {mode === 'suggest' && (
          <>
            <div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., I want to model a bibliography with authors, publications, publishers, and institutions. Authors write publications, publications are published by publishers, and authors are affiliated with institutions."
                className="min-h-[100px] text-sm"
                disabled={isLoading || !isReady || !settings.enabled}
              />
            </div>
            <Button
              onClick={handleSuggestSchema}
              disabled={isLoading || !description.trim() || !isReady || !settings.enabled}
              className="w-full"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Schema
                </>
              )}
            </Button>
          </>
        )}

        {(mode === 'optimize' || mode === 'validate') && (
          <>
            <div className="text-sm text-muted-foreground">
              Current schema: {store.nodes.length} nodes, {store.relationships.length} relationships
            </div>
            <Button
              onClick={mode === 'optimize' ? handleOptimizeSchema : handleValidateSchema}
              disabled={isLoading || store.nodes.length === 0 || !isReady || !settings.enabled}
              className="w-full"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  {mode === 'optimize' ? <Lightbulb className="h-4 w-4 mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                  {mode === 'optimize' ? 'Optimize Schema' : 'Validate Schema'}
                </>
              )}
            </Button>
          </>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
            {error}
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0">
          {mode === 'suggest' && suggestion && (
            <div className="space-y-4 pr-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-semibold">Schema Suggestion Generated</span>
                  </div>
                  <Button
                    onClick={handleApplySuggestion}
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Apply Schema
                  </Button>
                </div>

                {suggestion.reasoning && (
                  <div className="bg-muted/50 p-3 rounded-lg mb-3">
                    <h4 className="font-semibold mb-2 text-xs">Reasoning:</h4>
                    <div className="text-xs text-muted-foreground">
                      <MarkdownContent content={suggestion.reasoning} />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-semibold text-xs">Suggested Nodes:</h4>
                  {suggestion.nodes.map((node, idx) => (
                    <div key={idx} className="border-l-2 border-primary/30 pl-3 py-2">
                      <div className="font-semibold text-xs">{node.label} ({node.name})</div>
                      {node.description && (
                        <div className="text-xs text-muted-foreground mt-1">{node.description}</div>
                      )}
                      {node.properties.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Properties: {node.properties.map(p => `${p.name} (${p.type}${p.required ? ', required' : ''})`).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {suggestion.relationships.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <h4 className="font-semibold text-xs">Suggested Relationships:</h4>
                    {suggestion.relationships.map((rel, idx) => (
                      <div key={idx} className="border-l-2 border-primary/30 pl-3 py-2">
                        <div className="font-semibold text-xs">
                          {rel.from} → {rel.to} ({rel.type})
                          {rel.cardinality && ` [${rel.cardinality}]`}
                        </div>
                        {rel.description && (
                          <div className="text-xs text-muted-foreground mt-1">{rel.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'optimize' && optimization && (
            <div className="space-y-4 pr-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-semibold">Optimization Analysis Complete</span>
                  </div>
                </div>

                {optimization.reasoning && (
                  <div className="bg-muted/50 p-3 rounded-lg mb-3">
                    <h4 className="font-semibold mb-2 text-xs">Analysis:</h4>
                    <div className="text-xs text-muted-foreground">
                      <MarkdownContent content={optimization.reasoning} />
                    </div>
                  </div>
                )}

                {optimization.improvements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs">Suggested Improvements:</h4>
                    {optimization.improvements.map((improvement, idx) => {
                      const isApplied = appliedOptimizations.has(idx)
                      
                      return (
                        <div
                          key={idx}
                          className={`border-l-2 pl-3 py-2 ${
                            isApplied
                              ? 'bg-green-50 border-green-500'
                              : improvement.severity === 'important'
                              ? 'border-yellow-500'
                              : improvement.severity === 'recommendation'
                              ? 'border-blue-500'
                              : 'border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-xs">{improvement.message}</div>
                                {isApplied && (
                                  <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">Applied</span>
                                )}
                              </div>
                              {improvement.suggestion && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {improvement.suggestion.nodeLabel && `Node: ${improvement.suggestion.nodeLabel}`}
                                  {improvement.suggestion.relationshipType && `Relationship: ${improvement.suggestion.relationshipType}`}
                                  {improvement.suggestion.propertyName && `Property: ${improvement.suggestion.propertyName}`}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              {isApplied ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUndoOptimization(idx)}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-6 text-xs px-2"
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Undo
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApplyOptimization(improvement, idx)}
                                  disabled={improvement.type === 'suggest_normalization'}
                                  className="h-6 text-xs px-2"
                                >
                                  Apply
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'validate' && validation && (
            <div className="space-y-4 pr-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-semibold">Validation Complete</span>
                </div>

                {validation.issues.length === 0 ? (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-xs">
                    ✓ No issues found. Your schema looks good!
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs">Validation Issues:</h4>
                    {validation.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`border-l-2 pl-3 py-2 ${
                          issue.severity === 'error'
                            ? 'border-red-500'
                            : issue.severity === 'warning'
                            ? 'border-yellow-500'
                            : 'border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-xs capitalize">{issue.severity}: {issue.message}</div>
                        {issue.nodeLabel && (
                          <div className="text-xs text-muted-foreground mt-1">Node: {issue.nodeLabel}</div>
                        )}
                        {issue.suggestion && (
                          <div className="text-xs text-muted-foreground mt-1">Suggestion: {issue.suggestion}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

