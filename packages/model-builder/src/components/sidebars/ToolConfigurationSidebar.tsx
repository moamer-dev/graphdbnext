'use client'

import { useState, useEffect } from 'react'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useToolConfigurationStore } from '../../stores/toolConfigurationStore'
import { useToolConditionBuilder } from '../../hooks'
import { useToolTestExecution } from '../../hooks'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { X, Plus, Trash2, Play, CheckCircle2, XCircle, Eye } from 'lucide-react'
import { fetchFromApi, type ApiProvider } from '../../services/apiClient'
import { useCredentialsStore } from '../../stores/credentialsStore'
import { ApiResponseModal } from '../dialogs/ApiResponseModal'
import { ConnectionStatusIndicator, type ConnectionStatus } from '../shared/ConnectionStatusIndicator'
import { ValidationFeedback } from '../shared/ValidationFeedback'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { HelpTooltip } from '../shared/HelpTooltip'
import { ResponseHistory } from '../shared/ResponseHistory'
import { apiResponseCache } from '../../utils/apiResponseCache'
import { toast } from '../../utils/toast'
import { ToolConfigurationHeader } from './ToolConfigurationSidebar/ToolConfigurationHeader'
import { ToolConditionBuilder } from './ToolConfigurationSidebar/ToolConditionBuilder'
import { ToolSwitchConfiguration } from './ToolConfigurationSidebar/ToolSwitchConfiguration'
import { ToolTestExecution } from './ToolConfigurationSidebar/ToolTestExecution'
import { ToolApiConfiguration } from './ToolConfigurationSidebar/ToolApiConfiguration'
import { ToolLoopConfiguration } from './ToolConfigurationSidebar/ToolLoopConfiguration'
import { ToolFilterConfiguration } from './ToolConfigurationSidebar/ToolFilterConfiguration'
import { ToolTransformConfiguration } from './ToolConfigurationSidebar/ToolTransformConfiguration'
import { ToolMergeConfiguration } from './ToolConfigurationSidebar/ToolMergeConfiguration'
import { ToolLookupConfiguration } from './ToolConfigurationSidebar/ToolLookupConfiguration'
import { ToolTraverseConfiguration } from './ToolConfigurationSidebar/ToolTraverseConfiguration'
import { ToolDelayConfiguration } from './ToolConfigurationSidebar/ToolDelayConfiguration'
import { ToolAggregateConfiguration } from './ToolConfigurationSidebar/ToolAggregateConfiguration'
import { ToolSortConfiguration } from './ToolConfigurationSidebar/ToolSortConfiguration'
import { ToolLimitConfiguration } from './ToolConfigurationSidebar/ToolLimitConfiguration'
import { ToolCollectConfiguration } from './ToolConfigurationSidebar/ToolCollectConfiguration'
import { ToolSplitConfiguration } from './ToolConfigurationSidebar/ToolSplitConfiguration'
import { ToolValidateConfiguration } from './ToolConfigurationSidebar/ToolValidateConfiguration'
import { ToolMapConfiguration } from './ToolConfigurationSidebar/ToolMapConfiguration'
import { ToolReduceConfiguration } from './ToolConfigurationSidebar/ToolReduceConfiguration'
import { ToolPartitionConfiguration } from './ToolConfigurationSidebar/ToolPartitionConfiguration'
import { ToolDistinctConfiguration } from './ToolConfigurationSidebar/ToolDistinctConfiguration'
import { ToolWindowConfiguration } from './ToolConfigurationSidebar/ToolWindowConfiguration'
import { ToolJoinConfiguration } from './ToolConfigurationSidebar/ToolJoinConfiguration'
import { ToolUnionConfiguration } from './ToolConfigurationSidebar/ToolUnionConfiguration'
import { ToolIntersectConfiguration } from './ToolConfigurationSidebar/ToolIntersectConfiguration'
import { ToolDiffConfiguration } from './ToolConfigurationSidebar/ToolDiffConfiguration'
import { ToolExistsConfiguration } from './ToolConfigurationSidebar/ToolExistsConfiguration'
import { ToolRangeConfiguration } from './ToolConfigurationSidebar/ToolRangeConfiguration'
import { ToolBatchConfiguration } from './ToolConfigurationSidebar/ToolBatchConfiguration'
import { ToolSimpleConfigSection } from './ToolConfigurationSidebar/ToolSimpleConfigSection'
import { ToolEnrichConfiguration } from './ToolConfigurationSidebar/ToolEnrichConfiguration'
import { ToolDeduplicateConfiguration } from './ToolConfigurationSidebar/ToolDeduplicateConfiguration'
import { ToolValidateSchemaConfiguration } from './ToolConfigurationSidebar/ToolValidateSchemaConfiguration'
import { ToolCleanConfiguration } from './ToolConfigurationSidebar/ToolCleanConfiguration'
import { ToolVerifyConfiguration } from './ToolConfigurationSidebar/ToolVerifyConfiguration'
import { ToolWebhookConfiguration } from './ToolConfigurationSidebar/ToolWebhookConfiguration'
import { ToolEmailConfiguration } from './ToolConfigurationSidebar/ToolEmailConfiguration'
import { ToolLogConfiguration } from './ToolConfigurationSidebar/ToolLogConfiguration'

export type ConditionType =
  | 'HasChildren'
  | 'HasNoChildren'
  | 'HasAncestor'
  | 'HasParent'
  | 'HasAttribute'
  | 'HasTextContent'
  | 'ElementNameEquals'
  | 'AttributeValueEquals'
  | 'ChildCount'

export interface Condition {
  type: ConditionType
  value?: string
  values?: string[] // For conditions that need multiple values
  internalOperator?: 'AND' | 'OR' // For combining multiple values within a condition (e.g., multiple child elements)
  min?: number // For ChildCount
  max?: number // For ChildCount
  attributeName?: string // For HasAttribute, AttributeValueEquals
}

export interface ConditionGroup {
  id: string
  conditions: Condition[]
  internalOperator?: 'AND' | 'OR' // For combining conditions within this group
  operator?: 'AND' | 'OR' // For combining with previous group (external logic)
}

