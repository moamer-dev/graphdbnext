import { useState } from 'react'
import { useAISettings, useAIFeature } from '../../ai/config'
import { createChatModel } from '../../ai/models/factory'
import { suggestSchema, optimizeSchema, validateSchema, type SchemaSuggestion, type SchemaOptimization, type SchemaValidation } from '../../ai/agents/SchemaDesignAgent'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { createToolExecutor } from '../../ai/tools/toolExecutor'
import { SchemaDesignService } from '../../services/schemaDesignService'

interface AppliedOptimization {
  improvementIndex: number
  type: string
  undoData: {
    nodeId?: string
    relationshipId?: string
    previousNodeState?: {
      id: string
      properties: Array<{ key: string; type: string; required: boolean }>
    }
  }
}

export function useSchemaDesign() {
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<SchemaSuggestion | null>(null)
  const [optimization, setOptimization] = useState<SchemaOptimization | null>(null)
  const [validation, setValidation] = useState<SchemaValidation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [appliedOptimizations, setAppliedOptimizations] = useState<Map<number, AppliedOptimization>>(new Map())

  const { settings, isReady } = useAISettings()
  const isEnabled = useAIFeature('schemaDesignAgent')
  const store = useModelBuilderStore()

  const handleSuggestSchema = async () => {
    if (!description.trim() || !isReady || !settings.enabled) return

    setIsLoading(true)
    setError(null)
    setSuggestion(null)

    try {
      const model = createChatModel(settings.model)
      const existingNodes = store.nodes.length > 0 ? store.nodes : undefined
      const result = await suggestSchema(model, settings, description, existingNodes)
      setSuggestion(result)
    } catch (err) {
      console.error('Error suggesting schema:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate schema suggestion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptimizeSchema = async () => {
    if (!isReady || !settings.enabled) return

    setIsLoading(true)
    setError(null)
    setOptimization(null)

    try {
      const model = createChatModel(settings.model)
      const currentSchema = {
        nodes: store.nodes,
        relationships: store.relationships,
      }
      const result = await optimizeSchema(model, settings, currentSchema)
      setOptimization(result)
    } catch (err) {
      console.error('Error optimizing schema:', err)
      setError(err instanceof Error ? err.message : 'Failed to optimize schema')
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidateSchema = async () => {
    if (!isReady || !settings.enabled) return

    setIsLoading(true)
    setError(null)
    setValidation(null)

    try {
      const model = createChatModel(settings.model)
      const currentSchema = {
        nodes: store.nodes,
        relationships: store.relationships,
      }
      const result = await validateSchema(model, settings, currentSchema)
      setValidation(result)
    } catch (err) {
      console.error('Error validating schema:', err)
      setError(err instanceof Error ? err.message : 'Failed to validate schema')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplySuggestion = async () => {
    if (!suggestion) return

    try {
      const toolContext = {
        getStore: () => store,
        getNodes: () => useModelBuilderStore.getState().nodes,
        getRelationships: () => useModelBuilderStore.getState().relationships,
      }
      const executor = createToolExecutor(toolContext)

      for (const node of suggestion.nodes) {
        try {
          await executor.createNode({
            name: node.name,
            label: node.label,
            description: node.description,
            properties: node.properties.map(p => ({
              name: p.name,
              type: p.type,
              required: p.required || false,
            })),
          })
        } catch {
          // Node might already exist, continue
        }
      }

      for (const rel of suggestion.relationships) {
        try {
          await executor.createRelationship({
            from: rel.from,
            to: rel.to,
            type: rel.type,
            properties: rel.properties?.map(p => ({
              name: p.name,
              type: p.type,
            })),
          })
        } catch {
          // Relationship might already exist, continue
        }
      }
    } catch (err) {
      console.error('Error applying suggestion:', err)
      setError(err instanceof Error ? err.message : 'Failed to apply suggestion')
    }
  }

  const handleApplyOptimization = async (improvement: SchemaOptimization['improvements'][0], improvementIndex: number) => {
    if (!optimization) return

    try {
      const toolContext = {
        getStore: () => store,
        getNodes: () => useModelBuilderStore.getState().nodes,
        getRelationships: () => useModelBuilderStore.getState().relationships,
      }
      const executor = createToolExecutor(toolContext)
      const undoData: AppliedOptimization['undoData'] = {}

      switch (improvement.type) {
        case 'add_node': {
          if (!improvement.suggestion?.nodeLabel) {
            setError('Cannot apply: Node label is required for adding a node')
            return
          }
          
          try {
            const result = await executor.createNode({
              name: improvement.suggestion.nodeLabel.replace(/\s+/g, ''),
              label: improvement.suggestion.nodeLabel,
              description: improvement.message,
            })
            
            const extractedId = SchemaDesignService.extractNodeIdFromResult(result)
            if (extractedId) {
              undoData.nodeId = extractedId
            } else {
              const nodes = useModelBuilderStore.getState().nodes
              const nodeLabel = improvement.suggestion?.nodeLabel
              if (nodeLabel) {
                const createdNode = SchemaDesignService.findNodeByLabel(nodes, nodeLabel)
                if (createdNode) {
                  undoData.nodeId = createdNode.id
                }
              }
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to add node'
            if (errorMsg.includes('already exists')) {
              setAppliedOptimizations(prev => {
                const newMap = new Map(prev)
                newMap.set(improvementIndex, {
                  improvementIndex,
                  type: improvement.type,
                  undoData: {},
                })
                return newMap
              })
              return
            }
            throw err
          }
          break
        }

        case 'add_relationship': {
          if (!improvement.suggestion?.relationshipType) {
            const { toast } = await import('../../utils/toast')
            toast.error('Cannot apply: Relationship type is required')
            setError('Cannot apply: Relationship type is required')
            return
          }
          
          const nodes = store.nodes
          if (nodes.length < 2) {
            const { toast } = await import('../../utils/toast')
            toast.error('Cannot add relationship: Need at least 2 nodes in the schema')
            setError('Cannot add relationship: Need at least 2 nodes in the schema')
            return
          }
          
          const { source: sourceNode, target: targetNode } = SchemaDesignService.findNodesByMessage(
            nodes,
            improvement.message,
            improvement.suggestion?.nodeLabel
          )
          
          if (!sourceNode || !targetNode) {
            const { toast } = await import('../../utils/toast')
            if (!sourceNode && !targetNode) {
              toast.error('Cannot add relationship: Both source and target nodes do not exist in the schema')
              setError('Cannot add relationship: Both source and target nodes do not exist in the schema')
            } else if (!sourceNode) {
              toast.error('Cannot add relationship: Source node does not exist in the schema')
              setError('Cannot add relationship: Source node does not exist in the schema')
            } else {
              toast.error('Cannot add relationship: Target node does not exist in the schema')
              setError('Cannot add relationship: Target node does not exist in the schema')
            }
            return
          }
          
          try {
            const result = await executor.createRelationship({
              from: sourceNode.label,
              to: targetNode.label,
              type: improvement.suggestion.relationshipType,
            })
            
            const extractedId = SchemaDesignService.extractRelationshipIdFromResult(result)
            if (extractedId) {
              undoData.relationshipId = extractedId
            } else {
              const relationships = useModelBuilderStore.getState().relationships
              const createdRel = SchemaDesignService.findRelationshipByCriteria(
                relationships,
                improvement.suggestion?.relationshipType || '',
                sourceNode.id,
                targetNode.id
              )
              if (createdRel) {
                undoData.relationshipId = createdRel.id
              } else {
                const sortedRels = SchemaDesignService.sortRelationshipsByTimestamp(relationships)
                if (sortedRels.length > 0 && sortedRels[0].type === improvement.suggestion?.relationshipType) {
                  undoData.relationshipId = sortedRels[0].id
                }
              }
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to add relationship'
            const { toast } = await import('../../utils/toast')
            
            if (errorMsg.includes('not found')) {
              if (errorMsg.includes('Source node')) {
                toast.error('Cannot add relationship: Source node does not exist in the schema')
              } else if (errorMsg.includes('Target node')) {
                toast.error('Cannot add relationship: Target node does not exist in the schema')
              } else {
                toast.error(errorMsg)
              }
              setError(errorMsg)
              return
            }
            
            if (errorMsg.includes('already exists')) {
              setAppliedOptimizations(prev => {
                const newMap = new Map(prev)
                newMap.set(improvementIndex, {
                  improvementIndex,
                  type: improvement.type,
                  undoData: {},
                })
                return newMap
              })
              return
            }
            
            toast.error(errorMsg)
            throw err
          }
          break
        }

        case 'modify_node':
        case 'add_property': {
          if (!improvement.suggestion?.nodeLabel) {
            setError('Cannot apply: Node label is required')
            return
          }
          
          const properties = improvement.suggestion.propertyName 
            ? [{
                name: improvement.suggestion.propertyName,
                type: 'string' as const,
                required: false,
              }]
            : undefined
          
          try {
            await executor.updateNode({
              nodeIdOrLabel: improvement.suggestion.nodeLabel,
              properties,
            })
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update node')
            return
          }
          break
        }

        case 'suggest_normalization': {
          const { toast } = await import('../../utils/toast')
          toast.info(`Normalization Suggestion: ${improvement.message}\n\nThis type of optimization typically requires manual review and restructuring of your schema.`)
          return
        }

        default:
          setError(`Unknown optimization type: ${(improvement as any).type}`)
          return
      }
      
      setAppliedOptimizations(prev => {
        const newMap = new Map(prev)
        newMap.set(improvementIndex, {
          improvementIndex,
          type: improvement.type,
          undoData,
        })
        return newMap
      })
      
      const { toast } = await import('../../utils/toast')
      toast.success(`Optimization applied: ${improvement.message}`)
    } catch (err) {
      console.error('Error applying optimization:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to apply optimization'
      setError(errorMsg)
      const { toast } = await import('../../utils/toast')
      toast.error(errorMsg)
    }
  }

  const handleUndoOptimization = async (improvementIndex: number) => {
    const applied = appliedOptimizations.get(improvementIndex)
    if (!applied) return

    try {
      const { toast } = await import('../../utils/toast')
      
      switch (applied.type) {
        case 'add_node': {
          if (applied.undoData.nodeId) {
            store.deleteNode(applied.undoData.nodeId)
            toast.success('Node removed (optimization undone)')
          }
          break
        }

        case 'add_relationship': {
          if (applied.undoData.relationshipId) {
            try {
              const relationships = useModelBuilderStore.getState().relationships
              const relExists = SchemaDesignService.findRelationshipById(relationships, applied.undoData.relationshipId) !== undefined
              
              if (relExists) {
                store.deleteRelationship(applied.undoData.relationshipId)
                toast.success('Relationship removed (optimization undone)')
              } else {
                toast.error('Relationship not found (may have already been deleted)')
              }
            } catch (err) {
              console.error('Error deleting relationship:', err)
              toast.error(err instanceof Error ? err.message : 'Failed to delete relationship')
            }
          } else {
            toast.error('Cannot undo: Relationship ID not found')
          }
          break
        }

        case 'modify_node':
        case 'add_property': {
          if (applied.undoData.previousNodeState) {
            const { id, properties } = applied.undoData.previousNodeState
            store.updateNode(id, { properties: properties as any })
            toast.success('Node properties restored (optimization undone)')
          }
          break
        }

        default:
          toast.info('This optimization type cannot be undone')
          return
      }

      setAppliedOptimizations(prev => {
        const newMap = new Map(prev)
        newMap.delete(improvementIndex)
        return newMap
      })
    } catch (err) {
      console.error('Error undoing optimization:', err)
      const { toast } = await import('../../utils/toast')
      toast.error(err instanceof Error ? err.message : 'Failed to undo optimization')
    }
  }

  return {
    description,
    setDescription,
    isLoading,
    suggestion,
    optimization,
    validation,
    error,
    appliedOptimizations,
    isEnabled,
    isReady,
    settings,
    store,
    handleSuggestSchema,
    handleOptimizeSchema,
    handleValidateSchema,
    handleApplySuggestion,
    handleApplyOptimization,
    handleUndoOptimization
  }
}

