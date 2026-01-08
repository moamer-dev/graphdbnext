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
import { X } from 'lucide-react'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface ValidateRule {
  type: 'requiredAttribute' | 'requiredText' | 'attributeFormat' | 'textLength'
  attributeName?: string
  format?: string
  minLength?: number
  maxLength?: number
}

interface ValidateConfig {
  rules: ValidateRule[]
  onFailure?: 'skip' | 'error' | 'default'
}

interface ToolValidateConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  validateConfig: ValidateConfig
  onValidateConfigChange: (config: ValidateConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolValidateConfiguration({
  toolNodeId,
  toolNode,
  validateConfig,
  onValidateConfigChange,
  onUpdateToolNode
}: ToolValidateConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Validate Configuration</Label>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Validation Rules</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newRule: ValidateRule = { type: 'requiredAttribute' }
              const updated = { ...validateConfig, rules: [...validateConfig.rules, newRule] }
              onValidateConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, rules: [...validateConfig.rules, newRule] }
              })
            }}
            className="h-6 px-2 text-[10px]"
          >
            + Add Rule
          </Button>
        </div>
        <div className="space-y-2">
          {validateConfig.rules.map((rule, index) => (
            <div key={index} className="p-2 border rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Rule {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = { ...validateConfig, rules: validateConfig.rules.filter((_, i) => i !== index) }
                    onValidateConfigChange(updated)
                    onUpdateToolNode(toolNodeId, {
                      config: { ...toolNode?.config, rules: validateConfig.rules.filter((_, i) => i !== index) }
                    })
                  }}
                  className="h-6 w-6 p-0 text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Select
                value={rule.type}
                onValueChange={(value) => {
                  const updated = [...validateConfig.rules]
                  updated[index] = { ...updated[index], type: value as ValidateRule['type'] }
                  const updatedConfig = { ...validateConfig, rules: updated }
                  onValidateConfigChange(updatedConfig)
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, rules: updated }
                  })
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requiredAttribute">Required Attribute</SelectItem>
                  <SelectItem value="requiredText">Required Text</SelectItem>
                  <SelectItem value="attributeFormat">Attribute Format</SelectItem>
                  <SelectItem value="textLength">Text Length</SelectItem>
                </SelectContent>
              </Select>
              {rule.type === 'requiredAttribute' && (
                <Input
                  placeholder="Attribute name"
                  className="h-7 text-xs"
                  value={rule.attributeName || ''}
                  onChange={(e) => {
                    const updated = [...validateConfig.rules]
                    updated[index] = { ...updated[index], attributeName: e.target.value }
                    const updatedConfig = { ...validateConfig, rules: updated }
                    onValidateConfigChange(updatedConfig)
                    onUpdateToolNode(toolNodeId, {
                      config: { ...toolNode?.config, rules: updated }
                    })
                  }}
                />
              )}
              {(rule.type === 'attributeFormat' || rule.type === 'textLength') && (
                <>
                  {rule.type === 'attributeFormat' && (
                    <>
                      <Input
                        placeholder="Attribute name"
                        className="h-7 text-xs"
                        value={rule.attributeName || ''}
                        onChange={(e) => {
                          const updated = [...validateConfig.rules]
                          updated[index] = { ...updated[index], attributeName: e.target.value }
                          const updatedConfig = { ...validateConfig, rules: updated }
                          onValidateConfigChange(updatedConfig)
                          onUpdateToolNode(toolNodeId, {
                            config: { ...toolNode?.config, rules: updated }
                          })
                        }}
                      />
                      <Input
                        placeholder="Format (regex)"
                        className="h-7 text-xs"
                        value={rule.format || ''}
                        onChange={(e) => {
                          const updated = [...validateConfig.rules]
                          updated[index] = { ...updated[index], format: e.target.value }
                          const updatedConfig = { ...validateConfig, rules: updated }
                          onValidateConfigChange(updatedConfig)
                          onUpdateToolNode(toolNodeId, {
                            config: { ...toolNode?.config, rules: updated }
                          })
                        }}
                      />
                    </>
                  )}
                  {rule.type === 'textLength' && (
                    <>
                      <Input
                        type="number"
                        placeholder="Min length"
                        className="h-7 text-xs"
                        value={rule.minLength || ''}
                        onChange={(e) => {
                          const updated = [...validateConfig.rules]
                          updated[index] = { ...updated[index], minLength: parseInt(e.target.value) || undefined }
                          const updatedConfig = { ...validateConfig, rules: updated }
                          onValidateConfigChange(updatedConfig)
                          onUpdateToolNode(toolNodeId, {
                            config: { ...toolNode?.config, rules: updated }
                          })
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Max length"
                        className="h-7 text-xs"
                        value={rule.maxLength || ''}
                        onChange={(e) => {
                          const updated = [...validateConfig.rules]
                          updated[index] = { ...updated[index], maxLength: parseInt(e.target.value) || undefined }
                          const updatedConfig = { ...validateConfig, rules: updated }
                          onValidateConfigChange(updatedConfig)
                          onUpdateToolNode(toolNodeId, {
                            config: { ...toolNode?.config, rules: updated }
                          })
                        }}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">On Failure</Label>
        <Select
          value={validateConfig.onFailure}
          onValueChange={(value) => {
            const updated = { ...validateConfig, onFailure: value as ValidateConfig['onFailure'] }
            onValidateConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, onFailure: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="skip">Skip Element</SelectItem>
            <SelectItem value="error">Throw Error</SelectItem>
            <SelectItem value="default">Use Default</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

