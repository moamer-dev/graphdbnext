'use client'

import { useRef } from 'react'
import { Eye, FileText, Upload, Download, Loader2 } from 'lucide-react'
import { Switch } from '../../../ui/switch'
import { Label } from '../../../ui/label'
import { Button } from '../../../ui/button'
import { XmlStructureViewer } from '../XmlStructureViewer'
import { XmlMappingConfigurator } from '../../XmlMappingConfigurator'
import { AiMappingAssistant } from '../AiMappingAssistant'
import { useAIFeature } from '../../../../ai/config'
import { usePanelResize } from '../hooks/usePanelResize'
import { OntologyCombobox } from '../components/OntologyCombobox'
import type { XmlStructureAnalysis, XmlMappingConfig } from '../../../../services/xmlAnalyzer'
import type { TibOntology } from '../../../../types/semanticTypes'
import { useState } from 'react'
import { useXmlImportWizardStore } from '../../../../stores/xmlImportWizardStore'

interface ConfigureStepProps {
  analysis: XmlStructureAnalysis
  mapping: XmlMappingConfig
  xmlPreview: string | null
  selectedElements: Set<string>
  showStructure: boolean
  showMapping: boolean
  addingItems: Set<string>
  removingItems: Set<string>
  importingConfig: boolean
  onShowStructureChange: (show: boolean) => void
  onShowMappingChange: (show: boolean) => void
  onMappingChange: (mapping: XmlMappingConfig) => void
  onElementSelect: (elementName: string) => void
  onElementsSelect: (elementNames: string[], select: boolean) => void
  onElementDelete: (elementNames: string[]) => void
  onAddElements: (elementNames: string[]) => void
  onAddingItemsChange: (items: Set<string>) => void
  onRemoveElements: (elementNames: string[]) => void
  onImportConfig: (file: File) => void
  onExportConfig: () => void
}

