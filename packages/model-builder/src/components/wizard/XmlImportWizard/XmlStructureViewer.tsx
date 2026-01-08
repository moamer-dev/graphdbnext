'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { FileText } from 'lucide-react'
import { cn } from '../../../utils/cn'
import type { XmlStructureAnalysis } from '../../../services/xmlAnalyzer'
import { XmlJsonTreeViewer } from '../../viewer/XmlJsonTreeViewer'

interface XmlStructureViewerProps {
  analysis: XmlStructureAnalysis
  xmlString?: string
  onElementSelect?: (elementName: string) => void
  onElementsSelect?: (elementNames: string[], select: boolean) => void
  selectedElements?: Set<string>
  includedElements?: Set<string>
  onElementDelete?: (elementNames: string[]) => void
  onAddElements?: (elementNames: string[]) => void
  addingItems?: Set<string>
  onAddingItemsChange?: (items: Set<string>) => void
  className?: string
}

export function XmlStructureViewer ({
  analysis,
  xmlString,
  onElementSelect,
  onElementsSelect,
  selectedElements,
  includedElements,
  onElementDelete,
  onAddElements,
  addingItems,
  onAddingItemsChange,
  className
}: XmlStructureViewerProps) {
  return (
    <div className={cn('p-4 bg-background', className)}>
      {xmlString ? (
        <XmlJsonTreeViewer 
          xmlString={xmlString}
          analysis={analysis}
          analysisRules={{
            ignoredElements: analysis.ignoredElements || [],
            ignoredSubtrees: analysis.ignoredSubtrees || []
          }}
          includedElements={includedElements}
          onAddElements={onAddElements}
          addingItems={addingItems}
          onAddingItemsChange={onAddingItemsChange}
        />
      ) : (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>XML content not available for tree view</p>
        </div>
      )}
    </div>
  )
}
