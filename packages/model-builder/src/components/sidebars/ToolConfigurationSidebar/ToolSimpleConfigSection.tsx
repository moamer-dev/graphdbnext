'use client'

import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { HelpTooltip } from '../../shared/HelpTooltip'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface ConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox'
  placeholder?: string
  helpText?: string
  selectOptions?: Array<{ value: string; label: string }>
  textareaRows?: number
  textareaFontMono?: boolean
}

interface ToolSimpleConfigSectionProps {
  title: string
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  config: Record<string, unknown>
  fields: ConfigField[]
  onConfigChange: (updates: Record<string, unknown>) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolSimpleConfigSection({
  title,
  toolNodeId,
  toolNode,
  config,
  fields,
  onConfigChange,
  onUpdateToolNode
}: ToolSimpleConfigSectionProps) {
  const handleFieldChange = (key: string, value: unknown) => {
    const updated = { ...config, [key]: value }
    onConfigChange(updated)
    onUpdateToolNode(toolNodeId, {
      config: { ...toolNode?.config, ...updated }
    })
  }

  return (
    <CollapsibleSection title={title} defaultOpen={true}>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium">{field.label}</Label>
              {field.helpText && <HelpTooltip content={field.helpText} />}
            </div>
            
            {field.type === 'text' && (
              <Input
                placeholder={field.placeholder}
                className="h-8 text-xs"
                value={(config[field.key] as string) || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
              />
            )}

            {field.type === 'number' && (
              <Input
                type="number"
                placeholder={field.placeholder}
                className="h-8 text-xs"
                value={(config[field.key] as number) || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value ? parseInt(e.target.value, 10) : undefined)}
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                className={`w-full ${field.textareaRows ? `h-${field.textareaRows * 6}` : 'h-24'} text-xs p-2 border rounded ${field.textareaFontMono ? 'font-mono' : ''}`}
                placeholder={field.placeholder}
                value={typeof config[field.key] === 'string' ? config[field.key] as string : 
                       config[field.key] ? JSON.stringify(config[field.key], null, 2) : ''}
                onChange={(e) => {
                  if (field.textareaFontMono) {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      handleFieldChange(field.key, parsed)
                    } catch {
                      // Invalid JSON, ignore
                    }
                  } else {
                    handleFieldChange(field.key, e.target.value)
                  }
                }}
              />
            )}

            {field.type === 'select' && field.selectOptions && (
              <Select
                value={(config[field.key] as string) || ''}
                onValueChange={(value) => handleFieldChange(field.key, value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.selectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === 'checkbox' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(config[field.key] as boolean) || false}
                  onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                  className="h-4 w-4"
                />
                <Label className="text-xs">{field.helpText || ''}</Label>
              </div>
            )}

            {field.helpText && field.type !== 'checkbox' && (
              <div className="text-[10px] text-muted-foreground">
                {field.helpText}
              </div>
            )}
          </div>
        ))}
      </div>
    </CollapsibleSection>
  )
}

