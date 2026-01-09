'use client'

import { useState, useEffect, useMemo, useRef, startTransition } from 'react'
import { Plus, X, List, Search, Ban, FolderTree, Sparkles, Trash2, Eye, EyeOff, WrapText } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable-panel'
import { cn } from '../../utils/cn'
import { XmlCodePreview } from '../editor/XmlCodePreview'
import type { XmlAnalysisRules } from '../../services/xmlAnalyzer'
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
  const [showDropdown, setShowDropdown] = useState<Record<string, boolean>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)
  const ignoredElementsDropdownRef = useRef<HTMLDivElement>(null)
  const ignoredSubtreesDropdownRef = useRef<HTMLDivElement>(null)
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
  }, [initialRules, onRulesChange])

  // Close dropdown when clicking outside - using mousedown to avoid interfering with clicks
  useEffect(() => {
    function handleMouseDownOutside(event: MouseEvent) {
      const target = event.target as Node
      const isIgnoredElementsDropdown = ignoredElementsDropdownRef.current?.contains(target)
      const isIgnoredSubtreesDropdown = ignoredSubtreesDropdownRef.current?.contains(target)
      const isInputContainer = dropdownRef.current?.contains(target)

      // Don't close if clicking inside any dropdown or input container
      if (!isIgnoredElementsDropdown && !isIgnoredSubtreesDropdown && !isInputContainer) {
        // Only close if it's not a button click (buttons will handle their own closing)
        const isButton = (target as Element).closest('button')
        if (!isButton) {
          setShowDropdown({})
        }
      }
    }

    // Use mousedown but check if it's a button - buttons will handle closing via onClick
    document.addEventListener('mousedown', handleMouseDownOutside)
    return () => {
      document.removeEventListener('mousedown', handleMouseDownOutside)
    }
  }, [])

  // Helper to get current value or default
  const getList = (key: keyof XmlAnalysisRules) => (rules[key] as string[]) || defaultRules[key] as string[]

  // Get current lists for filtering
  const currentIgnoredElements = getList('ignoredElements')
  const currentIgnoredSubtrees = getList('ignoredSubtrees')

  // Filter available elements/attributes based on search and exclude already added items
  const filteredIgnoredElements = useMemo(() => {
    if (!availableElements) return []
    const search = (searchTerm.elementSearch || '').toLowerCase()
    let filtered = availableElements.elementNames.filter((name: string) =>
      !currentIgnoredElements.includes(name)
    )
    if (search) {
      filtered = filtered.filter((name: string) =>
        name.toLowerCase().includes(search)
      )
    }
    return filtered
  }, [availableElements, searchTerm.elementSearch, currentIgnoredElements])

  const filteredIgnoredSubtrees = useMemo(() => {
    if (!availableElements) return []
    const search = (searchTerm.subtreeSearch || '').toLowerCase()
    let filtered = availableElements.elementNames.filter((name: string) =>
      !currentIgnoredSubtrees.includes(name)
    )
    if (search) {
      filtered = filtered.filter((name: string) =>
        name.toLowerCase().includes(search)
      )
    }
    return filtered
  }, [availableElements, searchTerm.subtreeSearch, currentIgnoredSubtrees])

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

  const clearList = (listKey: keyof XmlAnalysisRules) => {
    updateRules({ [listKey]: [] })
  }



  /* eslint-disable react-hooks/rules-of-hooks */
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState('ignored-elements')
  const [wrapWord, setWrapWord] = useState(false)
  /* eslint-enable react-hooks/rules-of-hooks */

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
          className="w-full flex overflow-hidden min-h-0 pt-2 h-[calc(100vh-350px)] min-h-[400px]"
        >
          <ResizablePanelGroup orientation="horizontal" className="h-full rounded-lg border">
            {/* Rules Panel */}
            <ResizablePanel defaultSize={showPreview ? "50" : "100"} minSize="30">
              <div className="h-full bg-background flex flex-col border-none">
                <TabsContent value="ignored-elements" className="flex-1 flex flex-col m-0 min-h-0 data-[state=inactive]:hidden h-full">
                  <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b shrink-0">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Select elements to completely ignore during analysis. They won't appear in the graph.
                    </p>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1" ref={dropdownRef}>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={availableElements ? "Search element to ignore..." : "Type element name..."}
                            className="h-9 text-sm pl-9 pr-20 border-2 focus:border-primary/50 focus:ring-primary/20"
                            value={searchTerm.elementSearch || ''}
                            onChange={(e) => {
                              setSearchTerm({ ...searchTerm, elementSearch: e.target.value })
                              setShowDropdown({ ...showDropdown, ignoredElements: true })
                            }}
                            onFocus={() => {
                              if (availableElements && availableElements?.elementNames.length > 0) {
                                setShowDropdown({ ...showDropdown, ignoredElements: true })
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                const value = e.currentTarget.value.trim()
                                if (value) {
                                  addToList('ignoredElements', value)
                                  setSearchTerm({ ...searchTerm, elementSearch: '' })
                                }
                              }
                            }}
                          />
                          {availableElements && availableElements?.elementNames.length > 0 && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute right-10 top-0 h-9 w-9 p-0 hover:bg-muted"
                                onClick={() => {
                                  setShowDropdown({ ...showDropdown, ignoredElements: !showDropdown.ignoredElements })
                                }}
                                title="Show all elements"
                              >
                                <List className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute right-0 top-0 h-9 w-9 p-0 hover:bg-muted hover:text-primary"
                                onClick={() => {
                                  const value = searchTerm.elementSearch?.trim()
                                  if (value) {
                                    addToList('ignoredElements', value)
                                    setSearchTerm({ ...searchTerm, elementSearch: '' })
                                  }
                                }}
                                title="Add current value"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {availableElements && availableElements?.elementNames.length > 0 && showDropdown.ignoredElements && (
                      <div
                        ref={ignoredElementsDropdownRef}
                        className="border border-border rounded-lg max-h-48 overflow-y-auto bg-popover shadow-md z-10"
                      >
                        {filteredIgnoredElements.length > 0 ? (
                          <>
                            {filteredIgnoredElements.slice(0, 50).map((name: string) => (
                              <button
                                key={name}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted hover:text-primary transition-colors border-b border-border/40 last:border-b-0"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  addToList('ignoredElements', name)
                                  setSearchTerm({ ...searchTerm, elementSearch: '' })
                                }}
                              >
                                {name}
                              </button>
                            ))}
                            {filteredIgnoredElements.length > 50 && (
                              <div className="p-2 text-xs text-muted-foreground text-center border-t bg-muted/20">
                                + {filteredIgnoredElements.length - 50} more
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="p-4 text-xs text-muted-foreground text-center">
                            No matching elements found
                          </div>
                        )}
                      </div>
                    )}

                    {getList('ignoredElements').map((item) => (
                      <div key={item} className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border group">
                        <span className="text-sm font-medium">{item}</span>
                        <button
                          onClick={() => removeFromList('ignoredElements', item)}
                          className="text-muted-foreground hover:text-destructive p-1 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {getList('ignoredElements').length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Ban className="h-8 w-8 text-muted-foreground/20 mb-3" />
                        <p className="text-sm text-muted-foreground">No elements ignored</p>
                        {onOpenAIAssistant && isXmlMappingEnabled && (
                          <Button variant="link" size="sm" onClick={onOpenAIAssistant} className="text-primary h-auto p-0 mt-1">
                            Ask AI for suggestions
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="ignored-subtrees" className="flex-1 flex flex-col m-0 min-h-0 data-[state=inactive]:hidden h-full">
                  <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b shrink-0">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Select elements to ignore their children/subtree, but keep the element itself (e.g., if it contains raw text).
                    </p>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={availableElements ? "Search subtree to ignore..." : "Type element name..."}
                            className="h-9 text-sm pl-9 pr-20 border-2 focus:border-primary/50 focus:ring-primary/20"
                            value={searchTerm.subtreeSearch || ''}
                            onChange={(e) => {
                              setSearchTerm({ ...searchTerm, subtreeSearch: e.target.value })
                              setShowDropdown({ ...showDropdown, ignoredSubtrees: true })
                            }}
                            onFocus={() => {
                              if (availableElements && availableElements?.elementNames.length > 0) {
                                setShowDropdown({ ...showDropdown, ignoredSubtrees: true })
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                const value = e.currentTarget.value.trim()
                                if (value) {
                                  addToList('ignoredSubtrees', value)
                                  setSearchTerm({ ...searchTerm, subtreeSearch: '' })
                                }
                              }
                            }}
                          />
                          {availableElements && availableElements?.elementNames.length > 0 && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute right-10 top-0 h-9 w-9 p-0 hover:bg-muted"
                                onClick={() => {
                                  setShowDropdown({ ...showDropdown, ignoredSubtrees: !showDropdown.ignoredSubtrees })
                                }}
                                title="Show all elements"
                              >
                                <List className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute right-0 top-0 h-9 w-9 p-0 hover:bg-muted hover:text-primary"
                                onClick={() => {
                                  const value = searchTerm.subtreeSearch?.trim()
                                  if (value) {
                                    addToList('ignoredSubtrees', value)
                                    setSearchTerm({ ...searchTerm, subtreeSearch: '' })
                                  }
                                }}
                                title="Add current value"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {availableElements && availableElements?.elementNames.length > 0 && showDropdown.ignoredSubtrees && (
                      <div
                        ref={ignoredSubtreesDropdownRef}
                        className="border border-border rounded-lg max-h-48 overflow-y-auto bg-popover shadow-md z-10"
                      >
                        {filteredIgnoredSubtrees.length > 0 ? (
                          <>
                            {filteredIgnoredSubtrees.slice(0, 50).map((name: string) => (
                              <button
                                key={name}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted hover:text-primary transition-colors border-b border-border/40 last:border-b-0"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  addToList('ignoredSubtrees', name)
                                  setSearchTerm({ ...searchTerm, subtreeSearch: '' })
                                }}
                              >
                                {name}
                              </button>
                            ))}
                            {filteredIgnoredSubtrees.length > 50 && (
                              <div className="p-2 text-xs text-muted-foreground text-center border-t bg-muted/20">
                                + {filteredIgnoredSubtrees.length - 50} more
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="p-4 text-xs text-muted-foreground text-center">
                            No matching elements found
                          </div>
                        )}
                      </div>
                    )}

                    {getList('ignoredSubtrees').map((item) => (
                      <div key={item} className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border group">
                        <span className="text-sm font-medium">{item}</span>
                        <button
                          onClick={() => removeFromList('ignoredSubtrees', item)}
                          className="text-muted-foreground hover:text-destructive p-1 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {getList('ignoredSubtrees').length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FolderTree className="h-8 w-8 text-muted-foreground/20 mb-3" />
                        <p className="text-sm text-muted-foreground">No subtrees ignored</p>
                        {onOpenAIAssistant && isXmlMappingEnabled && (
                          <Button variant="link" size="sm" onClick={onOpenAIAssistant} className="text-primary h-auto p-0 mt-1">
                            Ask AI for suggestions
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </ResizablePanel>

            {/* XML Preview Panel */}
            {showPreview && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize="50" minSize="30">
                  <div className="h-full flex flex-col min-w-0 bg-background">
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b shrink-0 h-[46px]">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 rounded p-1">
                          <Eye className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold">XML Preview</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="xml-wrap-switch" className="text-[10px] text-muted-foreground font-medium cursor-pointer">Wrap</Label>
                        <Switch
                          id="xml-wrap-switch"
                          checked={wrapWord}
                          onCheckedChange={setWrapWord}
                          className="scale-75"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden relative">
                      <div className="absolute inset-0">
                        <XmlCodePreview
                          value={xmlPreview || 'No XML content available'}
                          height="100%"
                          wrapWord={wrapWord}
                        />
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </Tabs >
    </div >
  )
}

