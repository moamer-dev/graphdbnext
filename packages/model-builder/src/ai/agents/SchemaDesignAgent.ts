import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'
import type { AISettings } from '../config/types'
import type { Node, Relationship } from '../../types'

const SCHEMA_DESIGN_SYSTEM_PROMPT = `You are an expert graph database schema design assistant specializing in research data modeling.

Your role is to help researchers design optimal graph database schemas by:
1. Understanding research domain requirements from natural language descriptions
2. Suggesting appropriate node types and relationships
3. Recommending best practices (normalization, indexing, query patterns)
4. Providing domain-specific insights for academic and research use cases

Guidelines:
- Use semantic, research-friendly node names (e.g., "Person", "Publication", "Institution" not "personNode", "pub")
- Consider common research domains: bibliographies, social networks, linguistic data, historical records, etc.
- Suggest appropriate relationship types that reflect semantic connections
- Recommend properties that are meaningful for the domain
- Consider query patterns when designing the schema
- Suggest cardinality when appropriate (one-to-one, one-to-many, many-to-many)

CRITICAL: You MUST always respond with valid JSON only. Do not include markdown code blocks, explanations, or any text outside the JSON object.`

// Zod schemas for structured output
const PropertySchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object']),
  required: z.boolean().optional(),
  description: z.string().optional(),
})

const NodeSchema = z.object({
  name: z.string(),
  label: z.string(),
  description: z.string(),
  properties: z.array(PropertySchema),
})

const RelationshipPropertySchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'date']),
})

const RelationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.string(),
  cardinality: z.enum(['one-to-one', 'one-to-many', 'many-to-many']).optional(),
  properties: z.array(RelationshipPropertySchema).optional(),
  description: z.string().optional(),
})

const SchemaSuggestionSchema = z.object({
  nodes: z.array(NodeSchema),
  relationships: z.array(RelationshipSchema),
  reasoning: z.string(),
})

const ImprovementSuggestionSchema = z.object({
  nodeId: z.string().optional(),
  nodeLabel: z.string().optional(),
  relationshipType: z.string().optional(),
  propertyName: z.string().optional(),
})

const ImprovementSchema = z.object({
  type: z.enum(['add_node', 'add_relationship', 'modify_node', 'add_property', 'suggest_normalization']),
  severity: z.enum(['suggestion', 'recommendation', 'important']),
  message: z.string(),
  suggestion: ImprovementSuggestionSchema.optional(),
})

const SchemaOptimizationSchema = z.object({
  improvements: z.array(ImprovementSchema),
  reasoning: z.string(),
})

const ValidationIssueSchema = z.object({
  severity: z.enum(['error', 'warning', 'suggestion']),
  nodeId: z.string().optional(),
  nodeLabel: z.string().optional(),
  relationshipId: z.string().optional(),
  message: z.string(),
  suggestion: z.string().optional(),
})

const SchemaValidationSchema = z.object({
  issues: z.array(ValidationIssueSchema),
})

export interface SchemaSuggestion {
  nodes: Array<{
    name: string
    label: string
    description: string
    properties: Array<{
      name: string
      type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
      required?: boolean
      description?: string
    }>
  }>
  relationships: Array<{
    from: string
    to: string
    type: string
    cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-many'
    properties?: Array<{
      name: string
      type: 'string' | 'number' | 'boolean' | 'date'
    }>
    description?: string
  }>
  reasoning: string
}

export interface SchemaOptimization {
  improvements: Array<{
    type: 'add_node' | 'add_relationship' | 'modify_node' | 'add_property' | 'suggest_normalization'
    severity: 'suggestion' | 'recommendation' | 'important'
    message: string
    suggestion?: {
      nodeId?: string
      nodeLabel?: string
      relationshipType?: string
      propertyName?: string
    }
  }>
  reasoning: string
}

export interface SchemaValidation {
  issues: Array<{
    severity: 'error' | 'warning' | 'suggestion'
    nodeId?: string
    nodeLabel?: string
    relationshipId?: string
    message: string
    suggestion?: string
  }>
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
        name: 'schema_response',
        method: 'jsonSchema', // Prefer jsonSchema method
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
    // 1. Normalize cardinality values: "many-to-one" is the same as "one-to-many" (just reverse direction)
    if (parsed.relationships && Array.isArray(parsed.relationships)) {
      parsed.relationships = parsed.relationships.map((rel: any) => {
        if (rel.cardinality === 'many-to-one') {
          rel.cardinality = 'one-to-many'
        }
        // 2. Normalize relationship property types: convert unsupported types to "string"
        if (rel.properties && Array.isArray(rel.properties)) {
          rel.properties = rel.properties.map((prop: any) => {
            if (prop.type && !['string', 'number', 'boolean', 'date'].includes(prop.type)) {
              // Convert "array", "object", etc. to "string" for relationship properties
              prop.type = 'string'
            }
            return prop
          })
        }
        return rel
      })
    }

