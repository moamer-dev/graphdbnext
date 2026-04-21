'use client'

import { useState } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Play, CheckCircle2, XCircle, Eye, Loader2, Database, Info, Check, ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../ui/command'
import { ResponseHistory } from '../../shared/ResponseHistory'
import { ApiResponseModal } from '../../dialogs/ApiResponseModal'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import { toast } from '../../../utils/toast'
import { useDataSourcesStore } from '../../../stores/dataSourcesStore'
import { cn } from '../../../utils/cn'
import { ConfirmDialog } from '../../shared/ConfirmDialog'

interface TestResult {
  success: boolean
  output: string
  details?: string
}

interface ResponseHistoryEntry {
  id: string
  timestamp: number
  toolId: string
  toolLabel: string
  response: unknown
  params?: Record<string, unknown>
}

interface ToolTestExecutionProps {
  toolNode: ToolCanvasNode | null
  toolNodeType: string
  testResult: TestResult | null
  isExecuting: boolean
  testIdInput?: string
  onTestIdInputChange?: (value: string) => void
  executedApiResponse?: unknown
  responseHistory?: ResponseHistoryEntry[]
  apiResponseModalOpen?: boolean
  onApiResponseModalOpenChange?: (open: boolean) => void
  onResponseHistoryChange?: (history: ResponseHistoryEntry[]) => void
  onExecuteTest: () => void
  onUpdateToolNode?: (id: string, updates: Partial<ToolCanvasNode>) => void
  disabled?: boolean
  showTestIdInput?: boolean
  testIdPlaceholder?: string
  testIdHelpText?: string
  showApiResponse?: boolean
  conditionGroupsLength?: number
  switchCasesLength?: number
  // Real data sampling props
  attachedNode?: any
  realInstances?: any[]
  selectedInstanceIndex?: number
  onInstanceSelect?: (index: number) => void
  loadingRealData?: boolean
}

