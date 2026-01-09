import { useState, useEffect, useRef } from 'react'
import { useAIFeature } from '../../ai/config'
import { useAISettings } from '../../ai/config'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useXmlImportWizardStore } from '../../stores/xmlImportWizardStore'
import type { ToolExecutionContext } from '../../ai/tools/toolExecutor'
import type { ResearchAssistantContext } from '../../ai/agents/ResearchAssistantAgent'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function useAIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your research assistant. I can help you with schema design, XML mapping, workflow creation, and more. How can I assist you today?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Array<any>>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const { settings, isReady } = useAISettings()
  const isEnabled = useAIFeature('researchAssistantChatbot')
  const store = useModelBuilderStore()
  const xmlFileFromWizard = useXmlImportWizardStore(state => state.selectedFile)

  const toolContext: ToolExecutionContext = {
    getStore: () => store,
    getNodes: () => {
      return useModelBuilderStore.getState().nodes
    },
    getRelationships: () => {
      return useModelBuilderStore.getState().relationships
    },
  }

  const appContext: ResearchAssistantContext = {
    currentView: 'model-builder',
    currentState: {
      selectedNodeId: store.selectedNode,
      selectedRelationshipId: store.selectedRelationship,
      nodeCount: store.nodes.length,
      relationshipCount: store.relationships.length,
      nodes: store.nodes.map(n => ({ label: n.label, type: n.type, id: n.id })),
      relationships: store.relationships.map(r => ({
        type: r.type,
        from: r.from,
        to: r.to,
        id: r.id,
      })),
    },
  }

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isReady || !settings.enabled) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const messageToSend = input.trim()
    setInput('')
    setIsLoading(true)

    const assistantMessageId = Date.now().toString()
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const { createChatModel } = await import('../../ai/models/factory')
      const { invokeResearchAssistantStreaming } = await import('../../ai/agents/ResearchAssistantAgentStreaming')
      const { AIMessage, HumanMessage } = await import('@langchain/core/messages')

      const model = createChatModel(settings.model)
      const humanMsg = new HumanMessage(messageToSend)

      let fullResponse = ''

      for await (const token of invokeResearchAssistantStreaming(
        model,
        settings,
        messageToSend,
        conversationHistory,
        toolContext,
        { ...appContext, xmlContent: xmlFileFromWizard ? await xmlFileFromWizard.text() : undefined }
      )) {
        fullResponse += token
        setMessages(prev => prev.map(msg => {
          if (msg.role === 'assistant' && msg.timestamp === assistantMessage.timestamp) {
            return { ...msg, content: fullResponse }
          }
          return msg
        }))
      }

      const finalAIMessage = new AIMessage(fullResponse)
      setConversationHistory(prev => {
        const updated = [...prev, humanMsg, finalAIMessage]
        return updated.slice(-15)
      })
    } catch (error) {
      console.error('Error getting AI response:', error)

      let errorMessageText = 'Sorry, I encountered an error. Please check your AI settings and try again.'

      if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessageText = `Authentication error: Please check your API key in AI settings. ${error.message}`
        } else if (error.message.includes('Connection') || error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
          errorMessageText = `Connection error: Unable to connect to the AI service. ${error.message}`
        } else {
          errorMessageText = `Error: ${error.message}. Please check your AI settings.`
        }
      }

      setMessages(prev => prev.map(msg => {
        if (msg.role === 'assistant' && msg.timestamp === assistantMessage.timestamp) {
          return { ...msg, content: errorMessageText }
        }
        return msg
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return {
    isOpen,
    setIsOpen,
    isMinimized,
    setIsMinimized,
    messages,
    input,
    setInput,
    isLoading,
    inputRef,
    isEnabled,
    isReady,
    settings,
    handleSend,
    handleKeyPress
  }
}

