import type { MappingConfig, SchemaJson, ConversionError } from '../types/mappingConfig'

/**
 * Validates mapping configuration against schema
 * Ensures all mappings reference valid schema elements
 */
export class MappingValidator {
  /**
   * Validate mapping config against schema
   */
  static validate (mappingConfig: MappingConfig, schemaJson: SchemaJson): ConversionError[] {
    const errors: ConversionError[] = []

    // Validate element mappings
    for (const [elementName, mapping] of Object.entries(mappingConfig.elementMappings)) {
      if (!mapping.include) continue

      // Check node label exists in schema
      if (!schemaJson.nodes[mapping.nodeLabel]) {
        errors.push({
          type: 'schema',
          message: `Element "${elementName}" maps to node label "${mapping.nodeLabel}" which does not exist in schema`,
          element: elementName
        })
        continue
      }

      const schemaNode = schemaJson.nodes[mapping.nodeLabel]

      // Check node type matches
      if (schemaNode.name !== mapping.nodeType) {
        errors.push({
          type: 'schema',
          message: `Element "${elementName}" maps to node type "${mapping.nodeType}" but schema has "${schemaNode.name}"`,
          element: elementName
        })
      }

      // Validate attribute mappings
      for (const [attrName, attrMapping] of Object.entries(mapping.attributeMappings)) {
        if (!attrMapping.include) continue

        const schemaProp = schemaNode.properties[attrMapping.propertyKey]
        if (!schemaProp) {
          errors.push({
            type: 'schema',
            message: `Element "${elementName}" attribute "${attrName}" maps to property "${attrMapping.propertyKey}" which does not exist in node "${mapping.nodeLabel}"`,
            element: elementName,
            path: `@${attrName}`
          })
          continue
        }

        // Check property type compatibility
        if (!this.isTypeCompatible(attrMapping.propertyType, schemaProp.datatype)) {
          errors.push({
            type: 'validation',
            message: `Element "${elementName}" attribute "${attrName}" type "${attrMapping.propertyType}" is not compatible with schema property type "${schemaProp.datatype}"`,
            element: elementName,
            path: `@${attrName}`
          })
        }

        // Check if reference target exists
        if (attrMapping.isReference && attrMapping.referenceTarget) {
          if (!schemaJson.nodes[attrMapping.referenceTarget]) {
            errors.push({
              type: 'schema',
              message: `Element "${elementName}" attribute "${attrName}" references node "${attrMapping.referenceTarget}" which does not exist in schema`,
              element: elementName,
              path: `@${attrName}`
            })
          }
        }
      }
    }

    // Validate relationship mappings
    for (const [elementName, relationships] of Object.entries(mappingConfig.relationshipMappings)) {
      for (const relMapping of relationships) {
        if (!relMapping.include) continue

        // Check relationship type exists in schema
        if (!schemaJson.relations[relMapping.relationshipType]) {
          errors.push({
            type: 'schema',
            message: `Element "${elementName}" uses relationship type "${relMapping.relationshipType}" which does not exist in schema`,
            element: elementName
          })
          continue
        }

        const schemaRelation = schemaJson.relations[relMapping.relationshipType]

        // Validate relationship properties
        if (relMapping.properties) {
          for (const [propKey, propMapping] of Object.entries(relMapping.properties)) {
            const schemaProp = schemaRelation.properties?.[propKey]
            if (!schemaProp) {
              errors.push({
                type: 'schema',
                message: `Relationship "${relMapping.relationshipType}" property "${propKey}" does not exist in schema`,
                element: elementName
              })
            }
          }
        }

        // Validate target node exists
        if (relMapping.target.type === 'fixed') {
          if (!schemaJson.nodes[relMapping.target.nodeLabel]) {
            errors.push({
              type: 'schema',
              message: `Element "${elementName}" relationship "${relMapping.relationshipType}" targets node "${relMapping.target.nodeLabel}" which does not exist in schema`,
              element: elementName
            })
          }
        }
      }
    }

    // Validate text content rules
    for (const [elementName, textRule] of Object.entries(mappingConfig.textContentRules)) {
      if (!textRule.include) continue

      const elementMapping = mappingConfig.elementMappings[elementName]
      if (!elementMapping || !elementMapping.include) {
        errors.push({
          type: 'mapping',
          message: `Text content rule for "${elementName}" but element is not mapped`,
          element: elementName
        })
        continue
      }

      // If storing as property, validate property exists
      if (textRule.propertyKey) {
        const schemaNode = schemaJson.nodes[elementMapping.nodeLabel]
        if (!schemaNode.properties[textRule.propertyKey]) {
          errors.push({
            type: 'schema',
            message: `Element "${elementName}" text content maps to property "${textRule.propertyKey}" which does not exist in node "${elementMapping.nodeLabel}"`,
            element: elementName
          })
        }
      }

      // If tokenizing, validate target node exists
      if (textRule.tokenize?.enabled) {
        if (!schemaJson.nodes[textRule.tokenize.targetNodeLabel]) {
          errors.push({
            type: 'schema',
            message: `Element "${elementName}" tokenization targets node "${textRule.tokenize.targetNodeLabel}" which does not exist in schema`,
            element: elementName
          })
        }
      }
    }

    return errors
  }

  /**
   * Check if property type is compatible with schema datatype
   */
  private static isTypeCompatible (mappingType: string, schemaType: string): boolean {
    const typeMap: Record<string, string[]> = {
      string: ['string', 'uri'],
      number: ['integer', 'number', 'float'],
      boolean: ['boolean'],
      date: ['date', 'datetime'],
      array: ['array'],
      object: ['object', 'uri']
    }

    const compatible = typeMap[mappingType.toLowerCase()] || [mappingType.toLowerCase()]
    return compatible.includes(schemaType.toLowerCase())
  }

  /**
   * Validate that all required schema properties are mapped
   */
  static validateRequiredProperties (mappingConfig: MappingConfig, schemaJson: SchemaJson): ConversionError[] {
    const errors: ConversionError[] = []

    for (const [elementName, mapping] of Object.entries(mappingConfig.elementMappings)) {
      if (!mapping.include) continue

      const schemaNode = schemaJson.nodes[mapping.nodeLabel]
      if (!schemaNode) continue

      // Check all required properties are mapped
      for (const [propKey, schemaProp] of Object.entries(schemaNode.properties)) {
        if (!schemaProp.required) continue

        const attrMapping = Object.values(mapping.attributeMappings).find(
          am => am.include && am.propertyKey === propKey
        )

        if (!attrMapping) {
          // Check if text content rule provides this property
          const textRule = mappingConfig.textContentRules[elementName]
          if (!textRule?.include || textRule.propertyKey !== propKey) {
            errors.push({
              type: 'validation',
              message: `Required property "${propKey}" for node "${mapping.nodeLabel}" (element "${elementName}") is not mapped`,
              element: elementName
            })
          }
        }
      }
    }

    return errors
  }
}

