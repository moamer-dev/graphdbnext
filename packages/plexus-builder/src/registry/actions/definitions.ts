import { workflowRegistry } from '../workflowRegistry'
import { ActionDefinition } from '../types'
import { 
  Edit, 
  Link2, 
  Boxes, 
  FileText, 
  Type, 
  Search, 
  Trash2, 
  Copy, 
  Merge,
  Split,
  Wand2,
  Calculator,
  Settings,
  RotateCcw,
  SkipForward
} from 'lucide-react'

// Import executors
import { executeSetPropertyAction, executeCopyPropertyAction, executeMergePropertiesAction, executeSplitPropertyAction, executeFormatPropertyAction } from '../../services/workflow/workflowExecutor/actions/propertyActions'
import { executeCreateRelationshipAction, executeDeferRelationshipAction, executeUpdateRelationshipAction, executeDeleteRelationshipAction, executeReverseRelationshipAction } from '../../services/workflow/workflowExecutor/actions/relationshipActions'
import { executeCreateTextNodeAction, executeCreateTokenNodesAction } from '../../services/workflow/workflowExecutor/actions/advancedNodeActions'
import { executeCreateReferenceAction, executeCreateReferenceChainAction } from '../../services/workflow/workflowExecutor/actions/referenceActions'
import { executeExtractAndNormalizeAttributesAction, executeCreateNodeCompleteAction, executeMergeChildrenTextAction, executeExtractAndComputePropertyAction, executeCreateNodeWithLookupAction } from '../../services/workflow/workflowExecutor/actions/complexActions'
import { executeUpdateNodeAction, executeDeleteNodeAction, executeCloneNodeAction, executeMergeNodesAction } from '../../services/workflow/workflowExecutor/actions/nodeManipulationActions'
import { executeSkipAction } from '../../services/workflow/workflowExecutor/actions/specialActions'

// Helper to create common action definitions
const registerAction = (def: ActionDefinition) => workflowRegistry.registerAction(def)

