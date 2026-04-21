'use client'

import React from 'react'
import { Info, X, Check, MapPin, Plus, Loader2, FolderTree } from 'lucide-react'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import type { ElementFactSheet } from '../../../utils/xmlElementFactSheet'
import type { XmlStructureAnalysis } from '../../../services/xml/xmlAnalyzer'

interface FactSheetPanelProps {
  factSheet: ElementFactSheet | null
  analysis?: XmlStructureAnalysis | null
  onAddElements?: (elementNames: string[]) => void
  isElementIncluded: (elementName: string) => boolean
  addingItems: Set<string>
  isXmlPanelOpen: boolean
  hasSelectedNode: boolean
  onLocateInXml: () => void
  onClose: () => void
}

export function FactSheetPanel({
  factSheet,
  analysis,
  onAddElements,
  isElementIncluded,
  addingItems,
  isXmlPanelOpen,
  hasSelectedNode,
  onLocateInXml,
  onClose
}: FactSheetPanelProps) {
  if (!factSheet) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4" />
            Element Details
          </h3>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-sm text-muted-foreground text-center italic">
          Click on any element node to view its detailed properties and structure
        </div>
      </div>
    )
  }

  const getElementTypeInfo = (elementName: string) => {
    if (!analysis) return null
    return analysis.elementTypes.find(et => et.name.toLowerCase() === elementName.toLowerCase())
  }

  const elementType = getElementTypeInfo(factSheet.elementName)
  const isIncluded = isElementIncluded(factSheet.elementName)
  const isAdding = addingItems.has(factSheet.elementName)

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4" />
            Element Details
          </h3>
          <div className="flex items-center gap-2">
            {analysis && (
              <div className="text-xs text-muted-foreground hidden sm:block">
                {analysis.elementTypes.length} types • {analysis.totalElements} elements
              </div>
            )}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto p-4 flex-1 space-y-4">
        {/* Element Header Actions */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Element Name</h4>
          <div className="flex items-center gap-2">
            {onAddElements && !isIncluded && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onAddElements([factSheet.elementName])}
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1" />
                    Add to Mapping
                  </>
                )}
              </Button>
            )}
            {isIncluded && (
              <Badge variant="secondary" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                In Mapping
              </Badge>
            )}
            {isXmlPanelOpen && hasSelectedNode && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={onLocateInXml}
                title="Locate in XML"
              >
                <MapPin className="h-3 w-3 mr-1" />
                Locate in XML
              </Button>
            )}
          </div>
        </div>

        {/* Element Name Badge */}
        <div className="bg-muted/50 p-2 rounded">
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
              {factSheet.elementName}
            </code>
            {elementType?.specialPatterns?.isIgnoredSubtree && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-600 bg-amber-50">
                <FolderTree className="h-2.5 w-2.5 mr-0.5" />
                Subtree Ignored
              </Badge>
            )}
          </div>
          {factSheet.isArrayItem && factSheet.arrayIndex !== undefined && (
            <Badge variant="secondary" className="mt-2 text-xs">
              Array Index: {factSheet.arrayIndex}
            </Badge>
          )}
        </div>

        {/* Type Statistics */}
        {elementType && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Type Statistics</h4>
            <div className="bg-muted/50 p-2 rounded space-y-1">
              <div className="text-xs flex items-center justify-between">
                <span className="text-muted-foreground">Total Instances:</span>
                <span className="font-mono font-medium">{elementType.count}</span>
              </div>
              <div className="text-xs flex items-center justify-between">
                <span className="text-muted-foreground">Attributes:</span>
                <span className="font-mono font-medium">{elementType.attributes.length}</span>
              </div>
              <div className="text-xs flex items-center justify-between">
                <span className="text-muted-foreground">Child Types:</span>
                <span className="font-mono font-medium">{elementType.children.length}</span>
              </div>
              {elementType.hasTextContent && (
                <div className="text-xs text-muted-foreground italic mt-1">
                  Contains text content
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attributes */}
        {factSheet.attributes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Attributes ({factSheet.attributes.length})</h4>
            <div className="space-y-1">
              {factSheet.attributes.map((attr, idx) => (
                <div key={idx} className="bg-muted/50 p-2 rounded flex items-center gap-2">
                  <code className="text-xs font-mono text-blue-600">{attr.name}</code>
                  <span className="text-xs text-muted-foreground">=</span>
                  <span className="text-xs break-all">{attr.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Children */}
        {factSheet.children.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Children ({factSheet.children.length} types)</h4>
            <div className="flex flex-wrap gap-2">
              {factSheet.children.map((child, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  <code className="font-mono">{child.name}</code>
                  {child.count > 1 && (
                    <span className="ml-1 text-muted-foreground">({child.count})</span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Parent / Ancestors */}
        <div className="grid grid-cols-1 gap-4">
          {factSheet.parent && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Parent Element</h4>
              <div className="bg-muted/50 p-2 rounded">
                <code className="text-sm font-mono">{factSheet.parent}</code>
              </div>
            </div>
          )}

          {factSheet.ancestors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Ancestors ({factSheet.ancestors.length})</h4>
              <div className="flex flex-wrap gap-2">
                {factSheet.ancestors.map((ancestor, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    <code className="font-mono">{ancestor}</code>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Text Content */}
        {factSheet.hasTextContent && factSheet.textContent && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Text Content</h4>
            <div className="bg-muted/50 p-2 rounded">
              <p className="text-xs whitespace-pre-wrap break-words">
                {factSheet.textContent.length > 500
                  ? `${factSheet.textContent.substring(0, 500)}...`
                  : factSheet.textContent}
              </p>
              {factSheet.textContent.length > 500 && (
                <p className="text-xs text-muted-foreground mt-1">
                  (Truncated - {factSheet.textContent.length} characters total)
                </p>
              )}
            </div>
          </div>
        )}

        {!factSheet.hasTextContent && factSheet.children.length === 0 && (
          <div className="text-xs text-muted-foreground italic py-2">
            This element has no text content or children.
          </div>
        )}
      </div>
    </div>
  )
}
