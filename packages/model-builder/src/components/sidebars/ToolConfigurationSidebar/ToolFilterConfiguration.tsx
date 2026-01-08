'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { X } from 'lucide-react'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface FilterConfig {
  filterMode: 'ignoreElement' | 'ignoreSubtree' | 'ignoreTree'
  elementNames: string[]
}

interface ToolFilterConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  filterConfig: FilterConfig
  filterInputValues: Record<string, string>
  onFilterConfigChange: (config: FilterConfig) => void
  onFilterInputValuesChange: (values: Record<string, string>) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
  getState: () => { filterInputValues: Record<string, string> }
}

export function ToolFilterConfiguration({
  toolNodeId,
  toolNode,
  filterConfig,
  filterInputValues,
  onFilterConfigChange,
  onFilterInputValuesChange,
  onUpdateToolNode,
  getState
}: ToolFilterConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Filter Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Filter Mode</Label>
        <Select
          value={filterConfig.filterMode}
          onValueChange={(value) => {
            const updated = { ...filterConfig, filterMode: value as FilterConfig['filterMode'] }
            onFilterConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, filterMode: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ignoreElement">Ignore Element Only</SelectItem>
            <SelectItem value="ignoreSubtree">Ignore Element and Subtree</SelectItem>
            <SelectItem value="ignoreTree">Ignore Entire Tree</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Element Names to Filter</Label>
        <div className="flex gap-2">
          <Input
            value={filterInputValues['elements'] || ''}
            onChange={(e) => {
              onFilterInputValuesChange({ ...getState().filterInputValues, elements: e.target.value })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                const newValue = e.currentTarget.value.trim()
                if (!filterConfig.elementNames.includes(newValue)) {
                  const updated = [...filterConfig.elementNames, newValue]
                  onFilterConfigChange({ ...filterConfig, elementNames: updated })
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, elementNames: updated }
                  })
                  const newFilterState = { ...getState().filterInputValues }
                  delete newFilterState['elements']
                  onFilterInputValuesChange(newFilterState)
                }
              }
            }}
            placeholder="Enter element name"
            className="h-8 text-xs flex-1"
          />
        </div>
        {filterConfig.elementNames.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {filterConfig.elementNames.map((name) => (
              <span key={name} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                {name}
                <button
                  onClick={() => {
                    const updated = filterConfig.elementNames.filter((n) => n !== name)
                    onFilterConfigChange({ ...filterConfig, elementNames: updated })
                    onUpdateToolNode(toolNodeId, {
                      config: { ...toolNode?.config, elementNames: updated }
                    })
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

