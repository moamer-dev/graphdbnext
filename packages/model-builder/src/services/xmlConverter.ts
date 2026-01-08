import { DOMParser } from '@xmldom/xmldom'
import type { Node, Relationship, Property } from '../types'
import type {
  MappingConfig,
  SchemaJson,
  ConversionResult,
  ConversionError,
  ConversionWarning,
  ElementMapping,
  RelationshipMapping,
  TextContentRule,
  PropertyInheritanceRule,
  TokenizationContextRule,
  ConditionalRule,
  ElementCondition,
  ChildProcessingRule,
  PropertyMappingRule,
  PropertySource
} from '../types/mappingConfig'
import { MappingValidator } from './mappingValidator'

/**
 * Generic XML to Graph Converter
 * Converts XML to graph nodes/relationships based on mapping config and schema
 */
export class XmlConverter {
  private xmlDoc: Document
  private nodeIdCounter = 0
  private relationshipIdCounter = 0
  private elementToNodeMap = new Map<Element, Node>()
  private idToNodeMap = new Map<string, Node>()
  private errors: ConversionError[] = []
  private warnings: ConversionWarning[] = []

  constructor(
    private xmlContent: string,
    private schemaJson: SchemaJson,
    private mappingConfig: MappingConfig
  ) {
    const parser = new DOMParser()
    this.xmlDoc = parser.parseFromString(xmlContent, 'text/xml')

    // Check for parsing errors
    const parseError = this.xmlDoc.getElementsByTagName('parsererror')
    if (parseError.length > 0) {
      this.errors.push({
        type: 'xml',
        message: 'Invalid XML format: ' + parseError[0].textContent
      })
    }
  }

  /**
   * Convert XML to graph
   */
  convert(): ConversionResult {
    try {
      // Validate mapping config first
      const validationErrors = MappingValidator.validate(this.mappingConfig, this.schemaJson)
      if (validationErrors.length > 0) {
        return {
          nodes: [],
          relationships: [],
          errors: validationErrors,
          warnings: []
        }
      }

      const nodes: Node[] = []
      const relationships: Relationship[] = []

      // Walk through XML and convert
      const root = this.xmlDoc.documentElement
      if (root) {
        this.convertElement(root, null, nodes, relationships, 0)
      } else {
        this.errors.push({
          type: 'xml',
          message: 'XML document has no root element'
        })
      }

      return {
        nodes,
        relationships,
        errors: this.errors,
        warnings: this.warnings
      }
    } catch (error) {
      // Catch any unexpected errors during conversion
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.errors.push({
        type: 'xml',
        message: `Conversion error: ${errorMessage}`
      })

      return {
        nodes: [],
        relationships: [],
        errors: this.errors,
        warnings: this.warnings
      }
    }
  }