export function ToolTestExecution({
  toolNode,
  toolNodeType,
  testResult,
  isExecuting,
  testIdInput,
  onTestIdInputChange,
  executedApiResponse,
  responseHistory = [],
  apiResponseModalOpen,
  onApiResponseModalOpenChange,
  onResponseHistoryChange,
  onExecuteTest,
  onUpdateToolNode,
  disabled = false,
  showTestIdInput = false,
  testIdPlaceholder,
  testIdHelpText,
  showApiResponse = false,
  conditionGroupsLength,
  switchCasesLength,
  attachedNode,
  realInstances = [],
  selectedInstanceIndex = 0,
  onInstanceSelect,
  loadingRealData = false
}: ToolTestExecutionProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const isConditionTest = toolNodeType === 'tool:if' || toolNodeType === 'tool:switch'
  const isApiTest = showApiResponse
  
  const isDisabled = disabled || isExecuting || 
    (toolNodeType === 'tool:if' && (conditionGroupsLength === undefined || conditionGroupsLength === 0)) ||
    (toolNodeType === 'tool:switch' && (switchCasesLength === undefined || switchCasesLength === 0))

  return (
    <div className="mt-6 pt-4 border-t">
      <div className={`space-y-${isApiTest ? '4' : '3'}`}>
        <div className="flex items-center justify-between">
          <Label className={isApiTest ? 'text-sm font-semibold' : 'text-xs font-medium'}>
            {isApiTest ? 'Execute Step' : 'Test Execution'}
          </Label>
          <Button
            size="sm"
            onClick={onExecuteTest}
            disabled={isDisabled}
            className={`${isApiTest ? 'h-8 px-4 bg-primary hover:bg-primary/90' : 'h-7 px-3'} text-xs`}
          >
            {isExecuting ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            {isExecuting ? 'Executing...' : isApiTest ? 'Execute step' : 'Execute Test'}
          </Button>
        </div>

        {/* Instance Selection for Testing Context */}
        {attachedNode && (
          <div className="space-y-2 py-3 border-y border-dashed border-muted-foreground/20 bg-muted/5 -mx-4 px-4 my-2">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Instance Selection for Testing Context
              </Label>
              {loadingRealData && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Context: {attachedNode.label}</span>
              </div>

              {realInstances.length > 0 ? (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="h-9 w-full justify-between bg-background border-primary/20 text-xs font-normal"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Database className="h-3 w-3 text-muted-foreground/50" />
                        {selectedInstanceIndex !== undefined && realInstances[selectedInstanceIndex] 
                          ? `Instance ${selectedInstanceIndex + 1}: ${realInstances[selectedInstanceIndex].preview}`
                          : "Select instance to test..."}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Search instances..." 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        className="h-8 text-xs"
                      />
                      <CommandList>
                        <CommandEmpty className="py-2 text-[10px] text-center text-muted-foreground">
                          No instances found.
                        </CommandEmpty>
                        <CommandGroup heading="Available Instances">
                          {realInstances
                            .filter(instance => 
                              !searchQuery || 
                              instance.preview?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (instance.id && instance.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              (idx => (idx + 1).toString().includes(searchQuery))(realInstances.indexOf(instance))
                            )
                            .slice(0, 10)
                            .map((instance) => {
                              const idx = realInstances.indexOf(instance)
                              return (
                                <CommandItem
                                  key={idx}
                                  value={idx.toString()}
                                  onSelect={(val) => {
                                    onInstanceSelect?.(parseInt(val))
                                    setOpen(false)
                                    setSearchQuery('')
                                  }}
                                  className="text-xs cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-3 w-3",
                                      selectedInstanceIndex === idx ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col truncate">
                                    <span className="font-semibold text-[10px]">Instance {idx + 1}</span>
                                    <span className="truncate opacity-70">{instance.preview}</span>
                                  </div>
                                </CommandItem>
                              )
                            })}
                        </CommandGroup>
                        {realInstances.length > 10 && !searchQuery && (
                          <div className="px-2 py-1.5 text-[9px] text-muted-foreground text-center border-t bg-muted/20 italic">
                            Showing first 10 of {realInstances.length} instances. Use search to find more.
                          </div>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="text-[10px] text-muted-foreground italic bg-muted/30 p-2 rounded border border-dashed">
                  No real instances found for &quot;{attachedNode.label}&quot; in the uploaded file. Synthetic data will be used.
                </div>
              )}
            </div>
          </div>
        )}

        {showTestIdInput && onTestIdInputChange && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Test ID (Optional)</Label>
            <Input
              placeholder={testIdPlaceholder}
              className="h-8 text-xs"
              value={testIdInput}
              onChange={(e) => onTestIdInputChange(e.target.value)}
            />
            {testIdHelpText && (
              <div className="text-[10px] text-muted-foreground">
                {testIdHelpText}
              </div>
            )}
          </div>
        )}

        {testResult && (
          <div className={`p-3 rounded border-2 ${
            testResult.success 
              ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span className={`text-xs font-semibold ${
                testResult.success 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {isConditionTest ? `Result: ${testResult.output.toUpperCase()}` : testResult.output}
              </span>
            </div>
            {isConditionTest && toolNodeType === 'tool:if' && (
              <div className="text-xs text-muted-foreground mb-2">
                Output Path: <span className="font-medium">{testResult.success ? 'True' : 'False'}</span>
              </div>
            )}
            {isConditionTest && toolNodeType === 'tool:switch' && (
              <div className="text-xs text-muted-foreground mb-2">
                Output Path: <span className="font-medium">{testResult.output}</span>
              </div>
            )}
            {testResult.details && (
              <div className="text-[10px] text-muted-foreground font-mono bg-background/50 p-2 rounded mt-2 whitespace-pre-wrap">
                {testResult.details}
              </div>
            )}

            {/* Response Data section for API tests */}
            {showApiResponse && (
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <div className="space-y-3 mb-3 bg-white/50 dark:bg-black/20 p-2 rounded-md border border-green-200/50 dark:border-green-800/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Store Output As</Label>
                    <span className="text-[9px] text-green-600 dark:text-green-400 font-medium italic">Name your data source below</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Alias (e.g. wikiData)"
                        className={cn(
                          "h-8 text-xs bg-white dark:bg-muted/30 focus:ring-1 focus:ring-primary/20",
                          (() => {
                            const alias = (toolNode?.config.outputAlias as string) || ''
                            if (!alias) return ""
                            const id = alias.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                            const existing = useDataSourcesStore.getState().getSource(id)
                            return existing && existing.toolId !== toolNode?.id ? "border-amber-500 pr-8" : ""
                          })()
                        )}
                        value={(toolNode?.config.outputAlias as string) || ''}
                        onChange={(e) => {
                          if (toolNode && onUpdateToolNode) {
                            onUpdateToolNode(toolNode.id, {
                              config: {
                                ...toolNode.config,
                                outputAlias: e.target.value
                              }
                            })
                          }
                        }}
                      />
                      <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                        {(() => {
                          const alias = (toolNode?.config.outputAlias as string) || ''
                          if (!alias) return <Database className="h-3 w-3 text-muted-foreground/40" />
                          const id = alias.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                          const existing = useDataSourcesStore.getState().getSource(id)
                          if (existing && existing.toolId !== toolNode?.id) {
                            return <XCircle className="h-3 w-3 text-amber-500" />
                          }
                          return <Database className="h-3 w-3 text-muted-foreground/40" />
                        })()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 text-xs px-3 bg-primary hover:bg-primary/90 text-white font-medium"
                      onClick={() => {
                        const alias = toolNode?.config.outputAlias as string
                        if (toolNode && alias && alias.trim() && executedApiResponse) {
                          const id = alias.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                          const existing = useDataSourcesStore.getState().getSource(id)
                          
                          if (existing && existing.toolId !== toolNode.id) {
                            setConfirmDialogOpen(true)
                            return
                          }
                          
                          useDataSourcesStore.getState().setSource({
                            name: alias,
                            type: 'API_RESPONSE',
                            data: executedApiResponse,
                            toolId: toolNode.id
                          })
                          toast.success(`Saved to data sources as "${alias}"`)
                        } else {
                          toast.error('Enter a unique Output Alias first')
                        }
                      }}
                    >
                      Save
                    </Button>
                  </div>
                  <ConfirmDialog
                    open={confirmDialogOpen}
                    onOpenChange={setConfirmDialogOpen}
                    title="Overwrite Data Source?"
                    description={`A data source named "${(toolNode?.config.outputAlias as string) || ''}" already exists. Are you sure you want to replace it?`}
                    confirmText="Replace"
                    variant="destructive"
                    onConfirm={() => {
                      const alias = toolNode?.config.outputAlias as string
                      if (toolNode && alias && executedApiResponse) {
                        useDataSourcesStore.getState().setSource({
                          name: alias,
                          type: 'API_RESPONSE',
                          data: executedApiResponse,
                          toolId: toolNode.id
                        })
                        toast.success(`Saved to data sources as "${alias}"`)
                      }
                      setConfirmDialogOpen(false)
                    }}
                  />
                  {(() => {
                    const alias = (toolNode?.config.outputAlias as string) || ''
                    if (!alias) return null
                    const id = alias.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                    const existing = useDataSourcesStore.getState().getSource(id)
                    if (existing && existing.toolId !== toolNode?.id) {
                      return <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium px-1 flex items-center gap-1">
                        <Info className="h-2.5 w-2.5" /> This name is already used by another tool. Saving will overwrite it.
                      </p>
                    }
                    return null
                  })()}
                  <p className="text-[9px] text-muted-foreground leading-tight px-1">
                    This alias will be used in expressions like <code className="text-primary bg-primary/5 px-1 rounded">{'{{ $alias.field }}'}</code>
                  </p>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium">Response Viewer</Label>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {responseHistory.length > 0 && onResponseHistoryChange && (
                    <ResponseHistory
                      entries={responseHistory}
                      onSelect={(entry) => {
                        if (toolNode && onUpdateToolNode) {
                          onUpdateToolNode(toolNode.id, {
                            config: {
                              ...toolNode.config,
                              executedResponse: entry.response
                            }
                          })
                        }
                      }}
                      onClear={() => onResponseHistoryChange([])}
                    />
                  )}
                  {onApiResponseModalOpenChange && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApiResponseModalOpenChange(true)}
                      className="h-7 px-3 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Response
                    </Button>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground p-2 bg-muted rounded">
                  API response executed successfully. Click &quot;View Response&quot; to see the full data and select fields for use in actions.
                </div>
              </div>
            )}
          </div>
        )}

        {onApiResponseModalOpenChange && (
          <ApiResponseModal
            open={apiResponseModalOpen || false}
            onOpenChange={onApiResponseModalOpenChange}
            data={executedApiResponse}
            title="API Response"
            onFieldSelect={(path) => {
              const expression = `{{ $json.${path} }}`
              navigator.clipboard.writeText(expression)
              toast.success('Expression copied to clipboard')
            }}
          />
        )}

        {!testResult && !isExecuting && (
          <div className="text-[10px] text-muted-foreground p-2 bg-muted rounded">
            {isApiTest 
              ? 'Click "Execute step" to fetch data from the configured API. The response will be displayed below and can be used in connected actions.'
              : 'Click "Execute Test" to evaluate conditions against sample element data based on the attached node\'s metadata.'}
          </div>
        )}
      </div>
    </div>
  )
}
