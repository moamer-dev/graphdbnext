import { DOMParser } from '@xmldom/xmldom'
import type { Node, Relationship, Property } from '../types'

export interface XmlElementType {
  name: string
  count: number
  attributes: string[]
  children: string[]
  namespace?: string
  hasTextContent: boolean
  hasTailContent: boolean
  textContentPatterns: {
    whitespacePreserved: boolean
    mixedContent: boolean
    characterLevel: boolean
    signLevel: boolean
  }
  attributeAnalysis: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'id-reference' | 'xpath-reference'
    required: boolean
    sampleValues: unknown[]
    isReference: boolean
    referenceTarget?: string
  }>
  referencePatterns: {
    incoming: string[] // Attributes that reference this element
    outgoing: string[] // Attributes in this element that reference others
  }
  specialPatterns: {
    isAlternative: boolean
    isAnnotation: boolean
    isTranslation: boolean
    isChoice: boolean
    isIgnored: boolean
    isIgnoredSubtree: boolean
  }
}

export interface XmlRelationshipPattern {
  from: string
  to: string
  type: string
  frequency: 'high' | 'medium' | 'low'
  isDirect: boolean
  viaAttribute?: string // Relationship via attribute reference (e.g., target, corresp)
  relationshipTypes: string[] // Possible relationship types: contains, alternative, annotates, refersTo, mentions, translatedAs, hasLayer, expressedAs
  properties?: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'date'
    sampleValues: unknown[]
  }>
}

export interface XmlStructureAnalysis {
  elementTypes: XmlElementType[]
  relationshipPatterns: XmlRelationshipPattern[]
  rootElements: string[]
  namespaces: Record<string, string>
  totalElements: number
  maxDepth: number
  referenceAttributes: string[] // Common reference attributes (id, target, corresp, units, etc.)
  ignoredElements: string[] // Elements that should be ignored
  ignoredSubtrees: string[] // Elements whose subtrees should be ignored
}

export interface XmlAnalysisRules {
  // Elements to ignore completely
  ignoredElements: string[]

  // Elements whose subtrees should be ignored
  ignoredSubtrees: string[]

  // Custom reference attributes (in addition to defaults)
  referenceAttributes: string[]

  // Attribute patterns that indicate special element types
  patternRules: {
    // Attributes that indicate an alternative element
    alternativeAttributes: string[]
    // Attributes that indicate an annotation element
    annotationAttributes: string[]
    // Attributes that indicate a translation element
    translationAttributes: string[]
    // Attributes that indicate a choice container
    choiceIndicators: string[]
  }

  // Relationship type mappings based on attribute patterns
  relationshipTypeMappings: Record<string, string[]>
  // e.g., { 'target': ['annotates', 'refersTo'], 'corresp': ['refersTo', 'mentions'] }

  // Text content processing rules
  textContentRules: {
    // Elements that should create character-level text nodes
    characterLevelElements: string[]
    // Elements that should create sign-level text nodes
    signLevelElements: string[]
  }
}

export interface XmlMappingConfig {
  elementMappings: Record<string, {
    include: boolean
    nodeLabel: string
    nodeType: string
    superclassNames?: string[]
    conditionalRules?: import('../types/mappingConfig').ConditionalRule[]
    childProcessingRules?: import('../types/mappingConfig').ChildProcessingRule[]
    propertyMappings?: import('../types/mappingConfig').PropertyMappingRule[]
    semantic?: {
      classIri?: string
      classLabel?: string
      classCurie?: string
      ontologyId?: string
    }
  }>
  attributeMappings: Record<string, Record<string, {
    include: boolean
    propertyKey: string
    propertyType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'id-reference' | 'xpath-reference'
    required: boolean
    isReference?: boolean
    semantic?: {
      propertyIri?: string
      propertyLabel?: string
      propertyCurie?: string
      ontologyId?: string
    }
  }>>
  relationshipMappings: Record<string, {
    include: boolean
    relationshipType: string
    viaAttribute?: string
    semantic?: {
      propertyIri?: string
      propertyLabel?: string
      propertyCurie?: string
      ontologyId?: string
    }
  }>
  textContentMappings: Record<string, {
    include: boolean
    propertyKey: string // If set, maps text to this property on parent node (when createTextNodes is false)
    createTextNodes: boolean // If true, creates token nodes instead of mapping to property
    textNodeType: string // Node label for token nodes (can be any string, e.g., 'Sign', 'Character', 'Token', etc.)
    tokenizationMethod?: 'character' | 'word' | 'custom' // How to split text into tokens
    customSplitBy?: string // Custom delimiter for tokenization (when tokenizationMethod is 'custom')
  }>
}

