'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Play, CheckCircle2, XCircle, Eye } from 'lucide-react'
import { ResponseHistory } from '../../shared/ResponseHistory'
import { ApiResponseModal } from '../../dialogs/ApiResponseModal'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import { toast } from '../../../utils/toast'

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
  switchCasesLength
}: ToolTestExecutionProps) {
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
            <Play className="h-3 w-3 mr-1" />
            {isExecuting ? 'Executing...' : isApiTest ? 'Execute step' : 'Execute Test'}
          </Button>
        </div>

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
          </div>
        )}

        {showApiResponse && executedApiResponse !== null && testResult?.success && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Response Data</Label>
              <div className="flex gap-2">
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
            </div>
            <div className="text-[10px] text-muted-foreground p-2 bg-muted rounded">
              API response executed successfully. Click &quot;View Response&quot; to see the full data and select fields for use in actions.
            </div>
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

