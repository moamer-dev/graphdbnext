'use client'

import { useState, useEffect, useMemo, useRef, startTransition } from 'react'
import { Plus, List, Search, Ban, FolderTree, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ResizablePanel } from '../ui/resizable-panel'
import { cn } from '../../utils/cn'
import { XmlCodePreview } from '../editor/XmlCodePreview'
import type { XmlAnalysisRules } from '../../services/xml/xmlAnalyzer'
import type { XmlElementInfo } from '../../utils/xmlElementExtractor'
import { useAIFeature } from '../../ai/config'


interface XmlAnalysisRulesConfiguratorProps {
  initialRules?: Partial<XmlAnalysisRules>
  onRulesChange: (rules: Partial<XmlAnalysisRules>) => void
  availableElements?: XmlElementInfo
  className?: string
  onOpenAIAssistant?: () => void
  xmlPreview?: string | null
}

export function XmlAnalysisRulesConfigurator({
  initialRules,
  onRulesChange,
  availableElements,
  className,
  onOpenAIAssistant,
  xmlPreview
}: XmlAnalysisRulesConfiguratorProps) {
  const isXmlMappingEnabled = useAIFeature('xmlMappingAssistant')
  const defaultRules: XmlAnalysisRules = {
    ignoredElements: [],
    ignoredSubtrees: [],
    referenceAttributes: [],
    patternRules: {
      alternativeAttributes: [],
      annotationAttributes: [],
      translationAttributes: [],
      choiceIndicators: []
    },
    relationshipTypeMappings: {},
    textContentRules: {
      characterLevelElements: [],
      signLevelElements: []
    }
  }

  const [rules, setRules] = useState<Partial<XmlAnalysisRules>>(() => {
    const sanitizedRules: Partial<XmlAnalysisRules> = {
      ...initialRules,
      patternRules: defaultRules.patternRules,
      relationshipTypeMappings: {}
    }
    return sanitizedRules
  })
  const [searchTerm, setSearchTerm] = useState<Record<string, string>>({})
  const [showOnlyIgnored, setShowOnlyIgnored] = useState<Record<string, boolean>>({
    elements: false,
    subtrees: false
  })
  const prevInitialRulesRef = useRef<string>(JSON.stringify(initialRules || {}))

  // Sync with initialRules when they change (e.g., when navigating back)
  // Also sanitize legacy pattern/relationship rules we no longer expose
  useEffect(() => {
    const currentInitialRulesString = JSON.stringify(initialRules || {})

    // Only update if initialRules actually changed from outside
    if (prevInitialRulesRef.current !== currentInitialRulesString) {
      prevInitialRulesRef.current = currentInitialRulesString

      const sanitizedRules: Partial<XmlAnalysisRules> = {
        ...initialRules,
        patternRules: defaultRules.patternRules,
        relationshipTypeMappings: {}
      }

      // Use functional update to avoid dependency on rules state
      // Use startTransition to mark this as a non-urgent update
      startTransition(() => {
        setRules((prevRules) => {
          const prevRulesString = JSON.stringify(prevRules || {})
          const sanitizedRulesString = JSON.stringify(sanitizedRules || {})

          // Only update if something actually changed to avoid render loops
          if (prevRulesString !== sanitizedRulesString) {
            // Schedule callback after state update to avoid cascading renders
            queueMicrotask(() => {
              onRulesChange(sanitizedRules)
            })
            return sanitizedRules
          }
          return prevRules
        })
      })
    }
  }, [initialRules, onRulesChange, defaultRules.patternRules])


  // Helper to get current value or default
  const getList = (key: keyof XmlAnalysisRules) => (rules[key] as string[]) || defaultRules[key] as string[]


  const updateRules = (updates: Partial<XmlAnalysisRules>) => {
    const newRules = { ...rules, ...updates }
    setRules(newRules)
    onRulesChange(newRules)
  }

  const addToList = (listKey: keyof XmlAnalysisRules, value: string) => {
    if (!value || !value.trim()) {
      console.warn('addToList: empty value', { listKey, value })
      return
    }
    const trimmedValue = value.trim()
    const currentList = (rules[listKey] as string[]) || []
    if (!currentList.includes(trimmedValue)) {
      const newList = [...currentList, trimmedValue]
      console.log('addToList: adding', { listKey, value: trimmedValue, newList })
      updateRules({ [listKey]: newList })
    } else {
      console.log('addToList: already exists', { listKey, value: trimmedValue })
    }
  }

  const removeFromList = (listKey: keyof XmlAnalysisRules, value: string) => {
    const currentList = (rules[listKey] as string[]) || []
    const newList = currentList.filter(item => item !== value)
    updateRules({ [listKey]: newList })
  }

  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState('ignored-elements')
  const [previewWidth, setPreviewWidth] = useState(600)

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full bg-transparent">
        <div className="flex items-center gap-2 px-1 pb-2 border-b shrink-0">
          <TabsList className="grid flex-1 grid-cols-2 h-11 bg-muted/20 p-1 rounded-lg">
            <TabsTrigger
              value="ignored-elements"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border"
            >
              <Ban className="h-4 w-4" />
              <span className="font-medium">Ignored Elements</span>
              {getList('ignoredElements').length > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[1.25rem]">
                  {getList('ignoredElements').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="ignored-subtrees"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border"
            >
              <FolderTree className="h-4 w-4" />
              <span className="font-medium">Ignored Subtrees</span>
              {getList('ignoredSubtrees').length > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[1.25rem]">
                  {getList('ignoredSubtrees').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {xmlPreview && (
            <div className="flex items-center gap-1">

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className={cn(
                  "h-8 gap-2 text-xs font-medium transition-colors",
                  showPreview ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Hide XML
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Show XML
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div
          className="w-full flex overflow-hidden min-h-0 pt-2 h-[calc(100vh-350px)] min-h-[400px] border rounded-lg"
        >
          {/* Rules Panel (Fills remaining space) */}
          <div className="flex-1 min-w-0 flex flex-col h-full bg-background">
            <TabsContent value="ignored-elements" className="flex-1 flex flex-col m-0 min-h-0 data-[state=inactive]:hidden h-full">
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b shrink-0">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Toggle the visibility of elements. Ignored elements won&apos;t appear in the graph at all.
                </p>
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                <div className="p-4 border-b shrink-0 flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search elements..."
                      className="h-9 text-sm pl-9"
                      value={searchTerm.elementSearch || ''}
                      onChange={(e) => setSearchTerm({ ...searchTerm, elementSearch: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2 pr-2 border-l pl-4">
                    <Switch
                      id="show-ignored-elements"
                      checked={showOnlyIgnored.elements}
                      onCheckedChange={(checked) => setShowOnlyIgnored({ ...showOnlyIgnored, elements: checked })}
                      className="scale-75"
                    />
                    <Label htmlFor="show-ignored-elements" className="text-xs font-medium cursor-pointer whitespace-nowrap">
                      Only Ignored
                    </Label>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {availableElements ? (
                    <div className="divide-y divide-border/40">
                      {availableElements.elementNames
                        .filter(name => {
                          const matchesSearch = !searchTerm.elementSearch || name.toLowerCase().includes(searchTerm.elementSearch.toLowerCase())
                          if (showOnlyIgnored.elements) {
                            return matchesSearch && getList('ignoredElements').includes(name)
                          }
                          return matchesSearch
                        })
                        .sort()
                        .map(name => {
                          const isIgnored = getList('ignoredElements').includes(name)
                          return (
                            <div key={name} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 group">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  isIgnored ? "bg-muted-foreground/30 shadow-[0_0_8px_rgba(0,0,0,0.1)]" : "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                                )} />
                                <span className={cn(
                                  "text-sm font-medium transition-colors",
                                  isIgnored ? "text-muted-foreground" : "text-foreground"
                                )}>
                                  {name}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => isIgnored ? removeFromList('ignoredElements', name) : addToList('ignoredElements', name)}
                                className={cn(
                                  "h-8 w-8 p-0 rounded-full transition-all",
                                  isIgnored ? "text-muted-foreground hover:bg-muted hover:text-foreground" : "text-primary hover:bg-primary/10"
                                )}
                              >
                                {isIgnored ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Ban className="h-8 w-8 text-muted-foreground/20 mb-3" />
                      <p className="text-sm text-muted-foreground">No elements detected</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ignored-subtrees" className="flex-1 flex flex-col m-0 min-h-0 data-[state=inactive]:hidden h-full">
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b shrink-0">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Toggle child discovery. Hiding a subtree keeps the element but ignores its nested content.
                </p>
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                <div className="p-4 border-b shrink-0 flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search subtrees..."
                      className="h-9 text-sm pl-9"
                      value={searchTerm.subtreeSearch || ''}
                      onChange={(e) => setSearchTerm({ ...searchTerm, subtreeSearch: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2 pr-2 border-l pl-4">
                    <Switch
                      id="show-ignored-subtrees"
                      checked={showOnlyIgnored.subtrees}
                      onCheckedChange={(checked) => setShowOnlyIgnored({ ...showOnlyIgnored, subtrees: checked })}
                      className="scale-75"
                    />
                    <Label htmlFor="show-ignored-subtrees" className="text-xs font-medium cursor-pointer whitespace-nowrap">
                      Only Ignored
                    </Label>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {availableElements ? (
                    <div className="divide-y divide-border/40">
                      {availableElements.elementNames
                        .filter(name => {
                          const matchesSearch = !searchTerm.subtreeSearch || name.toLowerCase().includes(searchTerm.subtreeSearch.toLowerCase())
                          if (showOnlyIgnored.subtrees) {
                            return matchesSearch && getList('ignoredSubtrees').includes(name)
                          }
                          return matchesSearch
                        })
                        .sort()
                        .map(name => {
                          const isSubtreeIgnored = getList('ignoredSubtrees').includes(name)
                          return (
                            <div key={name} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 group">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  isSubtreeIgnored ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                )} />
                                <span className={cn(
                                  "text-sm font-medium transition-colors",
                                  isSubtreeIgnored ? "text-muted-foreground" : "text-foreground"
                                )}>
                                  {name}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => isSubtreeIgnored ? removeFromList('ignoredSubtrees', name) : addToList('ignoredSubtrees', name)}
                                className={cn(
                                  "h-8 w-8 p-0 rounded-full transition-all",
                                  isSubtreeIgnored ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                                )}
                              >
                                {isSubtreeIgnored ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FolderTree className="h-8 w-8 text-muted-foreground/20 mb-3" />
                      <p className="text-sm text-muted-foreground">No elements detected</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>

          {/* XML Preview Panel */}
          {showPreview && (
            <ResizablePanel
              side="right"
              defaultWidth={previewWidth}
              minWidth={300}
              onWidthChange={setPreviewWidth}
              className="h-full border-l"
            >
              <div className="h-full flex flex-col min-w-0 bg-background">
                <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b shrink-0 h-[46px]">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 rounded p-1">
                      <Eye className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <span className="text-xs font-semibold">XML Preview</span>
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden relative">
                  <div className="absolute inset-0">
                    <XmlCodePreview
                      value={xmlPreview || 'No XML content available'}
                      height="100%"
                      //wrapWord={wrapWord}
                    />
                  </div>
                </div>
              </div>
            </ResizablePanel>
          )}
        </div>
      </Tabs >
    </div >
  )
}

