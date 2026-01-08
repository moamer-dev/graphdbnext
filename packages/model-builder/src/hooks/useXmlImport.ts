import { useState, useEffect } from 'react'
import { XmlAnalyzer } from '../services/xmlAnalyzer'
import { useModelBuilderStore } from '../stores/modelBuilderStore'
import { useXmlImportWizardStore } from '../stores/xmlImportWizardStore'
import type { XmlStructureAnalysis, XmlMappingConfig, XmlAnalysisRules } from '../services/xmlAnalyzer'
import type { Node, Relationship } from '../types'

export interface XmlImportResult {
  nodes: Node[]
  relationships: Relationship[]
  analysis: XmlStructureAnalysis
  mapping: XmlMappingConfig
}

export function useXmlImport() {
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<XmlStructureAnalysis | null>(null)
  const [mapping, setMapping] = useState<XmlMappingConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { clear, loadState } = useModelBuilderStore()

  // Restore analysis and mapping from Zustand store on mount
  useEffect(() => {
    const storeAnalysis = useXmlImportWizardStore.getState().analysis
    const storeMapping = useXmlImportWizardStore.getState().mapping

    if (storeAnalysis && !analysis) {
      setAnalysis(storeAnalysis)
    }
    if (storeMapping && !mapping) {
      setMapping(storeMapping)
    }
  }, []) // Only run on mount

  /**
   * Analyze XML file structure
   */
  const analyzeXml = async (file: File, rules?: Partial<XmlAnalysisRules>): Promise<XmlStructureAnalysis | null> => {
    setAnalyzing(true)
    setError(null)

    try {
      const text = await file.text()
      const analysis = XmlAnalyzer.analyzeStructure(text, rules)
      setAnalysis(analysis)

      // Store in Zustand store for persistence
      useXmlImportWizardStore.getState().setAnalysis(analysis)

      // Generate default mapping
      const defaultMapping = XmlAnalyzer.generateDefaultMapping(analysis)
      setMapping(defaultMapping)

      // Store in Zustand store for persistence
      useXmlImportWizardStore.getState().setMapping(defaultMapping)

      return analysis
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze XML file'
      setError(errorMessage)
      console.error('XML analysis error:', err)
      return null
    } finally {
      setAnalyzing(false)
    }
  }

  /**
   * Update mapping configuration
   */
  const updateMapping = (newMapping: XmlMappingConfig) => {
    setMapping(newMapping)
    // Also update Zustand store for persistence
    useXmlImportWizardStore.getState().setMapping(newMapping)
  }

  /**
   * Generate model from analysis and mapping
   */
  const generateModel = (): XmlImportResult | null => {
    // Check both hook state and Zustand store for analysis and mapping
    const storeAnalysis = useXmlImportWizardStore.getState().analysis
    const storeMapping = useXmlImportWizardStore.getState().mapping

    const currentAnalysis = analysis || storeAnalysis
    const currentMapping = mapping || storeMapping

    if (!currentAnalysis || !currentMapping) {
      setError('Please analyze XML file first')
      return null
    }

    try {
      const { nodes, relationships } = XmlAnalyzer.convertToBuilderFormat(currentAnalysis, currentMapping)

      return {
        nodes,
        relationships,
        analysis: currentAnalysis,
        mapping: currentMapping
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate model'
      setError(errorMessage)
      console.error('Model generation error:', err)
      return null
    }
  }

  /**
   * Load generated model into builder
   */
  const loadModel = (result: XmlImportResult, metadata?: { name: string; description: string; version: string }) => {
    clear()
    const rootElementName = useXmlImportWizardStore.getState().rootElementName
    const selectedOntologyId = useXmlImportWizardStore.getState().selectedOntologyId
    const showSemantic = useXmlImportWizardStore.getState().showSemantic
    let rootNodeId: string | null = null

    // Find the node that matches the root element name
    if (rootElementName) {
      const rootNode = result.nodes.find(node =>
        node.label.toLowerCase() === rootElementName.toLowerCase()
      )
      if (rootNode) {
        rootNodeId = rootNode.id
      }
    }

    loadState({
      nodes: result.nodes,
      relationships: result.relationships,
      rootNodeId,
      selectedOntologyId,
      isSemanticEnabled: showSemantic,
      metadata: metadata || {
        name: result.analysis.rootElements[0] || 'Imported XML Schema',
        description: `Imported from XML. Found ${result.analysis.elementTypes.length} element types.`,
        version: '1.0.0'
      }
    })
  }

  /**
   * Reset all state
   */
  const reset = () => {
    setAnalysis(null)
    setMapping(null)
    setError(null)
  }

  return {
    analyzing,
    analysis,
    mapping,
    error,
    analyzeXml,
    updateMapping,
    generateModel,
    loadModel,
    reset,
    clearError: () => setError(null)
  }
}

