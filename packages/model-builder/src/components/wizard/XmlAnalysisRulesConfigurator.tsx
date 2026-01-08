'use client'

import { useState, useEffect, useMemo, useRef, startTransition } from 'react'
import { Plus, X, List, Search, Ban, FolderTree, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { cn } from '../../utils/cn'
import type { XmlAnalysisRules } from '../../services/xmlAnalyzer'
import type { XmlElementInfo } from '../../utils/xmlElementExtractor'
import { useAIFeature } from '../../ai/config'
import { usePanelResize } from './XmlImportWizard/hooks/usePanelResize'

interface XmlAnalysisRulesConfiguratorProps {
  initialRules?: Partial<XmlAnalysisRules>
  onRulesChange: (rules: Partial<XmlAnalysisRules>) => void
  availableElements?: XmlElementInfo
  className?: string
  onOpenAIAssistant?: () => void
}

export function XmlAnalysisRulesConfigurator ({
  initialRules,
  onRulesChange,
  availableElements,
  className,
  onOpenAIAssistant
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
    function handleMouseDownOutside (event: MouseEvent) {
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

  const { panelWidth, isResizing, panelsContainerRef, startResizing } = usePanelResize({
    initialWidth: 50,
    minWidth: 20,
    maxWidth: 80
  })

  return (
    <div className={cn('flex flex-col', className)}>
      {/* <div className="bg-muted/30 border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-1.5">
            <Settings className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Rules Configuration</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Customize how your XML structure is analyzed</p>
          </div>
        </div>
      </div> */}

      <div
        ref={panelsContainerRef}
        className="flex gap-0 relative flex-1 overflow-hidden"
        style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}
      >
        {/* Ignored Elements Panel */}
        <div className="bg-white border border-red-200/50 rounded-xl shadow-sm overflow-hidden shrink-0 flex flex-col" style={{ width: `${panelWidth}%`, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
          <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200/50 shrink-0">
            <div className="bg-red-100 rounded-lg p-2 shrink-0 mt-0.5">
              <Ban className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-sm font-semibold text-foreground">Ignored Elements</Label>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Elements to completely ignore during analysis
              </p>
            </div>
            {getList('ignoredElements').length > 0 && (
              <div className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0">
                {getList('ignoredElements').length}
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-white">
            <div className="flex gap-2">
              <div className="relative flex-1" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={availableElements ? "Search or type element name..." : "Type element name..."}
                    className="h-9 text-sm pl-9 pr-20 border-2 focus:border-primary/50"
                    value={searchTerm.elementSearch || ''}
                    onChange={(e) => {
                      setSearchTerm({ ...searchTerm, elementSearch: e.target.value })
                      setShowDropdown({ ...showDropdown, ignoredElements: true })
                    }}
                    onFocus={() => {
                      if (availableElements && availableElements.elementNames.length > 0) {
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
                          // Keep dropdown open for multiple selections
                        }
                      }
                    }}
                  />
                  {availableElements && availableElements.elementNames.length > 0 && (
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
                        className="absolute right-0 top-0 h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
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
            {availableElements && availableElements.elementNames.length > 0 && showDropdown.ignoredElements && (
              <div 
                ref={ignoredElementsDropdownRef}
                className="border-2 border-primary/20 rounded-lg max-h-48 overflow-y-auto bg-background shadow-xl z-10"
              >
                {filteredIgnoredElements.length > 0 ? (
                  <>
                    <div className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b px-3 py-2 text-xs font-medium text-foreground">
                      <span className="text-primary">{filteredIgnoredElements.length}</span> element{filteredIgnoredElements.length !== 1 ? 's' : ''} available
                      {currentIgnoredElements.length > 0 && (
                        <span className="ml-2 text-muted-foreground">({currentIgnoredElements.length} already added)</span>
                      )}
                    </div>
                    {filteredIgnoredElements.slice(0, 50).map((name: string) => (
                      <button
                        key={name}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-primary/5 hover:text-primary transition-colors border-b border-border/50 last:border-b-0"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const trimmedName = name.trim()
                          if (trimmedName) {
                            addToList('ignoredElements', trimmedName)
                            setSearchTerm({ ...searchTerm, elementSearch: '' })
                            // Keep dropdown open for multiple selections
                          }
                        }}
                      >
                        {name}
                      </button>
                    ))}
                    {filteredIgnoredElements.length > 50 && (
                      <div className="p-3 text-xs text-muted-foreground text-center border-t bg-muted/30">
                        Showing first 50 of {filteredIgnoredElements.length} elements. Type to filter.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-sm text-muted-foreground text-center">
                    All available elements have been added. Remove items from the list above to add more.
                  </div>
                )}
              </div>
            )}
            {getList('ignoredElements').length === 0 ? (
              <div className="pt-2 border-t border-red-200/50 flex items-center justify-center min-h-[200px]">
                <div className="flex flex-col items-center justify-center gap-4 text-center py-8">
                  <Ban className="h-12 w-12 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground max-w-xs">
                    You can add elements from the list above{isXmlMappingEnabled && ' or use the AI Assistant for suggestions'}
                  </p>
                  {onOpenAIAssistant && isXmlMappingEnabled && (
                    <Button
                      onClick={onOpenAIAssistant}
                      size="sm"
                      variant="outline"
                      className="mt-2 flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Get AI Suggestions</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-red-200/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    {getList('ignoredElements').length} element{getList('ignoredElements').length !== 1 ? 's' : ''} ignored
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearList('ignoredElements')}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear All</span>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {getList('ignoredElements').map((item) => (
                    <div key={item} className="group flex items-center gap-1 px-2 py-1 bg-red-100 border border-red-200 rounded-md text-xs font-medium text-red-900 hover:bg-red-200 transition-colors">
                      <span>{item}</span>
                      <button
                        onClick={() => removeFromList('ignoredElements', item)}
                        className="hover:text-red-700 hover:bg-red-300 rounded p-0.5 transition-colors"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
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

        {/* Ignored Subtrees Panel */}
        <div className="bg-white border border-amber-200/50 rounded-xl shadow-sm overflow-hidden shrink-0 flex flex-col" style={{ width: `${100 - panelWidth}%`, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
          <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200/50 shrink-0">
            <div className="bg-amber-100 rounded-lg p-2 shrink-0 mt-0.5">
              <FolderTree className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-sm font-semibold text-foreground">Ignored Subtrees</Label>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Elements whose children should be ignored
              </p>
            </div>
            {getList('ignoredSubtrees').length > 0 && (
              <div className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0">
                {getList('ignoredSubtrees').length}
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-white">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={availableElements ? "Search or type element name..." : "Type element name..."}
                    className="h-9 text-sm pl-9 pr-20 border-2 focus:border-primary/50"
                    value={searchTerm.subtreeSearch || ''}
                    onChange={(e) => {
                      setSearchTerm({ ...searchTerm, subtreeSearch: e.target.value })
                      setShowDropdown({ ...showDropdown, ignoredSubtrees: true })
                    }}
                    onFocus={() => {
                      if (availableElements && availableElements.elementNames.length > 0) {
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
                          // Keep dropdown open for multiple selections
                        }
                      }
                    }}
                  />
                  {availableElements && availableElements.elementNames.length > 0 && (
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
                        className="absolute right-0 top-0 h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
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
            {availableElements && availableElements.elementNames.length > 0 && showDropdown.ignoredSubtrees && (
              <div 
                ref={ignoredSubtreesDropdownRef}
                className="border-2 border-primary/20 rounded-lg max-h-48 overflow-y-auto bg-background shadow-xl z-10"
              >
                {filteredIgnoredSubtrees.length > 0 ? (
                  <>
                    <div className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b px-3 py-2 text-xs font-medium text-foreground">
                      <span className="text-primary">{filteredIgnoredSubtrees.length}</span> element{filteredIgnoredSubtrees.length !== 1 ? 's' : ''} available
                      {currentIgnoredSubtrees.length > 0 && (
                        <span className="ml-2 text-muted-foreground">({currentIgnoredSubtrees.length} already added)</span>
                      )}
                    </div>
                    {filteredIgnoredSubtrees.slice(0, 50).map((name: string) => (
                      <button
                        key={name}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-primary/5 hover:text-primary transition-colors border-b border-border/50 last:border-b-0"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const trimmedName = name.trim()
                          if (trimmedName) {
                            addToList('ignoredSubtrees', trimmedName)
                            setSearchTerm({ ...searchTerm, subtreeSearch: '' })
                            // Keep dropdown open for multiple selections
                          }
                        }}
                      >
                        {name}
                      </button>
                    ))}
                    {filteredIgnoredSubtrees.length > 50 && (
                      <div className="p-3 text-xs text-muted-foreground text-center border-t bg-muted/30">
                        Showing first 50 of {filteredIgnoredSubtrees.length} elements. Type to filter.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-sm text-muted-foreground text-center">
                    All available elements have been added. Remove items from the list above to add more.
                  </div>
                )}
              </div>
            )}
            {getList('ignoredSubtrees').length === 0 ? (
              <div className="pt-2 border-t border-amber-200/50 flex items-center justify-center min-h-[200px]">
                <div className="flex flex-col items-center justify-center gap-4 text-center py-8">
                  <FolderTree className="h-12 w-12 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground max-w-xs">
                    You can add elements from the list above{isXmlMappingEnabled && ' or use the AI Assistant for suggestions'}
                  </p>
                  {onOpenAIAssistant && isXmlMappingEnabled && (
                    <Button
                      onClick={onOpenAIAssistant}
                      size="sm"
                      variant="outline"
                      className="mt-2 flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Get AI Suggestions</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-amber-200/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    {getList('ignoredSubtrees').length} subtree{getList('ignoredSubtrees').length !== 1 ? 's' : ''} ignored
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearList('ignoredSubtrees')}
                    className="h-6 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear All</span>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {getList('ignoredSubtrees').map((item) => (
                    <div key={item} className="group flex items-center gap-1 px-2 py-1 bg-amber-100 border border-amber-200 rounded-md text-xs font-medium text-amber-900 hover:bg-amber-200 transition-colors">
                      <span>{item}</span>
                      <button
                        onClick={() => removeFromList('ignoredSubtrees', item)}
                        className="hover:text-amber-700 hover:bg-amber-300 rounded p-0.5 transition-colors"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

