import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'
import type { AISettings } from '../config/types'
import type { Node } from '../../types'

const NODE_PROPERTY_SUGGESTION_SYSTEM_PROMPT = `You are an expert graph database schema designer specializing in node property modeling.

Your role is to analyze a node and suggest appropriate properties based on:
1. Semantic meaning of node label/type
2. Domain knowledge (research, academic, bibliographic, social networks, etc.)
3. Common patterns for similar node types
4. Best practices for graph database properties

Guidelines:
- Suggest semantically meaningful property names (e.g., "name", "email", "publicationDate")
- Recommend appropriate property types (string, number, boolean, date, array, object)
- Identify which properties should be required vs optional
- Consider domain-specific requirements
- Suggest at least 10 properties to give users many options
- Provide brief descriptions for each property

CRITICAL: You MUST always respond with valid JSON only. Do not include markdown code blocks, explanations, or any text outside the JSON object.`

const PropertySuggestionSchema = z.object({
  key: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object']),
  required: z.boolean().optional().default(false),
  description: z.string().optional(),
})

const NodePropertySuggestionSchema = z.object({
  suggestions: z.array(PropertySuggestionSchema).optional().default([]),
  recommended: z.array(PropertySuggestionSchema).optional(),
}).refine(
  (data) => {
    return (data.suggestions && data.suggestions.length > 0) || (data.recommended && data.recommended.length > 0)
  },
  {
    message: "Either 'suggestions' array or 'recommended' array must be provided",
  }
)

export interface PropertySuggestion {
  key: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  required?: boolean
  description?: string
}

export interface NodePropertySuggestion {
  suggestions: PropertySuggestion[]
  recommended?: PropertySuggestion[]
}