/**
 * XML Structure Analyzer Service
 * Analyzes XML files to extract structure information for model building
 * Handles all cases from the XML converter including text content, references, special patterns, etc.
 */
export class XmlAnalyzer {
  // Common reference attributes (generic patterns)
  private static readonly REFERENCE_ATTRIBUTES = ['id', 'xml:id', 'target', 'corresp', 'units', 'ref', 'href', 'source', 'link', 'pointer']

  // Pattern detection: elements that typically contain only metadata (can be detected by structure)
  // These are detected dynamically based on patterns, not hardcoded names

  /**
   * Get default analysis rules
   */
  static getDefaultAnalysisRules(): XmlAnalysisRules {
    return {
      ignoredElements: [],
      ignoredSubtrees: [],
      referenceAttributes: [],
      patternRules: {
        alternativeAttributes: [],
        annotationAttributes: [],
        translationAttributes: [],
        choiceIndicators: []
      },
      relationshipTypeMappings: {},
      textContentRules: {
        characterLevelElements: [],
        signLevelElements: []
      }
    }
  }

  /**
   * Analyze XML structure from XML string
   * Comprehensive analysis handling all cases from xmlConverter
   */
  static analyzeStructure(xmlString: string, rules?: Partial<XmlAnalysisRules>): XmlStructureAnalysis {
    // Merge user rules with defaults
    const defaultRules = this.getDefaultAnalysisRules()
    const analysisRules: XmlAnalysisRules = {
      ignoredElements: rules?.ignoredElements ?? defaultRules.ignoredElements,
      ignoredSubtrees: rules?.ignoredSubtrees ?? defaultRules.ignoredSubtrees,
      referenceAttributes: [
        ...defaultRules.referenceAttributes,
        ...(rules?.referenceAttributes ?? [])
      ],
      patternRules: {
        alternativeAttributes: [
          ...defaultRules.patternRules.alternativeAttributes,
          ...(rules?.patternRules?.alternativeAttributes ?? [])
        ],
        annotationAttributes: [
          ...defaultRules.patternRules.annotationAttributes,
          ...(rules?.patternRules?.annotationAttributes ?? [])
        ],
        translationAttributes: [
          ...defaultRules.patternRules.translationAttributes,
          ...(rules?.patternRules?.translationAttributes ?? [])
        ],
        choiceIndicators: [
          ...defaultRules.patternRules.choiceIndicators,
          ...(rules?.patternRules?.choiceIndicators ?? [])
        ]
      },
      relationshipTypeMappings: {
        ...defaultRules.relationshipTypeMappings,
        ...(rules?.relationshipTypeMappings ?? {})
      },
      textContentRules: {
        characterLevelElements: rules?.textContentRules?.characterLevelElements ?? defaultRules.textContentRules.characterLevelElements,
        signLevelElements: rules?.textContentRules?.signLevelElements ?? defaultRules.textContentRules.signLevelElements
      }
    }

    // Merge reference attributes with defaults
    const allReferenceAttributes = [
      ...this.REFERENCE_ATTRIBUTES,
      ...analysisRules.referenceAttributes
    ]
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'text/xml')

    // Check for parsing errors
    const parseError = doc.getElementsByTagName('parsererror')
    if (parseError.length > 0) {
      throw new Error('Invalid XML format: ' + parseError[0].textContent)
    }

    const elementTypes = new Map<string, XmlElementType>()
    const relationshipPatterns = new Map<string, XmlRelationshipPattern>()
    const rootElements: string[] = []
    const namespaces: Record<string, string> = {}
    const referenceAttributes = new Set<string>()
    let totalElements = 0
    let maxDepth = 0

    // Track all elements for reference analysis
    const allElements: Element[] = []

    // Track ignored elements from rules
    const ignoredElementsSet = new Set(analysisRules.ignoredElements.map(e => e.toLowerCase()))
    const ignoredSubtreesSet = new Set(analysisRules.ignoredSubtrees.map(e => e.toLowerCase()))

