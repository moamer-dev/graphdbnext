import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'
import type { AISettings } from '../config/types'
import type { XmlStructureAnalysis, XmlMappingConfig } from '../../services/xmlAnalyzer'

const XML_MAPPING_ASSISTANT_SYSTEM_PROMPT = `You are an expert XML to Graph Database mapping assistant for research applications.
Your role is to analyze XML structures (especially TEI, edXML, and other scholarly formats) and suggest intelligent mappings to graph database schemas.

Key capabilities:
- Analyze XML element structures and understand their semantic meaning
- Suggest appropriate node labels and types based on domain knowledge
- Recommend relationships between nodes based on XML hierarchy and attributes
- Infer property types from XML attributes and content
- Provide explanations for mapping decisions

Guidelines:
- Use domain-specific knowledge (e.g., TEI elements like <persName>, <placeName>, <div>, <p>)
- Suggest semantic node names that researchers will understand (e.g., "Person" not "persName")
- Consider XML hierarchy when suggesting relationships
- Infer data types from attribute values and text content
- Explain your reasoning for each mapping suggestion
- Consider common patterns in scholarly XML (nested structures, references, metadata)`

// Zod schemas for structured output
const RelationshipSuggestionSchema = z.object({
  targetElement: z.string(),
  relationshipType: z.string(),
})

const NodeSuggestionSchema = z.object({
  elementName: z.string(),
  nodeLabel: z.string(),
  nodeType: z.string(),
  properties: z.array(z.string()).optional(),
  relationships: z.array(RelationshipSuggestionSchema).optional(),
})

