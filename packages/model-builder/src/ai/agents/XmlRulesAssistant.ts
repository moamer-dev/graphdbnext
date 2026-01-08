import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'
import type { AISettings } from '../config/types'
import type { XmlAnalysisRules } from '../../services/xmlAnalyzer'
import type { XmlElementInfo } from '../../utils/xmlElementExtractor'

const XML_RULES_ASSISTANT_SYSTEM_PROMPT = `You are an XML Analysis Rules Assistant. Your ONLY purpose is to help users configure XML analysis rules for importing XML files into a graph database.

**YOUR SCOPE - You can ONLY:**
1. **Discuss** XML analysis rules (what rules mean, how they work)
2. **Set/Suggest** XML analysis rules (propose rules for the user's XML structure)
3. **Update/Modify** XML analysis rules (change existing rules based on user feedback)

**XML Analysis Rules you work with:**
- Ignored Elements: Elements to completely ignore during analysis
- Ignored Subtrees: Elements whose children should be ignored
- Reference Attributes: Attributes that create cross-references (id, target, corresp, etc.)
- Pattern Rules: Attributes that indicate alternatives, annotations, translations, or choices
- Relationship Type Mappings: How parent-child element relationships should be typed
- Text Content Rules: Whether elements should be processed at character-level or sign-level

**STRICT LIMITATIONS - You MUST NOT:**
- Answer questions about XML validation (DTD, XSD, Schematron, RelaxNG)
- Explain XPath, XQuery, XSLT, or other XML query/transformation technologies
- Provide information about XML tools, libraries, or general XML programming
- Answer questions about XML standards, specifications, or formats
- Discuss topics unrelated to configuring XML analysis rules for import

**When users ask about topics outside your scope, politely redirect them:**
"I'm specifically designed to help you configure XML analysis rules for importing XML into a graph database. I can help you with setting up ignored elements, reference attributes, pattern rules, and other analysis rules. For questions about XML validation, XPath, XSLT, or other XML technologies, please consult relevant documentation."

**Response Style:**
- Keep responses brief and focused
- Provide structured explanations for rules
- Be concise when discussing rule configurations`

// Zod schemas for structured output
const PatternRulesSchema = z.object({
  alternativeAttributes: z.array(z.string()).optional(),
  annotationAttributes: z.array(z.string()).optional(),
  translationAttributes: z.array(z.string()).optional(),
  choiceIndicators: z.array(z.string()).optional(),
})

const TextContentRulesSchema = z.object({
  characterLevelElements: z.array(z.string()).optional(),
  signLevelElements: z.array(z.string()).optional(),
})

const XmlRulesSuggestionSchema = z.object({
  rules: z.object({
    ignoredElements: z.array(z.string()).optional(),
    ignoredSubtrees: z.array(z.string()).optional(),
    referenceAttributes: z.array(z.string()).optional(),
    patternRules: PatternRulesSchema.optional(),
    relationshipTypeMappings: z.record(z.array(z.string())).optional(),
    textContentRules: TextContentRulesSchema.optional(),
  }),
  explanation: z.string(),
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
        name: 'xml_rules_response',
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
      parsed.explanation = 'AI-generated analysis rules'
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
 * Suggests XML analysis rules using AI
 */
export async function suggestXmlRules(
  model: BaseChatModel,
  settings: AISettings,
  availableElements: XmlElementInfo,
  domainContext?: string
): Promise<{
  rules: Partial<XmlAnalysisRules>
  explanation: string
}> {
  const systemMessage = new SystemMessage(
    XML_RULES_ASSISTANT_SYSTEM_PROMPT + 
    (domainContext ? `\n\nDomain Context: ${domainContext}` : '')
  )

  const prompt = `Analyze this XML structure and suggest analysis rules for processing it.

Available Elements:
${availableElements.elementNames.slice(0, 100).map(name => `- ${name}`).join('\n')}

Available Attributes:
${availableElements.attributeNames.slice(0, 50).map(name => `- ${name}`).join('\n')}

Please suggest analysis rules in the following JSON format. IMPORTANT: The JSON must be valid (no comments, no trailing commas).

Format:
{
  "rules": {
    "ignoredElements": ["element1", "element2"],
    "ignoredSubtrees": ["element3"],
    "referenceAttributes": ["attr1", "attr2"],
    "patternRules": {
      "alternativeAttributes": [],
      "annotationAttributes": [],
      "translationAttributes": [],
      "choiceIndicators": []
    },
    "relationshipTypeMappings": {},
    "textContentRules": {
      "characterLevelElements": [],
      "signLevelElements": []
    }
  },
  "explanation": "Provide a BRIEF, structured explanation in this exact format:\n\n**Ignored Elements:**\n- element1: brief reason\n- element2: brief reason\n\n**Ignored Subtrees:**\n- element3: brief reason\n\n**Reference Attributes:**\n- attr1: brief reason\n\n**Pattern Rules:**\n- attribute1: brief reason\n\nKeep explanations concise (one line per item)."
}

Return ONLY valid JSON. No comments, no trailing commas, no markdown code blocks.`

  const messages = [systemMessage, new HumanMessage(prompt)]

  try {
    const parsed = await parseStructuredResponse(
      model,
      messages,
      XmlRulesSuggestionSchema
    )

    // Normalize rules to match Partial<XmlAnalysisRules> structure
    const normalizedRules: Partial<XmlAnalysisRules> = {
      ignoredElements: parsed.rules?.ignoredElements || [],
      ignoredSubtrees: parsed.rules?.ignoredSubtrees || [],
      referenceAttributes: parsed.rules?.referenceAttributes || [],
      patternRules: parsed.rules?.patternRules ? {
        alternativeAttributes: parsed.rules.patternRules.alternativeAttributes || [],
        annotationAttributes: parsed.rules.patternRules.annotationAttributes || [],
        translationAttributes: parsed.rules.patternRules.translationAttributes || [],
        choiceIndicators: parsed.rules.patternRules.choiceIndicators || [],
      } : undefined,
      relationshipTypeMappings: parsed.rules?.relationshipTypeMappings || {},
      textContentRules: parsed.rules?.textContentRules ? {
        characterLevelElements: parsed.rules.textContentRules.characterLevelElements || [],
        signLevelElements: parsed.rules.textContentRules.signLevelElements || [],
      } : undefined,
    }

    return {
      rules: normalizedRules,
      explanation: parsed.explanation || 'AI-generated analysis rules',
    }
  } catch {
    return {
      rules: {},
      explanation: 'Could not parse AI suggestions. The response may not be in the expected JSON format. Please try again.',
    }
  }
}

/**
 * Chat with the XML Rules Assistant
 */
export async function chatWithXmlRulesAssistant(
  model: BaseChatModel,
  messages: Array<HumanMessage | AIMessage | SystemMessage>,
  _availableElements?: XmlElementInfo
): Promise<string> {
  const response = await model.invoke(messages)
  
  if (response.content) {
    return typeof response.content === 'string' 
      ? response.content 
      : Array.isArray(response.content)
      ? response.content.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join('')
      : JSON.stringify(response.content)
  }
  
  return 'I apologize, but I did not receive a response. Please try again.'
}
