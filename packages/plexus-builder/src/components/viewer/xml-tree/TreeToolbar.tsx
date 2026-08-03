'use client'

import React from 'react'
import { Search, X, ChevronLeft, ChevronRight, ChevronsDownUp, ChevronsUpDown, Network } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Switch } from '../../ui/switch'
import { Label } from '../../ui/label'
import { cn } from '../../../utils/cn'
import { useXmlImportWizardStore } from '../../../stores/xmlImportWizardStore'

interface TreeToolbarProps {
  activeTab: 'tree' | 'nodes'
  setActiveTab: (tab: 'tree' | 'nodes') => void
  isXmlPanelOpen: boolean
  setIsXmlPanelOpen: (open: boolean) => void
  isDetailsPanelOpen: boolean
  setIsDetailsPanelOpen: (open: boolean) => void
  expandedKeysSize: number
  expandAll: () => void
  collapseAll: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  matchingPaths: string[]
  currentMatchIndex: number
  goToPreviousMatch: () => void
  goToNextMatch: () => void
  onClearSearch: () => void
}

export function TreeToolbar({
  activeTab,
  setActiveTab,
  isXmlPanelOpen,
  setIsXmlPanelOpen,
  isDetailsPanelOpen,
  setIsDetailsPanelOpen,
  expandedKeysSize,
  expandAll,
  collapseAll,
  searchQuery,
  setSearchQuery,
  matchingPaths,
  currentMatchIndex,
  goToPreviousMatch,
  goToNextMatch,
  onClearSearch
}: TreeToolbarProps) {
  const autoConnectRelations = useXmlImportWizardStore(state => state.autoConnectRelations)
  const setAutoConnectRelations = useXmlImportWizardStore(state => state.setAutoConnectRelations)
  return (
    <div className="p-4 border-b bg-background flex-shrink-0 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Main Tabs */}
          <div className="flex items-center gap-1 border rounded-md p-0.5 mr-2">
            <Button
              variant={activeTab === 'tree' ? 'default' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setActiveTab('tree')}
            >
              Tree
            </Button>
            <Button
              variant={activeTab === 'nodes' ? 'default' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setActiveTab('nodes')}
            >
              Nodes
            </Button>
          </div>

          {/* View Toggles */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1.5 border-r pr-3">
              <Label htmlFor="show-xml" className="text-[12px] text-muted-foreground cursor-pointer">
                XML
              </Label>
              <Switch
                id="show-xml"
                checked={isXmlPanelOpen}
                onCheckedChange={setIsXmlPanelOpen}
                className="scale-75"
              />
            </div>
            <div className="flex items-center gap-1.5 border-r pr-3">
              <Label htmlFor="show-details" className="text-[12px] text-muted-foreground cursor-pointer">
                Meta
              </Label>
              <Switch
                id="show-details"
                checked={isDetailsPanelOpen}
                onCheckedChange={setIsDetailsPanelOpen}
                className="scale-75"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Network className="h-3 w-3 text-muted-foreground" />
              <Label htmlFor="auto-connect-structure" className="text-[12px] text-muted-foreground cursor-pointer" title="Auto-connect relations based on structure when adding nodes to mapping">
                Auto-Connect
              </Label>
              <Switch
                id="auto-connect-structure"
                checked={autoConnectRelations}
                onCheckedChange={setAutoConnectRelations}
                className="scale-75"
              />
            </div>
          </div>
        </div>

        {/* Tree Controls (Expand/Collapse) */}
        {activeTab === 'tree' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md border text-[11px] font-medium text-muted-foreground">
              {expandedKeysSize > 0 ? (
                <ChevronsUpDown className="h-3 w-3" />
              ) : (
                <ChevronsDownUp className="h-3 w-3" />
              )}
              <Switch
                id="expand-collapse-tree"
                checked={expandedKeysSize > 0}
                onCheckedChange={(checked) => (checked ? expandAll() : collapseAll())}
                className="scale-75 ml-1"
                title={expandedKeysSize > 0 ? 'Collapse All' : 'Expand All'}
              />
            </div>
          </div>
        )}
      </div>

      {/* Search Bar for Tree Tab */}
      {activeTab === 'tree' && (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search elements or values in tree..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-8 h-8 text-xs bg-muted/10",
              matchingPaths.length > 0 ? "pr-32" : "pr-8"
            )}
          />
          {searchQuery && (
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {matchingPaths.length > 0 && (
                <div className="flex items-center gap-0.5 mr-1">
                  <span className="text-[10px] tabular-nums font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {currentMatchIndex + 1}/{matchingPaths.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-muted"
                    onClick={goToPreviousMatch}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-muted"
                    onClick={goToNextMatch}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
                onClick={onClearSearch}
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