  /**
   * Convert an XML element to graph nodes
   */
  private convertElement(
    element: Element,
    parentNode: Node | null,
    nodes: Node[],
    relationships: Relationship[],
    depth: number = 0
  ): void {
    const elementName = this.cleanName(element.tagName)
    const mapping = this.mappingConfig.elementMappings[elementName]

    // Skip if not mapped or not included
    if (!mapping || !mapping.include) {
      // Still process children (they might be mapped)
      const children = this.getChildElements(element)
      children.forEach(child => {
        this.convertElement(child, parentNode, nodes, relationships, depth + 1)
      })
      return
    }

    // Check conditional rules first
    const conditionalRule = this.findApplicableConditionalRule(element, mapping.conditionalRules || [])
    if (conditionalRule?.action.skip) {
      // Skip this element but still process children
      const children = this.getChildElements(element)
      children.forEach(child => {
        this.convertElement(child, parentNode, nodes, relationships, depth + 1)
      })
      return
    }

    // Use conditional rule's node mapping if available, otherwise use default
    const effectiveMapping = conditionalRule?.action.createNode
      ? {
        ...mapping,
        nodeLabel: conditionalRule.action.createNode.nodeLabel,
        nodeType: conditionalRule.action.createNode.nodeType,
        superclassNames: conditionalRule.action.createNode.superclassNames || mapping.superclassNames
      }
      : mapping

    // Check depth limit for recursive processing
    const childProcessingRule = conditionalRule?.action.childProcessing || mapping.childProcessingRules?.[0]
    if (childProcessingRule?.maxDepth !== undefined && depth >= childProcessingRule.maxDepth) {
      // Max depth reached, don't process children
      return
    }

    // Create node for this element
    const node = this.createNode(element, effectiveMapping)
    if (node) {
      // Apply property mappings from children/ancestors
      this.applyPropertyMappings(element, node, mapping.propertyMappings || [])

      nodes.push(node)
      this.elementToNodeMap.set(element, node)

      // Store by ID if it has one
      const idAttr = this.getAttributeValue(element, 'id') || this.getAttributeValue(element, 'xml:id')
      if (idAttr) {
        this.idToNodeMap.set(idAttr, node)
      }

      // Create relationship to parent if parent exists
      if (parentNode) {
        const parentElementName = this.getParentElementName(element)
        const parentMapping = parentElementName ? this.mappingConfig.elementMappings[parentElementName] : null

        if (parentMapping && parentMapping.include && parentElementName) {
          // Check for hierarchical relationship mapping
          const relMappings = this.mappingConfig.relationshipMappings[parentElementName] || []
          const hierarchicalRel = relMappings.find(
            (rm: RelationshipMapping) => rm.include &&
              rm.source.type === 'current-element' &&
              rm.target.type === 'child-element' &&
              rm.target.type === 'child-element' && rm.target.elementName === elementName
          )

          if (hierarchicalRel) {
            const rel = this.createRelationship(
              parentNode.id,
              node.id,
              hierarchicalRel.relationshipType,
              hierarchicalRel.properties
            )
            if (rel) {
              relationships.push(rel)
            }
          }
        }
      }

      // Process text content - check for conditional text processing or use default
      const textRule = conditionalRule?.action.textProcessing || this.mappingConfig.textContentRules[elementName]
      if (textRule && textRule.include) {
        // Use child processing rule's text processing stages if available
        const textStages = childProcessingRule?.textProcessing
        if (textStages?.beforeChildren) {
          this.processTextContent(element, node, textStages.beforeChildren, nodes, relationships)
        } else if (textRule) {
          this.processTextContent(element, node, textRule, nodes, relationships)
        }
      }

      // Process children with recursive processing rules
      const children = this.getChildElements(element)
      const processedChildren = this.filterChildrenForProcessing(children, childProcessingRule)
      const orderedChildren = this.orderChildren(processedChildren, childProcessingRule?.order || 'document')

      orderedChildren.forEach(child => {
        this.convertElement(child, node, nodes, relationships, depth + 1)
      })

      // Process text after children if configured
      if (textRule && childProcessingRule?.textProcessing?.afterChildren) {
        this.processTextContent(element, node, childProcessingRule.textProcessing.afterChildren, nodes, relationships)
      }

      // Process relationships
      const relMappings = this.mappingConfig.relationshipMappings?.[elementName] || []
      if (Array.isArray(relMappings)) {
        for (const relMapping of relMappings) {
          if (relMapping && relMapping.include) {
            this.processRelationship(element, node, relMapping, relationships)
          }
        }
      }
    }
  }

