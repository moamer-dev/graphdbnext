/**
 * Helper functions to configure complex mapping patterns
 * These can be used programmatically or as examples for UI configuration
 */

import type { MappingConfig, TextContentRule } from '../types/mappingConfig'

/**
 * Configure tokenization for seg → Sign with damage inheritance
 * 
 * This handles the pattern where:
 * - <seg> text is tokenized into Sign nodes (character by character)
 * - If seg is inside <damage>, Sign nodes inherit damage properties
 * 
 * Example XML:
 * <damage degree="high">
 *   <seg>abc</seg>
 * </damage>
 * 
 * Creates: 3 Sign nodes (a, b, c) each with damage: "high"
 */
export function configureSegToSignWithDamage (
  mappingConfig: MappingConfig,
  segElementName: string = 'seg',
  signNodeLabel: string = 'Sign'
): void {
  if (!mappingConfig.textContentRules[segElementName]) {
    mappingConfig.textContentRules[segElementName] = {
      include: true,
      tokenize: {
        enabled: true,
        splitBy: '', // Character-level tokenization
        targetNodeLabel: signNodeLabel,
        targetNodeType: signNodeLabel,
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
  } else {
    // Update existing rule
    const rule = mappingConfig.textContentRules[segElementName]
    if (rule.tokenize) {
      rule.tokenize.contextRules = [
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

/**
 * Configure tokenization for w → Character
 * 
 * This handles the pattern where:
 * - <w> text is tokenized into Character nodes (character by character)
 * 
 * Example XML:
 * <w lemma="li">li</w>
 * 
 * Creates: 1 Word node + 2 Character nodes (l, i)
 */
export function configureWordToCharacter (
  mappingConfig: MappingConfig,
  wordElementName: string = 'w',
  characterNodeLabel: string = 'Character'
): void {
  if (!mappingConfig.textContentRules[wordElementName]) {
    mappingConfig.textContentRules[wordElementName] = {
      include: true,
      tokenize: {
        enabled: true,
        splitBy: '', // Character-level tokenization
        targetNodeLabel: characterNodeLabel,
        targetNodeType: characterNodeLabel,
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
 * Add context rule to existing tokenization
 * 
 * Example: Add unclear property inheritance to seg tokenization
 */
export function addContextRuleToTokenization (
  mappingConfig: MappingConfig,
  elementName: string,
  contextRule: {
    whenInside?: string[]
    whenAncestor?: string[]
    whenParent?: string[]
    inheritProperties?: Array<{
      fromAncestor?: string
      fromParent?: boolean
      fromAttribute?: string
      propertyKey: string
      propertyType: 'string' | 'number' | 'boolean' | 'date'
      transform?: 'direct' | 'fixed' | 'map'
      fixedValue?: string
      valueMap?: Record<string, string>
    }>
  }
): void {
  const rule = mappingConfig.textContentRules[elementName]
  if (!rule || !rule.tokenize) {
    console.warn(`No tokenization rule found for ${elementName}`)
    return
  }

  if (!rule.tokenize.contextRules) {
    rule.tokenize.contextRules = []
  }

  rule.tokenize.contextRules.push(contextRule as any)
}

/**
 * Apply common KTU patterns to mapping config
 * This sets up the typical patterns used in KTU XML conversion
 */
export function applyCommonKTUPatterns (mappingConfig: MappingConfig): void {
  // seg → Sign with damage inheritance
  configureSegToSignWithDamage(mappingConfig, 'seg', 'Sign')

  // w → Character
  configureWordToCharacter(mappingConfig, 'w', 'Character')

  // Add unclear property inheritance for seg
  addContextRuleToTokenization(mappingConfig, 'seg', {
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
  })
}

