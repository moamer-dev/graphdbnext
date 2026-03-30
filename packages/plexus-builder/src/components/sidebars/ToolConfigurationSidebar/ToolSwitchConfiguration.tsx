'use client'

import { useState } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react'
import type { SwitchCase, SwitchSource } from '../ToolConfigurationSidebar'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { Node } from '../../../types'
import { useToolConfigurationStore } from '../../../stores/toolConfigurationStore'
import { CollapsibleSection } from '../../shared/CollapsibleSection'

interface ToolSwitchConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  attachedNode: Node | null
  switchSource: SwitchSource
  switchAttributeName: string
  switchCases: SwitchCase[]
  switchCaseInputs: Record<string, string>
  onSwitchSourceChange: (source: SwitchSource) => void
  onSwitchAttributeNameChange: (name: string) => void
  onSwitchCasesChange: (cases: SwitchCase[]) => void
  onSwitchCaseInputsChange: (inputs: Record<string, string>) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolSwitchConfiguration({
  toolNodeId,
  toolNode,
  attachedNode,
  switchSource,
  switchAttributeName,
  switchCases,
  switchCaseInputs,
  onSwitchSourceChange,
  onSwitchAttributeNameChange,
  onSwitchCasesChange,
  onSwitchCaseInputsChange,
  onUpdateToolNode
}: ToolSwitchConfigurationProps) {
  const getState = useToolConfigurationStore.getState

  const handleAddCase = () => {
    const newCase: SwitchCase = {
      id: `case_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      value: '',
      label: `Case ${switchCases.length + 1}`
    }
    const updated = [newCase, ...switchCases]

    // Sync to node outputs (always keep default)
    const outputs = [
      ...updated.map(c => ({ id: c.id, label: c.label })),
      { id: 'default', label: 'Default' }
    ]

    onSwitchCasesChange(updated)
    onUpdateToolNode(toolNodeId, { outputs })
  }

  const handleRemoveCase = (caseId: string) => {
    const updated = switchCases.filter(c => c.id !== caseId)

    // Sync to node outputs
    const outputs = [
      ...updated.map(c => ({ id: c.id, label: c.label })),
      { id: 'default', label: 'Default' }
    ]

    onSwitchCasesChange(updated)
    onUpdateToolNode(toolNodeId, { outputs })

    const newState = { ...((getState().config.switchCaseInputs as Record<string, string>) || {}) }
    delete newState[caseId]
    onSwitchCaseInputsChange(newState)
  }

  const handleCaseValueChange = (caseId: string, value: string) => {
    const updated = switchCases.map(c =>
      c.id === caseId ? { ...c, value } : c
    )
    onSwitchCasesChange(updated)
    
    const newSwitchState = { ...((getState().config.switchCaseInputs as Record<string, string>) || {}) }
    delete newSwitchState[caseId]
    onSwitchCaseInputsChange(newSwitchState)
  }

  const handleCaseLabelChange = (caseId: string, label: string) => {
    const updated = switchCases.map(c =>
      c.id === caseId ? { ...c, label } : c
    )

    // Sync to node outputs
    const outputs = [
      ...updated.map(c => ({ id: c.id, label: c.label })),
      { id: 'default', label: 'Default' }
    ]

    onSwitchCasesChange(updated)
    onUpdateToolNode(toolNodeId, { outputs })
  }

  return (
    <div>
      <div className="mb-2">
        <Label className="text-xs font-medium">Switch Configuration</Label>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Switch On</Label>
          <Select
            value={switchSource}
            onValueChange={(value) => {
              onSwitchSourceChange(value as SwitchSource)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, switchSource: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attribute">Attribute Value</SelectItem>
              <SelectItem value="elementName">Element Name</SelectItem>
              <SelectItem value="textContent">Text Content</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {switchSource === 'attribute' && (
          <div className="space-y-2">
            <Label className="text-xs">Attribute Name</Label>
            <div className="flex gap-2">
              <Input
                value={switchAttributeName}
                onChange={(e) => {
                  onSwitchAttributeNameChange(e.target.value)
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, switchAttributeName: e.target.value }
                  })
                }}
                placeholder="Enter attribute name"
                className="h-8 text-xs flex-1"
              />
              {attachedNode?.properties && attachedNode.properties.length > 0 && (
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value) {
                      onSwitchAttributeNameChange(value)
                      onUpdateToolNode(toolNodeId, {
                        config: { ...toolNode?.config, switchAttributeName: value }
                      })
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-32">
                    <SelectValue placeholder="Or select" />
                  </SelectTrigger>
                  <SelectContent>
                    {attachedNode.properties
                      .filter((prop) => prop.key !== switchAttributeName)
                      .map((prop) => (
                        <SelectItem key={prop.key} value={prop.key}>
                          {prop.key}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Cases</Label>
            <Button
              size="sm"
              onClick={handleAddCase}
              className="h-7 px-3 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Case
            </Button>
          </div>

          {switchCases.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4 border rounded">
              No cases defined. Add a case to configure the switch.
            </div>
          ) : (
            <div className="space-y-2">
              {switchCases.map((switchCase, index) => (
                <ToolSwitchCaseItem
                  key={switchCase.id}
                  switchCase={switchCase}
                  index={index}
                  switchCaseInputs={switchCaseInputs}
                  switchSource={switchSource}
                  switchAttributeName={switchAttributeName}
                  onRemoveCase={handleRemoveCase}
                  onUpdateCaseLabel={handleCaseLabelChange}
                  onUpdateCaseValue={handleCaseValueChange}
                  onSwitchCaseInputsChange={onSwitchCaseInputsChange}
                  onSwitchCasesChange={onSwitchCasesChange}
                  switchCases={switchCases}
                  getState={getState}
                />
              ))}

              {/* Static Default Case */}
              <div className="border rounded-md bg-muted/20 border-dashed transition-all">
                <div className="flex items-center justify-between px-3 py-2 opacity-80">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Default Case</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-sm">Fallback</span>
                </div>
                <div className="p-3 pt-0 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground/70 uppercase">Label</Label>
                    <Input
                      value="Default"
                      readOnly
                      disabled
                      className="h-8 text-xs bg-background/50 cursor-not-allowed border-none shadow-none"
                    />
                    <p className="text-[9px] text-muted-foreground leading-relaxed italic">Executed when no other match values are found.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ToolSwitchCaseItem({
  switchCase,
  index,
  switchCaseInputs,
  switchSource,
  switchAttributeName,
  onRemoveCase,
  onUpdateCaseLabel,
  onSwitchCaseInputsChange,
  onSwitchCasesChange,
  switchCases,
  getState
}: {
  switchCase: SwitchCase
  index: number
  switchCaseInputs: Record<string, string>
  switchSource: SwitchSource
  switchAttributeName: string
  onRemoveCase: (id: string) => void
  onUpdateCaseLabel: (id: string, label: string) => void
  onUpdateCaseValue: (id: string, value: string) => void
  onSwitchCaseInputsChange: (inputs: Record<string, string>) => void
  onSwitchCasesChange: (cases: SwitchCase[]) => void
  switchCases: SwitchCase[]
  getState: () => any
}) {
  const [isOpen, setIsOpen] = useState(index === 0)

  return (
    <div className="border rounded-md bg-card transition-all">
      {/* Simplified Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors group cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <span className="text-xs font-semibold truncate leading-none pt-0.5">
            {switchCase.label || 'Unnamed Case'}
          </span>
          {switchCase.value && (
            <span className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded-sm truncate">
              {switchCase.value}
            </span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onRemoveCase(switchCase.id)
          }}
          className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete Case"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content Section */}
      {isOpen && (
        <div className="p-3 pt-0 border-t bg-background/30 space-y-3">
          <div className="grid gap-3 pt-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground/70 uppercase">Match Value</Label>
              <Input
                value={switchCaseInputs[switchCase.id] ?? switchCase.value ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  onSwitchCaseInputsChange({
                    ...((getState().config.switchCaseInputs as Record<string, string>) || {}),
                    [switchCase.id]: val
                  })
                  // Also commit immediately to switchCases to prevent data loss on re-renders
                  const updated = switchCases.map(c =>
                    c.id === switchCase.id ? { ...c, value: val } : c
                  )
                  onSwitchCasesChange(updated)
                }}
                placeholder="Value to branch on..."
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground/70 uppercase">Label</Label>
              <Input
                value={switchCase.label}
                onChange={(e) => onUpdateCaseLabel(switchCase.id, e.target.value)}
                placeholder="Label for branch..."
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

