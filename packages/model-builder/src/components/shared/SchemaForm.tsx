'use client'

import React from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { Button } from '../ui/button'
import { Plus, Trash2, X, Settings2 } from 'lucide-react'
import { ConfigField } from '../../registry/types'
import { JsonFieldSelector } from '../viewer/JsonFieldSelector'
import { TransformEditor } from '../sidebars/ActionConfigurationSidebar/TransformEditor'
import { HelpTooltip } from './HelpTooltip'

interface SchemaFormProps {
  schema: ConfigField[]
  config: Record<string, any>
  onChange: (name: string, value: any) => void
  apiResponse?: unknown
}

export function SchemaForm({ schema, config, onChange, apiResponse }: SchemaFormProps) {
  const renderLabel = (field: ConfigField) => {
    return (
      <div className="flex items-center gap-1.5 mb-1.5">
        <Label className="text-xs font-semibold text-foreground/80">{field.label}</Label>
        {field.details && (
          <HelpTooltip content={field.details} />
        )}
      </div>
    )
  }

  const renderField = (field: ConfigField) => {
    // Check dependencies
    if (field.dependsOn) {
      const depValue = config[field.dependsOn]
      if (field.dependsOnValue !== undefined) {
        if (depValue !== field.dependsOnValue) return null
      } else if (!depValue) {
        return null
      }
    }

    const value = config[field.name] ?? field.defaultValue

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div key={field.name} className="space-y-1">
            {renderLabel(field)}
            {apiResponse && field.type === 'text' ? (
              <JsonFieldSelector
                data={apiResponse}
                value={value || ''}
                onChange={(val) => onChange(field.name, val)}
                placeholder={field.placeholder || "Enter value or select from JSON..."}
                label=""
              />
            ) : (
              <Input
                type={field.type}
                placeholder={field.placeholder}
                className="h-8 text-xs bg-muted/20 border-muted-foreground/20 focus:bg-background transition-colors"
                value={value || ''}
                onChange={(e) => onChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
              />
            )}
            {field.description && <p className="text-[10px] text-muted-foreground italic px-1">{field.description}</p>}
          </div>
        )

      case 'boolean':
        return (
          <div key={field.name} className="flex items-center space-x-2.5 py-1.5 px-1 hover:bg-muted/30 rounded-md transition-colors">
            <Checkbox
              id={field.name}
              checked={!!value}
              onCheckedChange={(checked) => onChange(field.name, checked)}
            />
            <div className="flex items-center gap-1.5">
              <Label htmlFor={field.name} className="text-xs font-medium cursor-pointer">
                {field.label}
              </Label>
              {field.details && (
                <HelpTooltip content={field.details} />
              )}
            </div>
          </div>
        )

      case 'select':
        return (
          <div key={field.name} className="space-y-1">
            {renderLabel(field)}
            <Select value={value || ''} onValueChange={(val) => onChange(field.name, val)}>
              <SelectTrigger className="h-8 text-xs bg-muted/20 border-muted-foreground/20 focus:bg-background transition-colors">
                <SelectValue placeholder={field.placeholder || "Select..."} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && <p className="text-[10px] text-muted-foreground italic px-1">{field.description}</p>}
          </div>
        )

      case 'properties': {
        const properties = (value || []) as Array<{ key: string; value: string }>
        return (
          <div key={field.name} className="space-y-2 pt-2 border-t mt-2">
            <div className="flex items-center justify-between">
              {renderLabel(field)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(field.name, [...properties, { key: '', value: '' }])}
                className="h-6 px-2 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary"
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {properties.map((prop, idx) => (
              <div key={idx} className="flex gap-2 items-start group">
                <Input
                  placeholder="Key"
                  className="h-7 text-[10px] flex-1"
                  value={prop.key}
                  onChange={(e) => {
                    const next = [...properties]
                    next[idx] = { ...next[idx], key: e.target.value }
                    onChange(field.name, next)
                  }}
                />
                <Input
                  placeholder="Value"
                  className="h-7 text-[10px] flex-1"
                  value={prop.value}
                  onChange={(e) => {
                    const next = [...properties]
                    next[idx] = { ...next[idx], value: e.target.value }
                    onChange(field.name, next)
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(field.name, properties.filter((_, i) => i !== idx))}
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            {properties.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic text-center py-2">No {field.label.toLowerCase()} defined.</p>
            )}
          </div>
        )
      }

      case 'mappings': {
        const mappings = (value || []) as Array<{ attributeName: string; propertyKey: string; defaultValue?: string; transforms: any[] }>
        return (
          <div key={field.name} className="space-y-4 pt-2 border-t mt-2">
            <div className="flex items-center justify-between">
              {renderLabel(field)}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange(field.name, [...mappings, { attributeName: '', propertyKey: '', transforms: [] }])}
                className="h-6 px-2 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Mapping
              </Button>
            </div>
            <div className="space-y-3">
              {mappings.map((mapping, idx) => (
                <div key={idx} className="p-2 border rounded space-y-2 relative group-mapping">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground">Mapping {idx + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChange(field.name, mappings.filter((_, i) => i !== idx))}
                      className="h-5 w-5 p-0 text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Source Attribute</Label>
                      <Input
                        placeholder="e.g. name"
                        className="h-7 text-xs"
                        value={mapping.attributeName}
                        onChange={(e) => {
                          const next = [...mappings]
                          next[idx] = { ...next[idx], attributeName: e.target.value }
                          onChange(field.name, next)
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Target Property</Label>
                      <Input
                        placeholder="e.g. personName"
                        className="h-7 text-xs"
                        value={mapping.propertyKey}
                        onChange={(e) => {
                          const next = [...mappings]
                          next[idx] = { ...next[idx], propertyKey: e.target.value }
                          onChange(field.name, next)
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Default Value (Optional)</Label>
                    <Input
                      placeholder="e.g. Unknown"
                      className="h-7 text-xs"
                      value={mapping.defaultValue || ''}
                      onChange={(e) => {
                        const next = [...mappings]
                        next[idx] = { ...next[idx], defaultValue: e.target.value }
                        onChange(field.name, next)
                      }}
                    />
                  </div>
                  <div className="space-y-1 border-t pt-2 mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <Settings2 className="h-3 w-3 text-muted-foreground" />
                        <Label className="text-[10px]">Transformations</Label>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const next = [...mappings]
                          next[idx] = { ...next[idx], transforms: [...(next[idx].transforms || []), { type: 'lowercase' }] }
                          onChange(field.name, next)
                        }}
                        className="h-5 px-1.5 text-[9px]"
                      >
                        <Plus className="h-2 w-2 mr-1" /> Add
                      </Button>
                    </div>
                    <TransformEditor
                      transforms={mapping.transforms || []}
                      onTransformsChange={(ts) => {
                        const next = [...mappings]
                        next[idx] = { ...next[idx], transforms: ts }
                        onChange(field.name, next)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {mappings.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic text-center py-2">No mappings defined.</p>
            )}
          </div>
        )
      }

      case 'transforms': {
        const transforms = (value || []) as any[]
        return (
          <div key={field.name} className="space-y-2 pt-2 border-t mt-2">
            <div className="flex items-center justify-between">
              {renderLabel(field)}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange(field.name, [...transforms, { type: 'lowercase' }])}
                className="h-5 px-1.5 text-[9px] bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
              >
                <Plus className="h-2 w-2 mr-1" /> Add
              </Button>
            </div>
            <TransformEditor
              transforms={transforms}
              onTransformsChange={(ts) => onChange(field.name, ts)}
            />
            {transforms.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic text-center py-2">No transformations defined.</p>
            )}
          </div>
        )
      }

      case 'separator':
        return <div key={field.name} className="hr border-t my-2" />

      default:
        return <div key={field.name}>Unsupported field type: {field.type}</div>
    }
  }

  return (
    <div className="space-y-4">
      {schema.map(renderField)}
    </div>
  )
}
