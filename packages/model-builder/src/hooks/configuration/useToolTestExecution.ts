import { useCallback } from 'react'
import { useToolConfigurationStore } from '../../stores/toolConfigurationStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import type { Condition, ConditionGroup } from '../../components/sidebars/ToolConfigurationSidebar'

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
      // If no specific children specified, check if it has NO children at all (is leaf)
      const validValues = (condition.values || []).filter(v => v && v.trim() !== '')
      if (validValues.length === 0) {
        return element.children.length === 0
      }
      const childNames = element.children.map(c => c.tagName.toLowerCase().trim())
      // Check if NONE of the specified children are present
      const matches = validValues.map(v => childNames.includes(v.toLowerCase().trim()))
      // If operator is AND, we want NONE of them to be present (so all must NOT be present)
      // If operator is OR, we want AT LEAST ONE to NOT be present? No, usually HasNoChildren([A, B]) means "Does not have A AND Does not have B".
      // But let's stick to the inverse logic.

      const notPresent = validValues.map(v => !childNames.includes(v.toLowerCase().trim()))
      const operator = condition.internalOperator || 'AND'
      return operator === 'AND' ? notPresent.every(n => n) : notPresent.some(n => n)
    }
    case 'HasDescendant': {
      // Collect valid values
      const validValues = [
        ...(condition.values || []),
        ...(condition.value ? [condition.value] : [])
      ].filter(v => v && v.trim() !== '')

      const descendants = element.descendants || []

      // If no valid values, check if ANY descendant exists
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
      // Collect valid values from both singular value and array values
      const validValues = [
        ...(condition.values || []),
        ...(condition.value ? [condition.value] : [])
      ].filter(v => v && v.trim() !== '')

      // If no valid values, check if ANY ancestor exists
      if (validValues.length === 0) {
        return (element.ancestors && element.ancestors.length > 0) || !!element.parent
      }

      const ancestors = element.ancestors || []
      // If we have a parent but it's not in ancestors list, add it for the check
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
      // If no valid value specified, just check if parent exists (which we verified above)
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
  const conditionGroups = useToolConfigurationStore((state) => state.conditionGroups)
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
  const getState = useToolConfigurationStore.getState

  const createTestElement = useCallback((
    attachedNode?: { label?: string; type?: string; properties?: Array<{ key: string }> } | null,
    xmlChildren?: Array<{ name: string }>,
    xmlAncestors?: string[],
    xmlParent?: string,
    xmlTypeStats?: { attributesCount?: number; hasTextContent?: boolean },
    xmlAttributes?: Record<string, string>,
    xmlDescendants?: string[]
  ): TestElementData => {
    const tagName = attachedNode?.label || attachedNode?.type || 'test-element'
    const children = (xmlChildren || []).map(child => ({ tagName: child.name }))

    // Start with provided XML attributes (real or fallback from sidebar)
    const attributes: Record<string, string> = xmlAttributes ? { ...xmlAttributes } : {}

    // Fill in missing properties from schema with mock values if not present
    if (attachedNode?.properties && attachedNode.properties.length > 0) {
      attachedNode.properties.forEach((prop) => {
        if (!(prop.key in attributes)) {
          attributes[prop.key] = `test-${prop.key}`
        }
      })
    } else if (Object.keys(attributes).length === 0 && xmlTypeStats?.attributesCount && xmlTypeStats.attributesCount > 0) {
      // Fallback only if no attributes exist at all and we didn't receive any fallback attributes
      // (This block might be redundant if sidebar always provides fallback attributes, but kept for safety)
      attributes['id'] = 'test-id'
      attributes['xml:id'] = 'test-xml-id'
    }

    // Determine text content based on stats
    const hasText = xmlTypeStats?.hasTextContent !== false // Default to true if unknown, unless explicitly false

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
    if (conditionGroups.length === 0) {
      setTestResult({
        success: false,
        output: 'No conditions configured',
        details: 'Please add at least one condition group before testing.'
      })
      return
    }

    setIsExecuting(true)

    setTimeout(() => {
      try {
        const testElement = createTestElementFn()
        const result = evaluateAllGroups(conditionGroups, testElement)

        const groupResults = conditionGroups.map((group, idx) => {
          const groupResult = evaluateConditionGroup(group, testElement)
          const conditionDetails = group.conditions.map(c => {
            const condResult = evaluateCondition(c, testElement)
            let details = `  - ${c.type}: ${condResult ? '✓' : '✗'}`

            if (c.type === 'HasParent') {
              const actualParent = testElement.parent?.tagName || 'none'
              const expectedParent = c.value || '(not set)'
              details += ` (expected: "${expectedParent}", actual: "${actualParent}")`
            } else if (c.type === 'HasAncestor') {
              const actualAncestors = (testElement.ancestors || []).join(', ') || 'none'
              const expectedAncestors = c.values?.join(', ') || c.value || '(not set)'
              const operator = c.internalOperator || 'OR'
              const ancestors = testElement.ancestors || []
              const matches = c.values?.map(v =>
                ancestors.some(a => a.toLowerCase().trim() === v.toLowerCase().trim())
              ) || []
              const hasAncestor = matches.length > 0 && (operator === 'AND' ? matches.every(m => m) : matches.some(m => m))
              details += ` (expected: [${expectedAncestors}], ancestors: [${actualAncestors}], operator: ${operator}, found: ${hasAncestor})`
            } else if (c.type === 'HasAttribute') {
              const hasAttr = c.attributeName ? (c.attributeName in testElement.attributes) : false
              const attrValue = c.attributeName ? (testElement.attributes[c.attributeName] || '(no value)') : '(not set)'
              details += ` (attribute: "${c.attributeName || '(not set)'}", found: ${hasAttr}, value: "${attrValue}")`
            } else if (c.type === 'HasChildren' || c.type === 'HasNoChildren') {
              const childNames = testElement.children.map(ch => ch.tagName).join(', ')
              const expected = c.values?.join(', ') || '(not set)'
              const operator = c.internalOperator || 'OR'
              details += ` (expected: [${expected}], actual: [${childNames}], operator: ${operator})`
            } else if (c.type === 'ChildCount') {
              const actualCount = testElement.children.length
              const minStr = c.min !== undefined ? c.min.toString() : 'none'
              const maxStr = c.max !== undefined ? c.max.toString() : 'none'
              const inRange = (c.min === undefined || actualCount >= c.min) &&
                (c.max === undefined || actualCount <= c.max)
              details += ` (count: ${actualCount}, min: ${minStr}, max: ${maxStr}, in range: ${inRange})`
            } else if (c.type === 'HasTextContent') {
              const hasText = testElement.textContent.trim().length > 0
              const textLength = testElement.textContent.trim().length
              details += ` (has text: ${hasText}, length: ${textLength})`
            } else if (c.type === 'ElementNameEquals') {
              const actualName = testElement.tagName
              const expectedName = c.value || '(not set)'
              const matches = actualName.toLowerCase() === expectedName.toLowerCase()
              details += ` (expected: "${expectedName}", actual: "${actualName}", matches: ${matches})`
            } else if (c.type === 'AttributeValueEquals') {
              const actualValue = c.attributeName ? (testElement.attributes[c.attributeName] || '(not found)') : '(attribute not set)'
              const expectedValue = c.value || '(not set)'
              const matches = c.attributeName && c.value
                ? (testElement.attributes[c.attributeName] === c.value)
                : false
              details += ` (attribute: "${c.attributeName || '(not set)'}", expected: "${expectedValue}", actual: "${actualValue}", matches: ${matches})`
            }
            return details
          }).join('\n')
          return `Group ${idx + 1} (${groupResult ? 'PASS' : 'FAIL'}):\n${conditionDetails}`
        }).join('\n\n')

        setTestResult({
          success: result,
          output: result ? 'true' : 'false',
          details: `Element: ${testElement.tagName}\n` +
            `Children: ${testElement.children.map(c => c.tagName).join(', ') || 'none'}\n` +
            `Attributes: ${Object.keys(testElement.attributes).join(', ') || 'none'}\n` +
            `Parent: ${testElement.parent?.tagName || 'none'}\n` +
            `Ancestors: ${(testElement.ancestors || []).join(', ') || 'none'}\n` +
            `Text Content: ${testElement.textContent ? 'Yes' : 'No'}\n\n` +
            `Evaluation Breakdown:\n${groupResults}`
        })
      } catch (error) {
        setTestResult({
          success: false,
          output: 'Error',
          details: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      } finally {
        setIsExecuting(false)
      }
    }, 300)
  }, [conditionGroups, setTestResult, setIsExecuting])

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
    createTestElement,
    evaluateCondition,
    evaluateConditionGroup,
    evaluateAllGroups
  }
}

