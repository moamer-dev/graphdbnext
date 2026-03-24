import type { RefObject } from 'react'
import type {
  XmlAnalysisRules,
  XmlMappingConfig,
  XmlStructureAnalysis
} from '../../../../services/xml/xmlAnalyzer'
import { extractXmlElements, type XmlElementInfo } from '../../../../utils/xmlElementExtractor'
import { downloadFile } from '../../../../utils/exportUtils'
import type { WizardStep } from '../../../../stores/xmlImportWizardStore'
import type { XmlImportResult } from '../../../../hooks/xml/useXmlImport'

interface XmlWizardConfigExport {
  version: 1
  fileName?: string
  createdAt: string
  analysisRules: Partial<XmlAnalysisRules>
  mapping: XmlMappingConfig | null
}

interface XmlWizardRulesExport {
  version: 1
  type: 'xml-rules'
  fileName?: string
  createdAt: string
  analysisRules: Partial<XmlAnalysisRules>
}

export interface XmlImportWizardHandlerDeps {
  selectedFile: File | null
  analysisRules: Partial<XmlAnalysisRules>
  selectedElements: Set<string>
  analysis: XmlStructureAnalysis | null
  mapping: XmlMappingConfig | null
  hookMapping: XmlMappingConfig | null
  step: WizardStep
  setStep: (step: WizardStep) => void
  setSelectedFile: (file: File | null) => void
  setAnalysisRules: (rules: Partial<XmlAnalysisRules>) => void
  setSelectedElements: (elements: Set<string>) => void
  setAvailableElements: (elements: XmlElementInfo | null) => void
  setAnalysis: (analysis: XmlStructureAnalysis | null) => void
  setMapping: (mapping: XmlMappingConfig | null) => void
  setWizardError: (error: string | null) => void
  resetWizard: () => void
  fileInputRef: RefObject<HTMLInputElement | null>
  setExtracting: (value: boolean) => void
  setImportingRules: (value: boolean) => void
  setImportingConfig: (value: boolean) => void
  setRemovingItems: (value: Set<string>) => void
  showMapping: boolean
  setShowMapping: (value: boolean) => void
  analyzeXml: (file: File, rules: Partial<XmlAnalysisRules>) => Promise<XmlStructureAnalysis | null>
  updateMapping: (mapping: XmlMappingConfig) => void
  generateModel: () => XmlImportResult | null
  loadModel: (data: XmlImportResult, metadata: { name: string; description: string; version: string }) => void
  resetImport: () => void
  clearError: () => void
  onImportComplete?: () => void
  getLatestMapping: () => XmlMappingConfig | null
}

export interface XmlImportWizardHandlers {
  handleFileSelect: (file: File) => Promise<void>
  handleAnalyze: () => Promise<void>
  handleMappingChange: (newMapping: XmlMappingConfig) => void
  handleAddElementsToMapping: (elementNames: string[]) => void
  handleRemoveElementsFromMapping: (elementNames: string[]) => Promise<void>
  handleElementDelete: (elementNames: string[]) => void
  handleGenerate: () => void
  handleReset: () => void
  handleClearError: () => void
  handleExportConfig: () => void
  handleExportRules: () => void
  handleImportRules: (file: File) => Promise<void>
  handleImportConfig: (file: File) => Promise<void>
  canAccessStep: (targetStep: WizardStep) => boolean
  handleStepClick: (targetStep: WizardStep) => void
}

