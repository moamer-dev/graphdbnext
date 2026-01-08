import { useCallback } from 'react'
import { useActionConfigurationStore } from '../../stores/actionConfigurationStore'

export function useActionTestExecution() {
  const testResult = useActionConfigurationStore((state) => state.testResult)
  const setTestResult = useActionConfigurationStore((state) => state.setTestResult)
  const isExecuting = useActionConfigurationStore((state) => state.isExecuting)
  const setIsExecuting = useActionConfigurationStore((state) => state.setIsExecuting)
  const graphResult = useActionConfigurationStore((state) => state.graphResult)
  const setGraphResult = useActionConfigurationStore((state) => state.setGraphResult)
  const showGraphModal = useActionConfigurationStore((state) => state.showGraphModal)
  const setShowGraphModal = useActionConfigurationStore((state) => state.setShowGraphModal)

  const handleExecuteTest = useCallback(async (
    executeWorkflowFn: () => Promise<Array<Record<string, unknown>>>
  ) => {
    setIsExecuting(true)
    setTestResult(null)
    
    try {
      const graph = await executeWorkflowFn()
      
      const graphItems = graph.map(item => ({ ...item } as Record<string, unknown>))
      
      setGraphResult(graphItems)
      setShowGraphModal(true)
      
      setTestResult({
        success: true,
        output: 'Success',
        details: `Graph generated successfully with ${graphItems.length} ${graphItems.length === 1 ? 'item' : 'items'}`
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
  }, [setIsExecuting, setTestResult, setGraphResult, setShowGraphModal])

  return {
    testResult,
    setTestResult,
    isExecuting,
    setIsExecuting,
    graphResult,
    showGraphModal,
    setShowGraphModal,
    handleExecuteTest
  }
}

