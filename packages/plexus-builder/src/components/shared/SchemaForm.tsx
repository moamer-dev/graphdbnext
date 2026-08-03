'use client'

import React, { useState } from 'react'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
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
import { Plus, Trash2, X, Settings2, ChevronDown, ChevronRight, Info, Lightbulb } from 'lucide-react'
import { ConfigField } from '../../registry/types'
import { JsonFieldSelector } from '../viewer/JsonFieldSelector'
import { TransformEditor } from '../sidebars/ActionConfigurationSidebar/TransformEditor'
import { useCredentialsStore } from '../../stores/credentialsStore'
import { HelpTooltip } from './HelpTooltip'
import { cn } from '../../utils/cn'

import { CollapsibleSection } from './CollapsibleSection'

interface SchemaFormProps {
  schema: ConfigField[]
  config: Record<string, any>
  onChange: (name: string, value: any) => void
  apiResponse?: unknown
  getCredentialsByType?: (type: string) => Array<{ id: string; name: string; type: string }>
  getCredential?: (id: string) => { id: string; name: string } | undefined
}

export function SchemaForm({ 
  schema, 
  config, 
  onChange, 
  apiResponse,
  getCredentialsByType,
  getCredential
}: SchemaFormProps) {
  const [collapsedMappings, setCollapsedMappings] = useState<Record<string, Record<number, boolean>>>({})
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const credentialsInStore = useCredentialsStore((state) => state.credentials)

  const toggleMapping = (fieldName: string, idx: number) => {
    setCollapsedMappings(prev => ({
      ...prev,
      [fieldName]: {
        ...(prev[fieldName] || {}),
        [idx]: !(prev[fieldName]?.[idx] ?? false)
      }
    }))
  }

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
        const matches = Array.isArray(field.dependsOnValue)
          ? field.dependsOnValue.includes(depValue)
          : depValue === field.dependsOnValue
        if (!matches) return null
      } else if (!depValue) {
        return null
      }
    }

    const value = config[field.name]

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-1.5">
            {renderLabel(field)}
            <Input
              type="text"
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="h-8 text-xs bg-primary/5 border-primary/20 focus:bg-background transition-all"
            />
          </div>
        )

      case 'template':
        return (
          <div key={field.name} className="space-y-1.5">
            {renderLabel(field)}
            <JsonFieldSelector
              data={apiResponse}
              value={value || ''}
              onChange={(val) => onChange(field.name, val)}
              placeholder={field.placeholder || "e.g. {{ $json.name }} or @id"}
            />
          </div>
        )

      case 'textarea':
        return (
          <div key={field.name} className="space-y-1.5">
            {renderLabel(field)}
            <Textarea
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="min-h-[80px] text-xs resize-none bg-primary/5 border-primary/20 focus:bg-background transition-all"
            />
          </div>
        )

      case 'number':
        return (
          <div key={field.name} className="space-y-1.5">
            {renderLabel(field)}
            <Input
              type="number"
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => onChange(field.name, parseFloat(e.target.value))}
              className="h-8 text-xs bg-primary/5 border-primary/20 focus:bg-background transition-all"
            />
          </div>
        )

      case 'boolean':
        return (
          <div key={field.name} className="flex items-center space-x-2 py-1">
            <Checkbox
              id={field.name}
              checked={value || false}
              onCheckedChange={(checked) => onChange(field.name, checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={field.name}
                className="text-xs font-semibold text-foreground/80 cursor-pointer"
              >
                {field.label}
              </Label>
              {field.description && (
                <p className="text-[10px] text-muted-foreground">{field.description}</p>
              )}
            </div>
            {field.details && <HelpTooltip content={field.details} />}
          </div>
        )

      case 'select':
        return (
          <div key={field.name} className="space-y-1.5">
            {renderLabel(field)}
            <Select
              value={value || ''}
              onValueChange={(val) => onChange(field.name, val)}
            >
              <SelectTrigger className="h-8 text-xs bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                <SelectValue placeholder={field.placeholder || "Select option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'properties':
        const properties = (value || []) as Array<{ key: string; value: string }>
        return (
          <div key={field.name} className="space-y-2 pt-2 border-t mt-2">
            <div className="flex items-center justify-between">
              {renderLabel(field)}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange(field.name, [...properties, { key: '', value: '' }])}
                className="h-5 px-1.5 text-[9px] bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
              >
                <Plus className="h-2 w-2 mr-1" /> Add
              </Button>
            </div>
            {properties.map((prop, idx) => (
              <div key={idx} className="flex gap-2 items-start group">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <JsonFieldSelector
                    data={apiResponse}
                    value={prop.key}
                    placeholder="Key (or {{ exp }})"
                    onChange={(val) => {
                      const next = [...properties]
                      next[idx] = { ...next[idx], key: val }
                      onChange(field.name, next)
                    }}
                  />
                  <JsonFieldSelector
                    data={apiResponse}
                    value={prop.value}
                    onChange={(val) => {
                      const next = [...properties]
                      next[idx] = { ...next[idx], value: val }
                      onChange(field.name, next)
                    }}
                    placeholder="Value (or {{ exp }})"
                  />
                </div>
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

      case 'mappings': {
        const mappings = (value || []) as Array<{ attributeName: string; propertyKey: string; defaultValue?: string; transforms: any[] }>
        return (
          <div key={field.name} className="space-y-4 pt-2 border-t mt-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                {renderLabel(field)}
                <span className="text-[10px] text-muted-foreground -mt-1 tracking-tight">Map external data to graph properties</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange(field.name, [{ attributeName: '', propertyKey: '', transforms: [] }, ...mappings])
                }}
                className="h-6 px-2 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Property
              </Button>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-md p-2 flex items-start gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div className="text-[10px] leading-tight text-foreground/70">
                <p><strong className="text-primary">Tip:</strong> Use <code className="bg-primary/10 px-1 rounded text-primary">@attr</code> for XML attributes, <code className="bg-primary/10 px-1 rounded text-primary">static value</code> for text, or <code className="bg-primary/10 px-1 rounded text-primary">{"{{ $json.path }}"}</code> for JSON extraction.</p>
              </div>
            </div>

            <div className="space-y-3">
              {mappings.map((mapping, idx) => {
                const isCollapsed = collapsedMappings[field.name]?.[idx] ?? false
                return (
                  <div key={idx} className={cn(
                    "border rounded-lg bg-muted/10 transition-all duration-200 overflow-hidden",
                    !isCollapsed ? "p-3 space-y-3" : "p-2"
                  )}>
                    <div 
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => toggleMapping(field.name, idx)}
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Entry {idx + 1}</span>
                          {isCollapsed && mapping.propertyKey && (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/10">
                              {mapping.propertyKey}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onChange(field.name, mappings.filter((_, i) => i !== idx))
                        }}
                        className="h-5 w-5 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {!isCollapsed && (
                      <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-1 duration-200 bg-muted/5 p-3 rounded-md border border-muted/20">
                        {/* THE KEY: What it's called in the graph */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-primary uppercase tracking-tight">Property Name (Key)</Label>
                          <JsonFieldSelector
                            data={apiResponse}
                            value={mapping.propertyKey}
                            onChange={(val) => {
                              const next = [...mappings]
                              next[idx] = { ...next[idx], propertyKey: val }
                              onChange(field.name, next)
                            }}
                            placeholder="e.g., name, age, or {{ $json.key }}"
                          />
                          <p className="text-[9px] text-muted-foreground italic">The name of the property as it will appear in your graph database.</p>
                        </div>

                        {/* THE VALUE: Where it comes from */}
                        <div className="space-y-1.5 border-t border-muted pt-3">
                          <Label className="text-[10px] font-bold text-primary uppercase tracking-tight">Source Data (Value)</Label>
                          <JsonFieldSelector
                            data={apiResponse}
                            value={mapping.attributeName}
                            onChange={(val) => {
                              const next = [...mappings]
                              next[idx] = { ...next[idx], attributeName: val }
                              onChange(field.name, next)
                            }}
                            placeholder="@id, static, or [] JSON]"
                          />
                          <p className="text-[9px] text-muted-foreground italic">The source value extracted from your XML attributes, JSON, or a static literal.</p>
                        </div>
                      </div>
                    )}

                    {!isCollapsed && (
                      <div className="space-y-1.5 border-t pt-3 mt-1 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Settings2 className="h-3.5 w-3.5 text-primary/70" />
                            <Label className="text-[10px] font-bold">Property Transformations</Label>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const next = [...mappings]
                              next[idx] = { ...next[idx], transforms: [...(next[idx].transforms || []), { type: 'trim' }] }
                              onChange(field.name, next)
                            }}
                            className="h-5 px-1.5 text-[9px] hover:bg-primary/5 text-primary"
                          >
                            <Plus className="h-2 w-2 mr-1" /> Add Transform
                          </Button>
                        </div>
                        {mapping.transforms && mapping.transforms.length > 0 ? (
                          <TransformEditor
                            transforms={mapping.transforms}
                            onTransformsChange={(ts) => {
                              const next = [...mappings]
                              next[idx] = { ...next[idx], transforms: ts }
                              onChange(field.name, next)
                            }}
                          />
                        ) : (
                          <p className="text-[9px] text-muted-foreground italic pl-5">No transforms added</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {mappings.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic text-center py-4 border border-dashed rounded-lg">
                Click "Add Property" to start mapping XML/JSON data to nodes.
              </p>
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

      case 'credential':
      case 'credentials': {
        const validTypes = ['orcid', 'geonames', 'europeana', 'getty', 'apiKey', 'bearer', 'basic', 'custom']
        const depValue = field.dependsOn ? config[field.dependsOn] : null
        
        // Check if dependency value is a valid credential type
        const isDepValidType = typeof depValue === 'string' && validTypes.includes(depValue)
        const typeFilter = field.credentialType || (isDepValidType ? depValue : null)
        
        // Get credentials from store and apply type filter if needed
        let allCredentials = typeFilter 
          ? credentialsInStore.filter(c => c.type === typeFilter)
          : credentialsInStore

        // Special case: If we filtered down to nothing but have credentials in store, 
        // and it's NOT a strict type-only field, show all as fallback
        if (allCredentials.length === 0 && credentialsInStore.length > 0 && !field.credentialType) {
          allCredentials = credentialsInStore
        }
        
        return (
          <div key={field.name} className="space-y-1.5">
            {renderLabel(field)}
            <Select
              value={value || ''}
              onValueChange={(val) => onChange(field.name, val)}
            >
              <SelectTrigger className="h-8 text-xs bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                <SelectValue placeholder={field.placeholder || "Select credential"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {allCredentials.map((cred: any) => (
                  <SelectItem key={cred.id} value={cred.id} className="text-xs">
                    <div className="flex items-center justify-between w-full gap-4">
                      <div className="flex items-center gap-2">
                        <span className="opacity-50 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-muted border border-border/30">{cred.type}</span>
                        <span className="font-medium text-foreground">{cred.name}</span>
                      </div>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight",
                        cred.storageSource === 'db' 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "bg-muted text-muted-foreground border border-border"
                      )}>
                        {cred.workspaceId ? 'WS' : (cred.storageSource || 'local')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                {allCredentials.length === 0 && (
                  <div className="p-4 text-[10px] text-muted-foreground text-center italic">
                    No {typeFilter || ''} credentials available.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )
      }
      
      case 'separator':
        return <div key={field.name} className="hr border-t my-2 border-primary/10" />

      default:
        return <div key={field.name}>Unsupported field type: {field.type}</div>
    }
  }

  // Pre-process schema into items (single fields or groups)
  const items: Array<{ type: 'field', field: ConfigField } | { type: 'group', name: string, fields: ConfigField[] }> = []
  const groupMap = new Map<string, { type: 'group', name: string, fields: ConfigField[] }>()

  schema.forEach(field => {
    if (field.group) {
      if (groupMap.has(field.group)) {
        groupMap.get(field.group)!.fields.push(field)
      } else {
        const newGroup = { type: 'group' as const, name: field.group, fields: [field] }
        groupMap.set(field.group, newGroup)
        items.push(newGroup)
      }
    } else {
      items.push({ type: 'field' as const, field })
    }
  })

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        if (item.type === 'field') {
          return renderField(item.field)
        } else {
          // Check if any field in the group is visible (based on dependencies)
          const visibleFields = item.fields.filter(f => {
             // Basic dependency check for visibility in the group
             if (!f.dependsOn) return true
             const depValue = config[f.dependsOn]
             if (f.dependsOnValue !== undefined) {
               return Array.isArray(f.dependsOnValue)
                 ? f.dependsOnValue.includes(depValue)
                 : depValue === f.dependsOnValue
             }
             return !!depValue
          })

          if (visibleFields.length === 0) return null

          return (
            <CollapsibleSection 
              key={item.name} 
              title={item.name} 
              defaultOpen={openGroups[item.name] ?? false}
              onToggle={(open) => setOpenGroups(prev => ({ ...prev, [item.name]: open }))}
              className="py-1"
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2">
                {item.fields.map(field => {
                  const rendered = renderField(field)
                  if (!rendered) return null
                  
                  const isFullWidth = [
                    'properties', 
                    'mappings', 
                    'transforms', 
                    'textarea', 
                    'separator'
                  ].includes(field.type)

                  return (
                    <div key={field.name} className={isFullWidth ? "col-span-2" : "col-span-1"}>
                      {rendered}
                    </div>
                  )
                })}
              </div>
            </CollapsibleSection>
          )
        }
      })}
    </div>
  )
}
