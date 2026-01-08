import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'
import type { AISettings } from '../config/types'
import type { Node, Relationship } from '../../types'

const RELATIONSHIP_RECOMMENDATION_SYSTEM_PROMPT = `You are an expert graph database schema designer specializing in relationship modeling.

Your role is to analyze two nodes and suggest appropriate relationship types, cardinality, and properties based on:
1. Semantic meaning of node labels/types
2. Node properties and their purposes
3. Domain knowledge (research, academic, bibliographic, social networks, etc.)
4. Best practices for graph database relationships

Guidelines:
- Suggest at least 10 relationship types (more if possible) to give users many options
- Suggest semantically meaningful relationship types (e.g., "AUTHORED", "PUBLISHED_IN", "AFFILIATED_WITH")
- Consider the direction of the relationship (from node A to node B)
- Recommend appropriate cardinality (one-to-one, one-to-many, many-to-many)
- Provide brief, concise descriptions for each relationship type
- Consider domain-specific patterns (e.g., in bibliographies: Author → Publication, Publication → Journal)
- Include a variety of relationship types from different perspectives

CRITICAL: You MUST always respond with valid JSON only. Do not include markdown code blocks, explanations, or any text outside the JSON object.`

const RelationshipPropertySchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'date']),
  description: z.string().optional(),
})

const RelationshipSuggestionSchema = z.object({
  type: z.string(),
  cardinality: z.enum(['one-to-one', 'one-to-many', 'many-to-many']),
  properties: z.array(RelationshipPropertySchema).optional(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
})

const RelationshipRecommendationSchema = z.object({
  suggestions: z.array(RelationshipSuggestionSchema).optional().default([]),
  recommended: RelationshipSuggestionSchema.optional(),
}).refine(
  (data) => {
    // Ensure at least suggestions or recommended exists
    return (data.suggestions && data.suggestions.length > 0) || !!data.recommended
  },
  {
    message: "Either 'suggestions' array or 'recommended' must be provided",
  }
)

export interface RelationshipSuggestion {
  type: string
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many'
  properties?: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'date'
    description?: string
  }>
  confidence: number
  reasoning: string
}

