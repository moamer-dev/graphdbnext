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
import { Plus, X, ChevronDown, ChevronRight, Hash, Trash2 } from 'lucide-react'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { cn } from '../../../utils/cn'
import type { SwitchCase, SwitchSource } from '../ToolConfigurationSidebar'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { Node as PlexusNode } from '../../../types'
import { useToolConfigurationStore } from '../../../stores/toolConfigurationStore'

interface ToolSwitchConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  attachedNode: PlexusNode | null
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
    <div className="space-y-4">
      <CollapsibleSection title="Switch Logic" defaultOpen={true}>
        <div className="grid grid-cols-1 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">Switch Source</label>
            <Select
              value={switchSource}
              onValueChange={(value) => {
                onSwitchSourceChange(value as SwitchSource)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode?.config, switchSource: value }
                })
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background border border-muted-foreground/20 rounded focus:ring-1 focus:ring-primary transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attribute" className="text-xs font-medium">Attribute Value</SelectItem>
                <SelectItem value="elementName" className="text-xs font-medium">Element Name</SelectItem>
                <SelectItem value="textContent" className="text-xs font-medium">Text Content</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {switchSource === 'attribute' && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">Attribute Name</label>
              <div className="flex gap-2">
                <input
                  value={switchAttributeName}
                  onChange={(e) => {
                    onSwitchAttributeNameChange(e.target.value)
                    onUpdateToolNode(toolNodeId, {
                      config: { ...toolNode?.config, switchAttributeName: e.target.value }
                    })
                  }}
                  placeholder="Enter attribute name"
                  className="w-full h-8 px-2 text-xs bg-background border border-muted-foreground/20 rounded focus:ring-1 focus:ring-primary outline-none transition-all flex-1"
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
                    <SelectTrigger className="h-8 text-xs w-28 bg-background border-muted-foreground/20 italic">
                      <SelectValue placeholder="Quick Pick" />
                    </SelectTrigger>
                    <SelectContent>
                      {attachedNode.properties
                        .filter((prop) => prop.key !== switchAttributeName)
                        .map((prop) => (
                          <SelectItem key={prop.key} value={prop.key} className="text-xs font-medium">
                            {prop.key}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      <div className="space-y-3 pt-4 border-t border-primary/10">
        <div className="flex items-center justify-between px-1">
          <Label className="text-[11px] font-bold text-primary/70 uppercase tracking-widest">Routing Cases</Label>
          <button
            onClick={handleAddCase}
            className="text-[11px] text-primary hover:underline font-medium"
          >
            + Add Case
          </button>
        </div>

        {switchCases.length === 0 ? (
          <div className="text-[10px] text-primary/50 text-center py-8 border border-dashed border-primary/20 rounded-md bg-primary/[0.02] italic leading-relaxed">
            No routing cases defined.<br />Add a case to branch your workflow.
          </div>
        ) : (
          <div className="space-y-2.5">
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
            <div className="rounded-md border border-primary/20 border-dashed bg-primary/[0.02] overflow-hidden">
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-primary/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 text-primary/40"><Hash className="h-3 w-3" /></div>
                  <span className="text-[11px] font-bold text-primary/60 uppercase tracking-tight">Default Routing</span>
                </div>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary/50 border border-primary/20 uppercase tracking-widest">Fallback</span>
              </div>
              <div className="p-3 pt-0 border-t border-primary/10 bg-white/10 mt-2">
                <div className="space-y-2 pt-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">Static Assignment</label>
                    <div className="h-8 px-2.5 flex items-center bg-background/50 border border-primary/10 rounded-md text-xs text-primary/60 font-medium italic">
                      Fallback Output
                    </div>
                  </div>
                  <p className="text-[9px] text-primary/40 leading-relaxed italic">This branch triggers when no specific match values are satisfied by the switch source.</p>
                </div>
              </div>
            </div>
          </div>
        )}
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
    <div className={cn(
      "rounded-md border transition-all duration-200 overflow-hidden",
      isOpen 
        ? "bg-primary/[0.04] border-primary/30" 
        : "bg-primary/[0.02] border-primary/10 hover:border-primary/20 hover:bg-primary/[0.04]"
    )}>
      <div 
        className={cn(
          "flex items-center gap-2 cursor-pointer group py-1.5 px-2.5",
          isOpen ? "bg-primary/5" : "bg-transparent"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="h-3 w-3 text-primary" /> : <ChevronRight className="h-3 w-3 text-primary/50 group-hover:text-primary" />}
        <div className="flex-1 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              "text-[11px] font-bold tracking-tight truncate",
              !switchCase.label ? "text-primary/40 italic" : "text-primary/90"
            )}>
              {switchCase.label || "Unnamed Case"}
            </span>
            {switchCase.value && !isOpen && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary/60 border border-primary/20 uppercase tracking-wider">
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
            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete Case"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="p-3 space-y-3 pt-0 border-t border-primary/10">
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">Match Value</label>
              <input
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
                placeholder="e.g. true"
                className="w-full h-8 px-2 text-xs bg-background border border-muted-foreground/20 rounded focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-0.5">Branch Label</label>
              <input
                value={switchCase.label}
                onChange={(e) => onUpdateCaseLabel(switchCase.id, e.target.value)}
                placeholder="Label..."
                className="w-full h-8 px-2 text-xs bg-background border border-muted-foreground/20 rounded focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

