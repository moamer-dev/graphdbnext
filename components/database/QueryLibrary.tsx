'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Play, ChevronDown, Check } from 'lucide-react'
import { QUERY_TEMPLATES, type QueryTemplate, replaceQueryParameters } from '@/lib/utils/queryTemplates'
import { cn } from '@/lib/utils'

interface QueryLibraryProps {
  onQuerySelect: (query: string) => void
  onExecute?: (query: string) => void
}

export function QueryLibrary ({ onQuerySelect, onExecute }: QueryLibraryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<QueryTemplate | null>(null)
  const [parameterValues, setParameterValues] = useState<Record<string, string>>({})
  const [open, setOpen] = useState(false)

  const handleTemplateSelect = (template: QueryTemplate) => {
    setSelectedTemplate(template)
    setOpen(false)
    const initialParams: Record<string, string> = {}
    template.parameters?.forEach(param => {
      if (param.options && param.options.length > 0) {
        initialParams[param.name] = param.options[0].value
      } else if (param.placeholder) {
        initialParams[param.name] = param.placeholder
      } else if (!param.required) {
        initialParams[param.name] = ''
      }
    })
    setParameterValues(initialParams)
  }

  const handleParameterChange = (name: string, value: string) => {
    setParameterValues(prev => ({ ...prev, [name]: value }))
  }

  const handleUseQuery = () => {
    if (!selectedTemplate) return
    const query = replaceQueryParameters(selectedTemplate.query, parameterValues, selectedTemplate)
    onQuerySelect(query)
  }

  const handleExecute = () => {
    if (!selectedTemplate) return
    const query = replaceQueryParameters(selectedTemplate.query, parameterValues, selectedTemplate)
    onExecute?.(query)
  }

  const getCategoryColor = (category: QueryTemplate['category']) => {
    switch (category) {
      case 'explore': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
      case 'search': return 'bg-green-500/10 text-green-700 dark:text-green-400'
      case 'analyze': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
      case 'text': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-3">
      {/* Searchable Select */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Query Library</Label>
        <p className="text-xs text-muted-foreground">Select a pre-built query and configure parameters</p>
        <div className="space-y-1.5">
          <Label className="text-xs">Select Query</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between h-9 text-xs"
              >
                <span className="truncate">
                  {selectedTemplate ? selectedTemplate.name : 'Select a query...'}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search queries..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No queries found.</CommandEmpty>
                  <CommandGroup>
                    {QUERY_TEMPLATES.map((template) => (
                      <CommandItem
                        key={template.id}
                        value={template.id}
                        onSelect={() => handleTemplateSelect(template)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTemplate?.id === template.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="truncate">{template.name}</span>
                          <Badge className={`ml-2 text-xs shrink-0 ${getCategoryColor(template.category)}`}>
                            {template.category}
                          </Badge>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Parameters */}
      {selectedTemplate && selectedTemplate.parameters && selectedTemplate.parameters.length > 0 && (
        <div className="space-y-3">
          <Label className="text-xs font-semibold">Parameters</Label>
            {selectedTemplate.parameters.map((param) => (
              <div key={param.name} className="space-y-1.5">
                <Label className="text-xs">
                  {param.label}
                  {param.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {param.options ? (
                  <Select
                    value={parameterValues[param.name] || undefined}
                    onValueChange={(value) => handleParameterChange(param.name, value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={param.placeholder || `Select ${param.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {param.options.filter(option => option.value !== '').map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={param.type === 'number' ? 'number' : 'text'}
                    value={parameterValues[param.name] || ''}
                    onChange={(e) => handleParameterChange(param.name, e.target.value)}
                    placeholder={param.placeholder}
                    className="h-8 text-xs"
                  />
                )}
              </div>
            ))}
        </div>
      )}

      {/* Generated Query Preview */}
      {selectedTemplate && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Generated Query</Label>
          <div className="p-2 bg-muted rounded-md border">
            <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {replaceQueryParameters(selectedTemplate.query, parameterValues, selectedTemplate)}
            </pre>
          </div>
        </div>
      )}

      {/* Actions */}
      {selectedTemplate && (
        <div className="flex gap-2">
          <Button
            onClick={handleUseQuery}
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
          >
            Use Query
          </Button>
          {onExecute && (
            <Button
              onClick={handleExecute}
              size="sm"
              className="flex-1 text-xs"
            >
              <Play className="h-3 w-3 mr-1.5" />
              Execute
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