async function parseStructuredResponse(
  response: string,
  schema: z.ZodSchema
): Promise<any> {
  let jsonString = response.trim()

  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/```\w*\s*/g, '').replace(/```\s*$/g, '')
  }

  jsonString = jsonString.replace(/\/\/.*$/gm, '')
  jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1')

  try {
    const { jsonrepair } = await import('jsonrepair')
    const repaired = jsonrepair(jsonString)
    const parsed = JSON.parse(repaired)
    return schema.parse(parsed)
  } catch (error) {
    throw new Error(
      `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export async function suggestNodeProperties(
  node: Node,
  allNodes?: Node[],
  context?: string,
  settings?: AISettings
): Promise<NodePropertySuggestion> {
  if (!settings?.enabled || !settings?.model?.apiKey) {
    throw new Error('AI settings are not configured')
  }

  const { createChatModel } = await import('../models/factory')
  const model = createChatModel(settings.model)

  const nodeDescription = `
    Label: ${node.label}
    Type: ${node.type}
    Current Properties: ${node.properties.map((p) => `${p.key} (${p.type}${p.required ? ', required' : ''})`).join(', ') || 'None'}
  `

  const xmlContext = node.data ? (() => {
    const xmlData = node.data as Record<string, unknown>
    const typeStats = xmlData.xmlTypeStatistics as { count: number; attributesCount: number; childrenCount: number } | undefined
    const xmlChildren = xmlData.xmlChildren as Array<{ name: string; count: number }> | undefined
    
    if (typeStats || xmlChildren) {
      return `
XML Element Context:
- Instances: ${typeStats?.count || 0}
- Attributes: ${typeStats?.attributesCount || 0}
- Child Types: ${xmlChildren?.map(c => `${c.name} (${c.count})`).join(', ') || 'None'}
`
    }
    return ''
  })() : ''

  const schemaContext = allNodes && allNodes.length > 0
    ? `
Other nodes in schema:
${allNodes.filter(n => n.id !== node.id).slice(0, 5).map(n => `- ${n.label} (${n.type})`).join('\n')}
`
    : ''

  const prompt = `Analyze this node and suggest appropriate properties.

Node Details:
${nodeDescription}
${xmlContext}
${schemaContext}
${context ? `\nAdditional Context: ${context}` : ''}

Please suggest at least 10 properties that would be semantically appropriate for this node type. Include a variety of property types and indicate which ones should be required.`

  const messages = [
    new SystemMessage(NODE_PROPERTY_SUGGESTION_SYSTEM_PROMPT),
    new HumanMessage(prompt),
  ]

  try {
    // Try structured output first (if model supports it)
    if ('withStructuredOutput' in model && typeof (model as any).withStructuredOutput === 'function') {
      const structuredModel = (model as any).withStructuredOutput(NodePropertySuggestionSchema, {
        name: 'node_property_suggestion',
        method: 'jsonSchema',
      })
      
      try {
        const response = await structuredModel.invoke(messages)
        let parsed
        
        try {
          parsed = await parseStructuredResponse(
            typeof response === 'string' ? response : JSON.stringify(response),
            NodePropertySuggestionSchema
          )
        } catch (parseError) {
          // If structured parsing fails, try to extract from raw response
          const responseStr = typeof response === 'string' ? response : JSON.stringify(response)
          const { jsonrepair } = await import('jsonrepair')
          
          try {
            const jsonMatch = responseStr.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const repaired = jsonrepair(jsonMatch[0])
              const rawParsed = JSON.parse(repaired)
              
              const normalizedSuggestions = Array.isArray(rawParsed.suggestions)
                ? rawParsed.suggestions
                : Array.isArray(rawParsed.properties)
                ? rawParsed.properties
                : Array.isArray(rawParsed)
                ? rawParsed
                : []

              parsed = {
                suggestions: normalizedSuggestions,
                recommended: rawParsed.recommended || normalizedSuggestions.slice(0, 5),
              }
            } else {
              throw parseError
            }
          } catch {
            throw parseError
          }
        }

        const suggestionsArray = Array.isArray(parsed.suggestions) ? parsed.suggestions : []
        const recommendedArray = Array.isArray(parsed.recommended) ? parsed.recommended : []

        return {
          suggestions: suggestionsArray.map((s: any) => ({
            key: s.key || s.name || 'property',
            type: (s.type || 'string') as PropertySuggestion['type'],
            required: s.required ?? false,
            description: s.description || s.desc,
          })),
          recommended: recommendedArray.length > 0
            ? recommendedArray.map((s: any) => ({
                key: s.key || s.name || 'property',
                type: (s.type || 'string') as PropertySuggestion['type'],
                required: s.required ?? false,
                description: s.description || s.desc,
              }))
            : undefined,
        }
      } catch {
        // Fall through to manual parsing
      }
    }
  } catch {
    // Fall through to manual parsing
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

    let parsed
    try {
      parsed = await parseStructuredResponse(responseContent, NodePropertySuggestionSchema)
    } catch (parseError) {
      // If structured parsing fails, try to extract suggestions from raw response
      try {
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const repaired = jsonrepair(jsonMatch[0])
          const rawParsed = JSON.parse(repaired)
          
          const normalizedSuggestions = Array.isArray(rawParsed.suggestions)
            ? rawParsed.suggestions
            : Array.isArray(rawParsed.properties)
            ? rawParsed.properties
            : Array.isArray(rawParsed)
            ? rawParsed
            : []

          parsed = {
            suggestions: normalizedSuggestions,
            recommended: rawParsed.recommended || normalizedSuggestions.slice(0, 5),
          }
        } else {
          throw parseError
        }
      } catch {
        throw parseError
      }
    }

    const suggestionsArray = Array.isArray(parsed.suggestions) ? parsed.suggestions : []
    const recommendedArray = Array.isArray(parsed.recommended) ? parsed.recommended : []

    return {
      suggestions: suggestionsArray.map((s: any) => ({
        key: s.key || s.name || 'property',
        type: (s.type || 'string') as PropertySuggestion['type'],
        required: s.required ?? false,
        description: s.description || s.desc,
      })),
      recommended: recommendedArray.length > 0
        ? recommendedArray.map((s: any) => ({
            key: s.key || s.name || 'property',
            type: (s.type || 'string') as PropertySuggestion['type'],
            required: s.required ?? false,
            description: s.description || s.desc,
          }))
        : undefined,
    }
  } catch (error) {
    throw new Error(
      `Failed to get property suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

