import { create } from 'zustand'
import type { XmlStructureAnalysis, XmlMappingConfig, XmlAnalysisRules } from '../services/xmlAnalyzer'
import type { XmlElementInfo } from '../utils/xmlElementExtractor'

export type WizardStep = 'upload' | 'configure-rules' | 'analyze' | 'configure' | 'review'

interface XmlImportWizardState {
  // Step management
  step: WizardStep

  // File
  selectedFile: File | null

  // Analysis rules
  analysisRules: Partial<XmlAnalysisRules>

  // Analysis results
  analysis: XmlStructureAnalysis | null

  // Mapping configuration
  mapping: XmlMappingConfig | null

  // Selected elements
  selectedElements: Set<string>

  // Available elements from XML (for dropdowns)
  availableElements: XmlElementInfo | null

  // Root node element name (from mapping)
  rootElementName: string | null

  // Error state
  error: string | null

  // Semantic
  selectedOntologyId: string | null
  showSemantic: boolean
}

interface XmlImportWizardActions {
  // Step navigation
  setStep: (step: WizardStep) => void

  // File management
  setSelectedFile: (file: File | null) => void

  // Rules management
  setAnalysisRules: (rules: Partial<XmlAnalysisRules>) => void

  // Analysis management
  setAnalysis: (analysis: XmlStructureAnalysis | null) => void

  // Mapping management
  setMapping: (mapping: XmlMappingConfig | null) => void

  // Available elements management
  setAvailableElements: (elements: XmlElementInfo | null) => void

  // Selected elements management
  setSelectedElements: (elements: Set<string>) => void
  toggleElement: (elementName: string) => void
  selectElements: (elementNames: string[], select: boolean) => void

  // Root node management
  setRootElementName: (elementName: string | null) => void

  // Error management
  setError: (error: string | null) => void

  // Reset
  reset: () => void

  // Semantic
  setSelectedOntologyId: (ontologyId: string | null) => void
  setShowSemantic: (show: boolean) => void
}

export type XmlImportWizardStore = XmlImportWizardState & XmlImportWizardActions

const getInitialState = (): XmlImportWizardState => ({
  step: 'upload',
  selectedFile: null,
  analysisRules: {},
  analysis: null,
  mapping: null,
  selectedElements: new Set(),
  availableElements: null,
  rootElementName: null,
  error: null,
  selectedOntologyId: null,
  showSemantic: false
})

export const useXmlImportWizardStore = create<XmlImportWizardStore>((set, get) => ({
  ...getInitialState(),

  setStep: (step) => set({ step }),

  setSelectedFile: (file) => set({ selectedFile: file }),

  setAnalysisRules: (rules) => set({ analysisRules: rules }),

  setAnalysis: (analysis) => set({ analysis }),

  setMapping: (mapping) => set({ mapping }),

  setAvailableElements: (elements) => set({ availableElements: elements }),

  setSelectedElements: (elements) => set({ selectedElements: elements }),

  toggleElement: (elementName) => {
    const current = get().selectedElements
    const newSelected = new Set(current)
    if (newSelected.has(elementName)) {
      newSelected.delete(elementName)
    } else {
      newSelected.add(elementName)
    }
    set({ selectedElements: newSelected })
  },

  selectElements: (elementNames, select) => {
    const current = get().selectedElements
    const newSelected = new Set(current)
    elementNames.forEach(name => {
      if (select) {
        newSelected.add(name)
      } else {
        newSelected.delete(name)
      }
    })
    set({ selectedElements: newSelected })
  },

  setRootElementName: (elementName) => set({ rootElementName: elementName }),

  setError: (error) => set({ error }),

  setSelectedOntologyId: (ontologyId) => set({ selectedOntologyId: ontologyId }),

  setShowSemantic: (show) => set({ showSemantic: show }),

  reset: () => set(getInitialState())
}))