export function ConfigureStep({
  analysis,
  mapping,
  xmlPreview,
  selectedElements,
  showStructure,
  showMapping,
  addingItems,
  removingItems,
  importingConfig,
  onShowStructureChange,
  onShowMappingChange,
  onMappingChange,
  onElementSelect,
  onElementsSelect,
  onElementDelete,
  onAddElements,
  onAddingItemsChange,
  onRemoveElements,
  onImportConfig,
  onExportConfig
}: ConfigureStepProps) {
  const { panelWidth, panelsContainerRef, startResizing } = usePanelResize({
    initialWidth: 50,
    minWidth: 20,
    maxWidth: 80
  })

  const configInputRef = useRef<HTMLInputElement>(null)
  const isXmlMappingEnabled = useAIFeature('xmlMappingAssistant')
  const isSemanticEnrichmentEnabled = useAIFeature('semanticEnrichment')
  const showSemantic = useXmlImportWizardStore(state => state.showSemantic)
  const setShowSemantic = useXmlImportWizardStore(state => state.setShowSemantic)
  const selectedOntologyId = useXmlImportWizardStore(state => state.selectedOntologyId)
  const setSelectedOntologyId = useXmlImportWizardStore(state => state.setSelectedOntologyId)

  const includedElements = new Set(
    Object.entries(mapping?.elementMappings || {})
      .filter(([, config]) => config.include)
      .map(([name]) => name)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border rounded-lg">
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <Label htmlFor="show-structure-minimal" className="text-xs cursor-pointer">
            Structure
          </Label>
          <Switch
            id="show-structure-minimal"
            checked={showStructure}
            onCheckedChange={onShowStructureChange}
            className="scale-75"
          />
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <Label htmlFor="show-mapping-minimal" className="text-xs cursor-pointer">
            Mapping
          </Label>
          <Switch
            id="show-mapping-minimal"
            checked={showMapping}
            onCheckedChange={onShowMappingChange}
            className="scale-75"
          />
        </div>
        {isXmlMappingEnabled && (
          <>
            <div className="w-px h-4 bg-border" />
            <AiMappingAssistant
              analysis={analysis}
              currentMapping={mapping}
              onMappingSuggested={(newMapping, explanation) => {
                onMappingChange(newMapping)
              }}
            />
          </>
        )}
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={configInputRef}
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                onImportConfig(f)
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs flex items-center gap-1.5"
            onClick={() => !importingConfig && configInputRef.current?.click()}
            disabled={importingConfig}
            title="Import Configuration"
          >
            {importingConfig ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>Import Config</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs flex items-center gap-1.5"
            onClick={onExportConfig}
            disabled={!mapping}
            title="Export Configuration"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Config</span>
          </Button>
        </div>
        {isSemanticEnrichmentEnabled && (
          <>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Label htmlFor="show-semantic" className="text-xs cursor-pointer">
                Semantic
              </Label>
              <Switch
                id="show-semantic"
                checked={showSemantic}
                onCheckedChange={setShowSemantic}
                className="scale-75"
              />
            </div>
          </>
        )}
      </div>

      {isSemanticEnrichmentEnabled && showSemantic && (
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 rounded-lg p-1.5">
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-sm font-semibold">Semantic Enrichment</span>
            <span className="text-xs text-muted-foreground ml-auto">
              Attach ontology metadata to nodes and relationships
            </span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ontology-select" className="text-xs">
              Select Ontology
            </Label>
            <OntologyCombobox
              value={selectedOntologyId || undefined}
              onValueChange={(ontologyId: string, ontology: TibOntology | null) => {
                setSelectedOntologyId(ontologyId || null)
              }}
              showSelectedDescription={true}
            />
          </div>
        </div>
      )}

      <div
        ref={panelsContainerRef}
        className="flex gap-0 relative"
        style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}
      >
        {showStructure && (
          <div
            className="bg-card border rounded-xl shadow-sm overflow-hidden shrink-0 flex flex-col"
            style={{
              width: showStructure && showMapping ? `${panelWidth}%` : '100%',
              borderTopRightRadius: showMapping ? 0 : undefined,
              borderBottomRightRadius: showMapping ? 0 : undefined
            }}
          >
            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200/50 shrink-0">
              <div className="bg-blue-100 rounded-lg p-1.5">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-foreground">XML Structure</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {analysis.elementTypes.length} element{analysis.elementTypes.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-hidden flex-1 min-h-0">
              <XmlStructureViewer
                analysis={analysis}
                xmlString={xmlPreview || undefined}
                selectedElements={selectedElements}
                includedElements={includedElements}
                onElementSelect={onElementSelect}
                onElementsSelect={onElementsSelect}
                onElementDelete={onElementDelete}
                onAddElements={onAddElements}
                addingItems={addingItems}
                onAddingItemsChange={onAddingItemsChange}
              />
            </div>
          </div>
        )}

        {showStructure && showMapping && (
          <div
            className="w-2 bg-muted/30 hover:bg-primary/30 border-l border-r border-border/50 cursor-col-resize transition-all duration-200 flex items-center justify-center group relative z-10"
            onMouseDown={(e) => {
              e.preventDefault()
              startResizing()
            }}
            style={{ minWidth: '8px' }}
            title="Drag to resize panels"
          >
            <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />
            <div className="flex flex-col items-center gap-1 py-2">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary/60 transition-colors" />
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary/60 transition-colors" />
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary/60 transition-colors" />
              </div>
              <div className="flex gap-0.5">
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary/60 transition-colors" />
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary/60 transition-colors" />
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary/60 transition-colors" />
              </div>
              <div className="flex gap-0.5">
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary/60 transition-colors" />
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary/60 transition-colors" />
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary/60 transition-colors" />
              </div>
            </div>
          </div>
        )}

        {showMapping && (
          <div
            className="bg-card border rounded-xl shadow-sm overflow-hidden shrink-0 flex flex-col"
            style={{
              width: showStructure && showMapping ? `${100 - panelWidth}%` : '100%',
              borderTopLeftRadius: showStructure ? 0 : undefined,
              borderBottomLeftRadius: showStructure ? 0 : undefined
            }}
          >
            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200/50 shrink-0">
              <div className="bg-green-100 rounded-lg p-1.5">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-foreground">Mapping Configuration</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {Object.keys(mapping?.elementMappings || {}).length} mapped
              </span>
            </div>
            <div className="overflow-hidden flex-1 min-h-0">
              <XmlMappingConfigurator
                analysis={analysis}
                initialMapping={mapping}
                onMappingChange={onMappingChange}
                onRemoveElements={onRemoveElements}
                addingItems={addingItems}
                removingItems={removingItems}
                selectedOntologyId={showSemantic ? selectedOntologyId : null}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