    // 3. Normalize optimization schema format (schema_optimizations -> improvements)
    if (parsed.schema_optimizations && !parsed.improvements) {
      const optimizations: any[] = []

      // Convert new_nodes to add_node improvements
      if (parsed.schema_optimizations.new_nodes && Array.isArray(parsed.schema_optimizations.new_nodes)) {
        parsed.schema_optimizations.new_nodes.forEach((node: any) => {
          optimizations.push({
            type: 'add_node',
            severity: 'recommendation',
            message: node.description || `Add ${node.label || node.type} node: ${node.description || 'New node to improve schema structure'}`,
            suggestion: {
              nodeLabel: node.label || node.type,
            },
          })
        })
      }

      // Convert new_relationships to add_relationship improvements
      if (parsed.schema_optimizations.new_relationships && Array.isArray(parsed.schema_optimizations.new_relationships)) {
        parsed.schema_optimizations.new_relationships.forEach((rel: any) => {
          optimizations.push({
            type: 'add_relationship',
            severity: 'recommendation',
            message: rel.description || `Add ${rel.type} relationship between ${rel.from} and ${rel.to}`,
            suggestion: {
              relationshipType: rel.type,
            },
          })
        })
      }

      // Convert property suggestions to add_property improvements
      if (parsed.schema_optimizations.property_suggestions && Array.isArray(parsed.schema_optimizations.property_suggestions)) {
        parsed.schema_optimizations.property_suggestions.forEach((prop: any) => {
          optimizations.push({
            type: 'add_property',
            severity: 'suggestion',
            message: prop.message || `Add property ${prop.propertyName} to ${prop.nodeLabel || 'node'}`,
            suggestion: {
              nodeLabel: prop.nodeLabel,
              propertyName: prop.propertyName,
            },
          })
        })
      }

      parsed.improvements = optimizations
      // Preserve reasoning if it exists in schema_optimizations or at root level, otherwise use default
      if (!parsed.reasoning) {
        parsed.reasoning = parsed.schema_optimizations?.reasoning
          || parsed.schema_optimizations?.summary
          || parsed.reasoning
          || 'AI-generated optimization suggestions based on schema analysis.'
      }
      // Remove schema_optimizations to avoid confusion
      delete parsed.schema_optimizations
    }

    // 4. Ensure "improvements" field is present for optimization schema (if schema expects it)
    if (!parsed.improvements) {
      parsed.improvements = []
    }

    // 5. Ensure "reasoning" field is present (required by schema)
    if (!parsed.reasoning || typeof parsed.reasoning !== 'string') {
      parsed.reasoning = 'AI-generated schema suggestion based on the provided description.'
    }

    // Validate with Zod schema
    try {
      return schema.parse(parsed)
    } catch (zodError) {
      throw new Error(`Schema validation failed: ${zodError instanceof Error ? zodError.message : String(zodError)}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse AI response: ${errorMessage}`)
  }
}

/**
 * Suggests a graph database schema based on a natural language description
 */
export async function suggestSchema(
  model: BaseChatModel,
  settings: AISettings,
  description: string,
  existingNodes?: Node[],
  xmlContext?: string
): Promise<SchemaSuggestion> {
  const systemMessage = new SystemMessage(SCHEMA_DESIGN_SYSTEM_PROMPT)

  const existingSchemaInfo = existingNodes && existingNodes.length > 0
    ? `\n\nExisting Nodes: ${existingNodes.map(n => `${n.label} (${n.type})`).join(', ')}`
    : ''

  let prompt = `Based on this description, suggest a complete graph database schema:

Description: "${description}"
${existingSchemaInfo}`

  if (xmlContext) {
    const truncatedXml = xmlContext.length > 5000
      ? xmlContext.substring(0, 5000) + '... (truncated)'
      : xmlContext
    prompt += `\n\nContext from Uploaded XML (use this to infer entities and relationships):\n${truncatedXml}`
  }

  prompt += `\n\nIMPORTANT: You MUST respond with valid JSON only, matching this structure:
{
  "nodes": [
    {
      "name": "string",
      "label": "string",
      "description": "string",
      "properties": [
        {
          "name": "string",
          "type": "string" | "number" | "boolean" | "date" | "array" | "object",
          "required": boolean,
          "description": "string (optional)"
        }
      ]
    }
  ],
  "relationships": [
    {
      "from": "string (node label)",
      "to": "string (node label)",
      "type": "string",
      "cardinality": "one-to-one" | "one-to-many" | "many-to-many" | "many-to-one" (optional, "many-to-one" will be normalized to "one-to-many"),
      "properties": [{"name": "string", "type": "string" | "number" | "boolean" | "date"}] (optional, unsupported types will be normalized to "string"),
      "description": "string (optional)"
    }
  ],
  "reasoning": "string explaining your schema design (REQUIRED - must be provided)"
}

Respond with ONLY the JSON object, no markdown, no explanations before or after.`

  const messages = [systemMessage, new HumanMessage(prompt)]

  try {
    return await parseStructuredResponse(
      model,
      messages,
      SchemaSuggestionSchema
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      nodes: [],
      relationships: [],
      reasoning: `Could not parse AI response: ${errorMessage}. Please try again.`,
    }
  }
}

