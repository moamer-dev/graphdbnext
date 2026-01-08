import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'
import type { AISettings } from '../config/types'
import type { Node, Relationship } from '../../types'

const WORKFLOW_GENERATION_SYSTEM_PROMPT = `You are an expert workflow generation assistant for graph database processing pipelines.

Your role is to generate workflows that process XML data and transform it into graph database structures. You understand:
- XML parsing and traversal patterns
- Graph database node and relationship creation
- Data transformation and filtering
- Conditional logic and loops
- Common patterns in scholarly data processing (TEI, edXML, etc.)

CRITICAL: Always prefer specialized actions over generic ones. For example:
- Use "action:create-token-nodes" to tokenize text and create token nodes with relationships
- Use "action:create-annotation-nodes" for annotation processing
- Use "action:create-reference-chain" for reference processing
- Use "action:create-hierarchical-nodes" for hierarchical structures

Guidelines:
- Generate workflows that are logically structured and efficient
- Use tool:if for conditional checks (e.g., checking if element has attribute)
- Use specialized actions when available instead of generic create-node + create-relationship
- Create nodes and relationships in the correct order
- Handle XML structure traversal properly
- Consider error handling and edge cases
- Use semantic tool/action names that reflect their purpose`

// Zod schemas for structured output
const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

const ToolNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: PositionSchema,
  config: z.record(z.unknown()).optional().transform((val) => val || {}),
  label: z.string().optional(),
})

const ActionNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: PositionSchema,
  config: z.record(z.unknown()).optional().transform((val) => val || {}),
  label: z.string().optional(),
})

const EdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  outputPath: z.string().optional(),
})

const WorkflowSuggestionSchema = z.object({
  toolNodes: z.array(ToolNodeSchema),
  actionNodes: z.array(ActionNodeSchema),
  edges: z.array(EdgeSchema),
  explanation: z.string(),
})

export interface WorkflowSuggestion {
  toolNodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    config: Record<string, unknown>
    label?: string
  }>
  actionNodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    config: Record<string, unknown>
    label?: string
  }>
  edges: Array<{
    id: string
    from: string
    to: string
    sourceHandle?: string
    targetHandle?: string
    outputPath?: string
  }>
  explanation: string
}

/**
 * Attempts to use structured output, falls back to manual parsing with jsonrepair
 */
