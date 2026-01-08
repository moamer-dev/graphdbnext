import type { Node, Relationship, Property } from './index'

/**
 * Mapping configuration that defines how XML elements map to graph schema
 * This is the data-driven configuration that replaces hardcoded conversion logic
 */
export interface MappingConfig {
  version: string
  schemaId?: string // Reference to schema this mapping is for

  // Element to node type mappings
  elementMappings: Record<string, ElementMapping>

  // Relationship mappings
  relationshipMappings: Record<string, RelationshipMapping[]>

  // Text content processing rules
  textContentRules: Record<string, TextContentRule>

  // Reference resolution rules
  referenceRules: Record<string, ReferenceRule>
}

export interface ElementMapping {
  include: boolean
  nodeLabel: string // Must match a node label in schemaJson
  nodeType: string  // Must match a node type in schemaJson
  superclassNames?: string[]

  // Attribute to property mappings
  attributeMappings: Record<string, AttributeMapping>

  // Whether to process text content
  processTextContent: boolean

  // Advanced: Conditional node creation based on children/structure
  conditionalRules?: ConditionalRule[]

  // Advanced: Recursive processing rules for children
  childProcessingRules?: ChildProcessingRule[]

  // Advanced: Property mapping from children or ancestors
  propertyMappings?: PropertyMappingRule[]

  // Semantic metadata
  semantic?: {
    classIri?: string
    classLabel?: string
    classCurie?: string
    ontologyId?: string
  }
}

/**
 * Conditional rule: Create nodes conditionally based on element structure
 */
export interface ConditionalRule {
  // Condition: when to apply this rule
  condition: ElementCondition

  // Action: what to do when condition is met
  action: ConditionalAction
}

export interface ElementCondition {
  // Check if element has specific children
  hasChildren?: string[] // Element must have at least one of these children
  hasAllChildren?: string[] // Element must have all of these children
  hasNoChildren?: string[] // Element must not have any of these children
  hasAncestor?: string[] // Element must have one of these ancestors
  hasAttribute?: string[] // Element must have at least one of these attributes
  hasTextContent?: boolean // Element must/must not have text content
  childCount?: { min?: number; max?: number } // Child count constraints
}

export interface ConditionalAction {
  // Create a different node type
  createNode?: {
    nodeLabel: string
    nodeType: string
    superclassNames?: string[]
  }

  // Skip processing
  skip?: boolean

  // Apply different text processing
  textProcessing?: TextContentRule

  // Apply different child processing
  childProcessing?: ChildProcessingRule
}

/**
 * Child processing rule: How to recursively process child elements
 */
export interface ChildProcessingRule {
  // Which children to process
  processChildren?: {
    include?: string[] // Only process these child element types
    exclude?: string[] // Don't process these child element types
    processAll?: boolean // Process all children
  }

  // Processing order
  order?: 'document' | 'reverse' | 'custom' // Order to process children

  // Text processing stages
  textProcessing?: {
    beforeChildren?: TextContentRule // Process text before processing children
    afterChildren?: TextContentRule // Process text after processing children
    onTail?: TextContentRule // Process tail text (text after element)
  }

  // Recursive depth limit
  maxDepth?: number
}

/**
 * Property mapping rule: Map properties from children or ancestors
 */
export interface PropertyMappingRule {
  // Source of the property
  source: PropertySource

  // Target property on the current node
  targetProperty: string
  targetPropertyType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'

  // Transformation
  transform?: 'direct' | 'first' | 'last' | 'join' | 'count' | 'fixed' | 'map'
  transformValue?: string // For 'fixed' or 'join' delimiter
  valueMap?: Record<string, string> // For 'map' transform
}

export interface PropertySource {
  type: 'child-element' | 'ancestor-element' | 'child-attribute' | 'ancestor-attribute' | 'child-text' | 'ancestor-text'
  elementName?: string // For child/ancestor element
  attributeName?: string // For attribute source
  xpath?: string // XPath to find source (advanced)
}

export interface AttributeMapping {
  include: boolean
  propertyKey: string // Must match a property key in schema node
  propertyType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  required: boolean
  isReference?: boolean // If true, this attribute creates a relationship
  referenceTarget?: string // Node label this references
  semantic?: {
    propertyIri?: string
    propertyLabel?: string
    propertyCurie?: string
    ontologyId?: string
  }
}

