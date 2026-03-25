import { useCallback, useMemo } from 'react'
import { useToolConfigurationStore } from '../../stores/toolConfigurationStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useCredentialsStore } from '../../stores/credentialsStore'
import { fetchFromApi, type ApiProvider } from '../../services/apiClient'
import { toast } from '../../utils/toast'
import type { Condition, ConditionGroup, SwitchSource, SwitchCase } from '../../components/sidebars/ToolConfigurationSidebar'

export interface TestElementData {
  tagName: string
  children: Array<{ tagName: string }>
  attributes: Record<string, string>
  textContent: string
  parent?: { tagName: string } | null
  ancestors?: string[]
  descendants?: string[]
}

function evaluateCondition(condition: Condition, element: TestElementData): boolean {
  switch (condition.type) {
    case 'HasChildren': {
      const validValues = (condition.values || []).filter(v => v && v.trim() !== '')
      if (validValues.length === 0) {
        return element.children.length > 0
      }
      const childNames = element.children.map(c => c.tagName.toLowerCase().trim())
      const matches = validValues.map(v => childNames.includes(v.toLowerCase().trim()))
      const operator = condition.internalOperator || 'OR'
      return operator === 'AND' ? matches.every(m => m) : matches.some(m => m)
    }
    case 'HasNoChildren': {
      const validValues = (condition.values || []).filter(v => v && v.trim() !== '')
      if (validValues.length === 0) {
        return element.children.length === 0
      }
      const childNames = element.children.map(c => c.tagName.toLowerCase().trim())
      const notPresent = validValues.map(v => !childNames.includes(v.toLowerCase().trim()))
      const operator = condition.internalOperator || 'AND'
      return operator === 'AND' ? notPresent.every(n => n) : notPresent.some(n => n)
    }
    case 'HasDescendant': {
      const validValues = [
        ...(condition.values || []),
        ...(condition.value ? [condition.value] : [])
      ].filter(v => v && v.trim() !== '')
      const descendants = element.descendants || []
      if (validValues.length === 0) {
        return descendants.length > 0
      }
      const matches = validValues.map(v =>
        descendants.some(d => d.toLowerCase().trim() === v.toLowerCase().trim())
      )
      const operator = condition.internalOperator || 'OR'
      return operator === 'AND' ? matches.every(m => m) : matches.some(m => m)
    }
    case 'HasAncestor': {
      const validValues = [
        ...(condition.values || []),
        ...(condition.value ? [condition.value] : [])
      ].filter(v => v && v.trim() !== '')
      if (validValues.length === 0) {
        return (element.ancestors && element.ancestors.length > 0) || !!element.parent
      }
      const ancestors = element.ancestors || []
      if (element.parent && !ancestors.includes(element.parent.tagName)) {
        ancestors.push(element.parent.tagName)
      }
      const matches = validValues.map(v =>
        ancestors.some(a => a.toLowerCase().trim() === v.toLowerCase().trim())
      )
      const operator = condition.internalOperator || 'OR'
      return operator === 'AND' ? matches.every(m => m) : matches.some(m => m)
    }
    case 'HasParent': {
      if (!element.parent) return false
      if (!condition.value || condition.value.trim() === '') return true
      const parentTag = element.parent.tagName.toLowerCase().trim()
      const conditionValue = condition.value.toLowerCase().trim()
      return parentTag === conditionValue
    }
    case 'HasAttribute': {
      if (!condition.attributeName) return false
      return condition.attributeName in element.attributes
    }
    case 'HasTextContent': {
      return element.textContent.trim().length > 0
    }
    case 'ElementNameEquals': {
      if (!condition.value) return false
      return element.tagName.toLowerCase().trim() === condition.value.toLowerCase().trim()
    }
    case 'AttributeValueEquals': {
      if (!condition.attributeName || !condition.value) return false
      const attrValue = element.attributes[condition.attributeName]
      if (attrValue === undefined) return false
      return attrValue === condition.value
    }
    case 'ChildCount': {
      const count = element.children.length
      if (condition.min !== undefined && count < condition.min) return false
      if (condition.max !== undefined && count > condition.max) return false
      return true
    }
    default:
      return false
  }
}

