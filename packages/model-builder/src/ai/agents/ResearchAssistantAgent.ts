import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { AIMessage, HumanMessage, SystemMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages'
import { createModelBuilderTools } from '../tools/modelBuilderTools'
import { createToolExecutor } from '../tools/toolExecutor'
import type { ToolExecutionContext } from '../tools/toolExecutor'
import type { AISettings } from '../config/types'

export interface ResearchAssistantContext {
  currentView?: 'import-wizard' | 'model-builder' | 'workflow-builder'
  currentState?: {
    selectedNodeId?: string | null
    selectedRelationshipId?: string | null
    nodeCount?: number
    relationshipCount?: number
    nodes?: Array<{ label: string; type: string; id: string }>
    relationships?: Array<{ type: string; from: string; to: string; id: string }>
  }
  userHistory?: unknown[]
  xmlContent?: string
}

const RESEARCH_ASSISTANT_SYSTEM_PROMPT = `You are a helpful research assistant for a Graph Database Model Builder application. 
Your role is to help researchers understand, design, and optimize graph database schemas and workflows.

Key capabilities:
- Help users create and modify graph schemas (nodes and relationships)
- Explain schema structures and suggest improvements
- Guide users through the XML import wizard
- Assist with workflow design and optimization
- Answer questions about graph database concepts and best practices

Guidelines:
- Be concise but thorough
- Use the available tools to interact with the application when appropriate
- Explain concepts clearly for researchers who may not be database experts
- Suggest best practices for graph database design
- When asked to create schemas, use the create_node and create_relationship tools
- Always provide context and reasoning for your suggestions`

/**
 * Simple agent that uses model with tools bound directly (no LangGraph dependency)
 * This works client-side in the browser
 */
export async function invokeResearchAssistant(
  model: BaseChatModel,
  settings: AISettings,
  message: string,
  conversationHistory: Array<HumanMessage | AIMessage | ToolMessage> = [],
  toolContext?: ToolExecutionContext,
  appContext?: ResearchAssistantContext
): Promise<AIMessage> {
  // Build context-aware system prompt
  let contextInfo = `\n\nAI Features Enabled: ${JSON.stringify(settings.features)}`

  if (appContext) {
    contextInfo += `\n\nCurrent View: ${appContext.currentView || 'unknown'}`

    if (appContext.currentState) {
      const state = appContext.currentState
      contextInfo += `\n\nCurrent Schema State:`
      if (state.nodeCount !== undefined) {
        contextInfo += `\n- Nodes: ${state.nodeCount}`
        if (state.nodes && state.nodes.length > 0) {
          contextInfo += ` (${state.nodes.map(n => n.label).join(', ')})`
        }
      }
      if (state.relationshipCount !== undefined) {
        contextInfo += `\n- Relationships: ${state.relationshipCount}`
      }
      if (state.selectedNodeId) {
        const selectedNode = state.nodes?.find(n => n.id === state.selectedNodeId)
        contextInfo += `\n- Selected Node: ${selectedNode?.label || state.selectedNodeId}`
      }
      if (state.selectedRelationshipId) {
        contextInfo += `\n- Selected Relationship: ${state.selectedRelationshipId}`
      }
    }
    // temporary context aware solution until we apply vector embeddings
    if (appContext.xmlContent) {
      const truncatedXml = appContext.xmlContent.length > 5000
        ? appContext.xmlContent.substring(0, 5000) + '... (truncated)'
        : appContext.xmlContent
      contextInfo += `\n\nContext from Uploaded XML:\n${truncatedXml}`
    }
  }

  if (toolContext) {
    const schema = toolContext.getNodes()
    if (schema.length > 0) {
      contextInfo += `\n\nAvailable Nodes: ${schema.map(n => `${n.label} (${n.type})`).join(', ')}`
    }
  }

  const systemMessage = new SystemMessage(RESEARCH_ASSISTANT_SYSTEM_PROMPT + contextInfo)

  // Bind tools to the model (check if bindTools exists)
  if (!model.bindTools) {
    throw new Error('Model does not support tool binding. Please use a chat model that supports tools.')
  }

  // Create tools with executor if context is provided, otherwise use empty tools
  const tools = toolContext
    ? createModelBuilderTools(createToolExecutor(toolContext))
    : []

  const modelWithTools = model.bindTools(tools)

  // Track all messages in this conversation including tool interactions
  const conversationMessages: BaseMessage[] = [
    systemMessage,
    ...conversationHistory,
    new HumanMessage(message),
  ]

  // Call the model
  let response = await modelWithTools.invoke(conversationMessages)

  // Handle tool calls in a loop (max 5 iterations to prevent infinite loops)
  let iterations = 0
  const maxIterations = 5

  while (response.tool_calls && response.tool_calls.length > 0 && iterations < maxIterations) {
    iterations++
    const toolMessages: ToolMessage[] = []

    // Add the response (with tool calls) to conversation
    conversationMessages.push(response)

    for (const toolCall of response.tool_calls) {
      // Find the tool
      const tool = tools.find(t => t.name === toolCall.name)
      if (tool && toolCall.id) {
        try {
          // Tools are invoked with the args object directly
          const result = await (tool as any).invoke(toolCall.args || {})
          const toolMessage = new ToolMessage({
            content: typeof result === 'string' ? result : JSON.stringify(result),
            tool_call_id: toolCall.id,
          })
          toolMessages.push(toolMessage)
          conversationMessages.push(toolMessage)
        } catch (error) {
          const errorMessage = new ToolMessage({
            content: `Error executing tool ${toolCall.name}: ${error instanceof Error ? error.message : String(error)}`,
            tool_call_id: toolCall.id,
          })
          toolMessages.push(errorMessage)
          conversationMessages.push(errorMessage)
        }
      }
    }

    // Call the model again with full conversation history including tool results
    response = await modelWithTools.invoke(conversationMessages)
  }

  // Final response doesn't need to be added to conversationMessages as it's returned

  return response
}
