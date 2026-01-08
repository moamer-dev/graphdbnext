'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Loader2, Send } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { ScrollArea } from '../../ui/scroll-area'
import { MarkdownContent } from '../../ai/MarkdownContent'
import { useAISettings, useAIFeature } from '../../../ai/config'
import { createChatModel } from '../../../ai/models/factory'
import { suggestXmlRules, chatWithXmlRulesAssistant } from '../../../ai/agents/XmlRulesAssistant'
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { XmlAnalysisRules } from '../../../services/xmlAnalyzer'
import type { XmlElementInfo } from '../../../utils/xmlElementExtractor'
import { cn } from '../../../utils/cn'

interface AiRulesAssistantProps {
  availableElements: XmlElementInfo | null
  currentRules: Partial<XmlAnalysisRules>
  onRulesSuggested: (rules: Partial<XmlAnalysisRules>, explanation: string) => void
  domainContext?: string
  onOpenChange?: (isOpen: boolean) => void
  defaultOpen?: boolean
}

export function AiRulesAssistant({
  availableElements,
  currentRules,
  onRulesSuggested,
  domainContext,
  onOpenChange,
  defaultOpen = false
}: AiRulesAssistantProps) {
  const { settings, isReady } = useAISettings()
  const isXmlMappingEnabled = useAIFeature('xmlMappingAssistant')
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [input, setInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isChatting, setIsChatting] = useState(false)
  const [lastAnalysisResult, setLastAnalysisResult] = useState<{ rules: Partial<XmlAnalysisRules>; explanation: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chat opens
      const welcomeMessage = availableElements 
        ? `Hello! I'm your XML Analysis Rules Assistant. I can help you configure XML analysis rules for importing your XML file into a graph database.\n\nI can help you with:\n- Analyzing your XML structure and suggesting rules\n- Setting up ignored elements and ignored subtrees\n- Configuring reference attributes\n- Defining pattern rules (alternatives, annotations, translations, choices)\n- Setting relationship type mappings\n- Configuring text content processing rules\n\nYour XML contains ${availableElements.elementNames.length} element types and ${availableElements.attributeNames.length} attribute types. You can ask me to "analyze the XML and suggest ignored elements" or chat with me about configuring the rules!`
        : "Hello! I'm your XML Analysis Rules Assistant. I can help you configure XML analysis rules for importing your XML file into a graph database.\n\nI can help you with:\n- Setting up ignored elements and ignored subtrees\n- Configuring reference attributes\n- Defining pattern rules (alternatives, annotations, translations, choices)\n- Setting relationship type mappings\n- Configuring text content processing rules\n\nClick \"Start Analysis\" to get AI suggestions for your XML structure, or ask me questions about configuring these rules!"
      
      setMessages([{
        role: 'assistant',
        content: welcomeMessage
      }])
    }
  }, [isOpen, messages.length, availableElements])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [messages])

  const handleStartAnalysis = async () => {
    if (!isReady || !isXmlMappingEnabled) {
      alert('XML Mapping Assistant is not enabled. Please enable it in AI Settings.')
      return
    }

    if (!availableElements) {
      alert('Please wait for XML structure extraction to complete.')
      return
    }

    setIsAnalyzing(true)
    setInput('')

    // Add user message
    const userMsg = { role: 'user' as const, content: 'Start analysis' }
    setMessages(prev => [...prev, userMsg])

    try {
      const model = createChatModel(settings.model)
      const result = await suggestXmlRules(model, settings, availableElements, domainContext)
      
      // Merge with current rules
      const mergedRules: Partial<XmlAnalysisRules> = {
        ...currentRules,
        ...result.rules,
        ignoredElements: [
          ...(currentRules.ignoredElements || []),
          ...(result.rules.ignoredElements || [])
        ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
        ignoredSubtrees: [
          ...(currentRules.ignoredSubtrees || []),
          ...(result.rules.ignoredSubtrees || [])
        ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
        referenceAttributes: [
          ...(currentRules.referenceAttributes || []),
          ...(result.rules.referenceAttributes || [])
        ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
      }
      
      setLastAnalysisResult({ ...result, rules: mergedRules })
      
      // Add assistant response
      const assistantMsg = {
        role: 'assistant' as const,
        content: `## Analysis Complete

${result.explanation}

Would you like me to apply these rules, or would you like to discuss or modify them first?`
      }
      
      setMessages(prev => [...prev, assistantMsg])
    } catch (error) {
      console.error('Error analyzing XML:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to analyze XML structure'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an error while analyzing: ${errorMsg}. Please try again.`
      }])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!input.trim() || !isReady || !isXmlMappingEnabled || isChatting) return
    
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsChatting(true)

    try {
      const model = createChatModel(settings.model)
      
      const lowerMessage = userMessage.toLowerCase()
      
      // Check if user wants to analyze the XML
      const shouldAnalyze = lowerMessage.includes('analyze') || 
                           lowerMessage.includes('suggest') || 
                           lowerMessage.includes('recommend') ||
                           (lowerMessage.includes('ignore') && (lowerMessage.includes('element') || lowerMessage.includes('subtree')))
      
      if (shouldAnalyze && availableElements) {
        // Trigger analysis
        setIsAnalyzing(true)
        try {
          const result = await suggestXmlRules(model, settings, availableElements, domainContext)
          
          // Merge with current rules
          const mergedRules: Partial<XmlAnalysisRules> = {
            ...currentRules,
            ...result.rules,
            ignoredElements: [
              ...(currentRules.ignoredElements || []),
              ...(result.rules.ignoredElements || [])
            ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
            ignoredSubtrees: [
              ...(currentRules.ignoredSubtrees || []),
              ...(result.rules.ignoredSubtrees || [])
            ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
            referenceAttributes: [
              ...(currentRules.referenceAttributes || []),
              ...(result.rules.referenceAttributes || [])
            ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
          }
          
          // Store merged rules for potential application
          setLastAnalysisResult({ ...result, rules: mergedRules })
          
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `## Analysis Complete\n\n${result.explanation}\n\nWould you like me to apply these rules, or would you like to discuss or modify them first?`
          }])
        } catch (error) {
          console.error('Error analyzing XML:', error)
          const errorMsg = error instanceof Error ? error.message : 'Failed to analyze XML structure'
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `I encountered an error while analyzing: ${errorMsg}. Please try again.`
          }])
        } finally {
          setIsAnalyzing(false)
        }
        setIsChatting(false)
        inputRef.current?.focus()
        return
      }
      
      // Check if user is asking to apply rules
      if ((lowerMessage.includes('apply') || lowerMessage.includes('use these') || lowerMessage.includes('accept')) && 
          lastAnalysisResult) {
        // Apply the rules
        onRulesSuggested(lastAnalysisResult.rules, lastAnalysisResult.explanation)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Perfect! I\'ve applied the analysis rules. You can now proceed with the XML analysis, or continue discussing if you\'d like to make any adjustments.'
        }])
        setIsChatting(false)
        inputRef.current?.focus()
        return
      }
      
      // Build conversation history with restrictive system prompt
      let systemPrompt = `You are an XML Analysis Rules Assistant. Your ONLY purpose is to help users configure XML analysis rules for importing XML files into a graph database.

**YOUR SCOPE - You can ONLY:**
1. **Discuss** XML analysis rules (what rules mean, how they work)
2. **Analyze** the uploaded XML structure and suggest appropriate rules
3. **Set/Suggest** XML analysis rules (propose rules for the user's XML structure)
4. **Update/Modify** XML analysis rules (change existing rules based on user feedback)

**XML Analysis Rules you work with:**
- Ignored Elements: Elements to completely ignore during analysis
- Ignored Subtrees: Elements whose children should be ignored
- Reference Attributes: Attributes that create cross-references (id, target, corresp, etc.)
- Pattern Rules: Attributes that indicate alternatives, annotations, translations, or choices
- Relationship Type Mappings: How parent-child element relationships should be typed
- Text Content Rules: Whether elements should be processed at character-level or sign-level`

      // Add XML structure information if available
      if (availableElements) {
        systemPrompt += `\n\n**Available XML Elements (${availableElements.elementNames.length}):**\n${availableElements.elementNames.slice(0, 100).map(name => `- ${name}`).join('\n')}`
        if (availableElements.elementNames.length > 100) {
          systemPrompt += `\n... and ${availableElements.elementNames.length - 100} more elements`
        }
        systemPrompt += `\n\n**Available XML Attributes (${availableElements.attributeNames.length}):**\n${availableElements.attributeNames.slice(0, 50).map(name => `- ${name}`).join('\n')}`
        if (availableElements.attributeNames.length > 50) {
          systemPrompt += `\n... and ${availableElements.attributeNames.length - 50} more attributes`
        }
      }
      
      // Add current rules context
      if (currentRules.ignoredElements && currentRules.ignoredElements.length > 0) {
        systemPrompt += `\n\n**Current Ignored Elements:** ${currentRules.ignoredElements.join(', ')}`
      }
      if (currentRules.ignoredSubtrees && currentRules.ignoredSubtrees.length > 0) {
        systemPrompt += `\n\n**Current Ignored Subtrees:** ${currentRules.ignoredSubtrees.join(', ')}`
      }
      
      systemPrompt += `

**STRICT LIMITATIONS - You MUST NOT:**
- Answer questions about XML validation (DTD, XSD, Schematron, RelaxNG)
- Explain XPath, XQuery, XSLT, or other XML query/transformation technologies
- Provide information about XML tools, libraries, or general XML programming
- Answer questions about XML standards, specifications, or formats
- Discuss topics unrelated to configuring XML analysis rules for import

**When users ask to analyze or suggest rules:**
- Use the available XML elements and attributes listed above to make informed suggestions
- Suggest SPECIFIC element names from the available elements list (e.g., "header", "meta", "processing")
- When suggesting ignored elements, only use element names that actually exist in the XML
- When suggesting ignored subtrees, only use element names that actually exist in the XML
- Explain why each suggestion makes sense based on the XML structure
- Format suggestions clearly so users can easily identify which elements to add

**When users want to add/update specific elements:**
- If the user asks to add a specific element to ignored elements/subtrees, acknowledge the request
- Remind them that they can use the "Start Analysis" button or ask "analyze the XML and suggest ignored elements" to get AI suggestions
- Suggest running analysis to get comprehensive rule recommendations based on the XML structure

**When users ask about topics outside your scope, politely redirect them:**
"I'm specifically designed to help you configure XML analysis rules for importing XML into a graph database. I can help you with setting up ignored elements, reference attributes, pattern rules, and other analysis rules. For questions about XML validation, XPath, XSLT, or other XML technologies, please consult relevant documentation."

**Response Style:**
- Keep responses brief and focused
- Provide structured explanations for rules
- Be concise when discussing rule configurations
- When suggesting ignored elements/subtrees, list specific element names from the available elements
- If user asks to add/update rules, suggest the specific elements to add${domainContext ? `\n\nDomain Context: ${domainContext}` : ''}`
      
      const conversationMessages: Array<SystemMessage | HumanMessage | AIMessage> = [
        new SystemMessage(systemPrompt)
      ]
      
      // Add previous messages
      messages.forEach(msg => {
        if (msg.role === 'user') {
          conversationMessages.push(new HumanMessage(msg.content))
        } else {
          conversationMessages.push(new AIMessage(msg.content))
        }
      })
      
      // Add current user message
      conversationMessages.push(new HumanMessage(userMessage))
      
      // Regular chat with XML context
      const response = await chatWithXmlRulesAssistant(model, conversationMessages, availableElements || undefined)
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      console.error('Error in chat:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to get response'
      setMessages(prev => [...prev, { role: 'assistant', content: `I encountered an error: ${errorMsg}. Please try again.` }])
    } finally {
      setIsChatting(false)
      inputRef.current?.focus()
    }
  }

  const handleApplyRules = () => {
    if (lastAnalysisResult) {
      onRulesSuggested(lastAnalysisResult.rules, lastAnalysisResult.explanation)
      setMessages(prev => [...prev, {
        role: 'user',
        content: 'Apply these rules'
      }, {
        role: 'assistant',
        content: 'Great! I\'ve applied the analysis rules. You can now proceed with the XML analysis, or continue discussing if you\'d like to make any adjustments.'
      }])
    }
  }

  useEffect(() => {
    if (defaultOpen && !isOpen) {
      handleOpenChange(true)
    }
  }, [defaultOpen])

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-3 text-xs flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-medium"
        onClick={() => handleOpenChange(true)}
        disabled={!isReady || !isXmlMappingEnabled}
        title={!isXmlMappingEnabled ? 'Enable XML Mapping Assistant in AI Settings' : 'Open AI Rules Assistant'}
      >
        <Sparkles className="h-4 w-4" />
        <span>AI Assistant</span>
      </Button>
    )
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col border rounded-lg bg-background shadow-lg" style={{ height: '600px', width: '500px' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b shrink-0 bg-muted/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">AI Rules Assistant</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => handleOpenChange(false)}
          >
            Close
          </Button>
        </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'rounded-lg p-3 text-sm max-w-[85%]',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted'
              )}
            >
              {msg.role === 'assistant' ? (
                <MarkdownContent content={msg.content} />
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
          ))}

          {isAnalyzing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing XML structure...</span>
            </div>
          )}

          {isChatting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t shrink-0 space-y-2">
        {messages.length === 1 && !isAnalyzing && (
          <Button
            onClick={handleStartAnalysis}
            disabled={!availableElements || !isReady || !isXmlMappingEnabled}
            className="w-full"
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Start Analysis
          </Button>
        )}

        {lastAnalysisResult && !messages.some(m => m.role === 'user' && m.content.toLowerCase().includes('apply')) && (
          <Button
            onClick={handleApplyRules}
            variant="default"
            className="w-full"
            size="sm"
          >
            Apply Suggested Rules
          </Button>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about analysis rules..."
            disabled={isAnalyzing || isChatting || !isReady || !isXmlMappingEnabled}
            className="flex-1 text-sm"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isAnalyzing || isChatting || !isReady || !isXmlMappingEnabled}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
    </>
  )
}