function evaluateConditionGroup(group: ConditionGroup, element: TestElementData): boolean {
  if (group.conditions.length === 0) return true
  const results = group.conditions.map(c => evaluateCondition(c, element))
  const operator = group.internalOperator || 'AND'
  return operator === 'AND' ? results.every(r => r) : results.some(r => r)
}

function evaluateAllGroups(groups: ConditionGroup[], element: TestElementData): boolean {
  if (groups.length === 0) return true
  let finalResult = evaluateConditionGroup(groups[0], element)
  for (let i = 1; i < groups.length; i++) {
    const groupResult = evaluateConditionGroup(groups[i], element)
    const operator = groups[i].operator || 'AND'
    if (operator === 'AND') {
      finalResult = finalResult && groupResult
    } else {
      finalResult = finalResult || groupResult
    }
  }
  return finalResult
}

export function useToolTestExecution(toolNodeId: string | null) {
  const config = useToolConfigurationStore((state) => state.config)
  const testResult = useToolConfigurationStore((state) => state.testResult)
  const setTestResult = useToolConfigurationStore((state) => state.setTestResult)
  const isExecuting = useToolConfigurationStore((state) => state.isExecuting)
  const setIsExecuting = useToolConfigurationStore((state) => state.setIsExecuting)
  const testIdInput = useToolConfigurationStore((state) => state.testIdInput)
  const setTestIdInput = useToolConfigurationStore((state) => state.setTestIdInput)
  const executedApiResponse = useToolConfigurationStore((state) => state.executedApiResponse)
  const setExecutedApiResponse = useToolConfigurationStore((state) => state.setExecutedApiResponse)
  const apiResponseModalOpen = useToolConfigurationStore((state) => state.apiResponseModalOpen)
  const setApiResponseModalOpen = useToolConfigurationStore((state) => state.setApiResponseModalOpen)
  const responseHistory = useToolConfigurationStore((state) => state.responseHistory)
  const setResponseHistory = useToolConfigurationStore((state) => state.setResponseHistory)
  const connectionStatus = useToolConfigurationStore((state) => state.connectionStatus)
  const setConnectionStatus = useToolConfigurationStore((state) => state.setConnectionStatus)
  const validationErrors = useToolConfigurationStore((state) => state.validationErrors)
  const setValidationErrors = useToolConfigurationStore((state) => state.setValidationErrors)
  
  const toolNode = useToolCanvasStore((state) => state.nodes.find(n => n.id === toolNodeId))
  const updateToolNode = useToolCanvasStore((state) => state.updateNode)
  const getCredential = useCredentialsStore((state) => state.getCredential)

  // Derived from config
  const conditionGroups = useMemo(() => (config.conditionGroups as ConditionGroup[]) || [], [config.conditionGroups])
  const switchSource = useMemo(() => (config.switchSource as SwitchSource) || 'attribute', [config.switchSource])
  const switchAttributeName = useMemo(() => (config.switchAttributeName as string) || '', [config.switchAttributeName])
  const switchCases = useMemo(() => (config.switchCases as SwitchCase[]) || [], [config.switchCases])
  const switchCaseInputs = useMemo(() => (config.switchCaseInputs as Record<string, string>) || {}, [config.switchCaseInputs])

  const createTestElement = useCallback((
    attachedNode?: { label?: string; type?: string; properties?: Array<{ key: string }> } | null,
    xmlChildren?: Array<{ name: string; count?: number }>,
    xmlAncestors?: string[],
    xmlParent?: string,
    xmlTypeStats?: { attributesCount?: number; hasTextContent?: boolean },
    xmlAttributes?: Record<string, string>,
    xmlDescendants?: string[]
  ): TestElementData => {
    const tagName = attachedNode?.label || attachedNode?.type || 'test-element'
    const children = (xmlChildren || []).flatMap(child => {
      const count = child.count && child.count > 0 ? child.count : 1
      return Array(count).fill({ tagName: child.name })
    })
    const attributes: Record<string, string> = xmlAttributes ? { ...xmlAttributes } : {}
    if (attachedNode?.properties && (attachedNode.properties as any[]).length > 0) {
      (attachedNode.properties as any[]).forEach((prop) => {
        if (!(prop.key in attributes)) {
          attributes[prop.key] = `test-${prop.key}`
        }
      })
    }
    const hasText = xmlTypeStats?.hasTextContent !== false
    return {
      tagName,
      children,
      attributes,
      textContent: hasText ? 'Sample text content' : '',
      parent: xmlParent ? { tagName: xmlParent } : null,
      ancestors: xmlAncestors || [],
      descendants: xmlDescendants || []
    }
  }, [])

  const handleExecuteConditionTest = useCallback((
    createTestElementFn: () => TestElementData
  ) => {
    const isSwitchTool = toolNode?.type === 'tool:switch'
    if (!isSwitchTool && conditionGroups.length === 0) {
      setTestResult({
        success: false,
        output: 'No conditions configured',
        details: 'Please add at least one condition group before testing.'
      })
      return
    }
    if (isSwitchTool && switchCases.length === 0) {
      setTestResult({
        success: false,
        output: 'No cases configured',
        details: 'Please add at least one case to the switch configuration.'
      })
      return
    }
    setIsExecuting(true)
    setTimeout(() => {
      try {
        const testElement = createTestElementFn()
        if (isSwitchTool) {
          let matchValue: string = ''
          if (switchSource === 'elementName') {
            matchValue = testElement.tagName
          } else if (switchSource === 'textContent') {
            matchValue = testElement.textContent
          } else if (switchSource === 'attribute') {
            matchValue = testElement.attributes[switchAttributeName] || ''
          }
          const matchedCase = switchCases.find(c => {
            const expectedValue = switchCaseInputs[c.id] ?? c.value
            return (expectedValue || '').toLowerCase().trim() === (matchValue || '').toLowerCase().trim()
          })
          setTestResult({
            success: !!matchedCase,
            output: matchedCase ? `Matched: ${matchedCase.label}` : 'No Match',
            details: `Value found: "${matchValue}"\nMatched Case: ${matchedCase?.label || 'None'}`
          })
        } else {
          const result = evaluateAllGroups(conditionGroups, testElement)
          setTestResult({
            success: result,
            output: result ? 'true' : 'false',
            details: 'Condition evaluation complete.'
          })
        }
      } catch (error) {
        setTestResult({
          success: false,
          output: 'Error',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      } finally {
        setIsExecuting(false)
      }
    }, 300)
  }, [toolNode, conditionGroups, switchCases, switchSource, switchAttributeName, switchCaseInputs, setTestResult, setIsExecuting])

  const handleExecuteFetchApiTest = useCallback(async (
    fetchApiConfig: any,
    createTestElementFn: () => TestElementData
  ) => {
    if (!fetchApiConfig.apiProvider) {
      setTestResult({ success: false, output: 'Error', details: 'Provider required' })
      return
    }
    setConnectionStatus('pending')
    setIsExecuting(true)
    try {
      let testId = testIdInput.trim()
      const testElement = createTestElementFn()
      
      if (!testId) {
        if (fetchApiConfig.idSource === 'attribute') {
          testId = testElement.attributes[fetchApiConfig.idAttribute] || ''
        } else if (fetchApiConfig.idSource === 'textContent') {
          testId = testElement.textContent?.trim() || ''
        }
      }
      if (!testId) {
        setTestResult({ 
          success: false, 
          output: 'Error', 
          details: `No ID found using ${fetchApiConfig.idSource}${fetchApiConfig.idSource === 'attribute' ? ` (attribute: ${fetchApiConfig.idAttribute})` : ''}. Available attributes: ${JSON.stringify(Object.keys(testElement.attributes))}` 
        })
        setConnectionStatus('error')
        return
      }
      const response = await fetchFromApi({
        provider: fetchApiConfig.apiProvider as ApiProvider,
        id: testId,
        apiKey: fetchApiConfig.apiKey,
        timeout: fetchApiConfig.timeout || 10000
      })
      if (response.success && response.data) {
        setExecutedApiResponse(response.data)
        if (toolNode) {
          updateToolNode(toolNode.id, {
            config: { ...toolNode.config, executedResponse: response.data, executedTestId: testId }
          })
        }
        setConnectionStatus('connected')
        setTestResult({ success: true, output: 'Success', details: `Successfully fetched data for ID: ${testId}` })
        toast.success('API success')
      } else {
        setConnectionStatus('error')
        setTestResult({ 
          success: false, 
          output: 'Failed', 
          details: `API Error: ${response.error || 'Unknown error'}\nID used: ${testId}` 
        })
        toast.error('API failed')
      }
    } catch (error) {
      setConnectionStatus('error')
      setTestResult({ 
        success: false, 
        output: 'Error', 
        details: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setIsExecuting(false)
    }
  }, [toolNode, updateToolNode, testIdInput, setExecutedApiResponse, setConnectionStatus, setIsExecuting, setTestResult])

  const handleExecuteAuthenticatedApiTest = useCallback(async (
    authenticatedApiConfig: any,
    attachedNode: any,
    realInstanceData: any
  ) => {
    if (!authenticatedApiConfig.credentialId) {
      setTestResult({ success: false, output: 'Error', details: 'Credential required' })
      return
    }
    setIsExecuting(true)
    try {
      let testId = testIdInput.trim()
      if (!testId && (attachedNode || realInstanceData)) {
        if (authenticatedApiConfig.idSource === 'attribute') {
          testId = (realInstanceData?.attributes || attachedNode?.data?.xmlAttributes)?.[authenticatedApiConfig.idAttribute] || ''
        } else if (authenticatedApiConfig.idSource === 'textContent') {
          testId = (realInstanceData?.textContent || attachedNode?.data?.xmlTextContent)?.trim() || ''
        }
      }
      if (!testId) {
        setTestResult({ success: false, output: 'Error', details: 'No ID found' })
        return
      }
      const response = await fetchFromApi({
        provider: (authenticatedApiConfig.apiProvider as ApiProvider) || 'orcid',
        id: testId,
        credentialId: authenticatedApiConfig.credentialId,
        timeout: authenticatedApiConfig.timeout || 10000
      }, (credId) => {
        const cred = getCredential(credId)
        return cred ? { data: cred.data } : undefined
      })
      setTestResult({
        success: response.success,
        output: response.success ? 'Success' : 'Failed',
        details: response.success ? 'Success' : response.error
      })
    } finally {
      setIsExecuting(false)
    }
  }, [testIdInput, getCredential, setIsExecuting, setTestResult])

  const handleExecuteHttpTest = useCallback(async (httpConfig: any) => {
    if (!httpConfig.url) {
      setTestResult({ success: false, output: 'Error', details: 'URL required' })
      return
    }
    setIsExecuting(true)
    try {
      const response = await fetch(httpConfig.url, { method: httpConfig.method })
      setTestResult({ success: response.ok, output: response.ok ? 'Success' : 'Failed' })
    } catch {
      setTestResult({ success: false, output: 'Error' })
    } finally {
      setIsExecuting(false)
    }
  }, [setIsExecuting, setTestResult])

  return {
    testResult,
    setTestResult,
    isExecuting,
    setIsExecuting,
    testIdInput,
    setTestIdInput,
    executedApiResponse,
    setExecutedApiResponse,
    apiResponseModalOpen,
    setApiResponseModalOpen,
    responseHistory,
    setResponseHistory,
    connectionStatus,
    setConnectionStatus,
    validationErrors,
    setValidationErrors,
    handleExecuteConditionTest,
    handleExecuteFetchApiTest,
    handleExecuteAuthenticatedApiTest,
    handleExecuteHttpTest,
    createTestElement,
    evaluateCondition,
    evaluateConditionGroup,
    evaluateAllGroups
  }
}