export interface RelationshipRecommendation {
  suggestions: RelationshipSuggestion[]
  recommended?: RelationshipSuggestion
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

export async function suggestRelationships(
  nodeA: Node,
  nodeB: Node,
  existingRelationships: Relationship[],
  context?: string,
  settings?: AISettings
): Promise<RelationshipRecommendation> {
  if (!settings?.enabled || !settings?.model?.apiKey) {
    throw new Error('AI settings are not configured')
  }

  const { createChatModel } = await import('../models/factory')
  const model = createChatModel(settings.model)

  const nodeADescription = `
    Label: ${nodeA.label}
    Type: ${nodeA.type}
    Properties: ${nodeA.properties.map((p) => `${p.key} (${p.type})`).join(', ') || 'None'}
  `

  const nodeBDescription = `
    Label: ${nodeB.label}
    Type: ${nodeB.type}
    Properties: ${nodeB.properties.map((p) => `${p.key} (${p.type})`).join(', ') || 'None'}
  `

  const existingRelsText = existingRelationships.length > 0
    ? `\nExisting relationships from ${nodeA.label} to ${nodeB.label}:\n${existingRelationships.map((r) => `- ${r.type} (${r.cardinality || 'unspecified'})`).join('\n')}`
    : ''

  const prompt = `Analyze the relationship between these two nodes and suggest appropriate relationship types.

From Node (${nodeA.label}):
${nodeADescription}

To Node (${nodeB.label}):
${nodeBDescription}
${existingRelsText}
${context ? `\nAdditional Context: ${context}` : ''}

Please suggest at least 10 relationship types (more if possible) that would be semantically appropriate between these two nodes. Include a variety of relationship types to give the user many options to choose from. For each relationship, provide the type name and a brief description.`

  const messages = [
    new SystemMessage(RELATIONSHIP_RECOMMENDATION_SYSTEM_PROMPT),
    new HumanMessage(prompt),
  ]

  try {
    // Try structured output first (if model supports it)
    if ('withStructuredOutput' in model && typeof (model as any).withStructuredOutput === 'function') {
      const structuredModel = (model as any).withStructuredOutput(RelationshipRecommendationSchema, {
        name: 'relationship_recommendation',
        method: 'jsonSchema',
      })
      const response = await structuredModel.invoke(messages)
      let parsed
      
      try {
        parsed = await parseStructuredResponse(
          typeof response === 'string' ? response : JSON.stringify(response),
          RelationshipRecommendationSchema
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
              : Array.isArray(rawParsed.relationships)
              ? rawParsed.relationships
              : Array.isArray(rawParsed)
              ? rawParsed
              : []

            parsed = {
              suggestions: normalizedSuggestions,
              recommended: rawParsed.recommended || normalizedSuggestions[0],
            }
          } else {
            throw parseError
          }
        } catch {
          throw parseError
        }
      }

      const suggestionsArray = Array.isArray(parsed.suggestions) ? parsed.suggestions : []
      const recommendedItem = parsed.recommended || suggestionsArray[0]

      return {
        suggestions: suggestionsArray.map((s: any) => ({
          type: s.type || 'RELATES_TO',
          cardinality: s.cardinality || 'many-to-many',
          properties: s.properties || [],
          confidence: s.confidence ?? 0.8,
          reasoning: s.reasoning || 'No reasoning provided',
        })),
        recommended: recommendedItem
          ? {
              type: recommendedItem.type || 'RELATES_TO',
              cardinality: recommendedItem.cardinality || 'many-to-many',
              properties: recommendedItem.properties || [],
              confidence: recommendedItem.confidence ?? 0.8,
              reasoning: recommendedItem.reasoning || 'No reasoning provided',
            }
          : undefined,
      }
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

    let parsed
    try {
      parsed = await parseStructuredResponse(responseContent, RelationshipRecommendationSchema)
    } catch (parseError) {
      // If structured parsing fails, try to extract suggestions from raw response
      try {
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const { jsonrepair } = await import('jsonrepair')
          const repaired = jsonrepair(jsonMatch[0])
          const rawParsed = JSON.parse(repaired)
          
          // Try to normalize the response structure
          const normalizedSuggestions = Array.isArray(rawParsed.suggestions)
            ? rawParsed.suggestions
            : Array.isArray(rawParsed.relationships)
            ? rawParsed.relationships
            : Array.isArray(rawParsed)
            ? rawParsed
            : rawParsed.relationships
            ? [rawParsed.relationships]
            : []

          parsed = {
            suggestions: normalizedSuggestions.map((s: any) => ({
              type: s.type || s.name || 'RELATES_TO',
              cardinality: s.cardinality || 'many-to-many',
              properties: s.properties || [],
              confidence: s.confidence ?? 0.8,
              reasoning: s.reasoning || s.description || 'No reasoning provided',
            })),
            recommended: rawParsed.recommended || normalizedSuggestions[0],
          }
        } else {
          throw parseError
        }
      } catch {
        throw parseError
      }
    }

    const suggestionsArray = Array.isArray(parsed.suggestions) ? parsed.suggestions : []
    const recommendedItem = parsed.recommended || suggestionsArray[0]

    return {
      suggestions: suggestionsArray.map((s: any) => ({
        type: s.type || 'RELATES_TO',
        cardinality: s.cardinality || 'many-to-many',
        properties: s.properties || [],
        confidence: s.confidence ?? 0.8,
        reasoning: s.reasoning || 'No reasoning provided',
      })),
      recommended: recommendedItem
        ? {
            type: recommendedItem.type || 'RELATES_TO',
            cardinality: recommendedItem.cardinality || 'many-to-many',
            properties: recommendedItem.properties || [],
            confidence: recommendedItem.confidence ?? 0.8,
            reasoning: recommendedItem.reasoning || 'No reasoning provided',
          }
        : undefined,
    }
  } catch (error) {
    throw new Error(
      `Failed to get relationship suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

