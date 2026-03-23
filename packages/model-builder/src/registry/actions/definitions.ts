import { workflowRegistry } from '../workflowRegistry'
import { ActionDefinition } from '../types'
import { 
  Edit, 
  Link2, 
  Boxes, 
  FileText, 
  CheckCircle2, 
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

// Helper to create common action definitions
const registerAction = (def: ActionDefinition) => workflowRegistry.registerAction(def)

// 1. Set Property
registerAction({
  id: 'action:set-property',
  metadata: {
    label: 'Set Property',
    description: 'Set node property value',
    icon: Edit,
    category: 'Property Actions',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50'
  },
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
    category: 'Relationship Actions',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
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
    category: 'Workflow & Control',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  configSchema: [], // Groups don't have separate config fields besides label/enabled (handled by sidebar)
  defaultConfig: {}
})

// 4. Skip Element
registerAction({
  id: 'action:skip',
  metadata: {
    label: 'Skip Element',
    description: 'Skip processing this element',
    icon: SkipForward,
    category: 'Workflow & Control',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
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
    category: 'Property Actions',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  },
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
    category: 'Node Actions',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  configSchema: [
    { name: 'nodeId', label: 'Node ID (Optional)', type: 'text', description: 'Defaults to current node' },
    { name: 'properties', label: 'Properties to Update', type: 'properties' }
  ],
  defaultConfig: { nodeId: '', properties: [] }
})

// 11. Delete Node
registerAction({
  id: 'action:delete-node',
  metadata: {
    label: 'Delete Node',
    description: 'Delete nodes conditionally',
    icon: Trash2,
    category: 'Node Actions',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  configSchema: [
    { name: 'nodeId', label: 'Node ID (Optional)', type: 'text' },
    { name: 'condition', label: 'Condition', type: 'text', placeholder: 'e.g. {{ $json.type == "test" }}' }
  ],
  defaultConfig: { nodeId: '', condition: '' }
})

// 12. Create Reference Chain
registerAction({
  id: 'action:create-reference-chain',
  metadata: {
    label: 'Create Reference Chain',
    description: 'Create chain of reference relationships',
    icon: Link2,
    category: 'Relationship Actions',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
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
    category: 'Property Actions',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50'
  },
  configSchema: [
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
  defaultConfig: { propertyKey: '', formatType: 'string', formatOption: '' }
})

// 14. Create Token Nodes
registerAction({
  id: 'action:create-token-nodes',
  metadata: {
    label: 'Create Token Nodes',
    description: 'Create nodes from text tokens',
    icon: Type,
    category: 'Node Actions',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
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
    category: 'Workflow & Control',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50'
  },
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
    category: 'Node Actions',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  configSchema: [
    { name: 'nodeLabel', label: 'Node Label', type: 'text' },
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
    description: 'Copy property from one node to another',
    icon: Copy,
    category: 'Property Actions',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50'
  },
  configSchema: [
    { name: 'sourceProperty', label: 'Source Property', type: 'text' },
    { name: 'targetProperty', label: 'Target Property', type: 'text' },
    { name: 'sourceNodeId', label: 'Source Node ID (Optional)', type: 'text' }
  ],
  defaultConfig: { sourceProperty: '', targetProperty: '', sourceNodeId: '' }
})

// 8. Update Relationship
registerAction({
  id: 'action:update-relationship',
  metadata: {
    label: 'Update Relationship',
    description: 'Update existing relationship properties',
    icon: Edit,
    category: 'Relationship Actions',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  configSchema: [
    { name: 'relationshipType', label: 'Relationship Type', type: 'text' },
    { name: 'newRelationshipType', label: 'New Relationship Type (Optional)', type: 'text' },
    { name: 'properties', label: 'Properties to Update', type: 'properties' }
  ],
  defaultConfig: { relationshipType: '', newRelationshipType: '', properties: [] }
})

// 9. Extract & Compute Property
registerAction({
  id: 'action:extract-and-compute-property',
  metadata: {
    label: 'Extract & Compute Property',
    description: 'Extract and compute property value',
    icon: Calculator,
    category: 'Property Actions',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  configSchema: [
    { name: 'propertyKey', label: 'Target Property Key', type: 'text' },
    { name: 'expression', label: 'Expression', type: 'text', placeholder: 'e.g. {{ $json.val * 2 }}' }
  ],
  defaultConfig: { propertyKey: '', expression: '' }
})

// 10. Create Node with Lookup
registerAction({
  id: 'action:create-node-with-lookup',
  metadata: {
    label: 'Create Node with Lookup',
    description: 'Create node and link by property lookup',
    icon: Search,
    category: 'Node Actions',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
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
    category: 'Property Actions',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  configSchema: [
    { name: 'targetProperty', label: 'Target Property', type: 'text' },
    { name: 'sourceProperties', label: 'Source Properties (Comma separated)', type: 'text' },
    { name: 'separator', label: 'Separator', type: 'text', defaultValue: ' ' }
  ],
  defaultConfig: { targetProperty: '', sourceProperties: '', separator: ' ' }
})

// 12. Split Property
registerAction({
  id: 'action:split-property',
  metadata: {
    label: 'Split Property',
    description: 'Split property into multiple properties',
    icon: Split,
    category: 'Property Actions',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50'
  },
  configSchema: [
    { name: 'sourceProperty', label: 'Source Property', type: 'text' },
    { name: 'separator', label: 'Separator/Pattern', type: 'text', defaultValue: ',' },
    { name: 'targetProperties', label: 'Target Properties (Comma separated)', type: 'text' }
  ],
  defaultConfig: { sourceProperty: '', separator: ',', targetProperties: '' }
})

// 13. Clone Node
registerAction({
  id: 'action:clone-node',
  metadata: {
    label: 'Clone Node',
    description: 'Clone node with modifications',
    icon: Copy,
    category: 'Node Actions',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  configSchema: [
    { name: 'nodeId', label: 'Source Node ID (Optional)', type: 'text' },
    { name: 'newLabel', label: 'New Label (Optional)', type: 'text' },
    { name: 'propertiesToOverride', label: 'Properties to Override', type: 'properties' }
  ],
  defaultConfig: { nodeId: '', newLabel: '', propertiesToOverride: [] }
})

// 14. Merge Nodes
registerAction({
  id: 'action:merge-nodes',
  metadata: {
    label: 'Merge Nodes',
    description: 'Merge duplicate nodes',
    icon: Merge,
    category: 'Node Actions',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  configSchema: [
    { name: 'nodeLabel', label: 'Node Label', type: 'text' },
    { name: 'mergeCriteria', label: 'Merge Criteria Property', type: 'text', defaultValue: 'id' }
  ],
  defaultConfig: { nodeLabel: '', mergeCriteria: 'id' }
})

// 21. Create Node Complete
registerAction({
  id: 'action:create-node-complete',
  metadata: {
    label: 'Create Node Complete',
    description: 'Create a fully specified node with relationships',
    icon: Boxes,
    category: 'Node Actions',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50'
  },
  configSchema: [
    { name: 'nodeLabel', label: 'Node Label', type: 'text' },
    { name: 'properties', label: 'Properties Mapping', type: 'mappings' },
    { name: 'relationships', label: 'Relationships', type: 'properties' }
  ],
  defaultConfig: { nodeLabel: '', properties: [], relationships: [] }
})

// 22. Create Annotation Nodes
registerAction({
  id: 'action:create-annotation-nodes',
  metadata: {
    label: 'Create Annotation Nodes',
    description: 'Create individual nodes for specific annotations',
    icon: FileText,
    category: 'Advanced Actions',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  },
  configSchema: [
    { name: 'annotationPath', label: 'Annotation Path', type: 'text' },
    { name: 'nodeLabel', label: 'Node Label', type: 'text' },
    { name: 'properties', label: 'Properties', type: 'mappings' }
  ],
  defaultConfig: { annotationPath: '', nodeLabel: '', properties: [] }
})

// 23. Delete Relationship
registerAction({
  id: 'action:delete-relationship',
  metadata: {
    label: 'Delete Relationship',
    description: 'Remove an existing relationship',
    icon: Trash2,
    category: 'Relationship Actions',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  configSchema: [
    { name: 'relationshipType', label: 'Relationship Type', type: 'text' }
  ],
  defaultConfig: { relationshipType: '' }
})

// 24. Reverse Relationship
registerAction({
  id: 'action:reverse-relationship',
  metadata: {
    label: 'Reverse Relationship',
    description: 'Reverse the direction of a relationship',
    icon: RotateCcw,
    category: 'Relationship Actions',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  configSchema: [
    { name: 'relationshipType', label: 'Relationship Type', type: 'text' }
  ],
  defaultConfig: { relationshipType: '' }
})