/**
 * Analyzes an existing schema and suggests optimizations
 */
export async function optimizeSchema(
  model: BaseChatModel,
  settings: AISettings,
  currentSchema: { nodes: Node[]; relationships: Relationship[] }
): Promise<SchemaOptimization> {
  const systemMessage = new SystemMessage(SCHEMA_DESIGN_SYSTEM_PROMPT)

  const schemaSummary = {
    nodes: currentSchema.nodes.map(n => ({
      label: n.label,
      type: n.type,
      properties: n.properties.map(p => ({ name: p.key, type: p.type, required: p.required })),
    })),
    relationships: currentSchema.relationships.map(r => ({
      type: r.type,
      from: currentSchema.nodes.find(n => n.id === r.from)?.label || r.from,
      to: currentSchema.nodes.find(n => n.id === r.to)?.label || r.to,
      properties: r.properties?.map(p => ({ name: p.key, type: p.type })),
      cardinality: r.cardinality,
    })),
  }

  const prompt = `Analyze this graph database schema and suggest optimizations:

Current Schema:
${JSON.stringify(schemaSummary, null, 2)}

Consider:
- Missing nodes that would improve query efficiency
- Missing relationships that represent important connections
- Properties that might be useful
- Normalization opportunities (splitting properties into nodes)
- Performance considerations (avoiding overly deep hierarchies)

IMPORTANT: You MUST respond with valid JSON only, matching this structure:
{
  "improvements": [
    {
      "type": "add_node" | "add_relationship" | "modify_node" | "add_property" | "suggest_normalization",
      "severity": "suggestion" | "recommendation" | "important",
      "message": "string describing the optimization",
      "suggestion": {
        "nodeLabel": "string (for add_node type)",
        "relationshipType": "string (for add_relationship type)",
        "propertyName": "string (for add_property type)",
        "nodeId": "string (for modify_node type)"
      }
    }
  ],
  "reasoning": "string explaining your optimization suggestions (REQUIRED)"
}

Respond with ONLY the JSON object, no markdown, no explanations before or after.`

  const messages = [systemMessage, new HumanMessage(prompt)]

  try {
    return await parseStructuredResponse(
      model,
      messages,
      SchemaOptimizationSchema
    )
  } catch {
    return {
      improvements: [],
      reasoning: 'Could not parse AI response. Please try again.',
    }
  }
}

/**
 * Validates a schema with domain knowledge
 */
export async function validateSchema(
  model: BaseChatModel,
  settings: AISettings,
  schema: { nodes: Node[]; relationships: Relationship[] }
): Promise<SchemaValidation> {
  const systemMessage = new SystemMessage(SCHEMA_DESIGN_SYSTEM_PROMPT)

  const schemaSummary = {
    nodes: schema.nodes.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
      properties: n.properties.map(p => ({ name: p.key, type: p.type, required: p.required })),
    })),
    relationships: schema.relationships.map(r => ({
      id: r.id,
      type: r.type,
      from: schema.nodes.find(n => n.id === r.from)?.label || r.from,
      fromId: r.from,
      to: schema.nodes.find(n => n.id === r.to)?.label || r.to,
      toId: r.to,
    })),
  }

  const prompt = `Validate this graph database schema and identify issues:

Schema:
${JSON.stringify(schemaSummary, null, 2)}

Check for:
- Nodes without relationships (orphaned nodes)
- Missing required relationships
- Relationship types that don't match semantic meaning
- Property type mismatches
- Schema design anti-patterns
- Potential query performance issues

Provide validation results as requested.`

  const messages = [systemMessage, new HumanMessage(prompt)]

  try {
    return await parseStructuredResponse(
      model,
      messages,
      SchemaValidationSchema
    )
  } catch {
    return {
      issues: [],
    }
  }
}
