import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import type { ToolExecutionContext } from './toolExecutor'

/**
 * Tools for interacting with the Model Builder application
 * These tools allow the AI agent to perform actions within the app
 */

/**
 * Creates tools that can execute actions on the model builder store
 */
export function createModelBuilderTools(executor: ReturnType<typeof import('./toolExecutor').createToolExecutor>) {
  const createNodeTool = tool(
    async ({ name, label, description, properties }: {
      name: string
      label?: string
      description?: string
      properties?: Array<{ name: string; type: string; required?: boolean }>
    }) => {
      return await executor.createNode({ name, label, description, properties })
    },
    {
      name: 'create_node',
      description: 'Create a new node in the graph schema. Use this to add nodes to your data model. The node will be added to the canvas immediately. IMPORTANT: Check if the node already exists before creating it - the tool will prevent duplicates automatically.',
      schema: z.object({
        name: z.string().describe('The technical name/identifier for the node (e.g., "Person", "Book")'),
        label: z.string().optional().describe('Human-readable label for the node (defaults to name)'),
        description: z.string().optional().describe('Description of what this node represents'),
        properties: z.array(z.object({
          name: z.string().describe('Property name (e.g., "name", "age", "email")'),
          type: z.string().describe('Property type: "string", "number", "boolean", "date", "array", or "object"'),
          required: z.boolean().optional().describe('Whether this property is required'),
        })).optional().describe('List of properties this node should have'),
      }),
    }
  )

  const createRelationshipTool = tool(
    async ({ from, to, type, properties }: {
      from: string
      to: string
      type: string
      properties?: Array<{ name: string; type: string }>
    }) => {
      return await executor.createRelationship({ from, to, type, properties })
    },
    {
      name: 'create_relationship',
      description: 'Create a relationship between two nodes in the graph schema. Use the exact node labels (e.g., "Person", "Car") to reference them - matching is case-insensitive. The relationship will be added to the canvas immediately. IMPORTANT: Both nodes must exist before creating a relationship. If nodes were just created in the same tool call batch, wait for node creation to complete first. Use list_nodes tool to verify nodes exist.',
      schema: z.object({
        from: z.string().describe('The label, type, or ID of the source node (e.g., "Person", "Book")'),
        to: z.string().describe('The label, type, or ID of the target node (e.g., "Person", "Book")'),
        type: z.string().describe('The type of relationship (e.g., "AUTHORED_BY", "CONTAINS", "BELONGS_TO", "HAS_AUTHOR")'),
        properties: z.array(z.object({
          name: z.string().describe('Property name'),
          type: z.string().describe('Property type: "string", "number", "boolean", "date", "array", or "object"'),
        })).optional().describe('Properties for the relationship'),
      }),
    }
  )

  const explainSchemaTool = tool(
    async ({ query }: { query: string }) => {
      const schema = executor.getSchema()
      // Return schema info so the agent can explain it
      return `Current schema has ${schema.nodes.length} nodes and ${schema.relationships.length} relationships. Nodes: ${schema.nodes.map(n => n.label).join(', ')}. Relationships: ${schema.relationships.map(r => r.type).join(', ')}. Query: ${query}`
    },
    {
      name: 'explain_schema',
      description: 'Get information about the current schema to help explain it. Use this when users ask about their schema structure.',
      schema: z.object({
        query: z.string().describe('What aspect of the schema to explain or what question to answer about it'),
      }),
    }
  )

  const optimizeSchemaTool = tool(
    async ({ goals }: { goals?: string }) => {
      const schema = executor.getSchema()
      // Return schema info so the agent can suggest optimizations
      return `Current schema has ${schema.nodes.length} nodes and ${schema.relationships.length} relationships. Optimization goals: ${goals || 'general improvements'}. The agent should analyze the schema and provide optimization suggestions.`
    },
    {
      name: 'optimize_schema',
      description: 'Get the current schema to suggest optimizations. Use this when users ask for schema optimization or improvements.',
      schema: z.object({
        goals: z.string().optional().describe('What to optimize for (e.g., "performance", "normalization", "simplicity", "query efficiency")'),
      }),
    }
  )

  const listNodesTool = tool(
    async () => {
      return executor.listNodes()
    },
    {
      name: 'list_nodes',
      description: 'List all available nodes in the current schema. Use this before creating relationships to see what nodes exist and their exact labels.',
      schema: z.object({}),
    }
  )

  const updateNodeTool = tool(
    async ({ nodeIdOrLabel, properties, label, description }: {
      nodeIdOrLabel: string
      properties?: Array<{ name: string; type: string; required?: boolean }>
      label?: string
      description?: string
    }) => {
      return await executor.updateNode({ nodeIdOrLabel, properties, label, description })
    },
    {
      name: 'update_node',
      description: 'Update an existing node in the graph schema. Add, remove, or modify properties. Use the node label, type, or ID to reference it.',
      schema: z.object({
        nodeIdOrLabel: z.string().describe('The label, type, or ID of the node to update (e.g., "Person", "Car")'),
        properties: z.array(z.object({
          name: z.string().describe('Property name (e.g., "name", "age", "job")'),
          type: z.string().describe('Property type: "string", "number", "boolean", "date", "array", or "object"'),
          required: z.boolean().optional().describe('Whether this property is required'),
        })).optional().describe('List of properties to update. If a property already exists, it will be updated. New properties will be added.'),
        label: z.string().optional().describe('New label for the node (if changing it)'),
        description: z.string().optional().describe('Description for the node'),
      }),
    }
  )

  return [
    createNodeTool,
    createRelationshipTool,
    explainSchemaTool,
    optimizeSchemaTool,
    listNodesTool,
    updateNodeTool,
  ]
}

/**
 * Legacy export for backwards compatibility (tools without executor)
 * These return JSON strings and don't execute actions
 * @deprecated Use createModelBuilderTools with executor instead
 */
export const modelBuilderTools = [
  tool(
    async () => {
      return 'Tool execution requires a ToolExecutionContext. Please use createModelBuilderTools with an executor.'
    },
    {
      name: 'create_node',
      description: 'Create a new node (requires executor)',
      schema: z.object({}),
    }
  ),
]