  /**
   * Create a node from XML element based on mapping
   */
  private createNode(element: Element, mapping: ElementMapping): Node | null {
    const schemaNode = this.schemaJson.nodes[mapping.nodeLabel]
    if (!schemaNode) {
      this.errors.push({
        type: 'schema',
        message: `Node label "${mapping.nodeLabel}" not found in schema`,
        element: this.cleanName(element.tagName)
      })
      return null
    }

    const properties: Property[] = []
    const propertySemantics: Record<string, any> = {}

    // Map attributes to properties
    const attributeMappings = mapping.attributeMappings || {}
    for (const [attrName, attrMapping] of Object.entries(attributeMappings)) {
      if (!attrMapping || !attrMapping.include) continue

      const attrValue = this.getAttributeValue(element, attrName)
      if (attrValue !== null) {
        const prop: Property = {
          key: attrMapping.propertyKey,
          type: attrMapping.propertyType,
          required: attrMapping.required,
          defaultValue: this.convertValue(attrValue, attrMapping.propertyType)
        }
        properties.push(prop)

        // Store semantic metadata for this property if available
        if (attrMapping.semantic) {
          propertySemantics[attrMapping.propertyKey] = attrMapping.semantic
        }
      } else if (attrMapping.required) {
        this.warnings.push({
          type: 'missing-property',
          message: `Required attribute "${attrName}" missing on element "${this.cleanName(element.tagName)}"`,
          element: this.cleanName(element.tagName)
        })
      }
    }

    // Create node
    console.log('[XmlConverter] Creating node:', {
      nodeType: mapping.nodeType,
      hasSemantic: !!mapping.semantic,
      semantic: mapping.semantic,
      hasPropertySemantics: Object.keys(propertySemantics).length > 0,
      propertySemantics
    })
    const node: Node = {
      id: `node_${this.nodeIdCounter++}`,
      label: mapping.nodeLabel,
      type: mapping.nodeType,
      properties,
      position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
      order: this.nodeIdCounter,
      data: {
        ...(mapping.semantic && { semantic: mapping.semantic }),
        ...(Object.keys(propertySemantics).length > 0 && { propertySemantics })
      }
    }

    return node
  }

  /**
   * Process text content according to text content rule
   */
  private processTextContent(
    element: Element,
    parentNode: Node,
    textRule: TextContentRule,
    nodes: Node[],
    relationships: Relationship[]
  ): void {
    const textContent = this.getTextContent(element)

    // Store as property if specified (only if tokenization is not enabled)
    if (!textRule.tokenize?.enabled && textRule.propertyKey && textContent) {
      // Check if property exists in schema (optional validation)
      const schemaNode = this.schemaJson.nodes[parentNode.label]
      if (schemaNode && !schemaNode.properties[textRule.propertyKey]) {
        // Property doesn't exist in schema, but we'll still add it (schema might be incomplete)
        // Note: This is just informational, not an error
      }

      const prop: Property = {
        key: textRule.propertyKey,
        type: 'string',
        required: false,
        defaultValue: textContent
      }
      parentNode.properties.push(prop)
    }

    // Tokenize if enabled
    if (textRule.tokenize?.enabled && textContent && textRule.tokenize) {
      // Set current element for property inheritance
      this.currentTokenizationElement = element

      try {
        // Determine which context rule applies
        const contextRule = this.findApplicableContextRule(element, textRule.tokenize.contextRules)

        // Use context rule overrides if available
        const targetNodeLabel = contextRule?.targetNodeLabel || textRule.tokenize.targetNodeLabel
        const targetNodeType = contextRule?.targetNodeType || textRule.tokenize.targetNodeType
        const splitBy = contextRule?.splitBy !== undefined ? contextRule.splitBy : textRule.tokenize.splitBy

        const tokens = this.tokenize(textContent, splitBy)
        const targetSchemaNode = this.schemaJson.nodes[targetNodeLabel]

        if (!targetSchemaNode) {
          this.errors.push({
            type: 'schema',
            message: `Tokenization target node "${targetNodeLabel}" not found in schema`,
            element: this.cleanName(element.tagName)
          })
          return
        }

        tokens.forEach((token, index) => {
          const tokenNode = this.createTokenNode(
            token,
            index,
            {
              ...textRule.tokenize!,
              targetNodeLabel,
              targetNodeType,
              splitBy
            },
            targetSchemaNode,
            contextRule?.inheritProperties || []
          )
          if (tokenNode) {
            nodes.push(tokenNode)

            // Create relationship from parent to token
            const rel = this.createRelationship(
              parentNode.id,
              tokenNode.id,
              'contains', // Default relationship type for tokenization
              {}
            )
            if (rel) {
              relationships.push(rel)
            }
          }
        })
      } finally {
        this.currentTokenizationElement = null
      }
    }
  }

