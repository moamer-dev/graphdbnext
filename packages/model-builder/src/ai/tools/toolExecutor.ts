import type { Node, Relationship, Property } from '../../types'
import type { ModelBuilderStore } from '../../stores/modelBuilderStore'

/**
 * Tool execution context that provides access to the model builder store
 * This allows AI tools to actually execute actions (create nodes, relationships, etc.)
 */
export interface ToolExecutionContext {
  getStore: () => ModelBuilderStore
  getNodes: () => Node[]
  getRelationships: () => Relationship[]
}

/**
 * Creates tool execution handlers that can interact with the model builder store
 */
export function createToolExecutor(context: ToolExecutionContext) {
  return {
    /**
     * Creates a node in the model builder store
     */
    async createNode(args: {
      name: string
      label?: string
      description?: string
      properties?: Array<{ name: string; type: string; required?: boolean }>
    }): Promise<string> {
      // Get fresh store and nodes state each time
      const store = context.getStore()
      const nodes = context.getNodes() // Get current nodes state
      
      // Check if node with same name/type already exists (case-insensitive)
      const nodeLabel = args.label || args.name
      const existingNode = nodes.find(n => 
        n.type.toLowerCase() === args.name.toLowerCase() || 
        n.label.toLowerCase() === nodeLabel.toLowerCase()
      )
      
      if (existingNode) {
        return `Node "${nodeLabel}" (${args.name}) already exists with ID: ${existingNode.id}. Available properties: ${existingNode.properties.map(p => p.key).join(', ')}. No duplicate created.`
      }
      
      const properties: Property[] = (args.properties || []).map(prop => ({
        key: prop.name,
        type: prop.type as Property['type'],
        required: prop.required ?? false,
      }))

      const nodeId = store.addNode({
        label: nodeLabel,
        type: args.name,
        properties,
      })

      // Verify node was created by getting fresh state
      const updatedNodes = context.getNodes()
      const createdNode = updatedNodes.find(n => n.id === nodeId)
      
      if (!createdNode) {
        throw new Error(`Failed to create node "${nodeLabel}". Node was not found after creation.`)
      }

      const propertiesList = createdNode.properties.map(p => `${p.key} (${p.type})`).join(', ')
      return `Node "${nodeLabel}" (${args.name}) created successfully with ID: ${nodeId}. Properties: ${propertiesList || 'none'}`
    },

    /**
     * Updates an existing node in the model builder store
     */
    async updateNode(args: {
      nodeIdOrLabel: string
      properties?: Array<{ name: string; type: string; required?: boolean }>
      label?: string
      description?: string
    }): Promise<string> {
      const store = context.getStore()
      const nodes = context.getNodes()
      
      // Find node by ID, label, or type
      const node = nodes.find(n => 
        n.id === args.nodeIdOrLabel || 
        n.label === args.nodeIdOrLabel || 
        n.type === args.nodeIdOrLabel
      )
      
      if (!node) {
        const availableNodes = nodes.map(n => `"${n.label}" (ID: ${n.id})`).join(', ')
        throw new Error(`Node "${args.nodeIdOrLabel}" not found. Available nodes: ${availableNodes || 'none'}`)
      }

      const updates: Partial<import('../../types').Node> = {}
      
      // Update label if provided
      if (args.label) {
        updates.label = args.label
      }
      
      // Update properties if provided
      if (args.properties) {
        const existingProps = new Map(node.properties.map(p => [p.key, p]))
        const propertyNamesToUpdate = new Set(args.properties.map(p => p.name))
        const updatedProperties: import('../../types').Property[] = []
        
        // Keep existing properties that aren't being updated
        for (const prop of node.properties) {
          if (!propertyNamesToUpdate.has(prop.key)) {
            updatedProperties.push(prop) // Keep existing property
          }
        }
        
        // Add/update properties from args
        for (const prop of args.properties) {
          const existingProp = existingProps.get(prop.name)
          updatedProperties.push({
            key: prop.name,
            type: prop.type as import('../../types').Property['type'],
            required: prop.required ?? existingProp?.required ?? false,
            description: existingProp?.description, // Keep existing description, or can be updated separately
            defaultValue: existingProp?.defaultValue, // Preserve existing default value
          })
        }
        
        updates.properties = updatedProperties
      }

      store.updateNode(node.id, updates)
      
      const updatedNode = context.getNodes().find(n => n.id === node.id)
      const propertiesList = updatedNode?.properties.map(p => `${p.key} (${p.type}${p.required ? ', required' : ''})`).join(', ') || 'none'
      
      return `Node "${updatedNode?.label || node.label}" updated successfully. Properties: ${propertiesList}`
    },

    /**
     * Creates a relationship between two nodes
     */
    async createRelationship(args: {
      from: string
      to: string
      type: string
      properties?: Array<{ name: string; type: string }>
    }): Promise<string> {
      // Get fresh store and state each time
      const store = context.getStore()
      const nodes = context.getNodes() // Get current nodes state (after any previous creations)
      const relationships = context.getRelationships()

      // Find nodes by label, type, or ID (case-insensitive for label/type matching)
      const fromLower = args.from.toLowerCase().trim()
      const toLower = args.to.toLowerCase().trim()
      
      const fromNode = nodes.find(n => 
        n.label.toLowerCase() === fromLower || 
        n.type.toLowerCase() === fromLower || 
        n.id === args.from
      )
      const toNode = nodes.find(n => 
        n.label.toLowerCase() === toLower || 
        n.type.toLowerCase() === toLower || 
        n.id === args.to
      )

      if (!fromNode) {
        const availableNodes = nodes.length > 0 
          ? nodes.map(n => `"${n.label}" (type: ${n.type})`).join(', ')
          : 'none - create nodes first'
        throw new Error(`Source node "${args.from}" not found. Available nodes: ${availableNodes}. Make sure nodes are created before creating relationships.`)
      }

      if (!toNode) {
        const availableNodes = nodes.length > 0 
          ? nodes.map(n => `"${n.label}" (type: ${n.type})`).join(', ')
          : 'none - create nodes first'
        throw new Error(`Target node "${args.to}" not found. Available nodes: ${availableNodes}. Make sure nodes are created before creating relationships.`)
      }

      // Check if relationship already exists
      const existingRel = relationships.find(r => 
        r.from === fromNode.id && 
        r.to === toNode.id && 
        r.type.toLowerCase() === args.type.toLowerCase()
      )
      
      if (existingRel) {
        return `Relationship "${args.type}" from "${fromNode.label}" to "${toNode.label}" already exists with ID: ${existingRel.id}. No duplicate created.`
      }

      const relProperties: Relationship['properties'] = (args.properties || []).map(prop => ({
        key: prop.name,
        type: prop.type as Property['type'],
        required: false,
      }))

      const relId = store.addRelationship({
        from: fromNode.id,
        to: toNode.id,
        type: args.type,
        properties: relProperties,
      })

      // Verify relationship was created
      const updatedRelationships = context.getRelationships()
      const createdRel = updatedRelationships.find(r => r.id === relId)
      
      if (!createdRel) {
        throw new Error(`Failed to create relationship "${args.type}". Relationship was not found after creation.`)
      }

      return `Relationship "${args.type}" created successfully from "${fromNode.label}" to "${toNode.label}" with ID: ${relId}`
    },

    /**
     * Gets the current schema state
     */
    getSchema(): { nodes: Node[]; relationships: Relationship[] } {
      return {
        nodes: context.getNodes(),
        relationships: context.getRelationships(),
      }
    },

    /**
     * Lists all available nodes in a human-readable format
     */
    listNodes(): string {
      const nodes = context.getNodes()
      if (nodes.length === 0) {
        return 'No nodes exist yet. Create nodes using the create_node tool.'
      }
      return `Available nodes (${nodes.length}):\n${nodes.map(n => `- "${n.label}" (type: ${n.type}, ID: ${n.id})`).join('\n')}`
    },
  }
}

