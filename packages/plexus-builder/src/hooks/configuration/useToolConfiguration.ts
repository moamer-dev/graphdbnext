import { useMemo, useCallback, useEffect } from 'react'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'
import { useToolConfigurationStore } from '../../stores/toolConfigurationStore'
import { useXmlImportWizardStore } from '../../stores/xmlImportWizardStore'
import { useCredentialsStore } from '../../stores/credentialsStore'
import { workflowRegistry } from '../../registry'

export function useToolConfiguration(toolNodeId: string | null) {
  const toolNodes = useToolCanvasStore((state) => state.nodes)
  const toolNode = useMemo(() => toolNodes.find((n) => n.id === toolNodeId) || null, [toolNodes, toolNodeId])
  const updateToolNode = useToolCanvasStore((state) => state.updateNode)
  const nodes = useModelBuilderStore((state) => state.nodes)
  const toolCanvasEdges = useToolCanvasStore((state) => state.edges)
  const actionCanvasNodes = useActionCanvasStore((state) => state.nodes)
  const actionCanvasEdges = useActionCanvasStore((state) => state.edges)

  const toolDefinition = useMemo(() => {
    return toolNode ? workflowRegistry.getTool(toolNode.type) : null
  }, [toolNode])

  const config = useToolConfigurationStore((state) => state.config)
  const updateConfig = useToolConfigurationStore((state) => state.updateConfig)
  const toolLabel = useToolConfigurationStore((state) => state.toolLabel)
  const setToolLabel = useToolConfigurationStore((state) => state.setToolLabel)
  
  const getCredentialsByType = useCredentialsStore((state) => state.getCredentialsByType)
  const getCredential = useCredentialsStore((state) => state.getCredential)

  // Load configuration into store only when toolNodeId changes
  useEffect(() => {
    if (toolNodeId) {
      useToolConfigurationStore.getState().loadFromToolNode(toolNode)
    } else {
      useToolConfigurationStore.getState().reset()
    }
    // Only reload when switching nodes, otherwise we might overwrite unsaved changes while typing
  }, [toolNodeId])

  // Real instances state (Access from config)
  const realInstances = (config.realInstances as any[]) || []
  const selectedInstanceIndex = (config.selectedInstanceIndex as number) || 0
  const selectedFile = useXmlImportWizardStore((state) => state.selectedFile)

  // Context Discovery: Find the node this tool is attached to by traversing upstream
  const attachedNode = useMemo(() => {
    if (!toolNodeId) return null

    let currentId = toolNodeId
    const visited = new Set<string>()
    let depth = 0
    const MAX_DEPTH = 30 // Increased depth for complex chains

    while (currentId && !visited.has(currentId) && depth < MAX_DEPTH) {
      visited.add(currentId)
      depth++

      // 1. Direct attachment (metadata)
      const currentTool = toolNodes.find(n => n.id === currentId)
      if (currentTool?.targetNodeId) {
        const directNode = nodes.find(n => n.id === currentTool.targetNodeId)
        if (directNode) return directNode
      }

      // 2. Search in tool edges (Node -> Tool or Tool -> Tool)
      const toolEdge = toolCanvasEdges.find(e => e.target === currentId)
      if (toolEdge) {
        const sourceTool = toolNodes.find(n => n.id === toolEdge.source)
        if (sourceTool) {
          currentId = toolEdge.source
          continue
        }

        const sourceNode = nodes.find(n => n.id === toolEdge.source)
        if (sourceNode) return sourceNode
      }

      // 3. Search in action edges (Tool -> Action or Action -> Action or Action -> Tool)
      const actionEdge = actionCanvasEdges.find(e => e.target === currentId)
      if (actionEdge) {
        const sourceAction = actionCanvasNodes.find(n => n.id === actionEdge.source)
        if (sourceAction) {
          currentId = actionEdge.source
          continue
        }
        
        const sourceTool = toolNodes.find(n => n.id === actionEdge.source)
        if (sourceTool) {
          currentId = actionEdge.source
          continue
        }

        const sourceNode = nodes.find(n => n.id === actionEdge.source)
        if (sourceNode) return sourceNode
      }

      break
    }
    return null
  }, [toolNodeId, toolNodes, toolCanvasEdges, nodes, actionCanvasNodes, actionCanvasEdges])

  // Normalized configurations
  const fetchApiConfig = useMemo(() => {
    const fromNested = (config.fetchApiConfig as any) || {}
    return {
      apiProvider: config.apiProvider || fromNested.apiProvider || '',
      idSource: config.idSource || fromNested.idSource || 'attribute',
      idAttribute: config.idAttribute || fromNested.idAttribute || '',
      idXpath: config.idXpath || fromNested.idXpath || '',
      apiKey: config.apiKey || fromNested.apiKey || '',
      customEndpoint: config.customEndpoint || fromNested.customEndpoint || '',
      timeout: config.timeout || fromNested.timeout || 10000,
      storeInContext: config.storeInContext || fromNested.storeInContext || ''
    }
  }, [config])

  const authenticatedApiConfig = useMemo(() => {
    const fromNested = (config.authenticatedApiConfig as any) || {}
    const isSpecializedFetch = toolNode?.type.startsWith('tool:fetch-') && toolNode?.type !== 'tool:fetch-api'
    
    return {
      credentialId: config.credentialId || fromNested.credentialId || '',
      idSource: config.idSource || fromNested.idSource || 'attribute',
      idAttribute: config.idAttribute || fromNested.idAttribute || '',
      idXpath: config.idXpath || fromNested.idXpath || '',
      timeout: config.timeout || fromNested.timeout || 10000,
      storeInContext: config.storeInContext || fromNested.storeInContext || '',
      apiProvider: isSpecializedFetch ? toolNode?.type.replace('tool:fetch-', '') : (config.apiProvider || '')
    }
  }, [config, toolNode])

  const httpConfig = useMemo(() => {
    const fromNested = (config.httpConfig as any) || {}
    return {
      method: (config.method || fromNested.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      url: config.url || fromNested.url || '',
      useCredential: config.useCredential ?? fromNested.useCredential ?? false,
      credentialId: config.credentialId || fromNested.credentialId || '',
      authType: config.authType || fromNested.authType || 'none',
      apiKey: config.apiKey || fromNested.apiKey || '',
      apiKeyHeader: config.apiKeyHeader || fromNested.apiKeyHeader || '',
      bearerToken: config.bearerToken || fromNested.bearerToken || '',
      basicUsername: config.basicUsername || fromNested.basicUsername || '',
      basicPassword: config.basicPassword || fromNested.basicPassword || '',
      customHeaderName: config.customHeaderName || fromNested.customHeaderName || '',
      customHeaderValue: config.customHeaderValue || fromNested.customHeaderValue || '',
      headers: config.headers || fromNested.headers || [],
      queryParams: config.queryParams || fromNested.queryParams || [],
      body: config.body || fromNested.body || '',
      bodyType: (config.bodyType || fromNested.bodyType || 'json') as 'json' | 'text' | 'form-data' | 'x-www-form-urlencoded',
      timeout: config.timeout || fromNested.timeout || 10000,
      storeInContext: config.storeInContext || fromNested.storeInContext || ''
    }
  }, [config])

  const handleUpdateConfig = useCallback((updates: Record<string, any>) => {
    if (!toolNodeId) return
    updateConfig(updates)
    updateToolNode(toolNodeId, {
      config: { ...(toolNode?.config || {}), ...updates }
    })
  }, [toolNodeId, toolNode, updateConfig, updateToolNode])

  const setInstanceIndex = (index: number) => updateConfig({ selectedInstanceIndex: index })
  const setRealInstances = (instances: any[]) => updateConfig({ realInstances: instances })
  const setSelectedFile = (file: string) => updateConfig({ selectedFile: file })

  return {
    toolNode,
    toolDefinition,
    config,
    toolLabel,
    attachedNode,
    fetchApiConfig,
    authenticatedApiConfig,
    httpConfig,
    realInstances,
    selectedInstanceIndex,
    selectedFile,
    setToolLabel,
    handleUpdateConfig,
    setInstanceIndex,
    setRealInstances,
    setSelectedFile,
    updateToolNode,
    getCredentialsByType,
    getCredential
  }
}
