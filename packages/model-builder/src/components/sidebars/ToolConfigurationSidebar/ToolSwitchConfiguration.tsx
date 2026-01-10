'use client'

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
import { Plus, X } from 'lucide-react'
import type { SwitchCase, SwitchSource } from '../ToolConfigurationSidebar'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { Node } from '../../../types'
import { useToolConfigurationStore } from '../../../stores/toolConfigurationStore'

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
    const updated = [...switchCases, newCase]

    // Sync to node outputs
    const outputs = updated.map(c => ({ id: c.id, label: c.label }))

    onSwitchCasesChange(updated)
    onUpdateToolNode(toolNodeId, {
      config: { ...toolNode?.config, switchCases: updated },
      outputs
    })
  }

  const handleRemoveCase = (caseId: string) => {
    const updated = switchCases.filter(c => c.id !== caseId)

    // Sync to node outputs
    const outputs = updated.map(c => ({ id: c.id, label: c.label }))

    onSwitchCasesChange(updated)
    onUpdateToolNode(toolNodeId, {
      config: { ...toolNode?.config, switchCases: updated },
      outputs
    })
    const newState = { ...getState().switchCaseInputs }
    delete newState[caseId]
    onSwitchCaseInputsChange(newState)
  }

  const handleCaseValueChange = (caseId: string, value: string) => {
    const updated = switchCases.map(c =>
      c.id === caseId ? { ...c, value } : c
    )
    onSwitchCasesChange(updated)
    onUpdateToolNode(toolNodeId, {
      config: { ...toolNode?.config, switchCases: updated }
    })
    const newSwitchState = { ...getState().switchCaseInputs }
    delete newSwitchState[caseId]
    onSwitchCaseInputsChange(newSwitchState)
  }

  const handleCaseLabelChange = (caseId: string, label: string) => {
    const updated = switchCases.map(c =>
      c.id === caseId ? { ...c, label } : c
    )

    // Sync to node outputs
    const outputs = updated.map(c => ({ id: c.id, label: c.label }))

    onSwitchCasesChange(updated)
    onUpdateToolNode(toolNodeId, {
      config: { ...toolNode?.config, switchCases: updated },
      outputs
    })
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
              {switchCases.map((switchCase) => (
                <div
                  key={switchCase.id}
                  className="border rounded p-2 space-y-2 bg-background"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold bg-muted px-2 py-0.5 rounded">
                      {switchCase.label}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCase(switchCase.id)}
                      className="h-5 w-5 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Match Value</Label>
                      <Input
                        value={switchCaseInputs[switchCase.id] ?? switchCase.value ?? ''}
                        onChange={(e) => {
                          onSwitchCaseInputsChange({
                            ...getState().switchCaseInputs,
                            [switchCase.id]: e.target.value
                          })
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            handleCaseValueChange(switchCase.id, e.currentTarget.value.trim())
                          }
                        }}
                        onBlur={() => {
                          const inputValue = switchCaseInputs[switchCase.id]
                          if (inputValue !== undefined) {
                            handleCaseValueChange(switchCase.id, inputValue.trim())
                          }
                        }}
                        placeholder={`Enter ${switchSource === 'attribute' ? 'attribute' : switchSource === 'elementName' ? 'element' : 'text'} value to match`}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Case Label</Label>
                      <Input
                        value={switchCase.label}
                        onChange={(e) => handleCaseLabelChange(switchCase.id, e.target.value)}
                        placeholder="Case label (e.g., 'default', 'error')"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