// Register categories
workflowRegistry.registerActionCategory({ id: 'node_actions', label: 'Node Actions', icon: Boxes, color: 'text-blue-600', bgColor: 'bg-blue-100', order: 1 })
workflowRegistry.registerActionCategory({ id: 'property_actions', label: 'Property Actions', icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-100', order: 2 })
workflowRegistry.registerActionCategory({ id: 'relationship_actions', label: 'Relationship Actions', icon: Link2, color: 'text-indigo-600', bgColor: 'bg-indigo-100', order: 3 })
workflowRegistry.registerActionCategory({ id: 'workflow_&_control', label: 'Workflow & Control', icon: Boxes, color: 'text-orange-600', bgColor: 'bg-orange-100', order: 4 })
workflowRegistry.registerActionCategory({ id: 'advanced_actions', label: 'Advanced Actions', icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-100', order: 5 })

// 1. Set Property
registerAction({
  id: 'action:set-property',
  metadata: {
    label: 'Set Property',
    description: 'Set node property value',
    icon: Edit,
    category: 'property_actions',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    order: 1,
    hidden: false
  },
  executor: executeSetPropertyAction,
  configSchema: [
    { name: 'propertyKey', label: 'Property Key', type: 'text', placeholder: 'Property name' },
    { name: 'propertyValue', label: 'Property Value', type: 'text', placeholder: 'Property value' },
    { 
      name: 'valueSource', 
      label: 'Value Source', 
      type: 'select', 
      options: [
        { label: 'Static', value: 'static' },
        { label: 'Attribute', value: 'attribute' }
      ],
      defaultValue: 'static'
    }
  ],
  defaultConfig: { propertyKey: '', propertyValue: '', valueSource: 'static' }
})

// 2. Create Relationship
registerAction({
  id: 'action:create-relationship',
  metadata: {
    label: 'Create Relationship',
    description: 'Create relationship between nodes',
    icon: Link2,
    category: 'relationship_actions',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    order: 1,
    hidden: false
  },
  executor: executeCreateRelationshipAction,
  configSchema: [
    { name: 'relationshipType', label: 'Relationship Type', type: 'text', placeholder: 'e.g., contains, refersTo' },
    { 
      name: 'fromNode', 
      label: 'Source Node', 
      type: 'select', 
      options: [
        { label: 'Current Node', value: 'current' },
        { label: 'Parent Node', value: 'parent' }
      ],
      defaultValue: 'current'
    },
    { 
      name: 'toNode', 
      label: 'Target Node', 
      type: 'select', 
      options: [
        { label: 'Current Node', value: 'current' },
        { label: 'Parent Node', value: 'parent' }
      ],
      defaultValue: 'parent'
    },
    { name: 'properties', label: 'Properties', type: 'properties' }
  ],
  defaultConfig: { relationshipType: 'relatedTo', fromNode: 'current', toNode: 'parent', properties: [] }
})

// 3. Action Group
registerAction({
  id: 'action:group',
  metadata: {
    label: 'Action Group',
    description: 'Group multiple actions together',
    icon: Boxes,
    category: 'workflow_&_control',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    order: 1,
    hidden: false
  },
  // No executor for group (handled by walker)
  configSchema: [], 
  defaultConfig: {}
})

// 4. Skip Element
registerAction({
  id: 'action:skip',
  metadata: {
    label: 'Skip Element',
    description: 'Skip processing this element',
    icon: SkipForward,
    category: 'workflow_&_control',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    order: 2,
    hidden: false
  },
  executor: executeSkipAction,
  configSchema: [
    { name: 'skipMainNode', label: 'Skip Main Node', type: 'boolean', defaultValue: true },
    { name: 'skipChildren', label: 'Skip Children', type: 'boolean', defaultValue: true },
    { 
      name: 'skipChildrenMode', 
      label: 'Skip Children Mode', 
      type: 'select', 
      options: [
        { label: 'All', value: 'all' },
        { label: 'Selected Tags', value: 'selected' }
      ],
      dependsOn: 'skipChildren',
      defaultValue: 'all'
    }
  ],
  defaultConfig: { skipMainNode: true, skipChildren: true, skipChildrenMode: 'all', skipChildrenTags: [] }
})

// 9. Extract and Normalize Attributes (Bulk Mapper)
registerAction({
  id: 'action:extract-and-normalize-attributes',
  metadata: {
    label: 'Bulk Attribute Mapper',
    description: 'Extract and normalize element attributes',
    icon: Settings,
    category: 'property_actions',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    order: 2,
    hidden: false
  },
  executor: executeExtractAndNormalizeAttributesAction,
  configSchema: [
    { name: 'removeOriginal', label: 'Remove Original Attributes', type: 'boolean', defaultValue: false },
    { name: 'attributeMappings', label: 'Attribute Mappings', type: 'mappings' }
  ],
  defaultConfig: { removeOriginal: false, attributeMappings: [] }
})

// 10. Update Node
registerAction({
  id: 'action:update-node',
  metadata: {
    label: 'Update Node',
    description: 'Update existing node properties',
    icon: Edit,
    category: 'node_actions',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    order: 2,
    hidden: false
  },
  executor: executeUpdateNodeAction,
  configSchema: [
    { 
      name: 'targetMode', 
      label: 'Target Mode', 
      type: 'select',
      group: 'Target Settings',
      options: [
        { label: 'Current Context Node', value: 'current' },
        { label: 'Lookup Target by Criteria', value: 'lookup' }
      ],
      defaultValue: 'current'
    },
    { 
      name: 'targetLabel', 
      label: 'Lookup Target Label', 
      type: 'text', 
      group: 'Lookup Criteria',
      dependsOn: 'targetMode', 
      dependsOnValue: 'lookup',
      placeholder: 'e.g. Person, Place'
    },
    { 
      name: 'lookupProperty', 
      label: 'Lookup Property Key', 
      type: 'text', 
      group: 'Lookup Criteria',
      dependsOn: 'targetMode', 
      dependsOnValue: 'lookup',
      placeholder: 'e.g. id, uri'
    },
    { 
      name: 'lookupValue', 
      label: 'Lookup Property Value', 
      type: 'template', 
      group: 'Lookup Criteria',
      dependsOn: 'targetMode', 
      dependsOnValue: 'lookup',
      placeholder: 'e.g. @id or {{ $json.id }}' 
    },
    { name: 'properties', label: 'Properties to Update', type: 'properties', group: 'Update Payload' }
  ],
  defaultConfig: { targetMode: 'current', properties: [], targetLabel: '', lookupProperty: '', lookupValue: '' }
}),

// 11. Delete Node
registerAction({
  id: 'action:delete-node',
  metadata: {
    label: 'Delete Node',
    description: 'Delete nodes conditionally',
    icon: Trash2,
    category: 'node_actions',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    order: 2,
    hidden: false
  },
  executor: executeDeleteNodeAction,
  configSchema: [
    { 
      name: 'targetMode', 
      label: 'Target Mode', 
      type: 'select',
      options: [
        { label: 'Current Context Node', value: 'current' },
        { label: 'Lookup Target by Criteria', value: 'lookup' }
      ],
      defaultValue: 'current'
    },
    { 
      name: 'targetLabel', 
      label: 'Lookup Target Label', 
      type: 'text', 
      dependsOn: 'targetMode', 
      dependsOnValue: 'lookup',
      placeholder: 'e.g. Word, Element'
    },
    { 
      name: 'lookupProperty', 
      label: 'Lookup Property Key', 
      type: 'text', 
      dependsOn: 'targetMode', 
      dependsOnValue: 'lookup',
      placeholder: 'e.g. id, uri'
    },
    { 
      name: 'lookupValue', 
      label: 'Lookup Property Value', 
      type: 'template', 
      dependsOn: 'targetMode', 
      dependsOnValue: 'lookup',
      placeholder: 'e.g. @id or {{ $json.id }}' 
    },
    { name: 'condition', label: 'Delete Condition (Optional)', type: 'text', placeholder: 'e.g. {{ $json.type == "test" }}' }
  ],
  defaultConfig: { targetMode: 'current', condition: '', targetLabel: '', lookupProperty: '', lookupValue: '' }
})

// 12. Create Reference Chain
registerAction({
  id: 'action:create-reference-chain',
  metadata: {
    label: 'Create Reference Chain',
    description: 'Create chain of reference relationships',
    icon: Link2,
    category: 'relationship_actions',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  executor: executeCreateReferenceChainAction,
  configSchema: [
    { name: 'relationshipType', label: 'Relationship Type', type: 'text', defaultValue: 'refersTo' },
    { name: 'referenceProperty', label: 'Reference Property', type: 'text', defaultValue: 'ref' },
    { name: 'targetLabel', label: 'Target Node Label', type: 'text' }
  ],
  defaultConfig: { relationshipType: 'refersTo', referenceProperty: 'ref', targetLabel: '' }
})

// 13. Format Property
registerAction({
  id: 'action:format-property',
  metadata: {
    label: 'Format Property',
    description: 'Format property value (date, number, etc.)',
    icon: Wand2,
    category: 'property_actions',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50'
  },
  executor: executeFormatPropertyAction,
  configSchema: [
    { 
      name: 'targetMode', 
      label: 'Target Node Mode', 
      type: 'select',
      options: [
        { label: 'Current Context Node', value: 'current' },
        { label: 'Lookup Target by Criteria', value: 'lookup' }
      ],
      defaultValue: 'current'
    },
    { name: 'targetLabel', label: 'Lookup Target Label', type: 'text', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'lookupProperty', label: 'Lookup Property Key', type: 'text', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'lookupValue', label: 'Lookup Property Value', type: 'template', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'propertyKey', label: 'Property to Format', type: 'text' },
    { 
      name: 'formatType', 
      label: 'Format Type', 
      type: 'select',
      options: [
        { label: 'Date', value: 'date' },
        { label: 'Number', value: 'number' },
        { label: 'String', value: 'string' }
      ],
      defaultValue: 'string'
    },
    { name: 'formatOption', label: 'Format Pattern', type: 'text', placeholder: 'e.g. YYYY-MM-DD' }
  ],
  defaultConfig: { targetMode: 'current', propertyKey: '', formatType: 'string', formatOption: '' }
}),

// 14. Create Token Nodes
registerAction({
  id: 'action:create-token-nodes',
  metadata: {
    label: 'Create Token Nodes',
    description: 'Create nodes from text tokens',
    icon: Type,
    category: 'node_actions',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  executor: executeCreateTokenNodesAction,
  configSchema: [
    { name: 'parentNodeLabel', label: 'Parent Node Label', type: 'text', placeholder: 'e.g., Word, W' },
    { name: 'tokenNodeLabel', label: 'Token Node Label', type: 'text', placeholder: 'e.g., Character' },
    { name: 'relationshipType', label: 'Relationship Type', type: 'text', defaultValue: 'contains' },
    { 
      name: 'textSource', 
      label: 'Text Source', 
      type: 'select',
      options: [
        { label: 'Text Content', value: 'textContent' },
        { label: 'Attribute', value: 'attribute' }
      ],
      defaultValue: 'textContent'
    },
    { name: 'attributeName', label: 'Attribute Name', type: 'text', dependsOn: 'textSource', dependsOnValue: 'attribute' },
    { name: 'transforms', label: 'Transforms (Before Tokenization)', type: 'transforms' },
    { name: 'splitBy', label: 'Split By', type: 'text', placeholder: 'Leave empty for character-level' },
    { name: 'filterPattern', label: 'Filter Pattern (Regex)', type: 'text' },
    { 
      name: 'structure', 
      label: 'Structure', 
      type: 'select',
      options: [
        { label: 'Flat (All connect to Parent)', value: 'flat' },
        { label: 'Chained (Linked List)', value: 'chained' }
      ],
      defaultValue: 'flat'
    },
    { name: 'nextRelationshipType', label: 'Next Token Relationship', type: 'text', defaultValue: 'next', dependsOn: 'structure', dependsOnValue: 'chained' }
  ],
  defaultConfig: { parentNodeLabel: '', tokenNodeLabel: '', relationshipType: 'contains', textSource: 'textContent', transforms: [], splitBy: '', filterPattern: '', structure: 'flat', nextRelationshipType: 'next' }
})

// 15. Merge Children Text
registerAction({
  id: 'action:merge-children-text',
  metadata: {
    label: 'Merge Children Text',
    description: 'Merge text from child elements',
    icon: Merge,
    category: 'workflow_&_control',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50'
  },
  executor: executeMergeChildrenTextAction,
  configSchema: [
    { name: 'propertyKey', label: 'Target Property Key', type: 'text', defaultValue: 'text' },
    { name: 'separator', label: 'Separator', type: 'text', defaultValue: '' },
    { name: 'recursive', label: 'Recursive', type: 'boolean', defaultValue: true }
  ],
  defaultConfig: { propertyKey: 'text', separator: '', recursive: true }
})

// 6. Create Text Node
registerAction({
  id: 'action:create-text-node',
  metadata: {
    label: 'Create Text Node',
    description: 'Create node with text content',
    icon: FileText,
    category: 'node_actions',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  executor: executeCreateTextNodeAction,
  configSchema: [
    { 
      name: 'nodeLabel', 
      label: 'Node Label', 
      type: 'text',
      placeholder: 'e.g. Content, Text' 
    },
    { name: 'labelTransforms', label: 'Label Transformations', type: 'transforms' },
    { 
      name: 'textSource', 
      label: 'Text Source', 
      type: 'select',
      options: [
        { label: 'Text Content', value: 'textContent' },
        { label: 'Attribute', value: 'attribute' }
      ],
      defaultValue: 'textContent'
    },
    { name: 'attributeName', label: 'Attribute Name', type: 'text', dependsOn: 'textSource', dependsOnValue: 'attribute' },
    { name: 'propertyKey', label: 'Property Key', type: 'text', defaultValue: 'text' }
  ],
  defaultConfig: { nodeLabel: '', textSource: 'textContent', attributeName: '', propertyKey: 'text', parentRelationship: 'contains', inheritProperties: true }
})

// 7. Copy Property
registerAction({
  id: 'action:copy-property',
  metadata: {
    label: 'Copy Property',
    description: 'Copy property between nodes',
    icon: Copy,
    category: 'property_actions',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50'
  },
  executor: executeCopyPropertyAction,
  configSchema: [
    { 
      name: 'sourceAlias', 
      label: 'Node Mode', 
      type: 'select',
      group: 'Source Definition',
      options: [
        { label: 'Current Context Node', value: 'current' },
        { label: 'Parent Node', value: 'parent' },
        { label: 'Lookup Source by Criteria', value: 'lookup' }
      ],
      defaultValue: 'current'
    },
    { name: 'sourceLabel', label: 'Lookup Label', type: 'text', group: 'Source Definition', dependsOn: 'sourceAlias', dependsOnValue: 'lookup' },
    { name: 'sourceLookupProperty', label: 'Lookup Property Key', type: 'text', group: 'Source Definition', dependsOn: 'sourceAlias', dependsOnValue: 'lookup' },
    { name: 'sourceLookupValue', label: 'Lookup Property Value', type: 'template', group: 'Source Definition', dependsOn: 'sourceAlias', dependsOnValue: 'lookup' },
    { name: 'sourceProperty', label: 'Property Key', type: 'text', group: 'Source Definition' },
    
    { 
      name: 'targetMode', 
      label: 'Node Mode', 
      type: 'select',
      group: 'Target Definition',
      options: [
        { label: 'Current Context Node', value: 'current' },
        { label: 'Parent Node', value: 'parent' },
        { label: 'Lookup Target by Criteria', value: 'lookup' }
      ],
      defaultValue: 'current'
    },
    { name: 'targetLabel', label: 'Lookup Label', type: 'text', group: 'Target Definition', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'lookupProperty', label: 'Lookup Property Key', type: 'text', group: 'Target Definition', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'lookupValue', label: 'Lookup Property Value', type: 'template', group: 'Target Definition', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'targetProperty', label: 'Property Key', type: 'text', group: 'Target Definition' }
  ],
  defaultConfig: { sourceAlias: 'current', targetMode: 'current', sourceProperty: '', targetProperty: '' }
}),

// 8. Update Relationship
registerAction({
  id: 'action:update-relationship',
  metadata: {
    label: 'Update Relationship',
    description: 'Update existing relationship properties',
    icon: Edit,
    category: 'relationship_actions',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  executor: executeUpdateRelationshipAction,
  configSchema: [
    { name: 'sep1', label: 'Relationship Filter', type: 'separator' },
    { name: 'relationshipType', label: 'Target Relationship Type', type: 'text' },
    { 
      name: 'fromAlias', 
      label: 'From Node (Source)', 
      type: 'select',
      options: [
        { label: 'Current Node', value: 'current' },
        { label: 'Parent Node', value: 'parent' },
        { label: 'Lookup Node', value: 'lookup' }
      ],
      defaultValue: 'current'
    },
    { name: 'fromLabel', label: 'From Lookup Label', type: 'text', dependsOn: 'fromAlias', dependsOnValue: 'lookup' },
    { name: 'fromProperty', label: 'From Lookup Prop Key', type: 'text', dependsOn: 'fromAlias', dependsOnValue: 'lookup' },
    { name: 'fromValue', label: 'From Lookup Prop Val', type: 'template', dependsOn: 'fromAlias', dependsOnValue: 'lookup' },
    
    { 
      name: 'toAlias', 
      label: 'To Node (Target)', 
      type: 'select',
      options: [
        { label: 'Current Node', value: 'current' },
        { label: 'Parent Node', value: 'parent' },
        { label: 'Lookup Node', value: 'lookup' }
      ],
      defaultValue: 'parent'
    },
    { name: 'toLabel', label: 'To Lookup Label', type: 'text', dependsOn: 'toAlias', dependsOnValue: 'lookup' },
    { name: 'toProperty', label: 'To Lookup Prop Key', type: 'text', dependsOn: 'toAlias', dependsOnValue: 'lookup' },
    { name: 'toValue', label: 'To Lookup Prop Val', type: 'template', dependsOn: 'toAlias', dependsOnValue: 'lookup' },
    
    { name: 'sep2', label: 'Updates', type: 'separator' },
    { name: 'newRelationshipType', label: 'New Relationship Type (Optional)', type: 'text' },
    { name: 'properties', label: 'Properties to Update', type: 'properties' }
  ],
  defaultConfig: { fromAlias: 'current', toAlias: 'parent', relationshipType: '', newRelationshipType: '', properties: [] }
}),

// 9. Extract & Compute Property
registerAction({
  id: 'action:extract-and-compute-property',
  metadata: {
    label: 'Extract & Compute Property',
    description: 'Extract and compute property value',
    icon: Calculator,
    category: 'property_actions',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  executor: executeExtractAndComputePropertyAction,
  configSchema: [
    { 
      name: 'targetMode', 
      label: 'Target Node Mode', 
      type: 'select',
      options: [
        { label: 'Current Context Node', value: 'current' },
        { label: 'Lookup Target by Criteria', value: 'lookup' }
      ],
      defaultValue: 'current'
    },
    { name: 'targetLabel', label: 'Lookup Target Label', type: 'text', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'lookupProperty', label: 'Lookup Property Key', type: 'text', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'lookupValue', label: 'Lookup Property Value', type: 'template', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'propertyKey', label: 'Target Property Key', type: 'text' },
    { name: 'expression', label: 'Compute Expression', type: 'text', placeholder: 'e.g. {{ $json.val * 2 }}' }
  ],
  defaultConfig: { targetMode: 'current', propertyKey: '', expression: '' }
}),

// 10. Create Node with Lookup
registerAction({
  id: 'action:create-node-with-lookup',
  metadata: {
    label: 'Create Node with Lookup',
    description: 'Create node and link by property lookup',
    icon: Search,
    category: 'node_actions',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  executor: executeCreateNodeWithLookupAction,
  configSchema: [
    { name: 'nodeLabel', label: 'Node Label', type: 'text' },
    { name: 'lookupProperty', label: 'Lookup Property', type: 'text' },
    { name: 'lookupValue', label: 'Lookup Value', type: 'text' },
    { name: 'relationshipType', label: 'Relationship Type', type: 'text', defaultValue: 'linkedTo' }
  ],
  defaultConfig: { nodeLabel: '', lookupProperty: '', lookupValue: '', relationshipType: 'linkedTo' }
})

// 11. Merge Properties
registerAction({
  id: 'action:merge-properties',
  metadata: {
    label: 'Merge Properties',
    description: 'Merge properties from multiple sources',
    icon: Merge,
    category: 'property_actions',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  executor: executeMergePropertiesAction,
  configSchema: [
    { 
      name: 'targetMode', 
      label: 'Target Node Mode', 
      type: 'select',
      options: [
        { label: 'Current Context Node', value: 'current' },
        { label: 'Lookup Target by Criteria', value: 'lookup' }
      ],
      defaultValue: 'current'
    },
    { name: 'targetLabel', label: 'Lookup Target Label', type: 'text', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'lookupProperty', label: 'Lookup Property Key', type: 'text', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'lookupValue', label: 'Lookup Property Value', type: 'template', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'targetProperty', label: 'Target Property Key', type: 'text' },
    { name: 'sourceProperties', label: 'Source Properties (Comma separated)', type: 'text' },
    { name: 'separator', label: 'Separator', type: 'text', defaultValue: ' ' }
  ],
  defaultConfig: { targetMode: 'current', targetProperty: '', sourceProperties: '', separator: ' ' }
}),

// 12. Split Property
registerAction({
  id: 'action:split-property',
  metadata: {
    label: 'Split Property',
    description: 'Split property into multiple properties',
    icon: Split,
    category: 'property_actions',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50'
  },
  executor: executeSplitPropertyAction,
  configSchema: [
    { 
      name: 'targetMode', 
      label: 'Target Node Mode', 
      type: 'select',
      options: [
        { label: 'Current Context Node', value: 'current' },
        { label: 'Lookup Target by Criteria', value: 'lookup' }
      ],
      defaultValue: 'current'
    },
    { name: 'targetLabel', label: 'Lookup Target Label', type: 'text', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'lookupProperty', label: 'Lookup Property Key', type: 'text', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'lookupValue', label: 'Lookup Property Value', type: 'template', dependsOn: 'targetMode', dependsOnValue: 'lookup' },
    { name: 'sourceProperty', label: 'Source Property Key', type: 'text' },
    { name: 'separator', label: 'Separator/Pattern', type: 'text', defaultValue: ',' },
    { name: 'targetProperties', label: 'Target Properties (Comma separated)', type: 'text' }
  ],
  defaultConfig: { targetMode: 'current', sourceProperty: '', separator: ',', targetProperties: '' }
}),

// 13. Clone Node
registerAction({
  id: 'action:clone-node',
  metadata: {
    label: 'Clone Node',
    description: 'Clone node with transformations and modifications',
    icon: Copy,
    category: 'node_actions',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  executor: executeCloneNodeAction,
  configSchema: [
    { 
      name: 'targetMode', 
      label: 'Source Node Mode', 
      type: 'select',
      options: [
        { label: 'Current Context Node', value: 'current' },
        { label: 'Lookup Source by Criteria', value: 'lookup' }
      ],
      defaultValue: 'current'
    },
    { 
      name: 'targetLabel', 
      label: 'Source Node Label', 
      type: 'text', 
      dependsOn: 'targetMode', 
      dependsOnValue: 'lookup',
      placeholder: 'e.g. MasterData'
    },
    { 
      name: 'lookupProperty', 
      label: 'Source Property Key', 
      type: 'text', 
      dependsOn: 'targetMode', 
      dependsOnValue: 'lookup',
      placeholder: 'e.g. id, uri'
    },
    { 
      name: 'lookupValue', 
      label: 'Source Property Value', 
      type: 'template', 
      dependsOn: 'targetMode', 
      dependsOnValue: 'lookup',
      placeholder: 'e.g. {{ $json.templateId }}' 
    },
    { name: 'newLabel', label: 'Override New Label (Optional)', type: 'template' },
    { name: 'modifications', label: 'Properties to Override/Add', type: 'properties' }
  ],
  defaultConfig: { targetMode: 'current', targetLabel: '', lookupProperty: '', lookupValue: '', newLabel: '', modifications: [] }
}),

// 14. Merge Nodes
registerAction({
  id: 'action:merge-nodes',
  metadata: {
    label: 'Merge Nodes',
    description: 'Merge duplicate or related nodes',
    icon: Merge,
    category: 'node_actions',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  executor: executeMergeNodesAction,
  configSchema: [
    { name: 'sep1', label: 'Primary Node (The Merger)', type: 'separator' },
    { 
      name: 'targetMode', 
      label: 'Merge INTO (Target)', 
      type: 'select',
      options: [
        { label: 'Current Context Node', value: 'current' },
        { label: 'Lookup Target by Criteria', value: 'lookup' },
        { label: 'Parent Node', value: 'parent' }
      ],
      defaultValue: 'lookup'
    },
    { 
      name: 'targetLabel', 
      label: 'Lookup Target Label', 
      type: 'text', 
      dependsOn: 'targetMode', 
      dependsOnValue: 'lookup',
      placeholder: 'e.g. MasterEntity'
    },
    { 
      name: 'lookupProperty', 
      label: 'Lookup Property Key', 
      type: 'text', 
      dependsOn: 'targetMode', 
      dependsOnValue: 'lookup',
      placeholder: 'e.g. id, uri'
    },
    { 
      name: 'lookupValue', 
      label: 'Lookup Property Value', 
      type: 'template', 
      dependsOn: 'targetMode', 
      dependsOnValue: 'lookup',
      placeholder: 'e.g. {{ $json.id }}' 
    },
    { name: 'sep2', label: 'Secondary Nodes (The Merged)', type: 'separator' },
    { 
      name: 'sourceAlias', 
      label: 'Merge FROM (Source)', 
      type: 'select',
      options: [
        { label: 'Current Context Node', value: 'current' },
        { label: 'Parent Node', value: 'parent' },
        { label: 'Lookup Source by Criteria', value: 'lookup' }
      ],
      defaultValue: 'current'
    },
    { 
      name: 'sourceLabel', 
      label: 'Lookup Source Label', 
      type: 'text', 
      dependsOn: 'sourceAlias', 
      dependsOnValue: 'lookup'
    },
    { 
      name: 'sourceLookupProperty', 
      label: 'Lookup Source Property Key', 
      type: 'text', 
      dependsOn: 'sourceAlias', 
      dependsOnValue: 'lookup'
    },
    { 
      name: 'sourceLookupValue', 
      label: 'Lookup Source Property Value', 
      type: 'template', 
      dependsOn: 'sourceAlias', 
      dependsOnValue: 'lookup',
      placeholder: 'e.g. {{ $json.duplicate_id }}'
    },
    { name: 'sep3', label: 'Merge Strategy', type: 'separator' },
    { 
      name: 'mergeStrategy', 
      label: 'Conflict Strategy', 
      type: 'select',
      options: [
        { label: 'Union (Combine all data)', value: 'union' },
        { label: 'Target Wins (Keep Primary data)', value: 'preferTarget' },
        { label: 'Source Wins (Prefer New data)', value: 'preferSource' }
      ],
      defaultValue: 'preferSource'
    }
  ],
  defaultConfig: { targetMode: 'lookup', sourceAlias: 'current', mergeStrategy: 'preferSource' }
})

// 21. Create Node Complete
registerAction({
  id: 'action:create-node-complete',
  metadata: {
    label: 'Create Node',
    description: 'Create a fully specified node with relationships',
    icon: Boxes,
    category: 'node_actions',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    order: 1,
    hidden: false
  },
  executor: executeCreateNodeCompleteAction,
  configSchema: [
    { 
      name: 'nodeLabel', 
      label: 'Node Label', 
      type: 'template',
      group: 'Node Identity',
      placeholder: 'e.g. Person, Place or {{ $json.type }}'
    },
    { name: 'labelTransforms', label: 'Label Transformations', type: 'transforms', group: 'Node Identity' },
    { 
      name: 'inheritProperties', 
      label: 'Inherit all XML Attributes', 
      type: 'boolean', 
      group: 'Data Persistence',
      defaultValue: true, 
      description: 'Automatically add all XML attributes of this element to the graph node properties' 
    },
    { name: 'properties', label: 'Properties Mapping', type: 'mappings', group: 'Data Persistence' },
    
    { 
      name: 'relationshipType', 
      label: 'Relationship Type', 
      type: 'text', 
      group: 'Graph Relationship',
      defaultValue: 'contains',
      placeholder: 'e.g. contains, refersTo, hasAttribute' 
    },
    { 
      name: 'relationshipMode', 
      label: 'Relationship Mode', 
      type: 'select',
      group: 'Graph Relationship',
      options: [
        { label: 'Connect to Parent (Direct)', value: 'connected' },
        { label: 'Lookup Target (Deferred)', value: 'deferred' },
        { label: 'No Relationship (Standalone)', value: 'standalone' }
      ],
      defaultValue: 'connected'
    },
    { 
      name: 'targetNodeLabel', 
      label: 'Target Node Label', 
      type: 'text', 
      group: 'Graph Relationship',
      dependsOn: 'relationshipMode', 
      dependsOnValue: 'deferred',
      placeholder: 'Label of the node to find' 
    },
    { 
      name: 'lookupProperty', 
      label: 'Lookup Property Key', 
      type: 'text', 
      group: 'Graph Relationship',
      dependsOn: 'relationshipMode', 
      dependsOnValue: 'deferred',
      placeholder: 'e.g. id, uri, name' 
    },
    { 
      name: 'lookupValue', 
      label: 'Lookup Property Value', 
      type: 'template', 
      group: 'Graph Relationship',
      dependsOn: 'relationshipMode', 
      dependsOnValue: 'deferred',
      placeholder: 'e.g. @id or {{ $json.target }}' 
    },
    { 
      name: 'relationshipDirection', 
      label: 'Relationship Direction', 
      type: 'select',
      group: 'Graph Relationship',
      options: [
        { label: 'Out: Created → Target (Parent/Lookup)', value: 'outgoing' },
        { label: 'In: Target (Parent/Lookup) → Created', value: 'incoming' }
      ],
      defaultValue: 'outgoing'
    }
  ],
  defaultConfig: { 
    nodeLabel: '', 
    properties: [], 
    inheritProperties: true, 
    relationshipType: 'contains', 
    relationshipMode: 'connected',
    relationshipDirection: 'outgoing',
    targetNodeLabel: '',
    lookupProperty: '',
    lookupValue: ''
  }
})

// 22. Create Reference
registerAction({
  id: 'action:create-reference',
  metadata: {
    label: 'Create Reference',
    description: 'Create references from the current node to other nodes via attributes',
    icon: Link2,
    category: 'node_actions',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    order: 2,
    hidden: false
  },
  executor: executeCreateReferenceAction,
  configSchema: [
    { name: 'annotationPath', label: 'Reference Attribute', type: 'text', description: 'Attribute containing target IDs (e.g. target, ref, corresp)', placeholder: 'target' },
    { 
      name: 'nodeLabel', 
      label: 'Override Parent Node Label', 
      type: 'template',
      placeholder: 'e.g. Reference or {{ $json.category }}',
      description: 'Optional: Override the label of the node being created'
    },
    { name: 'labelTransforms', label: 'Label Transformations', type: 'transforms' },
    { name: 'relationshipType', label: 'Relationship Type', type: 'text', defaultValue: 'annotates', placeholder: 'e.g., annotates, refersTo' },
    { name: 'properties', label: 'Additional Properties', type: 'mappings' }
  ],
  defaultConfig: { annotationPath: '', nodeLabel: '', relationshipType: 'annotates', properties: [] }
})

// 23. Delete Relationship
registerAction({
  id: 'action:delete-relationship',
  metadata: {
    label: 'Delete Relationship',
    description: 'Remove existing relationships conditionally',
    icon: Trash2,
    category: 'relationship_actions',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  executor: executeDeleteRelationshipAction,
  configSchema: [
    { name: 'sep1', label: 'Source/Target Filter', type: 'separator' },
    { name: 'relationshipType', label: 'Relationship Type', type: 'text' },
    { 
      name: 'fromAlias', 
      label: 'From Node (Source)', 
      type: 'select',
      options: [
        { label: 'Current Node', value: 'current' },
        { label: 'Parent Node', value: 'parent' },
        { label: 'Lookup Node', value: 'lookup' }
      ],
      defaultValue: 'current'
    },
    { name: 'fromLabel', label: 'From Lookup Label', type: 'text', dependsOn: 'fromAlias', dependsOnValue: 'lookup' },
    { name: 'fromProperty', label: 'From Lookup Prop Key', type: 'text', dependsOn: 'fromAlias', dependsOnValue: 'lookup' },
    { name: 'fromValue', label: 'From Lookup Prop Val', type: 'template', dependsOn: 'fromAlias', dependsOnValue: 'lookup' },
    
    { 
      name: 'toAlias', 
      label: 'To Node (Target)', 
      type: 'select',
      options: [
        { label: 'Current Node', value: 'current' },
        { label: 'Parent Node', value: 'parent' },
        { label: 'Lookup Node', value: 'lookup' }
      ],
      defaultValue: 'parent'
    },
    { name: 'toLabel', label: 'To Lookup Label', type: 'text', dependsOn: 'toAlias', dependsOnValue: 'lookup' },
    { name: 'toProperty', label: 'To Lookup Prop Key', type: 'text', dependsOn: 'toAlias', dependsOnValue: 'lookup' },
    { name: 'toValue', label: 'To Lookup Prop Val', type: 'template', dependsOn: 'toAlias', dependsOnValue: 'lookup' },
    
    { name: 'sep2', label: 'Properties Filter', type: 'separator' },
    { name: 'propertyMatch', label: 'Matching Properties (Optional)', type: 'properties' }
  ],
  defaultConfig: { fromAlias: 'current', toAlias: 'parent', relationshipType: '', propertyMatch: [] }
}),

// 24. Reverse Relationship
registerAction({
  id: 'action:reverse-relationship',
  metadata: {
    label: 'Reverse Relationship',
    description: 'Reverse the direction of specified relationships',
    icon: RotateCcw,
    category: 'relationship_actions',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  executor: executeReverseRelationshipAction,
  configSchema: [
    { name: 'sep1', label: 'Source/Target Filter', type: 'separator' },
    { name: 'relationshipType', label: 'Relationship Type', type: 'text' },
    { 
      name: 'fromAlias', 
      label: 'From Node', 
      type: 'select',
      options: [
        { label: 'Current Node', value: 'current' },
        { label: 'Parent Node', value: 'parent' },
        { label: 'Lookup Node', value: 'lookup' }
      ],
      defaultValue: 'current'
    },
    { name: 'fromLabel', label: 'From Lookup Label', type: 'text', dependsOn: 'fromAlias', dependsOnValue: 'lookup' },
    { name: 'fromProperty', label: 'From Lookup Prop Key', type: 'text', dependsOn: 'fromAlias', dependsOnValue: 'lookup' },
    { name: 'fromValue', label: 'From Lookup Prop Val', type: 'template', dependsOn: 'fromAlias', dependsOnValue: 'lookup' },
    
    { 
      name: 'toAlias', 
      label: 'To Node', 
      type: 'select',
      options: [
        { label: 'Current Node', value: 'current' },
        { label: 'Parent Node', value: 'parent' },
        { label: 'Lookup Node', value: 'lookup' }
      ],
      defaultValue: 'parent'
    },
    { name: 'toLabel', label: 'To Lookup Label', type: 'text', dependsOn: 'toAlias', dependsOnValue: 'lookup' },
    { name: 'toProperty', label: 'To Lookup Prop Key', type: 'text', dependsOn: 'toAlias', dependsOnValue: 'lookup' },
    { name: 'toValue', label: 'To Lookup Prop Val', type: 'template', dependsOn: 'toAlias', dependsOnValue: 'lookup' }
  ],
  defaultConfig: { fromAlias: 'current', toAlias: 'parent', relationshipType: '' }
})

// 26. Defer Relationship
registerAction({
  id: 'action:defer-relationship',
  metadata: {
    label: 'Defer Relationship',
    description: 'Create relationship to an element processed later',
    icon: Link2,
    category: 'relationship_actions',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  executor: executeDeferRelationshipAction,
  configSchema: [
    { name: 'relationshipType', label: 'Relationship Type', type: 'text' },
    { name: 'targetTag', label: 'Target Tag', type: 'text' },
    { name: 'targetAttributeName', label: 'Target Attribute Name', type: 'text' },
    { name: 'targetAttributeValue', label: 'Target Attribute Value', type: 'text' },
    { 
      name: 'searchScope', 
      label: 'Search Scope', 
      type: 'select',
      options: [
        { label: 'Children', value: 'children' },
        { label: 'Descendants', value: 'descendants' },
        { label: 'Global', value: 'global' }
      ],
      defaultValue: 'children'
    }
  ],
  defaultConfig: { relationshipType: 'relatedTo', targetTag: '', targetAttributeName: '', targetAttributeValue: '', searchScope: 'children' }
})
