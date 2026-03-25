/**
 * Example mapping configurations for common XML to graph conversion patterns
 * These can be used as templates or reference for users
 */

import type { MappingConfig } from '../types/mappingConfig'

/**
 * Example: Tokenization with context-aware properties
 * 
 * Scenario: <seg> elements contain text that should be tokenized into Sign nodes.
 * If the seg is inside a <damage> element, the Sign nodes should inherit damage properties.
 * 
 * Example XML:
 * <damage degree="high">
 *   <seg>abc</seg>
 * </damage>
 * 
 * Should create: 3 Sign nodes (a, b, c) each with damage: "high"
 */
export const segToSignWithDamageExample: Partial<MappingConfig> = {
  elementMappings: {
    seg: {
      include: true,
      nodeLabel: 'Seg',
      nodeType: 'Seg',
      attributeMappings: {
        id: {
          include: true,
          propertyKey: 'id',
          propertyType: 'string',
          required: false
        }
      },
      processTextContent: true
    }
  },
  textContentRules: {
    seg: {
      include: true,
      tokenize: {
        enabled: true,
        splitBy: '', // Character-level tokenization
        targetNodeLabel: 'Sign',
        targetNodeType: 'Sign',
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
        contextRules: [
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
    }
  }
}

/**
 * Example: Word to Character tokenization
 * 
 * Scenario: <w> elements contain text that should be tokenized into Character nodes.
 * 
 * Example XML:
 * <w lemma="li">li</w>
 * 
 * Should create: 1 Word node + 2 Character nodes (l, i)
 */
export const wordToCharacterExample: Partial<MappingConfig> = {
  elementMappings: {
    w: {
      include: true,
      nodeLabel: 'Word',
      nodeType: 'Word',
      attributeMappings: {
        id: {
          include: true,
          propertyKey: 'id',
          propertyType: 'string',
          required: false
        },
        lemma: {
          include: true,
          propertyKey: 'lemma',
          propertyType: 'string',
          required: false
        }
      },
      processTextContent: true
    }
  },
  textContentRules: {
    w: {
      include: true,
      tokenize: {
        enabled: true,
        splitBy: '', // Character-level tokenization
        targetNodeLabel: 'Character',
        targetNodeType: 'Character',
        properties: {
          text: {
            source: 'text',
            propertyKey: 'text'
          },
          whitespace: {
            source: 'whitespace',
            propertyKey: 'whitespace'
          }
        }
      }
    }
  }
}

/**
 * Example: Context-dependent tokenization
 * 
 * Scenario: Text inside <seg> should create Sign nodes, but if inside <g> or <pc>,
 * it should still create Sign nodes (same type but different context handling).
 */
export const contextDependentTokenizationExample: Partial<MappingConfig> = {
  textContentRules: {
    seg: {
      include: true,
      tokenize: {
        enabled: true,
        splitBy: '',
        targetNodeLabel: 'Sign',
        targetNodeType: 'Sign',
        contextRules: [
          {
            // When inside damage, inherit damage property
            whenInside: ['damage'],
            inheritProperties: [
              {
                fromAncestor: 'damage',
                fromAttribute: 'degree',
                propertyKey: 'damage',
                propertyType: 'string'
              }
            ]
          },
          {
            // When inside unclear, add unclear property
            whenInside: ['unclear'],
            inheritProperties: [
              {
                fromAncestor: 'unclear',
                propertyKey: 'unclear',
                propertyType: 'boolean',
                transform: 'fixed',
                fixedValue: 'true'
              }
            ]
          }
        ]
      }
    }
  }
}

