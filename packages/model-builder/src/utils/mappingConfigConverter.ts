import type { XmlMappingConfig } from '../services/xmlAnalyzer'
import type { MappingConfig, ElementMapping, AttributeMapping, RelationshipMapping, TextContentRule } from '../types/mappingConfig'

/**
 * Convert XmlMappingConfig (from wizard UI) to generic MappingConfig
 */
export function convertXmlMappingToGenericMapping (
  xmlMapping: XmlMappingConfig,
  version: string = '1.0.0'
): MappingConfig {
  const mappingConfig: MappingConfig = {
    version,
    elementMappings: {},
    relationshipMappings: {},
    textContentRules: {},
    referenceRules: {}
  }

  // Convert element mappings
  for (const [elementName, elementMapping] of Object.entries(xmlMapping.elementMappings)) {
    if (!elementMapping.include) continue

    const attributeMappings: Record<string, AttributeMapping> = {}
    const attrMapping = xmlMapping.attributeMappings[elementName] || {}

    for (const [attrName, attrMap] of Object.entries(attrMapping)) {
      if (!attrMap.include) continue

      // Map property type, filtering out reference types
      const propertyType = attrMap.propertyType === 'id-reference' || attrMap.propertyType === 'xpath-reference'
        ? 'string'
        : attrMap.propertyType

      attributeMappings[attrName] = {
        include: attrMap.include,
        propertyKey: attrMap.propertyKey,
        propertyType: propertyType as 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object',
        required: attrMap.required,
        isReference: attrMap.isReference,
        referenceTarget: attrMap.isReference ? undefined : undefined // TODO: extract from mapping
      }
    }

    mappingConfig.elementMappings[elementName] = {
      include: elementMapping.include,
      nodeLabel: elementMapping.nodeLabel,
      nodeType: elementMapping.nodeType,
      superclassNames: elementMapping.superclassNames,
      attributeMappings,
      processTextContent: !!xmlMapping.textContentMappings[elementName]?.include
    }

    // Convert text content rules
    const textMapping = xmlMapping.textContentMappings[elementName]
    if (textMapping && textMapping.include) {
      const textRule: TextContentRule = {
        include: true,
        propertyKey: textMapping.propertyKey || undefined
      }

      if (textMapping.createTextNodes && textMapping.textNodeType) {
        // Determine splitBy based on tokenizationMethod
        let splitBy: string | undefined = ''
        if (textMapping.tokenizationMethod === 'word') {
          splitBy = ' '
        } else if (textMapping.tokenizationMethod === 'custom' && textMapping.customSplitBy) {
          splitBy = textMapping.customSplitBy
        } else {
          // Default to character-level (empty string = no split, each char is a token)
          splitBy = ''
        }

        textRule.tokenize = {
          enabled: true,
          splitBy,
          targetNodeLabel: textMapping.textNodeType,
          targetNodeType: textMapping.textNodeType,
          properties: {
            text: {
              source: 'text',
              propertyKey: 'text'
            },
            whitespace: {
              source: 'whitespace',
              propertyKey: 'whitespace'
            },
            index: {
              source: 'index',
              propertyKey: 'index'
            }
          },
          // Add context rules for common patterns
          contextRules: []
        }

        // Add context-aware rules based on element type
        // For 'seg' creating 'Sign' nodes: if inside 'damage', inherit damage property
        if (elementName === 'seg' && textMapping.textNodeType === 'Sign') {
          textRule.tokenize.contextRules = [
            {
              whenInside: ['damage'],
              inheritProperties: [
                {
                  fromAncestor: 'damage',
                  fromAttribute: 'degree',
                  propertyKey: 'damage',
                  propertyType: 'string',
                  transform: 'map',
                  valueMap: {
                    'high': 'high',
                    'low': 'low'
                  }
                }
              ]
            }
          ]
        }

        // For 'w' creating 'Character' nodes: similar patterns can be added
        if (elementName === 'w' && textMapping.textNodeType === 'Character') {
          // Add any context rules for Word -> Character tokenization
          // For example, if inside certain elements, change behavior
        }
      }

      mappingConfig.textContentRules[elementName] = textRule
    }

    // Convert relationship mappings
    const relMappings: RelationshipMapping[] = []
    const elementRelMapping = xmlMapping.relationshipMappings[elementName]
    if (elementRelMapping && elementRelMapping.include) {
      // For now, create a simple hierarchical relationship
      // In the future, this should be expanded based on the UI configuration
      relMappings.push({
        include: true,
        relationshipType: elementRelMapping.relationshipType,
        source: { type: 'current-element' },
        target: { type: 'child-element', elementName: '' }, // Will be determined dynamically
        properties: {}
      })
    }

    if (relMappings.length > 0) {
      mappingConfig.relationshipMappings[elementName] = relMappings
    }
  }

  return mappingConfig
}

/**
 * Convert generic MappingConfig back to XmlMappingConfig (for UI editing)
 */
export function convertGenericMappingToXmlMapping (
  mappingConfig: MappingConfig
): XmlMappingConfig {
  const xmlMapping: XmlMappingConfig = {
    elementMappings: {},
    attributeMappings: {},
    relationshipMappings: {},
    textContentMappings: {}
  }

  for (const [elementName, elementMapping] of Object.entries(mappingConfig.elementMappings)) {
    if (!elementMapping.include) continue

    xmlMapping.elementMappings[elementName] = {
      include: elementMapping.include,
      nodeLabel: elementMapping.nodeLabel,
      nodeType: elementMapping.nodeType,
      superclassNames: elementMapping.superclassNames
    }

    // Convert attribute mappings
    xmlMapping.attributeMappings[elementName] = {}
    for (const [attrName, attrMapping] of Object.entries(elementMapping.attributeMappings)) {
      if (!attrMapping.include) continue

      xmlMapping.attributeMappings[elementName][attrName] = {
        include: attrMapping.include,
        propertyKey: attrMapping.propertyKey,
        propertyType: attrMapping.propertyType,
        required: attrMapping.required,
        isReference: attrMapping.isReference
      }
    }

    // Convert text content mappings
    const textRule = mappingConfig.textContentRules[elementName]
    if (textRule && textRule.include) {
      xmlMapping.textContentMappings[elementName] = {
        include: true,
        propertyKey: textRule.propertyKey || 'text',
        createTextNodes: textRule.tokenize?.enabled || false,
        textNodeType: (textRule.tokenize?.targetNodeType as 'Sign' | 'Character' | 'Text') || 'Text'
      }
    }

    // Convert relationship mappings
    const relMappings = mappingConfig.relationshipMappings[elementName]
    if (relMappings && relMappings.length > 0) {
      const firstRel = relMappings[0]
      xmlMapping.relationshipMappings[elementName] = {
        include: firstRel.include,
        relationshipType: firstRel.relationshipType,
        viaAttribute: firstRel.target.type === 'reference' ? firstRel.target.attribute : undefined
      }
    }
  }

  return xmlMapping
}