  /**
   * Find applicable context rule for tokenization
   */
  private findApplicableContextRule(
    element: Element,
    contextRules?: TokenizationContextRule[]
  ): TokenizationContextRule | null {
    if (!contextRules || contextRules.length === 0) return null

    const ancestors = this.getAncestorNames(element)
    const parentName = this.getParentElementName(element)

    for (const rule of contextRules) {
      // Check whenAncestor
      if (rule.whenAncestor) {
        const matches = rule.whenAncestor.some(name => ancestors.includes(name))
        if (matches) return rule
      }

      // Check whenParent
      if (rule.whenParent && parentName) {
        if (rule.whenParent.includes(parentName)) return rule
      }

      // Check whenInside
      if (rule.whenInside) {
        const matches = rule.whenInside.some(name => ancestors.includes(name))
        if (matches) return rule
      }
    }

    return null
  }

  /**
   * Get all ancestor element names
   */
  private getAncestorNames(element: Element): string[] {
    const names: string[] = []
    let current: Element | null = element.parentElement

    while (current) {
      names.push(this.cleanName(current.tagName))
      current = current.parentElement
    }

    return names
  }

  /**
   * Create a token node (for tokenization)
   */
  private createTokenNode(
    token: { text: string; whitespace: string },
    index: number,
    tokenizeConfig: NonNullable<TextContentRule['tokenize']>,
    schemaNode: SchemaJson['nodes'][string],
    inheritProperties: PropertyInheritanceRule[] = []
  ): Node | null {
    const properties: Property[] = []
    const element = this.getCurrentElement() // We need to track current element during tokenization

    // Map token properties
    if (tokenizeConfig.properties) {
      for (const [key, propMapping] of Object.entries(tokenizeConfig.properties)) {
        let value: unknown

        switch (propMapping.source) {
          case 'text':
            value = token.text
            break
          case 'whitespace':
            value = token.whitespace
            break
          case 'index':
            value = index
            break
          case 'fixed':
            value = propMapping.value
            break
        }

        const prop: Property = {
          key: propMapping.propertyKey,
          type: this.inferPropertyType(value),
          required: false,
          defaultValue: value
        }
        properties.push(prop)
      }
    } else {
      // Default: map text to 'text' property
      const textProp = schemaNode.properties['text']
      if (textProp) {
        properties.push({
          key: 'text',
          type: 'string',
          required: textProp.required,
          defaultValue: token.text
        })
      }
    }

    // Apply property inheritance rules
    if (element && inheritProperties.length > 0) {
      for (const inheritRule of inheritProperties) {
        let inheritedValue: unknown = null

        if (inheritRule.fromAncestor) {
          const ancestor = this.findAncestorElement(element, inheritRule.fromAncestor)
          if (ancestor && inheritRule.fromAttribute) {
            inheritedValue = this.getAttributeValue(ancestor, inheritRule.fromAttribute)
          }
        } else if (inheritRule.fromParent) {
          const parent = element.parentElement
          if (parent && inheritRule.fromAttribute) {
            inheritedValue = this.getAttributeValue(parent, inheritRule.fromAttribute)
          }
        }

        if (inheritedValue !== null) {
          // Transform value if needed
          let finalValue = inheritedValue
          if (inheritRule.transform === 'fixed' && inheritRule.fixedValue) {
            finalValue = inheritRule.fixedValue
          } else if (inheritRule.transform === 'map' && inheritRule.valueMap) {
            finalValue = inheritRule.valueMap[String(inheritedValue)] || inheritedValue
          }

          properties.push({
            key: inheritRule.propertyKey,
            type: inheritRule.propertyType,
            required: false,
            defaultValue: finalValue
          })
        }
      }
    }

    return {
      id: `node_${this.nodeIdCounter++}`,
      label: tokenizeConfig.targetNodeLabel,
      type: tokenizeConfig.targetNodeType,
      properties,
      position: { x: 0, y: 0 },
      order: this.nodeIdCounter
    }
  }

  /**
   * Find ancestor element by name
   */
  private findAncestorElement(element: Element, ancestorName: string): Element | null {
    let current: Element | null = element.parentElement
    while (current) {
      if (this.cleanName(current.tagName) === ancestorName) {
        return current
      }
      current = current.parentElement
    }
    return null
  }

  /**
   * Track current element during tokenization (needed for property inheritance)
   */
  private currentTokenizationElement: Element | null = null

