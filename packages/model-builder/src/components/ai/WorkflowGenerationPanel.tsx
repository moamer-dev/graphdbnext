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
import { Sparkles, Loader2, MessageSquare } from 'lucide-react'
import { useWorkflowGeneration } from '../../hooks'
import { MarkdownContent } from './MarkdownContent'

interface WorkflowGenerationPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkflowGenerationPanel({ open, onOpenChange }: WorkflowGenerationPanelProps) {
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

  const handleApply = () => {
    handleApplyWorkflow()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Workflow Generation</DialogTitle>
          <DialogDescription>
            Describe your workflow in natural language and let AI generate it for you
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Workflow Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Extract authors from TEI XML, create Person nodes, and link them to Work nodes"
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleGenerateWorkflow}
              disabled={!description.trim() || isLoading || !isReady || !settings.enabled}
              className="w-full"
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
            <ScrollArea className="flex-1 border rounded-md p-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Explanation</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExplainWorkflow}
                      disabled={isLoading}
                      className="h-7 text-xs"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Explain More
                    </Button>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <MarkdownContent content={suggestion.explanation} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    Generated Workflow ({suggestion.toolNodes.length} tools, {suggestion.actionNodes.length} actions, {suggestion.edges.length} edges)
                  </h3>
                  <div className="space-y-2 text-sm">
                    {suggestion.toolNodes.length > 0 && (
                      <div>
                        <strong className="text-xs text-muted-foreground">Tools:</strong>
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                          {suggestion.toolNodes.map((node, idx) => (
                            <li key={idx} className="text-xs">
                              {node.label || node.type} ({node.type})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {suggestion.actionNodes.length > 0 && (
                      <div>
                        <strong className="text-xs text-muted-foreground">Actions:</strong>
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                          {suggestion.actionNodes.map((node, idx) => (
                            <li key={idx} className="text-xs">
                              {node.label || node.type} ({node.type})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    onClick={handleApply}
                    className="flex-1"
                  >
                    Apply Workflow
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClear}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

