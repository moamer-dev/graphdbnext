import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { AIMessage, HumanMessage, SystemMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages'
import type { AIMessageChunk } from '@langchain/core/messages'
import { createModelBuilderTools } from '../tools/modelBuilderTools'
import { createToolExecutor } from '../tools/toolExecutor'
import type { ToolExecutionContext } from '../tools/toolExecutor'
import type { AISettings } from '../config/types'
import type { ResearchAssistantContext } from './ResearchAssistantAgent'

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
 * Streaming version of the research assistant agent
 * Returns an async generator that yields tokens as they arrive
 */
export async function* invokeResearchAssistantStreaming(
  model: BaseChatModel,
  settings: AISettings,
  message: string,
  conversationHistory: Array<HumanMessage | AIMessage | ToolMessage> = [],
  toolContext?: ToolExecutionContext,
  appContext?: ResearchAssistantContext
): AsyncGenerator<string, void, unknown> {
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

  // Call the model with streaming
  let response: AIMessage | null = null
  let accumulatedContent = ''
  const chunks: AIMessageChunk[] = []

  // Stream the initial response
  const stream = await modelWithTools.stream(conversationMessages)

  for await (const chunk of stream) {
    // Accumulate chunks to reconstruct full message for tool_calls
    chunks.push(chunk as AIMessageChunk)

    // Chunks are AIMessageChunk objects, which have content directly
    if (chunk.content) {
      const content = typeof chunk.content === 'string'
        ? chunk.content
        : Array.isArray(chunk.content)
          ? chunk.content.map((c: unknown) => typeof c === 'string' ? c : String(c)).join('')
          : String(chunk.content)
      accumulatedContent += content
      yield content
    }
  }

  // Reconstruct the full AIMessage from chunks to get tool_calls
  // In LangChain streaming, tool_calls are accumulated in chunks, so the last chunk has all tool_calls
  if (chunks.length > 0) {
    const lastChunk = chunks[chunks.length - 1]
    // Use the last chunk's tool_calls (LangChain accumulates them in the last chunk)
    const finalToolCalls = lastChunk.tool_calls && lastChunk.tool_calls.length > 0
      ? lastChunk.tool_calls.filter((tc): tc is NonNullable<typeof tc> => tc !== undefined && tc !== null)
      : undefined

    response = new AIMessage({
      content: accumulatedContent,
      tool_calls: finalToolCalls,
      response_metadata: lastChunk.response_metadata,
    })
  } else {
    response = new AIMessage(accumulatedContent)
  }

  // Handle tool calls in a loop (max 5 iterations to prevent infinite loops)
  let iterations = 0
  const maxIterations = 5

  while (response.tool_calls && response.tool_calls.length > 0 && iterations < maxIterations) {
    iterations++
    const toolMessages: ToolMessage[] = []

    // Add the response (with tool calls) to conversation
    conversationMessages.push(response)

    // Yield information about tool calls
    yield `\n\n[Executing ${response.tool_calls.length} tool(s)...]\n\n`

    for (const toolCall of response.tool_calls) {
      // Find the tool
      const tool = tools.find(t => t.name === toolCall.name)
      if (tool && toolCall.id) {
        try {
          // Tools are invoked with the args object directly
          const result = await (tool as any).invoke(toolCall.args || {})
          const resultContent = typeof result === 'string' ? result : JSON.stringify(result)

          // Yield tool result to user so they can see what happened
          yield `✓ Tool ${toolCall.name} executed: ${resultContent}\n`

          const toolMessage = new ToolMessage({
            content: resultContent,
            tool_call_id: toolCall.id,
          })
          toolMessages.push(toolMessage)
          conversationMessages.push(toolMessage)
        } catch (error) {
          const errorContent = `Error executing tool ${toolCall.name}: ${error instanceof Error ? error.message : String(error)}`

          // Yield error to user
          yield `✗ ${errorContent}\n`

          const errorMessage = new ToolMessage({
            content: errorContent,
            tool_call_id: toolCall.id,
          })
          toolMessages.push(errorMessage)
          conversationMessages.push(errorMessage)
        }
      } else {
        const notFoundMsg = `Tool ${toolCall.name} not found or missing ID`
        yield `✗ ${notFoundMsg}\n`

        if (toolCall.id) {
          const errorMessage = new ToolMessage({
            content: notFoundMsg,
            tool_call_id: toolCall.id,
          })
          toolMessages.push(errorMessage)
          conversationMessages.push(errorMessage)
        }
      }
    }

    yield `\n[Waiting for model response...]\n\n`

    // Stream the next response with tool results
    accumulatedContent = ''
    const nextChunks: AIMessageChunk[] = []
    const nextStream = await modelWithTools.stream(conversationMessages)

    for await (const chunk of nextStream) {
      // Accumulate chunks to reconstruct full message for tool_calls
      nextChunks.push(chunk as AIMessageChunk)

      // Chunks are AIMessageChunk objects, which have content directly
      if (chunk.content) {
        const content = typeof chunk.content === 'string'
          ? chunk.content
          : Array.isArray(chunk.content)
            ? chunk.content.map((c: unknown) => typeof c === 'string' ? c : String(c)).join('')
            : String(chunk.content)
        accumulatedContent += content
        yield content
      }
    }

    // Reconstruct the full AIMessage from chunks to get tool_calls
    if (nextChunks.length > 0) {
      const lastChunk = nextChunks[nextChunks.length - 1]
      // Use the last chunk's tool_calls (LangChain accumulates them in the last chunk)
      const finalToolCalls = lastChunk.tool_calls && lastChunk.tool_calls.length > 0
        ? lastChunk.tool_calls.filter((tc): tc is NonNullable<typeof tc> => tc !== undefined && tc !== null)
        : undefined

      response = new AIMessage({
        content: accumulatedContent,
        tool_calls: finalToolCalls,
        response_metadata: lastChunk.response_metadata,
      })
    } else {
      response = new AIMessage(accumulatedContent)
    }

    // Break if no more tool calls
    if (!response.tool_calls || response.tool_calls.length === 0) {
      break
    }
  }
}