async function parseStructuredResponse<T>(
  model: BaseChatModel,
  messages: Array<SystemMessage | HumanMessage>,
  schema: z.ZodSchema<T>
): Promise<T> {
  // Try structured output first (if model supports it)
  try {
    if ('withStructuredOutput' in model && typeof model.withStructuredOutput === 'function') {
      const structuredModel = (model as any).withStructuredOutput(schema, {
        name: 'workflow_response',
        method: 'jsonSchema',
      })
      const response = await structuredModel.invoke(messages)
      return response
    }
  } catch {
    // Fall back to manual parsing if structured output fails
  }

  // Fallback: manual invocation with jsonrepair
  try {
    const { jsonrepair } = await import('jsonrepair')
    const response = await model.invoke(messages)

    let responseContent = ''
    if (response.content) {
      responseContent = typeof response.content === 'string'
        ? response.content
        : Array.isArray(response.content)
          ? response.content.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join('')
          : JSON.stringify(response.content)
    }

    // Remove markdown code blocks if present
    let cleanedContent = responseContent.trim()
    cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '')

    // Try to extract JSON from response (match first complete JSON object)
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error(`No JSON found in response. Response preview: ${cleanedContent.substring(0, 200)}`)
    }

    // Use jsonrepair to fix malformed JSON
    let jsonString = jsonMatch[0]
    try {
      jsonString = jsonrepair(jsonString)
    } catch {
      // Continue with original JSON if repair fails
    }

    // Parse JSON
    let parsed: any
    try {
      parsed = JSON.parse(jsonString)
    } catch (parseError) {
      throw new Error(`Failed to parse JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
    }

    // Normalize data before validation
    // Ensure config fields are present (default to empty object)
    if (parsed.toolNodes && Array.isArray(parsed.toolNodes)) {
      parsed.toolNodes = parsed.toolNodes.map((node: any) => ({
        ...node,
        config: node.config || {},
      }))
    }
    if (parsed.actionNodes && Array.isArray(parsed.actionNodes)) {
      parsed.actionNodes = parsed.actionNodes.map((node: any) => ({
        ...node,
        config: node.config || {},
      }))
    }

    // Validate with Zod schema
    try {
      return schema.parse(parsed) as T
    } catch (zodError) {
      throw new Error(`Schema validation failed: ${zodError instanceof Error ? zodError.message : String(zodError)}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse AI response: ${errorMessage}`)
  }
}

/**
 * Generates a workflow from a natural language description
 */
export async function generateWorkflow(
  model: BaseChatModel,
  settings: AISettings,
  description: string,
  schema: { nodes: Node[]; relationships: Relationship[] }
): Promise<WorkflowSuggestion> {
  const systemMessage = new SystemMessage(WORKFLOW_GENERATION_SYSTEM_PROMPT)

  const schemaSummary = {
    nodes: schema.nodes.map(n => ({
      label: n.label,
      type: n.type,
      properties: n.properties.map(p => ({ name: p.key, type: p.type })),
    })),
    relationships: schema.relationships.map(r => ({
      type: r.type,
      from: schema.nodes.find(n => n.id === r.from)?.label || r.from,
      to: schema.nodes.find(n => n.id === r.to)?.label || r.to,
    })),
  }

  const prompt = `Generate a workflow based on this description:

Description: "${description}"

Target Schema:
${JSON.stringify(schemaSummary, null, 2)}

Available Workflow Components:

Tools (for conditional logic and data processing):
- tool:if - Conditional logic with condition groups (check HasAttribute, HasTextContent, HasChildren, etc.)
  Config example for checking attribute: {
    "conditionGroups": [{
      "conditions": [{
        "type": "HasAttribute",
        "attributeName": "text"  // or use "value" field
      }],
      "internalOperator": "AND",
      "operator": "AND"
    }]
  }
  Output paths: "true" or "false"
- tool:switch - Multi-branch conditional based on attribute/elementName/textContent
- tool:loop - Iterate over collections
- tool:filter - Filter data based on conditions
- tool:transform - Transform data structures
- tool:merge - Merge multiple data streams
- tool:map - Map over arrays
- tool:split - Split data into multiple streams
- tool:aggregate, tool:sort, tool:limit, tool:collect, tool:traverse, etc.
- tool:fetch-api - Fetch data from research APIs (Wikidata, GND, VIAF, ORCID, etc.)
  Use when: User asks to fetch data from external sources like Wikidata
  Config example: {
    "apiProvider": "wikidata",
    "idSource": "attribute",
    "idAttribute": "wikiId"
  }
- tool:lookup - Internal lookup (DO NOT use for external APIs like Wikidata)

Actions (for graph operations - USE SPECIALIZED ACTIONS WHEN AVAILABLE):
PRIMARY ACTIONS (use these when they match the use case):
- action:create-token-nodes - Tokenize text from an attribute and create token nodes with relationships
  Use when: You need to split text into tokens and create nodes for each token
  Config includes: parentNodeLabel, tokenNodeLabel, tokenNodeType, relationshipType (default: "includes"), textSource ("attribute" or "textContent"), attributeName (required if textSource is "attribute")
  splitBy: Optional. Only include if user explicitly requests splitting (e.g., "split by space", "split by comma"). 
    - If splitBy is NOT included in config or is empty: Creates one token node per character (character-level tokenization)
    - If splitBy is provided (e.g., " "): Splits text by the specified delimiter (e.g., space splits into words)
  IMPORTANT: If reading from an attribute, you MUST set textSource: "attribute" and attributeName to the attribute name (e.g., "text")
  IMPORTANT: Do NOT include splitBy in config unless the user explicitly asks to split the text by a delimiter. By default (when splitBy is not specified), the action will create one token node per character.
  This action automatically handles tokenization, node creation, and relationship creation
- action:create-annotation-nodes - Create annotation nodes from XML annotations
- action:create-reference-chain - Create reference chains
- action:create-hierarchical-nodes - Create hierarchical node structures
- action:create-node-with-attributes - Create a node and extract all attributes as properties
- action:create-node-complete - Complete node creation with property extraction
- action:extract-and-normalize-attributes - Extract and normalize XML attributes

BASIC ACTIONS (use when specialized actions don't fit):
- action:create-node - Create a basic graph node
- action:create-relationship - Create a relationship between existing nodes
- action:set-property - Set property on a node
- action:extract-property - Extract property from XML/data
- action:transform-text - Transform text content
- action:extract-text - Extract text content
- action:skip - Skip processing current item
- action:process-children - Process child elements

COMMON PATTERNS:

Pattern 1: Check if element has attribute, then tokenize:
{
  "toolNodes": [{
    "id": "tool-1",
    "type": "tool:if",
    "position": { "x": 100, "y": 100 },
    "config": {
      "conditionGroups": [{
        "conditions": [{
          "type": "HasAttribute",
          "attributeName": "text"
        }],
        "internalOperator": "AND",
        "operator": "AND"
      }]
    },
    "label": "Check Has Text Attribute"
  }],
  "actionNodes": [{
    "id": "action-1",
    "type": "action:create-token-nodes",
    "position": { "x": 300, "y": 100 },
    "config": {
      "parentNodeLabel": "Word",
      "tokenNodeLabel": "Token",
      "tokenNodeType": "Token",
      "relationshipType": "includes",
      "textSource": "attribute",
      "attributeName": "text"
    },
    "label": "Create Token Nodes"
  }],
  "edges": [
    {
      "id": "edge-1",
      "from": "tool-1",
      "to": "action-1",
      "sourceHandle": "true",  // Connect true output to action
      "targetHandle": "input-1"
    }
  ]
}

IMPORTANT RULES:
1. For tokenization: Always use "action:create-token-nodes" instead of action:create-node + action:create-relationship
2. For conditional checks: Use "tool:if" with HasAttribute condition type, NOT tool:filter
3. Connect tool:if "true" output to actions that should execute when condition is met
4. Use specialized actions (action:create-token-nodes, action:create-annotation-nodes, etc.) instead of generic actions when they match your use case
5. Start with XML input (implicit trigger:xml-start)
6. Use appropriate positions (spread horizontally: 100px apart, vertically: 150px apart)
7. Use semantic labels for nodes

Generate a workflow as JSON following these patterns. Return ONLY valid JSON. No comments, no trailing commas, no markdown code blocks.`

  const messages = [systemMessage, new HumanMessage(prompt)]

  try {
    const result = await parseStructuredResponse(
      model,
      messages,
      WorkflowSuggestionSchema
    )
    return result as WorkflowSuggestion
  } catch {
    return {
      toolNodes: [],
      actionNodes: [],
      edges: [],
      explanation: 'Could not parse AI response. Please try again.',
    }
  }
}

/**
 * Explains what a workflow does in plain language
 */
export async function explainWorkflow(
  model: BaseChatModel,
  settings: AISettings,
  workflow: {
    toolNodes?: Array<{ type: string; label?: string; config?: Record<string, unknown> }>
    actionNodes?: Array<{ type: string; label?: string; config?: Record<string, unknown> }>
    edges?: Array<{ from: string; to: string }>
  }
): Promise<string> {
  const systemMessage = new SystemMessage(WORKFLOW_GENERATION_SYSTEM_PROMPT)

  const workflowSummary = {
    tools: workflow.toolNodes?.map(n => ({
      type: n.type,
      label: n.label,
      config: n.config,
    })) || [],
    actions: workflow.actionNodes?.map(n => ({
      type: n.type,
      label: n.label,
      config: n.config,
    })) || [],
    connections: workflow.edges?.map(e => ({
      from: e.from,
      to: e.to,
    })) || [],
  }

  const prompt = `Explain what this workflow does:

Workflow Structure:
${JSON.stringify(workflowSummary, null, 2)}

Provide a clear, concise explanation in plain language:
- What data does it process?
- What operations does it perform?
- What graph structure does it create?
- What is the overall purpose?

Keep the explanation brief (2-3 paragraphs) and focus on the high-level purpose and flow.`

  const messages = [systemMessage, new HumanMessage(prompt)]
  const response = await model.invoke(messages)

  if (response.content) {
    return typeof response.content === 'string'
      ? response.content
      : Array.isArray(response.content)
        ? response.content.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join('')
        : JSON.stringify(response.content)
  }

  return 'Could not generate workflow explanation.'
}

