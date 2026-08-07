import { useState, useEffect, useRef, useCallback } from 'react'
import { createHash } from 'crypto'
import { toast } from '../../utils/toast'
import { workflowService } from '../../services/workflow/workflowService'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'
import { useXmlImportWizardStore } from '../../stores/xmlImportWizardStore'
import { executeWorkflow } from '../../services/workflow/workflowExecutor'
import { convertBuilderToSchemaJson } from '../../utils/schemaJsonConverter'
import { extractXmlElements } from '../../utils/xmlElementExtractor'
import { WorkflowConfigExport, importWorkflowConfig } from '../../utils/workflowConfigExport'
import { Node, Relationship } from '../../types'

interface UseWorkflowLifecycleProps {
  initialWorkflow?: WorkflowConfigExport | null
  nodes: Node[]
  relationships: Relationship[]
  ui: any // From useModelBuilderUI
}

export const useWorkflowLifecycle = ({
  initialWorkflow,
  nodes,
  relationships,
  ui
}: UseWorkflowLifecycleProps) => {
  const workflowLoadedRef = useRef(false)
  const lastWorkflowIdRef = useRef<string | null>(null)
  const [xmlContent, setXmlContent] = useState<string>('')
  const { setRunning, setExecutionProgress, setGraphPreview, setXmlFile, xmlFile } = ui
  const xmlFileFromWizard = useXmlImportWizardStore((state: any) => state.selectedFile)
  const xmlFileToLoad = xmlFileFromWizard || xmlFile

  const handleLoadWorkflowFromConfig = useCallback((wf: any) => {
    try {
      const config = wf?.config || wf
      if (!config) return
      const imported = importWorkflowConfig(
        typeof config === 'string' ? config : JSON.stringify(config), 
        nodes
      )
      const result = workflowService.applyWorkflowConfig(imported, nodes)
      return result
    } catch (err) {
      console.error('Failed to parse and apply workflow config:', err)
      throw err
    }
  }, [nodes])

  // Load XML content when XML file is available
  useEffect(() => {
    const loadXmlContent = async () => {
      if (xmlFileToLoad) {
        try {
          const text = await xmlFileToLoad.text()
          setXmlContent(text)
        } catch (error) {
          console.error('Error loading XML file:', error)
          setXmlContent('')
        }
      } else {
        setXmlContent('')
      }
    }
    loadXmlContent()
  }, [xmlFileToLoad])

  const handleUploadXml = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    useXmlImportWizardStore.getState().setSelectedFile(file)
    
    try {
      setXmlFile(file)
      const elementInfo = await extractXmlElements(file)
      useXmlImportWizardStore.getState().setAvailableElements(elementInfo)
      toast.success(`XML file uploaded: ${file.name}`)
    } catch (err) {
      console.error('Failed to extract elements', err)
      toast.error('Failed to parse XML file')
      setXmlFile(file)
      useXmlImportWizardStore.getState().setSelectedFile(file)
    }
  }, [setXmlFile])

  // Initial workflow loading
  useEffect(() => {
    if (initialWorkflow && nodes.length > 0) {
      const config = (initialWorkflow as any)?.config || initialWorkflow
      const workflowId = (initialWorkflow as any)?.id || `${config?.version}_${config?.createdAt}_${JSON.stringify(config?.tools || [])}`
      const isDifferentWorkflow = lastWorkflowIdRef.current !== workflowId

      if (isDifferentWorkflow) {
        workflowLoadedRef.current = false
        lastWorkflowIdRef.current = workflowId
        useToolCanvasStore.getState().clear()
        useActionCanvasStore.getState().clear()
        workflowLoadedRef.current = true

        setTimeout(() => {
          try {
            handleLoadWorkflowFromConfig(initialWorkflow)
          } catch (error) {
            console.error('Error loading initial workflow:', error)
          }
        }, 100)
      }
    }
  }, [initialWorkflow, nodes, handleLoadWorkflowFromConfig])

  // Custom event listener for workflow loading
  useEffect(() => {
    const handleWorkflowLoad = (event: CustomEvent<{ workflow: { id: string; config: unknown } }>) => {
      const { workflow } = event.detail
      workflowLoadedRef.current = false
      useToolCanvasStore.getState().clear()
      useActionCanvasStore.getState().clear()

      setTimeout(() => {
        try {
          const config = workflow.config as WorkflowConfigExport
          handleLoadWorkflowFromConfig(config)
        } catch (error) {
          console.error('Error loading workflow from event:', error)
        }
      }, 100)
    }

    window.addEventListener('plexus-builder:load-workflow', handleWorkflowLoad as EventListener)
    return () => {
      window.removeEventListener('plexus-builder:load-workflow', handleWorkflowLoad as EventListener)
    }
  }, [handleLoadWorkflowFromConfig])

  const handleRunWorkflow = useCallback(async () => {
    if (!xmlFileToLoad) {
      setGraphPreview({ items: [], fullGraph: [] })
      return
    }

    setRunning(true)
    setGraphPreview(null)
    setExecutionProgress({ current: 0, total: 100, currentStep: 'Loading XML...' })

    try {
      // Use the current xmlContent state (which includes manual edits)
      const text = xmlContent
      setExecutionProgress({ current: 10, total: 100, currentStep: 'Converting schema...' })

      const schemaJson = convertBuilderToSchemaJson(nodes, relationships)
      setExecutionProgress({ current: 20, total: 100, currentStep: 'Executing workflow...' })

      const toolNodes = useToolCanvasStore.getState().nodes
      const toolEdges = useToolCanvasStore.getState().edges
      const actionNodes = useActionCanvasStore.getState().nodes
      const actionEdges = useActionCanvasStore.getState().edges
      const rootNodeId = useModelBuilderStore.getState().rootNodeId

      const graph = await executeWorkflow({
        xmlContent: text,
        schemaJson,
        nodes,
        relationships,
        toolNodes,
        toolEdges,
        actionNodes,
        actionEdges,
        startNodeId: rootNodeId || undefined
      })

      setExecutionProgress({ current: 90, total: 100, currentStep: 'Processing results...' })

      const graphItems = graph.map(item => ({ ...item } as Record<string, unknown>))
      setGraphPreview({
        items: graphItems.slice(0, 200),
        fullGraph: graphItems
      })

      setExecutionProgress({ current: 100, total: 100, currentStep: 'Complete' })
      toast.success(`Graph generated successfully with ${graphItems.length} items`)
    } catch (err) {
      setGraphPreview({ items: [], fullGraph: [] })
      toast.error(err instanceof Error ? err.message : 'Failed to generate graph')
    } finally {
      setRunning(false)
      setTimeout(() => setExecutionProgress(null), 2000)
    }
  }, [nodes, relationships, setExecutionProgress, setGraphPreview, setRunning, xmlFileToLoad, xmlContent])

  return {
    xmlContent,
    setXmlContent,
    handleLoadWorkflowFromConfig,
    handleRunWorkflow,
    handleUploadXml
  }
}
