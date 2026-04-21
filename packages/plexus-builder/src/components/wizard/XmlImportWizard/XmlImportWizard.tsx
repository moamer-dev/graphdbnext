'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Upload, AlertCircle, FileText, Settings, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '../../ui/button'
import { UploadStep } from './steps/UploadStep'
import { ConfigureRulesStep } from './steps/ConfigureRulesStep'
import { ConfigureStep } from './steps/ConfigureStep'
import { ReviewStep } from './steps/ReviewStep'
import { useXmlImport } from '../../../hooks/xml/useXmlImport'
import { useXmlImportWizardStore } from '../../../stores/xmlImportWizardStore'
import { useXmlImportWizardUI } from '../../../hooks/wizard/useXmlImportWizardUI'
import { cn } from '../../../utils/cn'
import { createXmlImportWizardHandlers, formatXml } from './handlers/createXmlImportWizardHandlers'
import { useDataSourcesStore, type DataSource } from '../../../stores/dataSourcesStore'

interface XmlImportWizardProps {
  onImportComplete?: () => void
  className?: string
  workspaceXmls?: any[]
  onFetchXml?: (xmlSource: any) => Promise<{ content: string; name: string } | null>
}

export function XmlImportWizard({ onImportComplete, className, workspaceXmls: propsWorkspaceXmls, onFetchXml }: XmlImportWizardProps) {
  const sources = useDataSourcesStore((state) => state.sources)
  const storeWorkspaceXmls = useMemo(() => 
    Object.values(sources).filter((s: DataSource) => s.type === 'XML'),
    [sources]
  )
  const workspaceXmls = propsWorkspaceXmls || storeWorkspaceXmls

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
    setError: setWizardError,
    reset: resetWizard
  } = useXmlImportWizardStore()

  // Hook for XML import operations
  const {
    analyzing,
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
    handleStepClick,
    handleSelectWarehouseXml
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
    getLatestMapping,
    onFetchXml,
    setXmlPreview
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
  }, [step, selectedFile, xmlPreview, setXmlPreview])


  const wizardContent = (
    <div className={cn('flex gap-4', className)}>
      <div className="shrink-0 w-32 border-r pr-6 pt-4 relative hidden md:block">
        <div className="absolute right-[22px] top-6 bottom-6 w-[2px] bg-muted/40" />
        <div className="flex flex-col gap-8 relative z-10">
          {[
            { id: 'upload', icon: Upload, label: 'Upload', sub: 'XML File' },
            { id: 'configure-rules', icon: Settings, label: 'Rules', sub: 'Analysis' },
            { id: 'configure', icon: FileText, label: 'Configure', sub: 'Mapping' }
          ].map((s, idx, arr) => {
            const stepOrder = ['upload', 'configure-rules', 'analyze', 'configure', 'review']
            const currentIdx = stepOrder.indexOf(step)
            const thisIdx = stepOrder.indexOf(s.id as any)
            const isActive = step === s.id || (step === 'analyze' && s.id === 'configure-rules')
            const isCompleted = thisIdx < currentIdx && step !== 'analyze'
            const isPending = !isActive && !isCompleted

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStepClick(s.id as any)}
                disabled={!canAccessStep(s.id as any)}
                className={cn(
                  'group flex flex-col items-center gap-2 transition-all duration-300 outline-none cursor-pointer',
                  !canAccessStep(s.id as any) && 'opacity-40 cursor-not-allowed'
                )}
              >
                <div className="relative">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                    isActive && "bg-primary border-primary text-primary-foreground scale-110 shadow-primary/20",
                    isCompleted && "bg-background border-primary text-primary shadow-sm",
                    isPending && "bg-background border-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                  </div>
                  {isActive && (
                    <div className="absolute -inset-1 rounded-full border border-primary/20 animate-pulse" />
                  )}
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-[11px] font-bold tracking-tight transition-colors",
                    isActive ? "text-primary uppercase" : "text-foreground/70"
                  )}>
                    {s.label}
                  </div>
                  <div className="text-[9px] text-muted-foreground font-medium">
                    {s.sub}
                  </div>
                </div>
              </button>
            )
          })}
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
            workspaceXmls={workspaceXmls}
            onSelectWorkspaceXml={handleSelectWarehouseXml}
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

        {step === 'analyze' && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="bg-primary/5 p-6 rounded-full">
              <Loader2 className="h-9 w-9 text-primary animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Tree is being built...</h2>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Processing XML structure and generating your visual mapping environment.
              </p>
            </div>
          </div>
        )}


        {step === 'configure' && analysis && mapping && (
          <ConfigureStep
            analysis={analysis}
            mapping={mapping}
            xmlPreview={xmlPreview}
            showStructure={showStructure}
            showMapping={showMapping}
            addingItems={addingItems}
            removingItems={removingItems}
            importingConfig={importingConfig}
            onShowStructureChange={setShowStructure}
            onShowMappingChange={setShowMapping}
            onMappingChange={handleMappingChange}
            onElementDelete={handleElementDelete}
            onRemoveElements={handleRemoveElementsFromMapping}
            onAddElements={handleAddElementsToMapping}
            onAddingItemsChange={setAddingItems}
            onImportConfig={handleImportConfig}
            onExportConfig={handleExportConfig}
            className="flex-1 min-h-0"
          />
        )}


        {/* Navigation Buttons */}
        <div className="flex justify-between gap-2 pt-4 border-t">
          {/* Back Button - Show on all steps except upload */}
          {step !== 'upload' && (
            <Button
              variant="outline"
              onClick={() => {
                if (step === 'configure-rules') {
                  setStep('upload')
                } else if (step === 'configure') {
                  // Go back to configure-rules to allow re-analyzing with different rules
                  setStep('configure-rules')
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
                  Model Builder
                </Button>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )

  return wizardContent
}

