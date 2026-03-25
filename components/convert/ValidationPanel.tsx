'use client'

import { useState } from 'react'
import type { ValidationResult } from '@/lib/services/SchemaValidatorService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Database, FileCheck, AlertCircle, Info, ChevronLeft, ChevronRight } from 'lucide-react'

interface ValidationPanelProps {
  graph: Array<Record<string, unknown>>
}

const ITEMS_PER_PAGE = 50

export default function ValidationPanel ({ graph }: ValidationPanelProps) {
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [errorsPage, setErrorsPage] = useState(1)
  const [warningsPage, setWarningsPage] = useState(1)

  const handleValidate = async () => {
    if (!graph || graph.length === 0) {
      return
    }

    setValidating(true)
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph })
      })

      if (!response.ok) {
        throw new Error('Validation request failed')
      }

      const validationResult: ValidationResult = await response.json()
      setResult(validationResult)
      setErrorsPage(1)
      setWarningsPage(1)
    } catch (error: unknown) {
      console.error('Validation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setResult({
        valid: false,
        errors: [{
          elementId: 0,
          elementType: 'node',
          errorType: 'invalid_type',
          message: `Validation failed: ${errorMessage}`
        }],
        warnings: [],
        stats: {
          totalElements: 0,
          totalNodes: 0,
          totalRelations: 0,
          validatedNodes: 0,
          validatedRelations: 0
        }
      })
    } finally {
      setValidating(false)
    }
  }

  const getErrorVariant = (errorType: string): 'destructive' | 'default' => {
    switch (errorType) {
      case 'invalid_type':
      case 'invalid_label':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'invalid_type':
      case 'invalid_label':
        return <XCircle className="h-4 w-4" />
      case 'missing_superclass':
      case 'missing_property':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const hasData = graph && graph.length > 0

  // Pagination calculations
  const errorsTotalPages = result ? Math.ceil(result.errors.length / ITEMS_PER_PAGE) : 0
  const warningsTotalPages = result ? Math.ceil(result.warnings.length / ITEMS_PER_PAGE) : 0
  const paginatedErrors = result ? result.errors.slice((errorsPage - 1) * ITEMS_PER_PAGE, errorsPage * ITEMS_PER_PAGE) : []
  const paginatedWarnings = result ? result.warnings.slice((warningsPage - 1) * ITEMS_PER_PAGE, warningsPage * ITEMS_PER_PAGE) : []

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Schema Validation
          </CardTitle>
          <CardDescription>
            Validate your graph data against the EUPT-LPG schema specification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleValidate}
            disabled={validating || !hasData}
            className="w-full sm:w-auto"
          >
            {validating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Validate Graph
              </>
            )}
          </Button>
          {!hasData && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertTitle>No graph data available</AlertTitle>
              <AlertDescription>
                Load or convert XML data to validate against the schema
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.valid ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <CardTitle className="text-xl">
                    {result.valid ? 'Validation Successful' : 'Validation Failed'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}, {result.warnings.length} warning{result.warnings.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Total Elements</span>
                  </div>
                  <div className="text-2xl font-bold">{result.stats.totalElements}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Nodes</span>
                  </div>
                  <div className="text-2xl font-bold">{result.stats.totalNodes}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Relations</span>
                  </div>
                  <div className="text-2xl font-bold">{result.stats.totalRelations}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Validated</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {result.stats.validatedNodes + result.stats.validatedRelations}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Errors */}
            {result.errors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <h3 className="text-lg font-semibold">Validation Errors ({result.errors.length})</h3>
                  </div>
                  {errorsTotalPages > 1 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        Page {errorsPage} of {errorsTotalPages}
                      </span>
                      <span className="text-xs">
                        ({(errorsPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(errorsPage * ITEMS_PER_PAGE, result.errors.length)} of {result.errors.length})
                      </span>
                    </div>
                  )}
                </div>
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-3">
                    {paginatedErrors.map((error, idx) => {
                      const globalIdx = (errorsPage - 1) * ITEMS_PER_PAGE + idx
                      return (
                        <Alert
                          key={globalIdx}
                          variant={getErrorVariant(error.errorType)}
                          className="border-l-4"
                        >
                          <div className="flex items-start gap-3">
                            {getErrorIcon(error.errorType)}
                            <div className="flex-1 space-y-1">
                              <AlertTitle className="text-sm font-semibold">
                                {error.message}
                              </AlertTitle>
                              <AlertDescription className="space-y-2">
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <Badge variant="outline">
                                    ID: {error.elementId}
                                  </Badge>
                                  <Badge variant="outline">
                                    Type: {error.elementType}
                                  </Badge>
                                  <Badge variant="outline">
                                    Error: {error.errorType}
                                  </Badge>
                                </div>
                                {error.details && (
                                  <div className="mt-2">
                                    <details className="text-xs">
                                      <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                                        View details
                                      </summary>
                                      <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                                        {JSON.stringify(error.details, null, 2)}
                                      </pre>
                                    </details>
                                  </div>
                                )}
                              </AlertDescription>
                            </div>
                          </div>
                        </Alert>
                      )
                    })}
                  </div>
                </ScrollArea>
                {errorsTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setErrorsPage(prev => Math.max(1, prev - 1))}
                      disabled={errorsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Showing {(errorsPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(errorsPage * ITEMS_PER_PAGE, result.errors.length)} of {result.errors.length} errors
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setErrorsPage(prev => Math.min(errorsTotalPages, prev + 1))}
                      disabled={errorsPage === errorsTotalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold">Warnings ({result.warnings.length})</h3>
                  </div>
                  {warningsTotalPages > 1 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        Page {warningsPage} of {warningsTotalPages}
                      </span>
                      <span className="text-xs">
                        ({(warningsPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(warningsPage * ITEMS_PER_PAGE, result.warnings.length)} of {result.warnings.length})
                      </span>
                    </div>
                  )}
                </div>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-2">
                    {paginatedWarnings.map((warning, idx) => {
                      const globalIdx = (warningsPage - 1) * ITEMS_PER_PAGE + idx
                      return (
                        <Alert key={globalIdx} className="border-l-4 border-l-yellow-400 bg-yellow-50 dark:bg-yellow-950/20">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-sm">
                            {warning}
                          </AlertDescription>
                        </Alert>
                      )
                    })}
                  </div>
                </ScrollArea>
                {warningsTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWarningsPage(prev => Math.max(1, prev - 1))}
                      disabled={warningsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Showing {(warningsPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(warningsPage * ITEMS_PER_PAGE, result.warnings.length)} of {result.warnings.length} warnings
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWarningsPage(prev => Math.min(warningsTotalPages, prev + 1))}
                      disabled={warningsPage === warningsTotalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Success message when no errors */}
            {result.valid && result.errors.length === 0 && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-200">
                  All validations passed
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Your graph data conforms to the EUPT-LPG schema specification
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