  private getCurrentElement(): Element | null {
    return this.currentTokenizationElement
  }

  /**
   * Find applicable conditional rule for element
   */
  private findApplicableConditionalRule(
    element: Element,
    conditionalRules: ConditionalRule[]
  ): ConditionalRule | null {
    for (const rule of conditionalRules) {
      if (this.evaluateCondition(element, rule.condition)) {
        return rule
      }
    }
    return null
  }

  /**
   * Evaluate element condition
   */
  private evaluateCondition(element: Element, condition: ElementCondition): boolean {
    // Check hasChildren
    if (condition.hasChildren) {
      const children = this.getChildElements(element)
      const childNames = children.map((child: Element) => this.cleanName(child.tagName))
      const hasAny = condition.hasChildren.some((name: string) => childNames.includes(name))
      if (!hasAny) return false
    }

    // Check hasAllChildren
    if (condition.hasAllChildren) {
      const children = this.getChildElements(element)
      const childNames = children.map((child: Element) => this.cleanName(child.tagName))
      const hasAll = condition.hasAllChildren.every((name: string) => childNames.includes(name))
      if (!hasAll) return false
    }

    // Check hasNoChildren
    if (condition.hasNoChildren) {
      const children = this.getChildElements(element)
      const childNames = children.map((child: Element) => this.cleanName(child.tagName))
      const hasNone = condition.hasNoChildren.every((name: string) => !childNames.includes(name))
      if (!hasNone) return false
    }

    // Check hasAncestor
    if (condition.hasAncestor) {
      const ancestors = this.getAncestorNames(element)
      const hasAncestor = condition.hasAncestor.some((name: string) => ancestors.includes(name))
      if (!hasAncestor) return false
    }

    // Check hasAttribute
    if (condition.hasAttribute) {
      const hasAttr = condition.hasAttribute.some((attrName: string) => {
        return this.getAttributeValue(element, attrName) !== null
      })
      if (!hasAttr) return false
    }

    // Check hasTextContent
    if (condition.hasTextContent !== undefined) {
      const textContent = this.getTextContent(element)
      const hasText = textContent.trim().length > 0
      if (condition.hasTextContent !== hasText) return false
    }

    // Check childCount
    if (condition.childCount) {
      const children = this.getChildElements(element)
      const count = children.length
      if (condition.childCount.min !== undefined && count < condition.childCount.min) return false
      if (condition.childCount.max !== undefined && count > condition.childCount.max) return false
    }

    return true
  }

  /**
   * Filter children based on processing rules
   */
  private filterChildrenForProcessing(
    children: Element[],
    childProcessingRule?: ChildProcessingRule
  ): Element[] {
    if (!childProcessingRule?.processChildren) {
      return children
    }

    const { include, exclude, processAll } = childProcessingRule.processChildren

    if (processAll) {
      return children
    }

    if (include && include.length > 0) {
      return children.filter(child => {
        const childName = this.cleanName(child.tagName)
        return include.includes(childName)
      })
    }

    if (exclude && exclude.length > 0) {
      return children.filter(child => {
        const childName = this.cleanName(child.tagName)
        return !exclude.includes(childName)
      })
    }

    return children
  }

  /**
   * Order children based on processing rules
   */
  private orderChildren(children: Element[], order: 'document' | 'reverse' | 'custom'): Element[] {
    switch (order) {
      case 'reverse':
        return [...children].reverse()
      case 'custom':
        // Custom order would need additional configuration
        // For now, return as-is
        return children
      case 'document':
      default:
        return children
    }
  }

  /**
   * Apply property mappings from children or ancestors
   */
  private applyPropertyMappings(
    element: Element,
    node: Node,
    propertyMappings: PropertyMappingRule[]
  ): void {
    for (const propMapping of propertyMappings) {
      const value = this.getPropertyValue(element, propMapping.source)
      if (value !== null && value !== undefined) {
        const transformedValue = this.transformPropertyValue(value, propMapping)
        const existingProp = node.properties.find(p => p.key === propMapping.targetProperty)
        if (existingProp) {
          existingProp.defaultValue = transformedValue
        } else {
          node.properties.push({
            key: propMapping.targetProperty,
            type: propMapping.targetPropertyType,
            required: false,
            defaultValue: transformedValue
          })
        }
      }
    }
  }