export function createXmlImportWizardHandlers({
  selectedFile,
  analysisRules,
  selectedElements,
  analysis,
  mapping,
  hookMapping,
  step,
  setStep,
  setSelectedFile,
  setAnalysisRules,
  setSelectedElements,
  setAvailableElements,
  setAnalysis,
  setMapping,
  setWizardError,
  resetWizard,
  fileInputRef,
  setExtracting,
  setImportingRules,
  setImportingConfig,
  setRemovingItems,
  showMapping,
  setShowMapping,
  analyzeXml,
  updateMapping,
  generateModel,
  loadModel,
  resetImport,
  clearError,
  onImportComplete,
  getLatestMapping
}: XmlImportWizardHandlerDeps): XmlImportWizardHandlers {
  const handleMappingChange = (newMapping: XmlMappingConfig) => {
    const elementMappings = newMapping?.elementMappings || {}
    const included = new Set(
      Object.entries(elementMappings)
        .filter(([, config]) => config?.include)
        .map(([name]) => name)
    )
    setSelectedElements(included)
    updateMapping(newMapping)
    setMapping(newMapping)
  }

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xml')) {
      clearError()
      setWizardError(null)
      return
    }

    if (selectedFile && selectedFile.name !== file.name) {
      setAnalysis(null)
      setMapping(null)
      resetImport()
    }

    setSelectedFile(file)
    setExtracting(true)

    try {
      const elementInfo = await extractXmlElements(file)
      setAvailableElements(elementInfo)
      if (elementInfo.elementNames.length === 0) {
        console.warn('No elements found in XML. First 500 chars of XML:', file.name)
      }
    } catch (error) {
      console.error('Failed to extract XML elements:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setWizardError(`Failed to extract XML elements: ${errorMessage}`)
      setAvailableElements(null)
    } finally {
      setExtracting(false)
    }

    setStep('configure-rules')
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setStep('analyze')
    setWizardError(null)
    const result = await analyzeXml(selectedFile, analysisRules)
    if (result) {
      setAnalysis(result)

      setTimeout(() => {
        const currentMapping = hookMapping || getLatestMapping()
        if (currentMapping) {
          const included = new Set(
            Object.entries(currentMapping.elementMappings)
              .filter(([, config]) => config.include)
              .map(([name]) => name)
          )
          setSelectedElements(included)
        }
      }, 100)

      setStep('configure')
    }
  }

  const handleAddElementsToMapping = (elementNames: string[]) => {
    if (!analysis || !mapping) return

    if (!showMapping) {
      setShowMapping(true)
    }

    const newElementMappings = { ...mapping.elementMappings }
    const newAttributeMappings = { ...mapping.attributeMappings }

    elementNames.forEach((name) => {
      const elementType = analysis.elementTypes.find((et) => et.name === name)
      if (!elementType) return

      const existing = newElementMappings[name] || {
        include: false,
        nodeLabel: name,
        nodeType: name,
        superclassNames: []
      }

      newElementMappings[name] = {
        ...existing,
        include: true
      }

      if (!newAttributeMappings[name]) {
        newAttributeMappings[name] = {}
      } else {
        newAttributeMappings[name] = { ...newAttributeMappings[name] }
      }

      elementType.attributes.forEach((attrName) => {
        if (!newAttributeMappings[name][attrName]) {
          const attrAnalysis = elementType.attributeAnalysis[attrName]
          const attrType = attrAnalysis?.type || 'string'
          newAttributeMappings[name][attrName] = {
            include: true,
            propertyKey: attrName,
            propertyType: (attrType === 'id-reference' || attrType === 'xpath-reference') ? 'string' : attrType,
            required: attrAnalysis?.required || false,
            isReference: attrAnalysis?.isReference || false
          }
        } else if (!newAttributeMappings[name][attrName].include) {
          newAttributeMappings[name][attrName] = {
            ...newAttributeMappings[name][attrName],
            include: true
          }
        }
      })
    })

    const newMapping: XmlMappingConfig = {
      ...mapping,
      elementMappings: newElementMappings,
      attributeMappings: newAttributeMappings
    }

    handleMappingChange(newMapping)
  }

  const handleRemoveElementsFromMapping = async (elementNames: string[]) => {
    if (!mapping || elementNames.length === 0) return

    setRemovingItems(new Set(elementNames))

    try {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          const newMapping: XmlMappingConfig = {
            ...mapping,
            elementMappings: { ...mapping.elementMappings },
            attributeMappings: { ...mapping.attributeMappings },
            relationshipMappings: { ...mapping.relationshipMappings }
          }

          elementNames.forEach((name) => {
            if (newMapping.elementMappings[name]) {
              newMapping.elementMappings[name] = {
                ...newMapping.elementMappings[name],
                include: false
              }
            }

            Object.keys(newMapping.relationshipMappings).forEach((relKey) => {
              if (relKey.startsWith(`${name}->`) || relKey.includes(`->${name}`)) {
                delete newMapping.relationshipMappings[relKey]
              }
            })
          })

          handleMappingChange(newMapping)
          resolve()
        }, 0)
      })
    } finally {
      setTimeout(() => {
        setRemovingItems(new Set())
      }, 100)
    }
  }

  const handleElementDelete = (elementNames: string[]) => {
    if (!mapping) return

    const newMapping: XmlMappingConfig = {
      ...mapping,
      elementMappings: { ...mapping.elementMappings },
      attributeMappings: { ...mapping.attributeMappings },
      relationshipMappings: { ...mapping.relationshipMappings }
    }

    elementNames.forEach((name) => {
      delete newMapping.elementMappings[name]
      delete newMapping.attributeMappings[name]

      Object.keys(newMapping.relationshipMappings).forEach((relKey) => {
        if (relKey.includes(name)) {
          delete newMapping.relationshipMappings[relKey]
        }
      })
    })

    handleMappingChange(newMapping)

    const newSelected = new Set(selectedElements)
    elementNames.forEach((name) => newSelected.delete(name))
    setSelectedElements(newSelected)
  }

  const handleGenerate = () => {
    const result = generateModel()
    if (result) {
      loadModel(result, {
        name: selectedFile?.name.replace('.xml', '') || 'Imported XML Schema',
        description: `Imported from ${selectedFile?.name || 'XML file'}`,
        version: '1.0.0'
      })
      setStep('review')
      onImportComplete?.()
    }
  }

  const handleReset = () => {
    resetWizard()
    resetImport()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClearError = () => {
    clearError()
    setWizardError(null)
  }

  const handleExportConfig = () => {
    if (!selectedFile || !mapping) return
    const payload: XmlWizardConfigExport = {
      version: 1,
      fileName: selectedFile.name,
      createdAt: new Date().toISOString(),
      analysisRules,
      mapping
    }
    const json = JSON.stringify(payload, null, 2)
    const base = selectedFile.name.replace(/\.xml$/i, '') || 'xml-config'
    downloadFile(json, `${base}-config.json`, 'application/json;charset=utf-8;')
  }

  const handleExportRules = () => {
    if (!selectedFile) return
    const trimmedRules: Partial<XmlAnalysisRules> = {
      ignoredElements: analysisRules.ignoredElements || [],
      ignoredSubtrees: analysisRules.ignoredSubtrees || [],
      referenceAttributes: analysisRules.referenceAttributes || [],
      textContentRules: analysisRules.textContentRules || {
        characterLevelElements: [],
        signLevelElements: []
      }
    }
    const payload: XmlWizardRulesExport = {
      version: 1,
      type: 'xml-rules',
      fileName: selectedFile.name,
      createdAt: new Date().toISOString(),
      analysisRules: trimmedRules
    }
    const base = selectedFile.name.replace(/\.xml$/i, '') || 'xml-rules'
    const json = JSON.stringify(payload, null, 2)
    downloadFile(json, `${base}-rules.json`, 'application/json;charset=utf-8;')
  }

  const handleImportRules = async (file: File) => {
    if (!selectedFile) {
      setWizardError('Please upload the XML file before importing rules.')
      return
    }

    setImportingRules(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as XmlWizardRulesExport
      if (!data || typeof data !== 'object' || data.type !== 'xml-rules') {
        setWizardError('Invalid rules file.')
        return
      }
      setAnalysisRules(data.analysisRules || {})
    } catch (err) {
      console.error('Failed to import XML rules:', err)
      setWizardError('Failed to import rules.')
    } finally {
      setImportingRules(false)
    }
  }

  const handleImportConfig = async (file: File) => {
    if (!selectedFile) {
      setWizardError('Please upload the XML file before importing configuration.')
      return
    }

    setImportingConfig(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as XmlWizardConfigExport
      if (!data || typeof data !== 'object') {
        setWizardError('Invalid configuration file.')
        return
      }
      setAnalysisRules(data.analysisRules || {})
      const result = await analyzeXml(selectedFile, data.analysisRules)
      if (!result) return
      if (data.mapping) {
        handleMappingChange(data.mapping)
      }
      setStep('configure')
    } catch (err) {
      console.error('Failed to import XML config:', err)
      setWizardError('Failed to import configuration.')
    } finally {
      setImportingConfig(false)
    }
  }

  const canAccessStep = (targetStep: WizardStep): boolean => {
    switch (targetStep) {
      case 'upload':
        return true
      case 'configure-rules':
        return !!selectedFile
      case 'analyze':
        return !!selectedFile && Object.keys(analysisRules).length > 0
      case 'configure':
        return !!analysis && !!mapping
      case 'review':
        return !!analysis && !!mapping
      default:
        return false
    }
  }

  const handleStepClick = (targetStep: WizardStep) => {
    if (canAccessStep(targetStep) && targetStep !== step) {
      setStep(targetStep)
    }
  }

  return {
    handleFileSelect,
    handleAnalyze,
    handleMappingChange,
    handleAddElementsToMapping,
    handleRemoveElementsFromMapping,
    handleElementDelete,
    handleGenerate,
    handleReset,
    handleClearError,
    handleExportConfig,
    handleExportRules,
    handleImportRules,
    handleImportConfig,
    canAccessStep,
    handleStepClick
  }
}

export const formatXml = (input: string): string => {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input, 'application/xml')
    const serializer = new XMLSerializer()
    const raw = serializer.serializeToString(doc)
    const PADDING = '  '
    const reg = /(>)(<)(\/*)/g
    const xml = raw.replace(reg, '$1\r\n$2$3')
    let pad = 0
    return xml.split('\r\n').map((line) => {
      let indent = ''
      if (line.match(/.+<\/\w[^>]*>$/)) {
        indent = PADDING.repeat(pad)
      } else if (line.match(/^<\/\w/)) {
        pad = Math.max(pad - 1, 0)
        indent = PADDING.repeat(pad)
      } else if (line.match(/^<\w[^>]*[^\/]>(.*)$/)) {
        indent = PADDING.repeat(pad)
        pad += 1
      } else {
        indent = PADDING.repeat(pad)
      }
      return indent + line
    }).join('\r\n')
  } catch {
    return input
  }
}