    // Extract namespaces
    const root = doc.documentElement
    if (root) {
      const attrs = root.attributes
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i]
        if (attr.name.startsWith('xmlns')) {
          const prefix = attr.name === 'xmlns' ? 'default' : attr.name.replace('xmlns:', '')
          namespaces[prefix] = attr.value
        }
      }
    }

    // Helper to clean namespace from tag/attribute names
    const cleanName = (name: string): string => {
      if (name.includes('}')) {
        return name.split('}').pop() || name
      }
      if (name.includes(':')) {
        return name.split(':').pop() || name
      }
      return name
    }

    // Helper to check if attribute value looks like a reference
    const isReferenceValue = (value: string): boolean => {
      // Check for ID references (with or without #)
      if (value.startsWith('#') || /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) {
        return true
      }
      // Check for space-separated IDs
      if (value.includes(' ') && value.split(' ').every(v => v.startsWith('#') || /^[a-zA-Z]/.test(v))) {
        return true
      }
      return false
    }

    // Helper to detect text content patterns
    const analyzeTextContent = (element: Element): {
      hasText: boolean
      hasTail: boolean
      whitespacePreserved: boolean
      mixedContent: boolean
    } => {
      const childNodes = Array.from(element.childNodes)
      const elementChildren = childNodes.filter((node) => node.nodeType === 1) as Element[]
      const textNodes = childNodes.filter((node) => node.nodeType === 3)

      const hasText = textNodes.some((node) => node.textContent && node.textContent.trim().length > 0)
      const hasTail = element.nextSibling && element.nextSibling.nodeType === 3 &&
        element.nextSibling.textContent && element.nextSibling.textContent.trim().length > 0

      // Mixed content: both text and element children
      const mixedContent = hasText && elementChildren.length > 0

      // Check if whitespace is preserved (contains non-breaking spaces or significant whitespace)
      const textContent = element.textContent || ''
      const whitespacePreserved = /\s{2,}/.test(textContent) || textContent.includes('\n') || textContent.includes('\t')

      return { hasText, hasTail: !!hasTail, whitespacePreserved, mixedContent }
    }

    // Recursive function to analyze elements
    const analyzeElement = (element: Element, depth: number, parentName?: string, parentElement?: Element): void => {
      if (depth > maxDepth) {
        maxDepth = depth
      }

      totalElements++
      allElements.push(element)

      const tagName = element.tagName
      const localName = cleanName(tagName)
      const namespace = element.namespaceURI || undefined

      // Check if this element should be ignored (from rules)
      const isIgnoredByRule = ignoredElementsSet.has(localName.toLowerCase())

      // If element is ignored, skip analyzing it but still process children (unless subtree is also ignored)
      if (isIgnoredByRule) {
        const isIgnoredSubtreeByRule = ignoredSubtreesSet.has(localName.toLowerCase())

        // Process children unless subtree is also ignored
        if (!isIgnoredSubtreeByRule) {
          const children = Array.from(element.childNodes).filter(
            (node) => node.nodeType === 1
          ) as Element[]

          for (const child of children) {
            analyzeElement(child, depth + 1, parentName, element)
          }
        }

        // Don't add to elementTypes or process further
        return
      }

      // Track root elements
      if (depth === 0) {
        if (!rootElements.includes(localName)) {
          rootElements.push(localName)
        }
      }

      // Analyze text content
      const textAnalysis = analyzeTextContent(element)

      // Analyze element type
      if (!elementTypes.has(localName)) {
        const attributes: string[] = []
        const attributeAnalysis: Record<string, {
          type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'id-reference' | 'xpath-reference'
          required: boolean
          sampleValues: unknown[]
          isReference: boolean
          referenceTarget?: string
        }> = {}

        // Analyze attributes first
        const attrs = element.attributes
        for (let i = 0; i < attrs.length; i++) {
          const attr = attrs[i]
          const attrName = cleanName(attr.name)

          if (!attributes.includes(attrName)) {
            attributes.push(attrName)
          }

          // Check if this is a reference attribute (using rules)
          const isRefAttr = allReferenceAttributes.some(ra =>
            attrName.toLowerCase() === ra.toLowerCase() ||
            attrName.toLowerCase() === `xml:${ra.toLowerCase()}`
          )

          // Check if value looks like a reference
          const isRefValue = isReferenceValue(attr.value)
          const isReference = isRefAttr || isRefValue

          if (isReference) {
            referenceAttributes.add(attrName)
          }

          // Analyze attribute value type
          if (!attributeAnalysis[attrName]) {
            let inferredType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'id-reference' | 'xpath-reference' = 'string'

            if (isReference) {
              inferredType = attr.value.includes('@') || attr.value.includes('//') ? 'xpath-reference' : 'id-reference'
            } else {
              inferredType = this.inferType(attr.value)
            }

            attributeAnalysis[attrName] = {
              type: inferredType,
              required: false,
              sampleValues: [],
              isReference,
              referenceTarget: isReference ? attr.value : undefined
            }
          }

          // Collect sample values (max 5)
          if (attributeAnalysis[attrName].sampleValues.length < 5) {
            attributeAnalysis[attrName].sampleValues.push(attr.value)
          }
        }

        // Detect special patterns based on rules (not hardcoded attribute names)
        const hasAlternativeAttr = attributes.some(attr =>
          analysisRules.patternRules.alternativeAttributes.some(pa =>
            cleanName(attr).toLowerCase() === pa.toLowerCase() ||
            cleanName(attr).toLowerCase().includes(pa.toLowerCase())
          )
        )
        const hasAnnotationAttr = attributes.some(attr =>
          analysisRules.patternRules.annotationAttributes.some(pa =>
            cleanName(attr).toLowerCase() === pa.toLowerCase() ||
            cleanName(attr).toLowerCase().includes(pa.toLowerCase())
          )
        )
        const hasTranslationAttr = attributes.some(attr =>
          analysisRules.patternRules.translationAttributes.some(pa =>
            cleanName(attr).toLowerCase() === pa.toLowerCase() ||
            cleanName(attr).toLowerCase().includes(pa.toLowerCase())
          )
        )

        // Alternative pattern: element that references another element (using rules)
        const isAlternative = hasAlternativeAttr ||
          (hasAnnotationAttr && textAnalysis.hasText && element.childNodes.length === 0)

        // Annotation pattern: element with annotation attributes (using rules)
        const isAnnotation = hasAnnotationAttr && (textAnalysis.hasText || element.childNodes.length > 0)

        // Translation pattern: element with translation attributes (using rules)
        const isTranslation = hasTranslationAttr && (textAnalysis.hasText || element.childNodes.length > 0)

        // Choice pattern: element that contains multiple alternative children (using rules)
        const childElements = Array.from(element.childNodes).filter((node) => node.nodeType === 1) as Element[]
        const hasMultipleSimilarChildren = childElements.length > 1 &&
          childElements.every(child => {
            const childName = cleanName(child.tagName)
            return childName === localName ||
              childName.toLowerCase().includes(localName.toLowerCase()) ||
              localName.toLowerCase().includes(childName.toLowerCase())
          })
        const isChoice = hasMultipleSimilarChildren ||
          (childElements.length > 1 && childElements.every(child =>
            Array.from(child.attributes).some(attr =>
              analysisRules.patternRules.choiceIndicators.some(ci =>
                cleanName(attr.name).toLowerCase() === ci.toLowerCase() &&
                attr.value.toLowerCase().includes('alt')
              )
            )
          ))

        // Ignored pattern: only check pattern detection (rules are already handled above)
        // Elements explicitly ignored by rules are already skipped, so this is for auto-detection
        const isIgnored = !textAnalysis.hasText &&
          childElements.length === 0 &&
          attributes.length <= 1 &&
          (attributes.length === 0 || attributes.every(attr =>
            cleanName(attr).toLowerCase() === 'id' ||
            cleanName(attr).toLowerCase().includes('xml')
          ))

        // Ignored subtree pattern: check rules first, then pattern detection
        // Note: elements ignored by rules are already skipped, so this only applies to elements that weren't ignored
        const isIgnoredSubtree = ignoredSubtreesSet.has(localName.toLowerCase()) ||
          (isAnnotation && !textAnalysis.hasText && childElements.length === 0)

        // Detect text content patterns based on rules and actual content analysis
        const isCharacterLevelByRule = analysisRules.textContentRules.characterLevelElements.some(e =>
          localName.toLowerCase() === e.toLowerCase()
        )
        const isSignLevelByRule = analysisRules.textContentRules.signLevelElements.some(e =>
          localName.toLowerCase() === e.toLowerCase()
        )

        // Character level: check rules first, then pattern detection
        const characterLevel = isCharacterLevelByRule ||
          (textAnalysis.hasText &&
            childElements.length === 0 &&
            (parentElement ?
              (Array.from(parentElement.childNodes).filter(n => n.nodeType === 1).length > 1) : false
            ))

        // Sign level: check rules first, then pattern detection
        const signLevel = isSignLevelByRule ||
          (textAnalysis.hasText &&
            (childElements.length === 0 || childElements.every(child => {
              const childName = cleanName(child.tagName)
              return childName.toLowerCase().includes('format') ||
                childName.toLowerCase().includes('style') ||
                childName.toLowerCase().includes('mark')
            })))

        elementTypes.set(localName, {
          name: localName,
          count: 1,
          attributes,
          children: [],
          namespace,
          hasTextContent: textAnalysis.hasText,
          hasTailContent: textAnalysis.hasTail,
          textContentPatterns: {
            whitespacePreserved: textAnalysis.whitespacePreserved,
            mixedContent: textAnalysis.mixedContent,
            characterLevel: characterLevel || false,
            signLevel: signLevel || false
          },
          attributeAnalysis,
          referencePatterns: {
            incoming: [],
            outgoing: []
          },
          specialPatterns: {
            isAlternative,
            isAnnotation,
            isTranslation,
            isChoice,
            isIgnored,
            isIgnoredSubtree
          }
        })
      } else {
        const existing = elementTypes.get(localName)!
        existing.count++

        // Update text content analysis
        if (textAnalysis.hasText && !existing.hasTextContent) {
          existing.hasTextContent = true
        }
        if (textAnalysis.hasTail && !existing.hasTailContent) {
          existing.hasTailContent = true
        }
        // Ensure boolean values are set
        existing.hasTextContent = existing.hasTextContent || false
        existing.hasTailContent = existing.hasTailContent || false
        if (textAnalysis.mixedContent && !existing.textContentPatterns.mixedContent) {
          existing.textContentPatterns.mixedContent = true
        }

        // Update attribute analysis with more samples
        const attrs = element.attributes
        for (let i = 0; i < attrs.length; i++) {
          const attr = attrs[i]
          const attrName = cleanName(attr.name)

          if (!existing.attributes.includes(attrName)) {
            existing.attributes.push(attrName)

            const isRefAttr = allReferenceAttributes.some(ra =>
              attrName.toLowerCase() === ra.toLowerCase()
            )
            const isRefValue = isReferenceValue(attr.value)
            const isReference = isRefAttr || isRefValue

            if (isReference) {
              referenceAttributes.add(attrName)
            }

            let inferredType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'id-reference' | 'xpath-reference' = 'string'
            if (isReference) {
              inferredType = attr.value.includes('@') || attr.value.includes('//') ? 'xpath-reference' : 'id-reference'
            } else {
              inferredType = this.inferType(attr.value)
            }

            existing.attributeAnalysis[attrName] = {
              type: inferredType,
              required: false,
              sampleValues: [],
              isReference,
              referenceTarget: isReference ? attr.value : undefined
            }
          }

          if (existing.attributeAnalysis[attrName] && existing.attributeAnalysis[attrName].sampleValues.length < 5) {
            existing.attributeAnalysis[attrName].sampleValues.push(attr.value)
          }
        }
      }

      // Track reference patterns
      const elementType = elementTypes.get(localName)!
      const attrs = element.attributes
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i]
        const attrName = cleanName(attr.name)
        const attrAnalysis = elementType.attributeAnalysis[attrName]

        if (attrAnalysis?.isReference) {
          // This element references others via this attribute
          if (!elementType.referencePatterns.outgoing.includes(attrName)) {
            elementType.referencePatterns.outgoing.push(attrName)
          }
        }
      }

      // Track parent-child relationships
      if (parentName) {
        const relKey = `${parentName}->${localName}`
        const parentType = elementTypes.get(parentName)

        if (!relationshipPatterns.has(relKey)) {
          // Determine relationship type based on patterns
          const relationshipTypes: string[] = ['contains']

          if (elementType.specialPatterns.isAlternative) {
            relationshipTypes.push('alternative', 'expressedAs')
          }
          if (elementType.specialPatterns.isAnnotation) {
            relationshipTypes.push('annotates', 'annotatedBy')
          }
          if (elementType.specialPatterns.isTranslation) {
            relationshipTypes.push('translatedAs')
          }

          // Check for reference-based relationships (using rules)
          const refAttrs = element.attributes
          let viaAttribute: string | undefined
          for (let i = 0; i < refAttrs.length; i++) {
            const attr = refAttrs[i]
            const attrName = cleanName(attr.name)
            const attrNameLower = attrName.toLowerCase()

            // Check if this is a reference attribute using rules (merged with defaults)
            if (allReferenceAttributes.some(ra =>
              attrNameLower === ra.toLowerCase() ||
              attrNameLower.includes(ra.toLowerCase())
            )) {
              viaAttribute = attrName

              // Use relationship type mappings from rules (check both lowercase and original)
              const mappedTypes = analysisRules.relationshipTypeMappings[attrNameLower] ||
                analysisRules.relationshipTypeMappings[attrName] ||
                // Also check if any rule key matches (case-insensitive partial match)
                Object.entries(analysisRules.relationshipTypeMappings).find(([key]) =>
                  attrNameLower.includes(key.toLowerCase()) || key.toLowerCase().includes(attrNameLower)
                )?.[1]

              if (mappedTypes && mappedTypes.length > 0) {
                relationshipTypes.push(...mappedTypes)
              } else {
                // Fallback: infer relationship type based on attribute name pattern
                if (attrNameLower.includes('target') || attrNameLower.includes('point')) {
                  relationshipTypes.push('annotates', 'refersTo')
                } else if (attrNameLower.includes('corresp') || attrNameLower.includes('correspond')) {
                  relationshipTypes.push('refersTo', 'mentions')
                } else if (attrNameLower.includes('unit') || attrNameLower.includes('group')) {
                  relationshipTypes.push('refersTo')
                } else if (attrNameLower.includes('ref') || attrNameLower.includes('link')) {
                  relationshipTypes.push('refersTo', 'mentions')
                } else if (attrNameLower.includes('source') || attrNameLower.includes('origin')) {
                  relationshipTypes.push('refersTo')
                } else {
                  // Generic reference relationship
                  relationshipTypes.push('refersTo')
                }
              }
              break
            }
          }

          relationshipPatterns.set(relKey, {
            from: parentName,
            to: localName,
            type: relationshipTypes[0],
            frequency: 'high',
            isDirect: true,
            viaAttribute,
            relationshipTypes
          })
        } else {
          const rel = relationshipPatterns.get(relKey)!
          // Upgrade frequency if it appears often
          if (rel.frequency === 'low' && relationshipPatterns.size > 10) {
            rel.frequency = 'medium'
          } else if (rel.frequency === 'medium' && relationshipPatterns.size > 50) {
            rel.frequency = 'high'
          }
        }

        // Update children list
        if (parentType && !parentType.children.includes(localName)) {
          parentType.children.push(localName)
        }
      }

      // Recursively analyze children (unless subtree is ignored)
      // Only skip if explicitly marked as ignored subtree AND has no meaningful structure
      if (!(elementType.specialPatterns.isIgnoredSubtree && element.childNodes.length === 0)) {
        const children = Array.from(element.childNodes).filter(
          (node) => node.nodeType === 1
        ) as Element[]

        for (const child of children) {
          analyzeElement(child, depth + 1, localName, element)
        }
      }
    }

    // Start analysis from root
    if (root) {
      analyzeElement(root, 0)
    }

    // Analyze incoming references (attributes that reference each element type)
    allElements.forEach((element) => {
      const localName = cleanName(element.tagName)
      const elementType = elementTypes.get(localName)
      if (!elementType) return

      // Check if this element has an ID that others might reference
      const idAttrs = ['id', 'xml:id', 'xmlid']
      const hasId = idAttrs.some(idAttr => {
        const attr = element.getAttribute(idAttr) || element.getAttribute(`{http://www.w3.org/XML/1998/namespace}id`)
        return !!attr
      })

      if (hasId) {
        // Find elements that reference this one
        allElements.forEach((otherElement) => {
          const attrs = otherElement.attributes
          for (let i = 0; i < attrs.length; i++) {
            const attr = attrs[i]
            const attrName = cleanName(attr.name)
            const attrValue = attr.value

            if (isReferenceValue(attrValue)) {
              // This could reference our element
              const otherElementType = elementTypes.get(cleanName(otherElement.tagName))
              if (otherElementType && !elementType.referencePatterns.incoming.includes(attrName)) {
                elementType.referencePatterns.incoming.push(attrName)
              }
            }
          }
        })
      }
    })

    // Determine required attributes (appear in >80% of instances)
    elementTypes.forEach((elementType) => {
      Object.keys(elementType.attributeAnalysis).forEach((attrName) => {
        const attrCount = elementType.attributeAnalysis[attrName].sampleValues.length
        elementType.attributeAnalysis[attrName].required = attrCount / elementType.count > 0.8
      })
    })

    // Filter out ignored elements from final results (user-specified ignored elements are already excluded)
    const finalElementTypes = Array.from(elementTypes.values())
      .filter(et => !et.specialPatterns.isIgnored)
      .sort((a, b) => b.count - a.count)

    return {
      elementTypes: finalElementTypes,
      relationshipPatterns: Array.from(relationshipPatterns.values()),
      rootElements,
      namespaces,
      totalElements,
      maxDepth,
      referenceAttributes: Array.from(referenceAttributes),
      // Return user-specified ignored elements and auto-detected ones
      ignoredElements: [
        ...analysisRules.ignoredElements,
        ...Array.from(elementTypes.values())
          .filter(et => et.specialPatterns.isIgnored && !analysisRules.ignoredElements.includes(et.name))
          .map(et => et.name)
      ],
      // Return user-specified ignored subtrees and auto-detected ones
      ignoredSubtrees: [
        ...analysisRules.ignoredSubtrees,
        ...Array.from(elementTypes.values())
          .filter(et => et.specialPatterns.isIgnoredSubtree && !analysisRules.ignoredSubtrees.includes(et.name))
          .map(et => et.name)
      ]
    }
  }

  /**
   * Infer property type from value
   */
  private static inferType(value: string): Property['type'] {
    if (value === 'true' || value === 'false') {
      return 'boolean'
    }
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return 'number'
    }
    // Check for date patterns (basic)
    if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
      return 'date'
    }
    return 'string'
  }

  /**
   * Generate default mapping configuration from analysis
   */
  static generateDefaultMapping(analysis: XmlStructureAnalysis): XmlMappingConfig {
    const elementMappings: XmlMappingConfig['elementMappings'] = {}
    const attributeMappings: XmlMappingConfig['attributeMappings'] = {}
    const relationshipMappings: XmlMappingConfig['relationshipMappings'] = {}
    const textContentMappings: XmlMappingConfig['textContentMappings'] = {}

    // Map all element types to nodes (user can deselect later)
    analysis.elementTypes.forEach((elementType) => {
      // Skip ignored elements by default (detected by pattern, not hardcoded names)
      if (elementType.specialPatterns.isIgnored) {
        return
      }

      elementMappings[elementType.name] = {
        // Don't include by default - user must manually add elements to mapping
        include: false,
        nodeLabel: this.toPascalCase(elementType.name),
        nodeType: this.toPascalCase(elementType.name),
        superclassNames: []
      }

      // Map attributes to properties
      attributeMappings[elementType.name] = {}
      elementType.attributes.forEach((attrName) => {
        const attrAnalysis = elementType.attributeAnalysis[attrName]
        attributeMappings[elementType.name][attrName] = {
          include: !attrAnalysis.isReference || attrName.toLowerCase() === 'id', // Include IDs, skip other references by default
          propertyKey: this.toCamelCase(attrName),
          propertyType: attrAnalysis.isReference ? 'string' : attrAnalysis.type,
          required: attrAnalysis.required,
          isReference: attrAnalysis.isReference
        }
      })

      // Map text content (default to excluded; user can enable manually)
      if (elementType.hasTextContent || elementType.textContentPatterns.characterLevel ||
        elementType.textContentPatterns.signLevel) {
        textContentMappings[elementType.name] = {
          include: false,
          propertyKey: 'content',
          createTextNodes: false,
          textNodeType: 'Text'
        }
      }
    })

    return {
      elementMappings,
      attributeMappings,
      relationshipMappings,
      textContentMappings
    }
  }

  /**
   * Convert analysis and mapping to builder format (Node[] and Relationship[])
   */
  static convertToBuilderFormat(
    analysis: XmlStructureAnalysis,
    mapping: XmlMappingConfig
  ): { nodes: Node[]; relationships: Relationship[] } {
    const nodes: Node[] = []
    const relationships: Relationship[] = []
    const nodeIdMap = new Map<string, string>() // element name -> node id

    // Create nodes from included element mappings
    let nodeIndex = 0
    Object.entries(mapping.elementMappings).forEach(([elementName, config]) => {
      if (!config.include) return

      const nodeId = `node-${nodeIndex++}`
      nodeIdMap.set(elementName, nodeId)

      // Get properties from attribute mappings (fallback to analysis defaults when missing)
      const properties: Property[] = []
      const elementType = analysis.elementTypes.find((et) => et.name === elementName)
      const attrMapping = mapping.attributeMappings[elementName] || {}
      const attrNames = new Set([
        ...Object.keys(attrMapping),
        ...(elementType?.attributes || [])
      ])

      attrNames.forEach((attrName) => {
        const attrAnalysis = elementType?.attributeAnalysis[attrName]
        const mapped = attrMapping[attrName]
        const isReference = mapped?.isReference ?? attrAnalysis?.isReference ?? false
        // Include any attribute unless explicitly turned off in mapping
        const include = mapped?.include !== false

        if (!include) {
          return
        }

        const propertyKey = mapped?.propertyKey || this.toCamelCase(attrName)
        const rawType = mapped?.propertyType || attrAnalysis?.type || 'string'
        const propertyType = rawType === 'id-reference' || rawType === 'xpath-reference' ? 'string' : rawType

        properties.push({
          key: propertyKey,
          type: propertyType,
          required: mapped?.required ?? attrAnalysis?.required ?? false,
          description: `From XML attribute: ${attrName}${isReference ? ' (reference)' : ''}`
        })
      })

      // Store XML element type statistics for display in NodeEditor
      const xmlMetadata: Record<string, unknown> = {
        sourceElement: elementName,
        xmlNamespace: elementType?.namespace,
        superclassNames: config.superclassNames || [],
        semantic: config.semantic, // Persist class semantics
        propertySemantics: {}, // Will be populated below
      }

      // Populate property semantics
      const propertySemantics: Record<string, unknown> = {}
      attrNames.forEach((attrName) => {
        const mapped = attrMapping[attrName]
        if (mapped?.include !== false && mapped?.semantic) {
          const propertyKey = mapped?.propertyKey || this.toCamelCase(attrName)
          propertySemantics[propertyKey] = mapped.semantic
        }
      })
      xmlMetadata.propertySemantics = propertySemantics

      if (elementType) {
        xmlMetadata.xmlTypeStatistics = {
          count: elementType.count,
          attributesCount: elementType.attributes.length,
          childrenCount: elementType.children.length,
          hasTextContent: elementType.hasTextContent
        }
        xmlMetadata.xmlChildren = elementType.children.map(childName => ({
          name: childName,
          count: 0 // Count would need to be computed from XML, stored as 0 for now
        }))

        // Infer parent from relationship patterns (most common "from" element where this is "to")
        const parentCandidates = new Map<string, number>()
        analysis.relationshipPatterns.forEach((pattern) => {
          if (pattern.to === elementName) {
            parentCandidates.set(pattern.from, (parentCandidates.get(pattern.from) || 0) + 1)
          }
        })
        if (parentCandidates.size > 0) {
          const mostCommonParent = Array.from(parentCandidates.entries())
            .sort((a, b) => b[1] - a[1])[0][0]
          xmlMetadata.xmlParent = mostCommonParent

          // Compute ancestors by traversing up the parent chain
          const ancestors: string[] = []
          let currentParent = mostCommonParent
          const visited = new Set<string>([elementName])
          while (currentParent && !visited.has(currentParent)) {
            visited.add(currentParent)
            ancestors.push(currentParent)
            // Find parent of current parent
            const nextParent = analysis.relationshipPatterns
              .find(p => p.to === currentParent)?.from
            if (nextParent && !visited.has(nextParent)) {
              currentParent = nextParent
            } else {
              break
            }
          }
          if (ancestors.length > 0) {
            xmlMetadata.xmlAncestors = ancestors
          }
        }
      }

      nodes.push({
        id: nodeId,
        label: config.nodeLabel,
        type: config.nodeType,
        properties,
        position: { x: 0, y: 0 }, // Will be calculated by layout
        data: xmlMetadata
      })

    })

    // Create relationships from included relationship mappings
    // Start relIndex from relationships.length to avoid duplicate IDs with text node relationships
    let relIndex = relationships.length
    Object.entries(mapping.relationshipMappings).forEach(([relKey, config]) => {
      if (!config.include) return

      const [fromElement, toElement] = relKey.split('->')
      const fromNodeId = nodeIdMap.get(fromElement)
      const toNodeId = nodeIdMap.get(toElement)

      if (fromNodeId && toNodeId) {
        relationships.push({
          id: `rel-${relIndex++}`,
          type: config.relationshipType,
          from: fromNodeId,
          to: toNodeId,
          data: {
            sourcePattern: relKey,
            viaAttribute: config.viaAttribute,
            semantic: config.semantic // Persist relationship semantics
          }
        })
      }
    })

    return { nodes, relationships }
  }

  /**
   * Helper: Convert to PascalCase
   */
  private static toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  /**
   * Helper: Convert to camelCase
   */
  private static toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  }
}
