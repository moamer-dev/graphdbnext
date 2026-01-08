'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle2, MessageSquare } from 'lucide-react'
import { Button } from '../../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog'
import { ScrollArea } from '../../ui/scroll-area'
import { Input } from '../../ui/input'
import { MarkdownContent } from '../../ai/MarkdownContent'
import { useAISettings, useAIFeature } from '../../../ai/config'
import { createChatModel } from '../../../ai/models/factory'
import { suggestXmlMappings, explainMapping } from '../../../ai/agents/XmlMappingAssistant'
import type { XmlStructureAnalysis, XmlMappingConfig } from '../../../services/xmlAnalyzer'
import { cn } from '../../../utils/cn'

/**
 * Formats the explanation by removing JSON arrays and keeping only readable text
 */
function formatExplanation(explanation: string): string {
  // Remove JSON arrays (objects starting with [ and ending with ])
  let formatted = explanation
  
  // Remove JSON array patterns
  formatted = formatted.replace(/\[\s*\{[\s\S]*?\}\s*\]/g, '')
  
  // Remove standalone JSON objects that are clearly structured data
  formatted = formatted.replace(/\{\s*"[^"]+":\s*\[[\s\S]*?\]\s*\}/g, '')
  
  // Clean up multiple newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n')
  
  // Trim whitespace
  formatted = formatted.trim()
  
  return formatted || explanation
}

interface AiMappingAssistantProps {
  analysis: XmlStructureAnalysis
  currentMapping: XmlMappingConfig | null
  onMappingSuggested: (mapping: XmlMappingConfig, explanation: string) => void
  domainContext?: string
}

export function AiMappingAssistant({
  analysis,
  currentMapping,
  onMappingSuggested,
  domainContext
}: AiMappingAssistantProps) {
  const { settings, isReady } = useAISettings()
  const isXmlMappingEnabled = useAIFeature('xmlMappingAssistant')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedMapping, setSuggestedMapping] = useState<XmlMappingConfig | null>(null)
  const [explanation, setExplanation] = useState<string>('')
  const [confidence, setConfidence] = useState<number>(0)
  const [chatMode, setChatMode] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [isChatLoading, setIsChatLoading] = useState(false)

  const handleGetSuggestions = async () => {
    if (!isReady || !isXmlMappingEnabled) {
      alert('XML Mapping Assistant is not enabled. Please enable it in AI Settings.')
      return
    }

    setIsLoading(true)
    setSuggestedMapping(null)
    setExplanation('')
    setConfidence(0)

    try {
      const model = createChatModel(settings.model)
      const result = await suggestXmlMappings(model, settings, analysis, domainContext)
      
      setSuggestedMapping(result.mapping)
      setExplanation(result.explanation)
      setConfidence(result.confidence)
    } catch (error) {
      console.error('Error getting AI suggestions:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to get AI suggestions'
      setExplanation(`Error: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplySuggestion = () => {
    if (suggestedMapping) {
      onMappingSuggested(suggestedMapping, explanation)
      setIsDialogOpen(false)
      setSuggestedMapping(null)
      setExplanation('')
      setConfidence(0)
    }
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !isReady || !isXmlMappingEnabled || isChatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsChatLoading(true)

    try {
      const model = createChatModel(settings.model)
      const response = await explainMapping(
        model,
        settings,
        currentMapping || { elementMappings: {}, attributeMappings: {}, relationshipMappings: {}, textContentMappings: {} },
        analysis,
        userMessage.includes('element') ? userMessage.match(/element[:\s]+(\w+)/i)?.[1] : undefined
      )
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      console.error('Error in chat:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to get response'
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMsg}` }])
    } finally {
      setIsChatLoading(false)
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs flex items-center gap-1.5"
          disabled={!isReady || !isXmlMappingEnabled}
          title={!isXmlMappingEnabled ? 'Enable XML Mapping Assistant in AI Settings' : 'Get AI mapping suggestions'}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Suggestions</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 [&>button]:z-10">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>AI Mapping Assistant</DialogTitle>
          <DialogDescription>
            Get AI-powered suggestions for mapping your XML structure to graph nodes and relationships
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4 px-6 shrink-0">
          <Button
            variant={!chatMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChatMode(false)}
          >
            Suggestions
          </Button>
          <Button
            variant={chatMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChatMode(true)}
          >
            Chat
          </Button>
        </div>

        {!chatMode ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full px-6 pb-6">
            <div className="space-y-4">
              {!suggestedMapping && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Click &quot;Get AI Suggestions&quot; to analyze your XML structure and receive intelligent mapping recommendations.
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-sm text-muted-foreground">Analyzing XML structure...</span>
                </div>
              )}

              {suggestedMapping && explanation && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-semibold">AI Suggestions Generated</span>
                      {confidence > 0 && (
                        <span className="text-xs text-muted-foreground">
                          (Confidence: {Math.round(confidence * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <h4 className="font-semibold mb-3 text-sm">Extracted Nodes:</h4>
                    {Object.entries(suggestedMapping.elementMappings || {})
                      .filter(([, config]) => config.include)
                      .map(([elementName, config]) => {
                        const attributes = suggestedMapping.attributeMappings[elementName] || {}
                        const properties = Object.entries(attributes)
                          .filter(([, attrConfig]) => attrConfig.include)
                          .map(([, attrConfig]) => attrConfig.propertyKey)
                        
                        const relationships = Object.entries(suggestedMapping.relationshipMappings || {})
                          .filter(([key]) => key.startsWith(`${elementName}->`))
                          .map(([key, relConfig]) => {
                            const targetElement = key.replace(`${elementName}->`, '')
                            const targetLabel = suggestedMapping.elementMappings[targetElement]?.nodeLabel || targetElement
                            return { targetLabel, relationshipType: relConfig.relationshipType }
                          })

                        return (
                          <div key={elementName} className="border-l-2 border-primary/30 pl-3 py-2">
                            <div className="font-semibold text-sm">{config.nodeLabel}</div>
                            {properties.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Properties: {properties.join(', ')}
                              </div>
                            )}
                            {relationships.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                {relationships.map((rel, idx) => (
                                  <div key={idx}>
                                    Related to <span className="font-medium">{rel.targetLabel}</span> on <span className="font-medium">{rel.relationshipType}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>

                  {explanation && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h4 className="font-semibold mb-2 text-xs">Notes:</h4>
                      <div className="text-xs text-muted-foreground">
                        <MarkdownContent content={formatExplanation(explanation)} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pb-4">
                    <Button onClick={handleApplySuggestion} className="flex-1">
                      Apply Suggestions
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGetSuggestions}
                      disabled={isLoading}
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}

              {!suggestedMapping && !isLoading && (
                <Button
                  onClick={handleGetSuggestions}
                  disabled={isLoading || !isReady || !isXmlMappingEnabled}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get AI Suggestions
                    </>
                  )}
                </Button>
              )}
            </div>
            </ScrollArea>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 pb-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Ask questions about your mapping, like:
                    <ul className="mt-2 space-y-1 text-left list-disc list-inside">
                      <li>&quot;Why did you map X to Y?&quot;</li>
                      <li>&quot;Can you improve this mapping?&quot;</li>
                      <li>&quot;What should element X become?&quot;</li>
                    </ul>
                  </div>
                )}

                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'rounded-lg p-3 text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                        : 'bg-muted mr-auto max-w-[80%]'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <MarkdownContent content={msg.content} />
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    )}
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}
              </div>
              </ScrollArea>
              <div className="shrink-0 px-6 pb-6 pt-4 border-t bg-background">
              <form onSubmit={(e: React.FormEvent) => handleChatSubmit(e)} className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your mapping..."
                  disabled={isChatLoading || !isReady || !isXmlMappingEnabled}
                  className="flex-1"
                />
                <Button type="submit" disabled={isChatLoading || !chatInput.trim() || !isReady || !isXmlMappingEnabled}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </form>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

