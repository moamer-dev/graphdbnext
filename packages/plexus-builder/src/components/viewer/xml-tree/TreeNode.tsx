'use client'

import React, { type ReactNode } from 'react'
import { ChevronRight, ChevronDown, Plus, Check, MapPin, Info } from 'lucide-react'
import { cn } from '../../../utils/cn'
import type { JsonTreeNode } from '../../../utils/xmlToJsonTree'

interface TreeNodeProps {
  node: JsonTreeNode
  depth?: number
  path?: string
  expandedKeys: Set<string>
  toggleExpand: (path: string) => void
  highlightedPath: string | null
  visitedMatches: Set<string>
  selectedNode: { path: string; key: string } | null
  factSheetElementName?: string | null
  onAddElements?: (elementNames: string[]) => void
  isElementIncluded: (elementName: string) => boolean
  isXmlPanelOpen: boolean
  scrollToNodeInXml: (node: JsonTreeNode) => void
  handleNodeClick: (node: JsonTreeNode, currentPath: string, e: React.MouseEvent) => void
  onShowFactSheet: (node: JsonTreeNode, currentPath: string) => void
  highlightedNodeRef?: React.RefObject<HTMLDivElement | null>
}

export function TreeNode({
  node,
  depth = 0,
  path = '',
  expandedKeys,
  toggleExpand,
  highlightedPath,
  visitedMatches,
  selectedNode,
  factSheetElementName,
  onAddElements,
  isElementIncluded,
  isXmlPanelOpen,
  scrollToNodeInXml,
  handleNodeClick,
  onShowFactSheet,
  highlightedNodeRef
}: TreeNodeProps) {
  if (!node) return null

  const currentPath = path ? `${path}.${node.key}` : node.key
  const isExpanded = expandedKeys.has(currentPath)
  const hasChildren = node.children && node.children.length > 0
  const isExpandable = hasChildren
  const isElementNode = !node.key.startsWith('_') && node.key !== '__text'
  const isElementIncludedLocal = isElementIncluded(node.key)
  const isSelected = selectedNode?.path === currentPath
  const isTypeMatch = factSheetElementName === node.key && !isSelected

  const indent = depth * 20

  const isHighlighted = highlightedPath === currentPath
  const wasVisited = visitedMatches.has(currentPath) && !isHighlighted

  return (
    <div className="select-none" ref={isHighlighted ? highlightedNodeRef : null}>
      <div
        className={cn(
          'flex items-center gap-1 py-0.5 hover:bg-muted/30 rounded cursor-pointer group transition-all duration-200',
          node.key.startsWith('_') && 'text-primary/80',
          node.key === '__text' && 'text-emerald-600 dark:text-emerald-400',
          isHighlighted && 'bg-primary/20 dark:bg-primary/30 ring-1 ring-primary/40',
          wasVisited && 'bg-primary/5 dark:bg-primary/10',
          isSelected && 'bg-primary/10 dark:bg-primary/20 border-l-2 border-primary ring-1 ring-primary/30 z-10',
          isTypeMatch && 'bg-indigo-500/10 dark:bg-indigo-500/20 border-l-2 border-indigo-400',
          isElementIncludedLocal && !isSelected && !isTypeMatch && 'bg-emerald-500/10 dark:bg-emerald-500/20 border-l-2 border-emerald-400'
        )}
        style={{ paddingLeft: `${indent}px` }}
        onClick={(e) => handleNodeClick(node, currentPath, e)}
      >
        {isExpandable ? (
          <div className="h-4 w-4 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        ) : (
          <div className="w-4" />
        )}
        <span className="font-mono text-xs font-medium">{node.key}</span>
        {node.type === 'object' || node.type === 'array' ? (
          <span className="text-xs text-muted-foreground ml-1">
            {String(node.value)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground ml-2">
            : {typeof node.value === 'string' && node.value.length > 50
              ? `${node.value.substring(0, 50)}...`
              : String(node.value)}
          </span>
        )}
        {isElementNode && (
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onAddElements && !isElementIncludedLocal && (
              <button
                className="p-0.5 hover:bg-muted rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddElements([node.key])
                }}
                title="Add to mapping"
              >
                <Plus className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            {isElementIncludedLocal && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Check className="h-2.5 w-2.5 inline" />
              </span>
            )}
            {isXmlPanelOpen && (
              <button
                className="p-0.5 hover:bg-muted rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  scrollToNodeInXml(node)
                }}
                title="Locate in XML"
              >
                <MapPin className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            <button
              className="p-0.5 hover:bg-muted rounded"
              onClick={(e) => {
                e.stopPropagation()
                onShowFactSheet(node, currentPath)
              }}
              title="Show element details"
            >
              <Info className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child, idx) => (
            <TreeNode
              key={`${currentPath}-${child.key}-${idx}`}
              node={child}
              depth={depth + 1}
              path={currentPath}
              expandedKeys={expandedKeys}
              toggleExpand={toggleExpand}
              highlightedPath={highlightedPath}
              visitedMatches={visitedMatches}
              selectedNode={selectedNode}
              factSheetElementName={factSheetElementName}
              onAddElements={onAddElements}
              isElementIncluded={isElementIncluded}
              isXmlPanelOpen={isXmlPanelOpen}
              scrollToNodeInXml={scrollToNodeInXml}
              handleNodeClick={handleNodeClick}
              onShowFactSheet={onShowFactSheet}
              highlightedNodeRef={highlightedNodeRef}
            />
          ))}
        </div>
      )}
    </div>
  )
}
