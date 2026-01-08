'use client'

import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { ScrollArea } from '../ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Lightbulb, RotateCcw } from 'lucide-react'
import { useSchemaDesign } from '../../hooks'
import { MarkdownContent } from './MarkdownContent'

interface SchemaDesignPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'suggest' | 'optimize' | 'validate'
}

export function SchemaDesignPanel({ open, onOpenChange, mode }: SchemaDesignPanelProps) {
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
    return null
  }

  const handleApply = async () => {
    await handleApplySuggestion()
    onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 [&>button]:z-10">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-6 pb-6">
          {mode === 'suggest' && (
            <>
              <div className="mb-4">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., I want to model a bibliography with authors, publications, publishers, and institutions. Authors write publications, publications are published by publishers, and authors are affiliated with institutions."
                  className="min-h-[100px]"
                  disabled={isLoading || !isReady || !settings.enabled}
                />
              </div>
              <Button
                onClick={handleSuggestSchema}
                disabled={isLoading || !description.trim() || !isReady || !settings.enabled}
                className="w-full mb-4"
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
              <div className="mb-4 text-sm text-muted-foreground">
                Current schema: {store.nodes.length} nodes, {store.relationships.length} relationships
              </div>
              <Button
                onClick={mode === 'optimize' ? handleOptimizeSchema : handleValidateSchema}
                disabled={isLoading || store.nodes.length === 0 || !isReady || !settings.enabled}
                className="w-full mb-4"
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
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              {error}
            </div>
          )}

          <ScrollArea className="flex-1">
            {suggestion && mode === 'suggest' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-semibold">Schema Suggestion Generated</span>
                  </div>
                  <Button onClick={handleApply} size="sm">
                    Apply Schema
                  </Button>
                </div>

                {suggestion.reasoning && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm">Reasoning:</h4>
                    <div className="text-sm text-muted-foreground">
                      <MarkdownContent content={suggestion.reasoning} />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Suggested Nodes:</h4>
                  {suggestion.nodes.map((node, idx) => (
                    <div key={idx} className="border-l-2 border-primary/30 pl-3 py-2">
                      <div className="font-semibold text-sm">{node.label} ({node.name})</div>
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
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Suggested Relationships:</h4>
                    {suggestion.relationships.map((rel, idx) => (
                      <div key={idx} className="border-l-2 border-primary/30 pl-3 py-2">
                        <div className="font-semibold text-sm">
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
            )}

            {optimization && mode === 'optimize' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Optimization Analysis Complete</span>
                </div>

                {optimization.reasoning && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm">Analysis:</h4>
                    <div className="text-sm text-muted-foreground">
                      <MarkdownContent content={optimization.reasoning} />
                    </div>
                  </div>
                )}

                {optimization.improvements.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Suggested Improvements:</h4>
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
                                <div className="font-semibold text-sm">{improvement.message}</div>
                                {isApplied && (
                                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Applied</span>
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
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
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
            )}

            {validation && mode === 'validate' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Validation Complete</span>
                </div>

                {validation.issues.length === 0 ? (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-sm">
                    ✓ No issues found. Your schema looks good!
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Validation Issues:</h4>
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
                        <div className="font-semibold text-sm capitalize">{issue.severity}: {issue.message}</div>
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
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