const XmlMappingSuggestionSchema = z.object({
  nodes: z.array(NodeSuggestionSchema),
  explanation: z.string(),
  confidence: z.number().min(0).max(1).optional(),
})

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
        name: 'xml_mapping_response',
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

    // Ensure explanation is a string
    if (parsed.explanation) {
      if (typeof parsed.explanation !== 'string') {
        parsed.explanation = typeof parsed.explanation === 'object' 
          ? JSON.stringify(parsed.explanation, null, 2)
          : String(parsed.explanation)
      }
    } else {
      parsed.explanation = 'AI-generated mapping suggestions'
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
 * Suggests XML mapping configuration using AI
 */
export async function suggestXmlMappings(
  model: BaseChatModel,
  settings: AISettings,
  xmlAnalysis: XmlStructureAnalysis,
  domainContext?: string
): Promise<{
  mapping: XmlMappingConfig
  explanation: string
  confidence: number
}> {
  const systemMessage = new SystemMessage(
    XML_MAPPING_ASSISTANT_SYSTEM_PROMPT + 
    (domainContext ? `\n\nDomain Context: ${domainContext}` : '')
  )

  // Prepare analysis summary for the model
  const analysisSummary = {
    rootElements: xmlAnalysis.rootElements,
    elementTypes: xmlAnalysis.elementTypes.slice(0, 50).map(el => ({
      name: el.name,
      count: el.count,
      attributes: Object.keys(el.attributes || {}),
    })),
    totalElements: xmlAnalysis.elementTypes.length,
    hasNamespaces: Object.keys(xmlAnalysis.namespaces || {}).length > 0,
  }

  const prompt = `Analyze this XML structure and suggest a mapping configuration for converting it to a graph database schema.

XML Structure Analysis:
${JSON.stringify(analysisSummary, null, 2)}

Element Details:
${xmlAnalysis.elementTypes.slice(0, 50).map(el => {
  const attrs = Object.keys(el.attributes || {})
  const children = el.children || []
  return `- ${el.name}: appears ${el.count} times, attributes: ${attrs.join(', ') || 'none'}, children: ${children.slice(0, 5).join(', ') || 'none'}`
}).join('\n')}

Based on this XML structure, provide a structured analysis in JSON format:

{
  "nodes": [
    {
      "elementName": "elementName",
      "nodeLabel": "Human-readable label (e.g., 'Person' not 'persName')",
      "nodeType": "NodeType",
      "properties": ["property1", "property2"],
      "relationships": [
        {
          "targetElement": "anotherElement",
          "relationshipType": "HAS_RELATIONSHIP"
        }
      ]
    }
  ],
  "explanation": "A brief, human-readable explanation in plain text (NOT JSON). Write 2-3 sentences summarizing the mapping strategy. DO NOT include JSON arrays, objects, or structured data. Keep it concise and readable.",
  "confidence": 0.85
}

Guidelines:
- Extract key elements as nodes (skip metadata, wrapper elements)
- Use semantic node labels (e.g., "Person", "Document", "Author" not "persName", "div", "author")
- Map XML attributes to node properties
- Infer relationships from XML hierarchy and reference attributes
- Only include meaningful relationships (parent-child, references, etc.)

Return ONLY valid JSON. No comments, no trailing commas, no markdown code blocks.`

  const messages = [systemMessage, new HumanMessage(prompt)]

  try {
    const parsed = await parseStructuredResponse(
      model,
      messages,
      XmlMappingSuggestionSchema
    )

    // Build mapping from AI's node suggestions
    let validatedMapping: XmlMappingConfig
    if (parsed.nodes && Array.isArray(parsed.nodes)) {
      validatedMapping = buildMappingFromNodes(parsed.nodes, xmlAnalysis)
    } else {
      validatedMapping = generateDefaultMappingFromAnalysis(xmlAnalysis)
    }
    
    return {
      mapping: validatedMapping,
      explanation: parsed.explanation || 'AI-generated mapping suggestions',
      confidence: parsed.confidence || 0.7,
    }
  } catch {
    return {
      mapping: generateDefaultMappingFromAnalysis(xmlAnalysis),
      explanation: 'Using default mapping. Could not parse AI suggestions. Please try again.',
      confidence: 0.5,
    }
  }
}

/**
 * Explains why a mapping was suggested
 */
export async function explainMapping(
  model: BaseChatModel,
  settings: AISettings,
  mapping: XmlMappingConfig,
  xmlAnalysis: XmlStructureAnalysis,
  elementName?: string
): Promise<string> {
  const systemMessage = new SystemMessage(XML_MAPPING_ASSISTANT_SYSTEM_PROMPT)

  const elementFilter = elementName 
    ? `Focus specifically on the "${elementName}" element mapping.`
    : 'Explain the overall mapping strategy.'

  const prompt = `${elementFilter}

XML Structure:
${JSON.stringify({
  rootElements: xmlAnalysis.rootElements,
  elementCount: xmlAnalysis.elementTypes.length,
}, null, 2)}

Current Mapping Configuration:
${JSON.stringify(mapping, null, 2)}

Please explain:
1. Why each element was mapped to its node type
2. How relationships were determined
3. Any potential improvements or considerations`

  const messages = [systemMessage, new HumanMessage(prompt)]
  const response = await model.invoke(messages)

  if (response.content) {
    return typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
  }

  return 'Could not generate explanation.'
}

/**
 * Builds mapping configuration from AI's node suggestions
 */
function buildMappingFromNodes(
  nodes: Array<{
    elementName: string
    nodeLabel: string
    nodeType: string
    properties?: string[]
    relationships?: Array<{
      targetElement: string
      relationshipType: string
    }>
  }>,
  analysis: XmlStructureAnalysis
): XmlMappingConfig {
  const mapping: XmlMappingConfig = {
    elementMappings: {},
    attributeMappings: {},
    relationshipMappings: {},
    textContentMappings: {},
  }

  // Create a map of element name to element type for quick lookup
  const elementTypeMap = new Map(
    analysis.elementTypes.map(et => [et.name, et])
  )

  // Build element mappings
  for (const node of nodes) {
    const elementType = elementTypeMap.get(node.elementName)
    if (!elementType) continue

    // Add element mapping
    mapping.elementMappings[node.elementName] = {
      include: true,
      nodeLabel: node.nodeLabel,
      nodeType: node.nodeType,
      superclassNames: [],
    }

    // Add attribute mappings (properties)
    mapping.attributeMappings[node.elementName] = {}
    const properties = node.properties || []
    
    // Map each property to an attribute
    for (const prop of properties) {
      // Ensure propName is a string
      const propName = typeof prop === 'string' ? prop : String(prop)
      if (!propName || propName.trim() === '') continue

      // Find matching attribute in the element (case-insensitive, ignore dashes/underscores)
      const attrName = elementType.attributes.find(attr => {
        const normalizedAttr = attr.toLowerCase().replace(/[-_]/g, '')
        const normalizedProp = propName.toLowerCase().replace(/[-_]/g, '')
        return normalizedAttr === normalizedProp || attr.toLowerCase() === propName.toLowerCase()
      })

      if (!attrName) continue // Skip if attribute not found

      const attrAnalysis = elementType.attributeAnalysis[attrName]
      
      mapping.attributeMappings[node.elementName][attrName] = {
        include: true,
        propertyKey: propName,
        propertyType: attrAnalysis?.type || 'string',
        required: attrAnalysis?.required || false,
        isReference: attrAnalysis?.isReference || false,
      }
    }

    // Also include common attributes like id, xml:id if they exist
    for (const attrName of elementType.attributes) {
      if (attrName.toLowerCase() === 'id' || attrName.toLowerCase() === 'xml:id') {
        if (!mapping.attributeMappings[node.elementName][attrName]) {
          const attrAnalysis = elementType.attributeAnalysis[attrName]
          mapping.attributeMappings[node.elementName][attrName] = {
            include: true,
            propertyKey: attrName.toLowerCase() === 'xml:id' ? 'id' : attrName,
            propertyType: 'string',
            required: attrAnalysis?.required || false,
            isReference: false,
          }
        }
      }
    }

    // Add relationship mappings
    if (node.relationships && node.relationships.length > 0) {
      for (const rel of node.relationships) {
        const relKey = `${node.elementName}->${rel.targetElement}`
        mapping.relationshipMappings[relKey] = {
          include: true,
          relationshipType: rel.relationshipType,
        }
      }
    }
  }

  return mapping
}

/**
 * Generates a default mapping from XML analysis (fallback)
 */
function generateDefaultMappingFromAnalysis(analysis: XmlStructureAnalysis): XmlMappingConfig {
  const mapping: XmlMappingConfig = {
    elementMappings: {},
    attributeMappings: {},
    relationshipMappings: {},
    textContentMappings: {},
  }

  // Generate basic mappings for each element type
  for (const element of analysis.elementTypes) {
    // Skip ignored elements
    if (element.specialPatterns.isIgnored) continue

    const nodeLabel = element.name.charAt(0).toUpperCase() + element.name.slice(1).replace(/[-_]/g, '')
    const nodeType = element.name

    mapping.elementMappings[element.name] = {
      include: true,
      nodeLabel,
      nodeType,
    }

    // Map attributes
    mapping.attributeMappings[element.name] = {}
    for (const attrName of element.attributes) {
      const attrAnalysis = element.attributeAnalysis[attrName]
      mapping.attributeMappings[element.name][attrName] = {
        include: !attrAnalysis?.isReference || attrName.toLowerCase() === 'id',
        propertyKey: attrName.toLowerCase() === 'xml:id' ? 'id' : attrName,
        propertyType: attrAnalysis?.type || 'string',
        required: attrAnalysis?.required || false,
        isReference: attrAnalysis?.isReference || false,
      }
    }
  }

  return mapping
}

