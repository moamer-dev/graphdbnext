'use client'

import { useRef, useEffect, useState } from 'react'
import { FileText, Upload, Download, Loader2 } from 'lucide-react'
import { Button } from '../../../ui/button'
import { XmlAnalysisRulesConfigurator } from '../../XmlAnalysisRulesConfigurator'
import { AiRulesAssistant } from '../AiRulesAssistant'
import { useAIFeature } from '../../../../ai/config'
import type { XmlAnalysisRules } from '../../../../services/xmlAnalyzer'
import type { XmlElementInfo } from '../../../../utils/xmlElementExtractor'

// Wrapper component that listens for open events
function AiRulesAssistantWrapper(props: {
  availableElements: XmlElementInfo | null
  currentRules: Partial<XmlAnalysisRules>
  onRulesSuggested: (rules: Partial<XmlAnalysisRules>, explanation: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('openAIAssistant', handleOpen)
    return () => window.removeEventListener('openAIAssistant', handleOpen)
  }, [])

  return (
    <AiRulesAssistant
      {...props}
      defaultOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
      }}
    />
  )
}

interface ConfigureRulesStepProps {
  selectedFile: File
  extracting: boolean
  analysisRules: Partial<XmlAnalysisRules>
  availableElements: XmlElementInfo | null
  importingRules: boolean
  onRulesChange: (rules: Partial<XmlAnalysisRules>) => void
  onImportRules: (file: File) => void
  onExportRules: () => void
  xmlPreview: string | null
}

export function ConfigureRulesStep({
  selectedFile,
  extracting,
  analysisRules,
  availableElements,
  importingRules,
  onRulesChange,
  onImportRules,
  onExportRules,
  xmlPreview
}: ConfigureRulesStepProps) {
  const rulesInputRef = useRef<HTMLInputElement>(null)
  const isXmlMappingEnabled = useAIFeature('xmlMappingAssistant')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border rounded-lg">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium truncate">{selectedFile.name}</span>
          {availableElements && !extracting && (
            <>
              <span className="text-xs text-muted-foreground shrink-0">•</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {availableElements.elementNames.length} elements
              </span>
              <span className="text-xs text-muted-foreground shrink-0">•</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {availableElements.attributeNames.length} attributes
              </span>
            </>
          )}
        </div>
        {isXmlMappingEnabled && (
          <>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center">
              <AiRulesAssistantWrapper
                availableElements={availableElements}
                currentRules={analysisRules}
                onRulesSuggested={(newRules, explanation) => {
                  onRulesChange(newRules)
                }}
              />
            </div>
          </>
        )}
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={rulesInputRef}
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                onImportRules(f)
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs flex items-center gap-1.5"
            onClick={() => !importingRules && rulesInputRef.current?.click()}
            disabled={importingRules}
            title="Import Rules"
          >
            {importingRules ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>Import Rules</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs flex items-center gap-1.5"
            onClick={onExportRules}
            title="Export Rules"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Rules</span>
          </Button>
        </div>
      </div>

      {extracting ? (
        <div className="flex items-center justify-center p-16 bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl border-2 border-dashed border-muted-foreground/20">
          <div className="text-center space-y-3">
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
            <div>
              <p className="text-sm font-semibold mb-1">Extracting XML Structure</p>
              <p className="text-xs text-muted-foreground">Reading elements and attributes from your file...</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <XmlAnalysisRulesConfigurator
            initialRules={analysisRules}
            availableElements={availableElements || undefined}
            onRulesChange={onRulesChange}
            xmlPreview={xmlPreview}
            onOpenAIAssistant={() => {
              // Trigger AI Assistant to open
              const event = new CustomEvent('openAIAssistant')
              window.dispatchEvent(event)
            }}
          />
        </div>
      )}
    </div>
  )
}