export interface RelationshipMapping {
  include: boolean
  relationshipType: string // Must match a relationship type in schemaJson

  // How to determine the relationship
  source: RelationshipSource
  target: RelationshipTarget

  // Optional properties for the relationship
  properties?: Record<string, PropertyMapping>

  // Semantic metadata
  semantic?: {
    propertyIri?: string
    propertyLabel?: string
    propertyCurie?: string
    ontologyId?: string
  }
}

export type RelationshipSource =
  | { type: 'current-element' } // Current XML element
  | { type: 'parent-element' }  // Parent XML element
  | { type: 'attribute'; attribute: string } // From attribute value
  | { type: 'xpath'; xpath: string } // From XPath expression

export type RelationshipTarget =
  | { type: 'child-element'; elementName: string } // Child element
  | { type: 'sibling-element'; elementName: string } // Sibling element
  | { type: 'reference'; attribute: string } // From reference attribute
  | { type: 'xpath'; xpath: string } // From XPath expression
  | { type: 'fixed'; nodeLabel: string } // Fixed target node

export interface PropertyMapping {
  source: 'attribute' | 'text' | 'xpath' | 'fixed'
  sourcePath?: string // Attribute name, XPath, or fixed value
  propertyKey: string
  transform?: 'string' | 'number' | 'boolean' | 'date' | 'split' | 'join'
}

export interface TextContentRule {
  include: boolean
  propertyKey?: string // If set, store text as property on parent node

  // Tokenization options
  tokenize?: {
    enabled: boolean
    splitBy?: string // How to split (e.g., ' ', '') - empty string = character-level
    targetNodeLabel: string // Node type to create for each token
    targetNodeType: string
    properties?: Record<string, TokenPropertyMapping>

    // Context-aware tokenization
    contextRules?: TokenizationContextRule[]
  }
}

export interface TokenizationContextRule {
  // When to apply this rule
  whenAncestor?: string[] // Apply if any of these elements are ancestors
  whenParent?: string[] // Apply if parent is one of these
  whenInside?: string[] // Apply if inside (anywhere in ancestor chain) one of these

  // Override tokenization behavior
  targetNodeLabel?: string // Override target node type
  targetNodeType?: string
  splitBy?: string // Override split behavior

  // Additional properties to add to tokens
  inheritProperties?: PropertyInheritanceRule[]
}

export interface PropertyInheritanceRule {
  // Source of property
  fromAncestor?: string // Element name to inherit from
  fromAttribute?: string // Attribute name to inherit
  fromParent?: boolean // Inherit from direct parent

  // Target
  propertyKey: string // Property name on token node
  propertyType: 'string' | 'number' | 'boolean' | 'date'
  transform?: 'direct' | 'fixed' | 'map' // How to transform the value
  fixedValue?: string // For 'fixed' transform
  valueMap?: Record<string, string> // For 'map' transform
}

export interface TokenPropertyMapping {
  source: 'index' | 'text' | 'whitespace' | 'fixed'
  value?: string // For 'fixed' type
  propertyKey: string
}

export interface ReferenceRule {
  attribute: string // Attribute name that contains reference
  referenceType: 'id' | 'xpath' | 'uri'
  targetNodeLabel: string // What node type this references
  relationshipType?: string // Optional: create relationship automatically
}

/**
 * Schema JSON structure (simplified from what model builder uses)
 */
export interface SchemaJson {
  nodes: Record<string, SchemaNode>
  relations: Record<string, SchemaRelation>
}

export interface SchemaNode {
  name: string
  superclassNames?: string[]
  properties: Record<string, SchemaProperty>
  relationsOut?: Record<string, string[]>
  relationsIn?: Record<string, string[]>
}

export interface SchemaProperty {
  name: string
  datatype: string
  values?: unknown[]
  required: boolean
}

export interface SchemaRelation {
  name: string
  properties?: Record<string, SchemaProperty>
  domains: Record<string, string[]> // source node -> target nodes[]
}

/**
 * Conversion result
 */
export interface ConversionResult {
  nodes: Node[]
  relationships: Relationship[]
  errors: ConversionError[]
  warnings: ConversionWarning[]
}

export interface ConversionError {
  type: 'validation' | 'mapping' | 'schema' | 'xml'
  message: string
  element?: string
  path?: string
}

export interface ConversionWarning {
  type: 'missing-property' | 'unmapped-element' | 'invalid-reference'
  message: string
  element?: string
  path?: string
}