export interface SwitchCase {
  id: string
  value: string
  label: string
}

export type SwitchSource = 'attribute' | 'elementName' | 'textContent'

interface ToolConfigurationSidebarProps {
  toolNodeId: string | null
  onClose: () => void
  className?: string
}

export function ToolConfigurationSidebar({
  toolNodeId,
  onClose,
  className
}: ToolConfigurationSidebarProps) {
  const toolNodes = useToolCanvasStore((state) => state.nodes)
  const toolNode = toolNodeId ? toolNodes.find((n) => n.id === toolNodeId) : null
  const updateToolNode = useToolCanvasStore((state) => state.updateNode)
  const nodes = useModelBuilderStore((state) => state.nodes)
  const getCredentialsByType = useCredentialsStore((state) => state.getCredentialsByType)
  const getCredential = useCredentialsStore((state) => state.getCredential)

  // Tool configuration store
  const toolLabel = useToolConfigurationStore((state) => state.toolLabel)
  const setToolLabel = useToolConfigurationStore((state) => state.setToolLabel)
  const loadFromToolNode = useToolConfigurationStore((state) => state.loadFromToolNode)

  // Load all config from toolNode into store
  useEffect(() => {
    loadFromToolNode(toolNode || null)
  }, [toolNode, loadFromToolNode])

  // Condition builder hook
  const conditionBuilder = useToolConditionBuilder(toolNodeId)

  // Test execution hook
  const testExecution = useToolTestExecution(toolNodeId)

  // Condition builder state (from hook)
  const conditionGroups = conditionBuilder.conditionGroups
  const selectedConditionType = conditionBuilder.selectedConditionType
  const setSelectedConditionType = conditionBuilder.setSelectedConditionType
  const childInputValues = conditionBuilder.childInputValues
  const setChildInputValues = conditionBuilder.setChildInputValues
  const ancestorInputValues = conditionBuilder.ancestorInputValues
  const setAncestorInputValues = conditionBuilder.setAncestorInputValues

  // Test/Execution state (from hook)
  const testResult = testExecution.testResult
  const setTestResult = testExecution.setTestResult
  const isExecuting = testExecution.isExecuting
  const setIsExecuting = testExecution.setIsExecuting
  const testIdInput = testExecution.testIdInput
  const setTestIdInput = testExecution.setTestIdInput
  const executedApiResponse = testExecution.executedApiResponse
  const setExecutedApiResponse = testExecution.setExecutedApiResponse
  const apiResponseModalOpen = testExecution.apiResponseModalOpen
  const setApiResponseModalOpen = testExecution.setApiResponseModalOpen
  const responseHistory = testExecution.responseHistory
  const setResponseHistory = testExecution.setResponseHistory
  const connectionStatus = testExecution.connectionStatus
  const setConnectionStatus = testExecution.setConnectionStatus
  const validationErrors = testExecution.validationErrors
  const setValidationErrors = testExecution.setValidationErrors

  // Switch tool state from store
  const switchSource = useToolConfigurationStore((state) => state.switchSource)
  const setSwitchSource = useToolConfigurationStore((state) => state.setSwitchSource)
  const switchAttributeName = useToolConfigurationStore((state) => state.switchAttributeName)
  const setSwitchAttributeName = useToolConfigurationStore((state) => state.setSwitchAttributeName)
  const switchCases = useToolConfigurationStore((state) => state.switchCases)
  const setSwitchCases = useToolConfigurationStore((state) => state.setSwitchCases)
  const switchCaseInputs = useToolConfigurationStore((state) => state.switchCaseInputs)
  const setSwitchCaseInputs = useToolConfigurationStore((state) => state.setSwitchCaseInputs)

  const getState = useToolConfigurationStore.getState

  // Get the main node this tool is attached to
  const attachedNode = toolNode?.targetNodeId
    ? nodes.find((n) => n.id === toolNode.targetNodeId)
    : null

  // Get XML metadata from the attached node
  const xmlMetadata = attachedNode?.data as Record<string, unknown> | undefined
  const xmlChildren = xmlMetadata?.xmlChildren as Array<{ name: string; count: number }> | undefined
  const xmlAncestors = xmlMetadata?.xmlAncestors as string[] | undefined
  const xmlParent = xmlMetadata?.xmlParent as string | undefined
  const xmlTypeStats = xmlMetadata?.xmlTypeStatistics as { attributesCount: number } | undefined
  const xmlAttributes = xmlMetadata?.xmlAttributes as Record<string, string> | undefined

  // All configs are loaded via loadFromToolNode in the store above

  // API configs from store
  const authenticatedApiConfig = useToolConfigurationStore((state) => state.authenticatedApiConfig)
  const setAuthenticatedApiConfig = useToolConfigurationStore((state) => state.setAuthenticatedApiConfig)
  const httpConfig = useToolConfigurationStore((state) => state.httpConfig)
  const setHttpConfig = useToolConfigurationStore((state) => state.setHttpConfig)
  const fetchApiConfig = useToolConfigurationStore((state) => state.fetchApiConfig)
  const setFetchApiConfig = useToolConfigurationStore((state) => state.setFetchApiConfig)

  // Tool-specific configs from store
  const loopConfig = useToolConfigurationStore((state) => state.loopConfig)
  const setLoopConfig = useToolConfigurationStore((state) => state.setLoopConfig)
  const mergeConfig = useToolConfigurationStore((state) => state.mergeConfig)
  const setMergeConfig = useToolConfigurationStore((state) => state.setMergeConfig)
  const filterConfig = useToolConfigurationStore((state) => state.filterConfig)
  const setFilterConfig = useToolConfigurationStore((state) => state.setFilterConfig)
  const transformConfig = useToolConfigurationStore((state) => state.transformConfig)
  const setTransformConfig = useToolConfigurationStore((state) => state.setTransformConfig)
  const lookupConfig = useToolConfigurationStore((state) => state.lookupConfig)
  const setLookupConfig = useToolConfigurationStore((state) => state.setLookupConfig)
  const traverseConfig = useToolConfigurationStore((state) => state.traverseConfig)
  const setTraverseConfig = useToolConfigurationStore((state) => state.setTraverseConfig)
  const delayConfig = useToolConfigurationStore((state) => state.delayConfig)
  const setDelayConfig = useToolConfigurationStore((state) => state.setDelayConfig)
  const aggregateConfig = useToolConfigurationStore((state) => state.aggregateConfig)
  const setAggregateConfig = useToolConfigurationStore((state) => state.setAggregateConfig)
  const sortConfig = useToolConfigurationStore((state) => state.sortConfig)
  const setSortConfig = useToolConfigurationStore((state) => state.setSortConfig)
  const limitConfig = useToolConfigurationStore((state) => state.limitConfig)
  const setLimitConfig = useToolConfigurationStore((state) => state.setLimitConfig)
  const collectConfig = useToolConfigurationStore((state) => state.collectConfig)
  const setCollectConfig = useToolConfigurationStore((state) => state.setCollectConfig)
  const splitConfig = useToolConfigurationStore((state) => state.splitConfig)
  const setSplitConfig = useToolConfigurationStore((state) => state.setSplitConfig)
  const validateConfig = useToolConfigurationStore((state) => state.validateConfig)
  const setValidateConfig = useToolConfigurationStore((state) => state.setValidateConfig)
  const mapConfig = useToolConfigurationStore((state) => state.mapConfig)
  const setMapConfig = useToolConfigurationStore((state) => state.setMapConfig)
  const reduceConfig = useToolConfigurationStore((state) => state.reduceConfig)
  const setReduceConfig = useToolConfigurationStore((state) => state.setReduceConfig)
  const partitionConfig = useToolConfigurationStore((state) => state.partitionConfig)
  const setPartitionConfig = useToolConfigurationStore((state) => state.setPartitionConfig)
  const distinctConfig = useToolConfigurationStore((state) => state.distinctConfig)
  const setDistinctConfig = useToolConfigurationStore((state) => state.setDistinctConfig)
  const windowConfig = useToolConfigurationStore((state) => state.windowConfig)
  const setWindowConfig = useToolConfigurationStore((state) => state.setWindowConfig)
  const joinConfig = useToolConfigurationStore((state) => state.joinConfig)
  const setJoinConfig = useToolConfigurationStore((state) => state.setJoinConfig)
  const unionConfig = useToolConfigurationStore((state) => state.unionConfig)
  const setUnionConfig = useToolConfigurationStore((state) => state.setUnionConfig)
  const intersectConfig = useToolConfigurationStore((state) => state.intersectConfig)
  const setIntersectConfig = useToolConfigurationStore((state) => state.setIntersectConfig)
  const diffConfig = useToolConfigurationStore((state) => state.diffConfig)
  const setDiffConfig = useToolConfigurationStore((state) => state.setDiffConfig)
  const existsConfig = useToolConfigurationStore((state) => state.existsConfig)
  const setExistsConfig = useToolConfigurationStore((state) => state.setExistsConfig)
  const rangeConfig = useToolConfigurationStore((state) => state.rangeConfig)
  const setRangeConfig = useToolConfigurationStore((state) => state.setRangeConfig)
  const batchConfig = useToolConfigurationStore((state) => state.batchConfig)
  const setBatchConfig = useToolConfigurationStore((state) => state.setBatchConfig)
  const loopInputValues = useToolConfigurationStore((state) => state.loopInputValues)
  const setLoopInputValues = useToolConfigurationStore((state) => state.setLoopInputValues)
  const filterInputValues = useToolConfigurationStore((state) => state.filterInputValues)
  const setFilterInputValues = useToolConfigurationStore((state) => state.setFilterInputValues)

  // Condition builder handlers (from hook)
  const handleAddConditionGroup = () => conditionBuilder.handleAddConditionGroup(xmlParent, xmlAncestors)
  const handleAddConditionToGroup = (groupId: string) => conditionBuilder.handleAddConditionToGroup(groupId, xmlParent, xmlAncestors)
  const handleUpdateCondition = conditionBuilder.handleUpdateCondition
  const handleRemoveCondition = conditionBuilder.handleRemoveCondition
  const handleRemoveGroup = conditionBuilder.handleRemoveGroup
  const handleUpdateGroup = conditionBuilder.handleUpdateGroup

  // Test execution - use hook's createTestElement and handleExecuteConditionTest
  const createTestElement = () => testExecution.createTestElement(
    attachedNode,
    xmlChildren,
    xmlAncestors,
    xmlParent,
    xmlTypeStats,
    xmlAttributes
  )

  const handleExecuteTest = () => {
    testExecution.handleExecuteConditionTest(createTestElement)
  }

  const handleExecuteFetchApiTest = async () => {
    if (!fetchApiConfig.apiProvider || fetchApiConfig.apiProvider === '') {
      setTestResult({
        success: false,
        output: 'Error',
        details: 'Please select an API provider first.'
      })
      setValidationErrors([{ field: 'apiProvider', message: 'API provider is required' }])
      return
    }

    setValidationErrors([])
    setConnectionStatus('pending')
    setIsExecuting(true)
    setTestResult(null)

    try {
      // Determine the ID to use
      let testId: string | null = null

      if (testIdInput.trim()) {
        // Use manually entered ID
        testId = testIdInput.trim()
      } else if (attachedNode && xmlMetadata) {
        // Try to extract ID from attached node's XML metadata
        if (fetchApiConfig.idSource === 'attribute' && fetchApiConfig.idAttribute) {
          const attrs = xmlMetadata.xmlAttributes as Record<string, string> | undefined
          testId = attrs?.[fetchApiConfig.idAttribute] || null
        } else if (fetchApiConfig.idSource === 'textContent') {
          testId = (xmlMetadata.xmlTextContent as string | undefined)?.trim() || null
        }
        // XPath extraction not supported in test mode
      }

      if (!testId) {
        setTestResult({
          success: false,
          output: 'Error',
          details: `No ID found. Please:\n1. Enter an ID manually in the test field, or\n2. Ensure the attached node has the required attribute "${fetchApiConfig.idAttribute || 'id'}" or text content.`
        })
        setValidationErrors([{ field: 'testId', message: 'Test ID is required' }])
        setConnectionStatus('error')
        setIsExecuting(false)
        return
      }

      // Check cache first
      const cacheKey = apiResponseCache.generateKey(toolNode?.id || '', {
        provider: fetchApiConfig.apiProvider,
        id: testId
      })
      const cachedResponse = apiResponseCache.get(cacheKey)

      let response
      if (cachedResponse) {
        response = { success: true, data: cachedResponse }
        toast.info('Using cached response')
      } else {
        // Make API call
        response = await fetchFromApi({
          provider: fetchApiConfig.apiProvider as ApiProvider,
          id: testId,
          apiKey: fetchApiConfig.apiKey || undefined,
          customEndpoint: fetchApiConfig.customEndpoint || undefined,
          timeout: fetchApiConfig.timeout || 10000
        })
      }

      if (response.success && response.data) {
        // Cache the response
        if (!cachedResponse && toolNode) {
          apiResponseCache.set(cacheKey, response.data, 5 * 60 * 1000) // 5 minutes
        }

        // Store the response in tool node config and state
        setExecutedApiResponse(response.data)
        if (toolNode) {
          updateToolNode(toolNode.id, {
            config: {
              ...toolNode.config,
              executedResponse: response.data,
              executedTestId: testId
            }
          })
        }

        // Add to response history
        const historyEntry = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          toolId: toolNode?.id || '',
          toolLabel: toolNode?.label || 'Fetch API',
          response: response.data,
          params: { provider: fetchApiConfig.apiProvider, id: testId }
        }
        setResponseHistory([historyEntry, ...responseHistory.slice(0, 49)]) // Keep last 50

        setConnectionStatus('connected')
        setValidationErrors([])
        setTestResult({
          success: true,
          output: 'Success',
          details: `API Provider: ${fetchApiConfig.apiProvider}\nID Used: ${testId}\nStatus: Success${cachedResponse ? ' (cached)' : ''}`
        })
        toast.success('API call successful')
      } else {
        setConnectionStatus('error')
        setValidationErrors([{ field: 'api', message: response.error || 'API call failed' }])
        setTestResult({
          success: false,
          output: 'Failed',
          details: `API Provider: ${fetchApiConfig.apiProvider}\n` +
            `ID Used: ${testId}\n` +
            `Error: ${response.error || 'Unknown error'}\n\n` +
            `Please check:\n` +
            `- The ID is correct\n` +
            `- API key is set (if required)\n` +
            `- Network connection is available\n` +
            `- API endpoint is accessible`
        })
        toast.error('API call failed')
      }
    } catch (error) {
      setConnectionStatus('error')
      setValidationErrors([{ field: 'api', message: error instanceof Error ? error.message : 'Unknown error' }])
      setTestResult({
        success: false,
        output: 'Error',
        details: `Exception occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      toast.error('API test failed')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleExecuteAuthenticatedApiTest = async () => {
    if (!authenticatedApiConfig.credentialId) {
      setTestResult({
        success: false,
        output: 'Error',
        details: 'Please select a credential first.'
      })
      return
    }

    // Map tool type to provider
    const providerMap: Record<string, ApiProvider> = {
      'tool:fetch-orcid': 'orcid',
      'tool:fetch-geonames': 'geonames',
      'tool:fetch-europeana': 'europeana',
      'tool:fetch-getty': 'getty'
    }

    const provider = providerMap[toolNode?.type || ''] || 'orcid'

    setIsExecuting(true)
    setTestResult(null)

    try {
      // Determine the ID to use
      let testId: string | null = null

      if (testIdInput.trim()) {
        // Use manually entered ID
        testId = testIdInput.trim()
      } else if (attachedNode && xmlMetadata) {
        // Try to extract ID from attached node's XML metadata
        if (authenticatedApiConfig.idSource === 'attribute' && authenticatedApiConfig.idAttribute) {
          const attrs = xmlMetadata.xmlAttributes as Record<string, string> | undefined
          testId = attrs?.[authenticatedApiConfig.idAttribute] || null
        } else if (authenticatedApiConfig.idSource === 'textContent') {
          testId = (xmlMetadata.xmlTextContent as string | undefined)?.trim() || null
        }
        // XPath extraction not supported in test mode
      }

      if (!testId) {
        setTestResult({
          success: false,
          output: 'Error',
          details: `No ID found. Please:\n1. Enter an ID manually in the test field, or\n2. Ensure the attached node has the required attribute "${authenticatedApiConfig.idAttribute || 'id'}" or text content.`
        })
        setIsExecuting(false)
        return
      }

      // Get credential to pass to fetchFromApi
      const credential = getCredential(authenticatedApiConfig.credentialId)
      if (!credential) {
        setTestResult({
          success: false,
          output: 'Error',
          details: 'Credential not found. Please select a valid credential.'
        })
        setIsExecuting(false)
        return
      }

      // Make API call with credential
      const response = await fetchFromApi({
        provider,
        id: testId,
        credentialId: authenticatedApiConfig.credentialId,
        timeout: authenticatedApiConfig.timeout || 10000
      }, (credId: string) => {
        // Return credential data for API client
        const cred = getCredential(credId)
        return cred ? { data: cred.data } : undefined
      })

      if (response.success && response.data) {
        // Format the response data for display
        const dataStr = JSON.stringify(response.data, null, 2)
        const preview = dataStr.length > 1000 ? dataStr.substring(0, 1000) + '\n... (truncated)' : dataStr

        setTestResult({
          success: true,
          output: 'Success',
          details: `API Provider: ${provider}\n` +
            `Credential: ${credential.name}\n` +
            `ID Used: ${testId}\n` +
            `Status: Success\n\n` +
            `Response Data:\n${preview}`
        })
      } else {
        setTestResult({
          success: false,
          output: 'Failed',
          details: `API Provider: ${provider}\n` +
            `Credential: ${credential.name}\n` +
            `ID Used: ${testId}\n` +
            `Error: ${response.error || 'Unknown error'}\n\n` +
            `Please check:\n` +
            `- The ID is correct\n` +
            `- Credential is valid\n` +
            `- API service is accessible`
        })
      }
    } catch (error) {
      console.error('[Authenticated API Tool] Error:', error)
      setTestResult({
        success: false,
        output: 'Error',
        details: `API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleExecuteHttpTest = async () => {
    if (!httpConfig.url || httpConfig.url.trim() === '') {
      setTestResult({
        success: false,
        output: 'Error',
        details: 'Please enter a URL first.'
      })
      return
    }

    setIsExecuting(true)
    setTestResult(null)

    try {
      // Build URL with query parameters
      let url = httpConfig.url.trim()
      if (httpConfig.queryParams && httpConfig.queryParams.length > 0) {
        const params = httpConfig.queryParams
          .filter(p => p.key && p.value)
          .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
          .join('&')
        if (params) {
          url += (url.includes('?') ? '&' : '?') + params
        }
      }

      // Build headers
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      }

      // Add authentication headers
      if (httpConfig.useCredential) {
        const credential = httpConfig.credentialId ? getCredential(httpConfig.credentialId) : null
        if (credential) {
          // Use credential data - for custom type, use headerName/headerValue or apiKey
          if (credential.type === 'custom') {
            if (credential.data.headerName && credential.data.headerValue) {
              headers[credential.data.headerName] = credential.data.headerValue
            } else if (credential.data.apiKey) {
              headers[credential.data.headerName || 'X-API-Key'] = credential.data.apiKey
            }
          } else {
            // For other credential types, use apiKey field
            if (credential.data.apiKey) {
              headers['Authorization'] = `Bearer ${credential.data.apiKey}`
            } else if (credential.data.username) {
              // Basic auth
              const basicAuth = btoa(`${credential.data.username}:${credential.data.password || ''}`)
              headers['Authorization'] = `Basic ${basicAuth}`
            }
          }
        }
      } else {
        // Use direct authentication
        if (httpConfig.authType === 'bearer' && httpConfig.bearerToken) {
          headers['Authorization'] = `Bearer ${httpConfig.bearerToken}`
        } else if (httpConfig.authType === 'basic' && httpConfig.basicUsername) {
          const basicAuth = btoa(`${httpConfig.basicUsername}:${httpConfig.basicPassword || ''}`)
          headers['Authorization'] = `Basic ${basicAuth}`
        } else if (httpConfig.authType === 'apiKey' && httpConfig.apiKey) {
          headers[httpConfig.apiKeyHeader || 'X-API-Key'] = httpConfig.apiKey
        } else if (httpConfig.authType === 'custom' && httpConfig.customHeaderName) {
          headers[httpConfig.customHeaderName] = httpConfig.customHeaderValue || ''
        }
      }

      // Add custom headers
      httpConfig.headers?.forEach(header => {
        if (header.key && header.value) {
          headers[header.key] = header.value
        }
      })

      // Prepare body
      let body: string | undefined
      let contentType: string | undefined

      if (['POST', 'PUT', 'PATCH'].includes(httpConfig.method) && httpConfig.body) {
        if (httpConfig.bodyType === 'json') {
          body = httpConfig.body
          contentType = 'application/json'
        } else if (httpConfig.bodyType === 'text') {
          body = httpConfig.body
          contentType = 'text/plain'
        } else if (httpConfig.bodyType === 'form-data') {
          // Form data - simplified, would need FormData in real implementation
          body = httpConfig.body
          contentType = 'multipart/form-data'
        } else if (httpConfig.bodyType === 'x-www-form-urlencoded') {
          body = httpConfig.body
          contentType = 'application/x-www-form-urlencoded'
        }

        if (contentType) {
          headers['Content-Type'] = contentType
        }
      }

      // Make HTTP request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), httpConfig.timeout || 10000)

      const response = await fetch(url, {
        method: httpConfig.method,
        headers,
        body: body || undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const responseText = await response.text()
      let responseData: unknown

      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }

      if (response.ok) {
        const dataStr = JSON.stringify(responseData, null, 2)
        const preview = dataStr.length > 1000 ? dataStr.substring(0, 1000) + '\n... (truncated)' : dataStr

        setTestResult({
          success: true,
          output: 'Success',
          details: `Method: ${httpConfig.method}\n` +
            `URL: ${url}\n` +
            `Status: ${response.status} ${response.statusText}\n` +
            `Content-Type: ${response.headers.get('content-type') || 'unknown'}\n\n` +
            `Response Data:\n${preview}`
        })
      } else {
        setTestResult({
          success: false,
          output: 'Failed',
          details: `Method: ${httpConfig.method}\n` +
            `URL: ${url}\n` +
            `Status: ${response.status} ${response.statusText}\n` +
            `Error: ${responseText.substring(0, 500)}`
        })
      }
    } catch (error) {
      console.error('[HTTP Tool] Error:', error)
      setTestResult({
        success: false,
        output: 'Error',
        details: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsExecuting(false)
    }
  }


  if (!toolNodeId || !toolNode) {
    return null
  }

  return (
    <div className={`${className} flex flex-col h-full border-l bg-background`}>
      <ToolConfigurationHeader
        toolLabel={toolLabel}
        toolNode={toolNode}
        attachedNode={attachedNode}
        onToolLabelChange={setToolLabel}
        onUpdateToolNode={updateToolNode}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {toolNode.type === 'tool:if' && (
          <ToolConditionBuilder
            conditionBuilder={conditionBuilder}
            xmlParent={xmlParent}
            xmlAncestors={xmlAncestors}
            xmlChildren={xmlChildren}
          />
        )}

        {toolNode.type === 'tool:switch' && (
          <ToolSwitchConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            attachedNode={attachedNode || null}
            switchSource={switchSource}
            switchAttributeName={switchAttributeName}
            switchCases={switchCases}
            switchCaseInputs={switchCaseInputs}
            onSwitchSourceChange={setSwitchSource}
            onSwitchAttributeNameChange={setSwitchAttributeName}
            onSwitchCasesChange={setSwitchCases}
            onSwitchCaseInputsChange={setSwitchCaseInputs}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:loop' && (
          <ToolLoopConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            loopConfig={loopConfig}
            loopInputValues={loopInputValues}
            xmlChildren={xmlChildren}
            onLoopConfigChange={setLoopConfig}
            onLoopInputValuesChange={setLoopInputValues}
            onUpdateToolNode={updateToolNode}
            getState={getState}
          />
        )}

        {toolNode.type === 'tool:merge' && (
          <ToolMergeConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            mergeConfig={mergeConfig}
            onMergeConfigChange={setMergeConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:filter' && (
          <ToolFilterConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            filterConfig={filterConfig}
            filterInputValues={filterInputValues}
            onFilterConfigChange={setFilterConfig}
            onFilterInputValuesChange={setFilterInputValues}
            onUpdateToolNode={updateToolNode}
            getState={getState}
          />
        )}

        {toolNode.type === 'tool:transform' && (
          <ToolTransformConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            transformConfig={transformConfig}
            onTransformConfigChange={setTransformConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Lookup Tool Configuration */}
        {toolNode.type === 'tool:lookup' && (
          <ToolLookupConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            lookupConfig={lookupConfig}
            onLookupConfigChange={setLookupConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:traverse' && (
          <ToolTraverseConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            traverseConfig={traverseConfig}
            onTraverseConfigChange={setTraverseConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:delay' && (
          <ToolDelayConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            delayConfig={delayConfig}
            onDelayConfigChange={setDelayConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}


        {toolNode.type === 'tool:aggregate' && (
          <ToolAggregateConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            aggregateConfig={aggregateConfig}
            onAggregateConfigChange={setAggregateConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:sort' && (
          <ToolSortConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            sortConfig={sortConfig}
            onSortConfigChange={setSortConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:limit' && (
          <ToolLimitConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            limitConfig={limitConfig}
            onLimitConfigChange={setLimitConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:collect' && (
          <ToolCollectConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            collectConfig={collectConfig}
            onCollectConfigChange={setCollectConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:split' && (
          <ToolSplitConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            splitConfig={splitConfig}
            onSplitConfigChange={setSplitConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:validate' && (
          <ToolValidateConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            validateConfig={validateConfig}
            onValidateConfigChange={setValidateConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:map' && (
          <ToolMapConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            mapConfig={mapConfig}
            onMapConfigChange={setMapConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:reduce' && (
          <ToolReduceConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            reduceConfig={reduceConfig}
            onReduceConfigChange={setReduceConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:partition' && (
          <ToolPartitionConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            partitionConfig={partitionConfig}
            onPartitionConfigChange={setPartitionConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:distinct' && (
          <ToolDistinctConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            distinctConfig={distinctConfig}
            onDistinctConfigChange={setDistinctConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:window' && (
          <ToolWindowConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            windowConfig={windowConfig}
            onWindowConfigChange={setWindowConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:join' && (
          <ToolJoinConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            joinConfig={joinConfig}
            onJoinConfigChange={setJoinConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:union' && (
          <ToolUnionConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            unionConfig={unionConfig}
            onUnionConfigChange={setUnionConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:intersect' && (
          <ToolIntersectConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            intersectConfig={intersectConfig}
            onIntersectConfigChange={setIntersectConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:diff' && (
          <ToolDiffConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            diffConfig={diffConfig}
            onDiffConfigChange={setDiffConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:exists' && (
          <ToolExistsConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            existsConfig={existsConfig}
            onExistsConfigChange={setExistsConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:range' && (
          <ToolRangeConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            rangeConfig={rangeConfig}
            onRangeConfigChange={setRangeConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:batch' && (
          <ToolBatchConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            batchConfig={batchConfig}
            onBatchConfigChange={setBatchConfig}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {(toolNode.type === 'tool:fetch-api' ||
          ['tool:fetch-orcid', 'tool:fetch-geonames', 'tool:fetch-europeana', 'tool:fetch-getty'].includes(toolNode.type) ||
          toolNode.type === 'tool:http') && (
            <ToolApiConfiguration
              toolNodeType={toolNode.type}
              toolNodeId={toolNodeId!}
              toolNode={toolNode}
              fetchApiConfig={fetchApiConfig}
              authenticatedApiConfig={authenticatedApiConfig}
              httpConfig={httpConfig}
              onFetchApiConfigChange={setFetchApiConfig}
              onAuthenticatedApiConfigChange={setAuthenticatedApiConfig}
              onHttpConfigChange={setHttpConfig}
              onUpdateToolNode={updateToolNode}
              getCredentialsByType={(type: string) => getCredentialsByType(type as any)}
              getCredential={getCredential}
            />
          )}


        {/* Test Execution Section for Authenticated API Tools */}
        {['tool:fetch-orcid', 'tool:fetch-geonames', 'tool:fetch-europeana', 'tool:fetch-getty'].includes(toolNode.type) && (
          <div className="mt-6 pt-4 border-t">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Test API Call</Label>
                <Button
                  size="sm"
                  onClick={handleExecuteAuthenticatedApiTest}
                  disabled={isExecuting || !authenticatedApiConfig.credentialId}
                  className="h-7 px-3 text-xs"
                >
                  <Play className="h-3 w-3 mr-1" />
                  {isExecuting ? 'Fetching...' : 'Test API'}
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Test ID (Optional)</Label>
                <Input
                  placeholder={authenticatedApiConfig.idSource === 'attribute'
                    ? `e.g., ${toolNode.type === 'tool:fetch-orcid' ? '0000-0002-1825-0097' : toolNode.type === 'tool:fetch-geonames' ? '2925533' : toolNode.type === 'tool:fetch-europeana' ? 'record-id' : '500026662'} (for ${authenticatedApiConfig.idAttribute || 'id'})`
                    : 'Enter ID to test'}
                  className="h-8 text-xs"
                  value={testIdInput}
                  onChange={(e) => setTestIdInput(e.target.value)}
                />
                <div className="text-[10px] text-muted-foreground">
                  {attachedNode
                    ? `Leave empty to use ID from attached node "${attachedNode.label}" (if available)`
                    : 'Enter an ID to test the API call. If a node is attached, the ID will be extracted from it.'}
                </div>
              </div>

              {testResult && (
                <div className={`p-3 rounded border-2 ${testResult.success
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                  }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    <span className={`text-xs font-semibold ${testResult.success
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                      }`}>
                      {testResult.output}
                    </span>
                  </div>
                  {testResult.details && (
                    <div className="text-[10px] text-muted-foreground font-mono bg-background/50 p-2 rounded mt-2 whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {testResult.details}
                    </div>
                  )}
                </div>
              )}

              {!testResult && !isExecuting && (
                <div className="text-[10px] text-muted-foreground p-2 bg-muted rounded">
                  Click &quot;Test API&quot; to fetch data from the configured API. You can enter a test ID manually or use the ID from the attached node.
                </div>
              )}
            </div>
          </div>
        )}


        {/* Test Execution Section for HTTP Tool */}
        {toolNode.type === 'tool:http' && (
          <div className="mt-6 pt-4 border-t">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Test HTTP Request</Label>
                <Button
                  size="sm"
                  onClick={handleExecuteHttpTest}
                  disabled={isExecuting || !httpConfig.url}
                  className="h-7 px-3 text-xs"
                >
                  <Play className="h-3 w-3 mr-1" />
                  {isExecuting ? 'Sending...' : 'Test Request'}
                </Button>
              </div>

              {testResult && (
                <div className={`p-3 rounded border-2 ${testResult.success
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                  }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    <span className={`text-xs font-semibold ${testResult.success
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                      }`}>
                      {testResult.output}
                    </span>
                  </div>
                  {testResult.details && (
                    <div className="text-[10px] text-muted-foreground font-mono bg-background/50 p-2 rounded mt-2 whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {testResult.details}
                    </div>
                  )}
                </div>
              )}

              {!testResult && !isExecuting && (
                <div className="text-[10px] text-muted-foreground p-2 bg-muted rounded">
                  Click &quot;Test Request&quot; to send the HTTP request and see the response.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Normalize Tool Configuration */}
        {toolNode.type === 'tool:normalize' && (
          <ToolSimpleConfigSection
            title="Normalize Configuration"
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            config={toolNode?.config || {}}
            fields={[
              {
                key: 'format',
                label: 'Format',
                type: 'select',
                helpText: 'Select the data format to normalize',
                selectOptions: [
                  { value: 'date', label: 'Date' },
                  { value: 'number', label: 'Number' },
                  { value: 'text', label: 'Text' },
                  { value: 'url', label: 'URL' }
                ]
              },
              {
                key: 'targetProperty',
                label: 'Target Property',
                type: 'text',
                placeholder: 'normalized'
              }
            ]}
            onConfigChange={(updates) => {
              updateToolNode(toolNodeId!, {
                config: { ...toolNode?.config, ...updates }
              })
            }}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Enrich Tool Configuration */}
        {toolNode.type === 'tool:enrich' && (
          <ToolEnrichConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Deduplicate Tool Configuration */}
        {toolNode.type === 'tool:deduplicate' && (
          <ToolDeduplicateConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Validate Schema Tool Configuration */}
        {toolNode.type === 'tool:validate-schema' && (
          <ToolValidateSchemaConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Clean Tool Configuration */}
        {toolNode.type === 'tool:clean' && (
          <ToolCleanConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Standardize Tool Configuration */}
        {toolNode.type === 'tool:standardize' && (
          <ToolSimpleConfigSection
            title="Standardize Configuration"
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            config={toolNode?.config || {}}
            fields={[
              {
                key: 'format',
                label: 'Format',
                type: 'select',
                helpText: 'Select the format to standardize',
                selectOptions: [
                  { value: 'address', label: 'Address' },
                  { value: 'name', label: 'Name' },
                  { value: 'phone', label: 'Phone' },
                  { value: 'email', label: 'Email' },
                  { value: 'text', label: 'Text' }
                ]
              },
              {
                key: 'targetProperty',
                label: 'Target Property',
                type: 'text',
                placeholder: 'standardized'
              }
            ]}
            onConfigChange={(updates) => {
              updateToolNode(toolNodeId!, {
                config: { ...toolNode?.config, ...updates }
              })
            }}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Verify Tool Configuration */}
        {toolNode.type === 'tool:verify' && (
          <ToolVerifyConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Try-Catch Tool Configuration */}
        {toolNode.type === 'tool:try-catch' && (
          <ToolSimpleConfigSection
            title="Try-Catch Configuration"
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            config={toolNode?.config || {}}
            fields={[
              {
                key: 'fallbackPath',
                label: 'Fallback Path',
                type: 'text',
                placeholder: 'error',
                helpText: 'Output path to use when an error occurs'
              }
            ]}
            onConfigChange={(updates) => {
              updateToolNode(toolNodeId!, {
                config: { ...toolNode?.config, ...updates }
              })
            }}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Retry Tool Configuration */}
        {toolNode.type === 'tool:retry' && (
          <ToolSimpleConfigSection
            title="Retry Configuration"
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            config={toolNode?.config || {}}
            fields={[
              {
                key: 'maxRetries',
                label: 'Max Retries',
                type: 'number',
                placeholder: '3'
              },
              {
                key: 'backoffMs',
                label: 'Backoff (ms)',
                type: 'number',
                placeholder: '1000'
              }
            ]}
            onConfigChange={(updates) => {
              updateToolNode(toolNodeId!, {
                config: { ...toolNode?.config, ...updates }
              })
            }}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Timeout Tool Configuration */}
        {toolNode.type === 'tool:timeout' && (
          <ToolSimpleConfigSection
            title="Timeout Configuration"
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            config={toolNode?.config || {}}
            fields={[
              {
                key: 'timeoutMs',
                label: 'Timeout (ms)',
                type: 'number',
                placeholder: '5000'
              },
              {
                key: 'timeoutPath',
                label: 'Timeout Path',
                type: 'text',
                placeholder: 'timeout'
              }
            ]}
            onConfigChange={(updates) => {
              updateToolNode(toolNodeId!, {
                config: { ...toolNode?.config, ...updates }
              })
            }}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Cache Tool Configuration */}
        {toolNode.type === 'tool:cache' && (
          <ToolSimpleConfigSection
            title="Cache Configuration"
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            config={toolNode?.config || {}}
            fields={[
              {
                key: 'cacheKey',
                label: 'Cache Key',
                type: 'text',
                placeholder: 'auto-generated',
                helpText: 'Leave empty to auto-generate from tool ID and parameters'
              },
              {
                key: 'ttl',
                label: 'TTL (ms)',
                type: 'number',
                placeholder: '300000',
                helpText: 'Time to live in milliseconds (default: 5 minutes)'
              }
            ]}
            onConfigChange={(updates) => {
              updateToolNode(toolNodeId!, {
                config: { ...toolNode?.config, ...updates }
              })
            }}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Parallel Tool Configuration */}
        {toolNode.type === 'tool:parallel' && (
          <ToolSimpleConfigSection
            title="Parallel Configuration"
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            config={toolNode?.config || {}}
            fields={[
              {
                key: 'maxConcurrency',
                label: 'Max Concurrency',
                type: 'number',
                placeholder: '5',
                helpText: 'Maximum number of operations to run in parallel'
              }
            ]}
            onConfigChange={(updates) => {
              updateToolNode(toolNodeId!, {
                config: { ...toolNode?.config, ...updates }
              })
            }}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Throttle Tool Configuration */}
        {toolNode.type === 'tool:throttle' && (
          <ToolSimpleConfigSection
            title="Throttle Configuration"
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            config={toolNode?.config || {}}
            fields={[
              {
                key: 'requestsPerSecond',
                label: 'Requests Per Second',
                type: 'number',
                placeholder: '10'
              }
            ]}
            onConfigChange={(updates) => {
              updateToolNode(toolNodeId!, {
                config: { ...toolNode?.config, ...updates }
              })
            }}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Webhook Tool Configuration */}
        {toolNode.type === 'tool:webhook' && (
          <ToolWebhookConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Email Tool Configuration */}
        {toolNode.type === 'tool:email' && (
          <ToolEmailConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Log Tool Configuration */}
        {toolNode.type === 'tool:log' && (
          <ToolLogConfiguration
            toolNodeId={toolNodeId!}
            toolNode={toolNode}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {!['tool:if', 'tool:switch', 'tool:loop', 'tool:merge', 'tool:filter', 'tool:transform', 'tool:lookup', 'tool:traverse', 'tool:delay', 'tool:aggregate', 'tool:sort', 'tool:limit', 'tool:collect', 'tool:split', 'tool:validate', 'tool:map', 'tool:reduce', 'tool:partition', 'tool:distinct', 'tool:window', 'tool:join', 'tool:union', 'tool:intersect', 'tool:diff', 'tool:exists', 'tool:range', 'tool:batch', 'tool:fetch-api', 'tool:fetch-orcid', 'tool:fetch-geonames', 'tool:fetch-europeana', 'tool:fetch-getty', 'tool:http', 'tool:normalize', 'tool:enrich', 'tool:deduplicate', 'tool:validate-schema', 'tool:clean', 'tool:standardize', 'tool:verify', 'tool:try-catch', 'tool:retry', 'tool:timeout', 'tool:cache', 'tool:parallel', 'tool:throttle', 'tool:webhook', 'tool:email', 'tool:log'].includes(toolNode.type) && (
          <div className="text-xs text-muted-foreground text-center py-4">
            Configuration for {toolNode.type} will be available soon.
          </div>
        )}

        {toolNode.type === 'tool:fetch-api' && (
          <ToolTestExecution
            toolNode={toolNode}
            toolNodeType={toolNode.type}
            testResult={testResult}
            isExecuting={isExecuting}
            testIdInput={testIdInput}
            onTestIdInputChange={setTestIdInput}
            executedApiResponse={executedApiResponse}
            responseHistory={responseHistory}
            apiResponseModalOpen={apiResponseModalOpen}
            onApiResponseModalOpenChange={setApiResponseModalOpen}
            onResponseHistoryChange={setResponseHistory}
            onExecuteTest={handleExecuteFetchApiTest}
            onUpdateToolNode={updateToolNode}
            disabled={!fetchApiConfig.apiProvider}
            showTestIdInput={true}
            testIdPlaceholder={fetchApiConfig.idSource === 'attribute'
              ? `e.g., Q42 (for ${fetchApiConfig.idAttribute || 'wiki:id'})`
              : 'Enter ID to test'}
            testIdHelpText={attachedNode
              ? `Leave empty to use ID from attached node "${attachedNode.label}" (if available)`
              : 'Enter an ID to test the API call. If a node is attached, the ID will be extracted from it.'}
            showApiResponse={true}
          />
        )}

        {((toolNode.type === 'tool:if' && conditionGroups.length > 0) || (toolNode.type === 'tool:switch' && switchCases.length > 0)) && (
          <ToolTestExecution
            toolNode={toolNode}
            toolNodeType={toolNode.type}
            testResult={testResult}
            isExecuting={isExecuting}
            onExecuteTest={handleExecuteTest}
            conditionGroupsLength={toolNode.type === 'tool:if' ? conditionGroups.length : undefined}
            switchCasesLength={toolNode.type === 'tool:switch' ? switchCases.length : undefined}
          />
        )}
      </div>
    </div>
  )
}