  /**
   * Get property value from source (child/ancestor element or attribute)
   */
  private getPropertyValue(element: Element, source: PropertySource): unknown {
    switch (source.type) {
      case 'child-element': {
        if (!source.elementName) return null
        const children = this.getChildElements(element)
        const child = children.find(c => this.cleanName(c.tagName) === source.elementName)
        if (!child) return null
        return this.getTextContent(child)
      }
      case 'ancestor-element': {
        if (!source.elementName) return null
        const ancestor = this.findAncestorElement(element, source.elementName)
        if (!ancestor) return null
        return this.getTextContent(ancestor)
      }
      case 'child-attribute': {
        if (!source.elementName || !source.attributeName) return null
        const children = this.getChildElements(element)
        const child = children.find(c => this.cleanName(c.tagName) === source.elementName)
        if (!child) return null
        return this.getAttributeValue(child, source.attributeName)
      }
      case 'ancestor-attribute': {
        if (!source.elementName || !source.attributeName) return null
        const ancestor = this.findAncestorElement(element, source.elementName)
        if (!ancestor) return null
        return this.getAttributeValue(ancestor, source.attributeName)
      }
      case 'child-text': {
        if (!source.elementName) return null
        const children = this.getChildElements(element)
        const child = children.find(c => this.cleanName(c.tagName) === source.elementName)
        if (!child) return null
        return this.getTextContent(child)
      }
      case 'ancestor-text': {
        if (!source.elementName) return null
        const ancestor = this.findAncestorElement(element, source.elementName)
        if (!ancestor) return null
        return this.getTextContent(ancestor)
      }
      default:
        return null
    }
  }

  /**
   * Transform property value based on mapping rule
   */
  private transformPropertyValue(value: unknown, mapping: PropertyMappingRule): unknown {
    if (!mapping.transform || mapping.transform === 'direct') {
      return value
    }

    switch (mapping.transform) {
      case 'first':
        return Array.isArray(value) ? value[0] : value
      case 'last':
        return Array.isArray(value) ? value[value.length - 1] : value
      case 'join':
        return Array.isArray(value) ? value.join(mapping.transformValue || ', ') : String(value)
      case 'count':
        return Array.isArray(value) ? value.length : (value ? 1 : 0)
      case 'fixed':
        return mapping.transformValue
      case 'map':
        if (mapping.valueMap && typeof value === 'string') {
          return mapping.valueMap[value] || value
        }
        return value
      default:
        return value
    }
  }

  /**
   * Process relationship mappings
   */
  private processRelationship(
    element: Element,
    sourceNode: Node,
    relMapping: MappingConfig['relationshipMappings'][string][0],
    relationships: Relationship[]
  ): void {
    let targetNode: Node | null = null

    // Determine target based on relationship target config
    switch (relMapping.target.type) {
      case 'child-element': {
        const children = this.getChildElements(element)
        const childElement = children.find(
          child => this.cleanName(child.tagName) === (relMapping.target.type === 'child-element' ? relMapping.target.elementName : '')
        )
        if (childElement) {
          targetNode = this.elementToNodeMap.get(childElement) || null
        }
        break
      }
      case 'reference': {
        const refValue = this.getAttributeValue(element, relMapping.target.attribute)
        if (refValue) {
          // Remove # prefix if present
          const id = refValue.startsWith('#') ? refValue.slice(1) : refValue
          targetNode = this.idToNodeMap.get(id) || null
        }
        break
      }
      case 'fixed': {
        // Find node by label (this is a simplified approach)
        // In practice, you might need to track nodes by label
        this.warnings.push({
          type: 'invalid-reference',
          message: `Fixed target relationships not yet fully implemented`,
          element: this.cleanName(element.tagName)
        })
        break
      }
    }

    if (targetNode) {
      const rel = this.createRelationship(
        sourceNode.id,
        targetNode.id,
        relMapping.relationshipType,
        relMapping.properties,
        relMapping.semantic
      )
      if (rel) {
        relationships.push(rel)
      }
    }
  }

