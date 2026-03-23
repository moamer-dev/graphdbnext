'use client'

import { useEffect } from 'react'
import { Upload, AlertCircle, FileText, Settings, Eye, CheckCircle2, ChevronDown } from 'lucide-react'
import { Button } from '../../ui/button'
import { UploadStep } from './steps/UploadStep'
import { ConfigureRulesStep } from './steps/ConfigureRulesStep'
import { AnalyzeStep } from './steps/AnalyzeStep'
import { ConfigureStep } from './steps/ConfigureStep'
import { ReviewStep } from './steps/ReviewStep'
import { useXmlImport } from '../../../hooks/useXmlImport'
import { useXmlImportWizardStore } from '../../../stores/xmlImportWizardStore'
import { useXmlImportWizardUI } from '../../../hooks/wizard/useXmlImportWizardUI'
import { cn } from '../../../utils/cn'
import { createXmlImportWizardHandlers, formatXml } from './handlers/createXmlImportWizardHandlers'

interface XmlImportWizardProps {
  onImportComplete?: () => void
  className?: string
}

export function XmlImportWizard({ onImportComplete, className }: XmlImportWizardProps) {
  const ui = useXmlImportWizardUI()
  const {
    fileInputRef,
    extracting,
    setExtracting,
    showStructure,
    setShowStructure,
    showMapping,
    setShowMapping,
    xmlPreview,
    setXmlPreview,
    importingConfig,
    setImportingConfig,
    importingRules,
    setImportingRules,
    addingItems,
    setAddingItems,
    removingItems,
    setRemovingItems
  } = ui

  // Zustand store for wizard state
  const {
    step,
    selectedFile,
    analysisRules,
    selectedElements,
    availableElements,
    error: wizardError,
    setStep,
    setSelectedFile,
    setAnalysisRules,
    setAnalysis,
    setMapping,
    setSelectedElements,
    setAvailableElements,
    toggleElement,
    selectElements,
    setError: setWizardError,
    reset: resetWizard
  } = useXmlImportWizardStore()

  // Hook for XML import operations
  const {
    analysis: hookAnalysis,
    mapping: hookMapping,
    error: hookError,
    analyzeXml,
    updateMapping,
    generateModel,
    loadModel,
    reset: resetImport,
    clearError
  } = useXmlImport()

  // Get analysis and mapping from store (prefer store over hook for persistence)
  const analysis = useXmlImportWizardStore(state => state.analysis) || hookAnalysis
  const mapping = useXmlImportWizardStore(state => state.mapping) || hookMapping
  const error = wizardError || hookError

  const getLatestMapping = () => useXmlImportWizardStore.getState().mapping

  const {
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
  } = createXmlImportWizardHandlers({
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
    setAnalysis,
    setMapping,
    setSelectedElements,
    setAvailableElements,
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
  })

  // Load XML preview when entering configure step (for Document Tree)
  useEffect(() => {
    const loadPreview = async () => {
      if ((step !== 'configure' && step !== 'configure-rules') || !selectedFile || xmlPreview) return
      try {
        const text = await selectedFile.text()
        const formatted = formatXml(text)
        setXmlPreview(formatted)
      } catch (err) {
        console.error('Failed to load XML preview', err)
        setXmlPreview(null)
      }
    }
    loadPreview()
  }, [step, selectedFile, xmlPreview])


  const wizardContent = (
    <div className={cn('flex gap-4', className)}>
      {/* Vertical Step Indicator on Left */}
      <div className="bg-muted/30 rounded-lg p-3 shrink-0 w-32">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => handleStepClick('upload')}
            disabled={!canAccessStep('upload')}
            className={cn(
              'flex flex-col items-center gap-1.5 px-2 py-2 rounded-md transition-all w-full',
              step === 'upload' && 'bg-primary text-primary-foreground shadow-sm',
              canAccessStep('upload') && step !== 'upload' && 'hover:bg-muted',
              !canAccessStep('upload') && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Upload className={cn('h-5 w-5', step === 'upload' && 'text-primary-foreground')} />
            <span className="text-xs font-medium">Upload</span>
            <span className="text-[10px] text-muted-foreground">XML File</span>
          </button>

          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />

          <button
            type="button"
            onClick={() => handleStepClick('configure-rules')}
            disabled={!canAccessStep('configure-rules')}
            className={cn(
              'flex flex-col items-center gap-1.5 px-2 py-2 rounded-md transition-all w-full',
              step === 'configure-rules' && 'bg-primary text-primary-foreground shadow-sm',
              canAccessStep('configure-rules') && step !== 'configure-rules' && 'hover:bg-muted',
              !canAccessStep('configure-rules') && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Settings className={cn('h-5 w-5', step === 'configure-rules' && 'text-primary-foreground')} />
            <span className="text-xs font-medium">Rules</span>
            <span className="text-[10px] text-muted-foreground">Analysis</span>
          </button>

          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />

          <button
            type="button"
            onClick={() => handleStepClick('analyze')}
            disabled={!canAccessStep('analyze')}
            className={cn(
              'flex flex-col items-center gap-1.5 px-2 py-2 rounded-md transition-all w-full',
              step === 'analyze' && 'bg-primary text-primary-foreground shadow-sm',
              canAccessStep('analyze') && step !== 'analyze' && 'hover:bg-muted',
              !canAccessStep('analyze') && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Eye className={cn('h-5 w-5', step === 'analyze' && 'text-primary-foreground')} />
            <span className="text-xs font-medium">Analyze</span>
            <span className="text-[10px] text-muted-foreground">Structure</span>
          </button>

          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />

          <button
            type="button"
            onClick={() => handleStepClick('configure')}
            disabled={!canAccessStep('configure')}
            className={cn(
              'flex flex-col items-center gap-1.5 px-2 py-2 rounded-md transition-all w-full',
              step === 'configure' && 'bg-primary text-primary-foreground shadow-sm',
              canAccessStep('configure') && step !== 'configure' && 'hover:bg-muted',
              !canAccessStep('configure') && 'opacity-50 cursor-not-allowed'
            )}
          >
            <FileText className={cn('h-5 w-5', step === 'configure' && 'text-primary-foreground')} />
            <span className="text-xs font-medium">Configure</span>
            <span className="text-[10px] text-muted-foreground">Mapping</span>
          </button>

          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />

          <button
            type="button"
            onClick={() => handleStepClick('review')}
            disabled={!canAccessStep('review')}
            className={cn(
              'flex flex-col items-center gap-1.5 px-2 py-2 rounded-md transition-all w-full',
              step === 'review' && 'bg-primary text-primary-foreground shadow-sm',
              canAccessStep('review') && step !== 'review' && 'hover:bg-muted',
              !canAccessStep('review') && 'opacity-50 cursor-not-allowed'
            )}
          >
            <CheckCircle2 className={cn('h-5 w-5', step === 'review' && 'text-primary-foreground')} />
            <span className="text-xs font-medium">Review</span>
            <span className="text-[10px] text-muted-foreground">Complete</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" className="ml-auto h-6" onClick={handleClearError}>
              ×
            </Button>
          </div>
        )}

        {/* Step Content */}
        {step === 'upload' && (
          <UploadStep
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
          />
        )}

        {step === 'configure-rules' && selectedFile && (
          <ConfigureRulesStep
            selectedFile={selectedFile}
            extracting={extracting}
            analysisRules={analysisRules}
            availableElements={availableElements}
            importingRules={importingRules}
            onRulesChange={setAnalysisRules}
            onImportRules={handleImportRules}
            onExportRules={handleExportRules}
            xmlPreview={xmlPreview}
          />
        )}

        {step === 'analyze' && <AnalyzeStep />}

        {step === 'configure' && analysis && mapping && (
          <ConfigureStep
            analysis={analysis}
            mapping={mapping}
            xmlPreview={xmlPreview}
            selectedElements={selectedElements}
            showStructure={showStructure}
            showMapping={showMapping}
            addingItems={addingItems}
            removingItems={removingItems}
            importingConfig={importingConfig}
            onShowStructureChange={setShowStructure}
            onShowMappingChange={setShowMapping}
            onMappingChange={handleMappingChange}
            onElementSelect={toggleElement}
            onElementsSelect={selectElements}
            onElementDelete={handleElementDelete}
            onAddElements={handleAddElementsToMapping}
            onAddingItemsChange={setAddingItems}
            onRemoveElements={handleRemoveElementsFromMapping}
            onImportConfig={handleImportConfig}
            onExportConfig={handleExportConfig}
          />
        )}

        {step === 'review' && <ReviewStep />}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-2 pt-4 border-t">
          {/* Back Button - Show on all steps except upload */}
          {step !== 'upload' && (
            <Button
              variant="outline"
              onClick={() => {
                if (step === 'configure-rules') {
                  setStep('upload')
                } else if (step === 'analyze') {
                  setStep('configure-rules')
                } else if (step === 'configure') {
                  // Go back to configure-rules to allow re-analyzing with different rules
                  setStep('configure-rules')
                } else if (step === 'review') {
                  setStep('configure')
                }
              }}
            >
              Back
            </Button>
          )}

          {/* Forward/Action Buttons */}
          <div className="flex gap-2 ml-auto">
            {step === 'configure-rules' && selectedFile && (
              <>
                <Button variant="outline" onClick={handleReset}>
                  Cancel
                </Button>
                <Button onClick={handleAnalyze}>
                  Next: Configure XML
                </Button>
              </>
            )}

            {step === 'configure' && (
              <>
                <Button variant="outline" onClick={handleReset}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate}>
                  Generate Model
                </Button>
              </>
            )}

            {step === 'review' && (
              <Button onClick={handleReset}>
                Import Another File
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return wizardContent
}

