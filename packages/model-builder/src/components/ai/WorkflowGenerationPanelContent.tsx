'use client'

import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { ScrollArea } from '../ui/scroll-area'
import { Sparkles, Loader2, MessageSquare, CheckCircle2 } from 'lucide-react'
import { useWorkflowGeneration } from '../../hooks'
import { MarkdownContent } from './MarkdownContent'

export function WorkflowGenerationPanelContent() {
  const {
    description,
    setDescription,
    isLoading,
    suggestion,
    error,
    isReady,
    settings,
    handleGenerateWorkflow,
    handleApplyWorkflow,
    handleExplainWorkflow,
    handleClear
  } = useWorkflowGeneration()

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Generate Workflow</h3>
        <p className="text-xs text-muted-foreground">
          Describe your workflow in natural language and let AI generate it for you
        </p>
      </div>

      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Workflow Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Extract authors from TEI XML, create Person nodes, and link them to Work nodes"
            className="min-h-[100px] resize-none text-sm"
            disabled={isLoading || !isReady || !settings.enabled}
          />
          <Button
            onClick={handleGenerateWorkflow}
            disabled={!description.trim() || isLoading || !isReady || !settings.enabled}
            className="w-full"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Workflow...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Workflow
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
            {error}
          </div>
        )}

        {suggestion && (
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-4 pr-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Generated Workflow</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExplainWorkflow}
                      disabled={isLoading}
                      className="h-7 text-xs"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Explain
                    </Button>
                    <Button
                      onClick={handleApplyWorkflow}
                      size="sm"
                      className="h-7 text-xs"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-semibold">Explanation</h5>
                    </div>
                    <div className="text-xs prose prose-sm max-w-none">
                      <MarkdownContent content={suggestion.explanation || ''} />
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold mb-2">
                      Generated Workflow ({suggestion.toolNodes?.length || 0} tools, {suggestion.actionNodes?.length || 0} actions, {suggestion.edges?.length || 0} edges)
                    </h5>
                    <div className="space-y-2 text-xs">
                      {suggestion.toolNodes && suggestion.toolNodes.length > 0 && (
                        <div>
                          <strong className="text-xs text-muted-foreground">Tools:</strong>
                          <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                            {suggestion.toolNodes.map((node, idx) => (
                              <li key={idx}>
                                {node.label || node.type} ({node.type})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {suggestion.actionNodes && suggestion.actionNodes.length > 0 && (
                        <div>
                          <strong className="text-xs text-muted-foreground">Actions:</strong>
                          <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                            {suggestion.actionNodes.map((node, idx) => (
                              <li key={idx}>
                                {node.label || node.type} ({node.type})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