  /**
   * Create a relationship
   */
  private createRelationship(
    fromId: string,
    toId: string,
    relationshipType: string,
    properties?: Record<string, any>,
    semantic?: {
      propertyIri?: string
      propertyLabel?: string
      propertyCurie?: string
      ontologyId?: string
    }
  ): Relationship | null {
    const schemaRelation = this.schemaJson.relations[relationshipType]
    if (!schemaRelation) {
      this.errors.push({
        type: 'schema',
        message: `Relationship type "${relationshipType}" not found in schema`
      })
      return null
    }

    const relProperties: Property[] = []
    if (properties && schemaRelation.properties) {
      for (const [key, propMapping] of Object.entries(properties)) {
        const schemaProp = schemaRelation.properties[key]
        if (schemaProp) {
          relProperties.push({
            key,
            type: this.mapSchemaDatatypeToPropertyType(schemaProp.datatype),
            required: schemaProp.required,
            defaultValue: propMapping.source === 'fixed' ? propMapping.sourcePath : undefined
          })
        }
      }
    }

    return {
      id: `rel_${this.relationshipIdCounter++}`,
      type: relationshipType,
      from: fromId,
      to: toId,
      properties: relProperties.length > 0 ? relProperties : undefined,
      data: semantic ? { semantic } : undefined
    }
  }

  /**
   * Get child elements safely
   */
  private getChildElements(element: Element): Element[] {
    try {
      // Try using children property first (HTMLCollection)
      if (element.children && element.children.length > 0) {
        return Array.from(element.children) as Element[]
      }
      // Fallback to childNodes (NodeList)
      if (element.childNodes) {
        return Array.from(element.childNodes).filter(
          (node): node is Element => node.nodeType === 1 // Element node
        ) as Element[]
      }
      return []
    } catch (error) {
      console.warn('Error getting child elements:', error)
      return []
    }
  }

  /**
   * Helper methods
   */
  private cleanName(name: string): string {
    if (name.includes('}')) {
      return name.split('}').pop() || name
    }
    if (name.includes(':')) {
      return name.split(':').pop() || name
    }
    return name
  }

  private getAttributeValue(element: Element, attrName: string): string | null {
    const attr = element.getAttribute(attrName) || element.getAttribute(`xml:${attrName}`)
    return attr || null
  }

  private getTextContent(element: Element): string {
    return element.textContent || ''
  }

  private getParentElementName(element: Element): string | null {
    const parent = element.parentElement
    return parent ? this.cleanName(parent.tagName) : null
  }

  private tokenize(text: string, splitBy?: string): Array<{ text: string; whitespace: string }> {
    if (!splitBy || splitBy === '') {
      // Character-level tokenization
      return Array.from(text).map(char => ({
        text: char,
        whitespace: ''
      }))
    }

    // Split by delimiter
    const parts = text.split(splitBy)
    return parts.map((part, index) => ({
      text: part,
      whitespace: index < parts.length - 1 ? splitBy : ''
    }))
  }

  private convertValue(value: string, type: string): unknown {
    switch (type) {
      case 'number':
        return Number(value)
      case 'boolean':
        return value === 'true' || value === '1'
      case 'date':
        return new Date(value).toISOString()
      case 'array':
        return value.split(',').map(v => v.trim())
      default:
        return value
    }
  }

  private inferPropertyType(value: unknown): Property['type'] {
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (value instanceof Date) return 'date'
    return 'string'
  }

  private mapSchemaDatatypeToPropertyType(datatype: string): Property['type'] {
    const mapping: Record<string, Property['type']> = {
      string: 'string',
      integer: 'number',
      number: 'number',
      float: 'number',
      boolean: 'boolean',
      date: 'date',
      datetime: 'date',
      array: 'array',
      uri: 'object'
    }
    return mapping[datatype.toLowerCase()] || 'string'
  }
}

/**
 * Convert XML to graph using mapping config and schema
 */
export function convertXmlToGraph(
  xmlContent: string,
  schemaJson: SchemaJson,
  mappingConfig: MappingConfig
): ConversionResult {
  const converter = new XmlConverter(xmlContent, schemaJson, mappingConfig)
  return converter.convert()
}

