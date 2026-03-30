'use client'

import React, { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { CheckCircle2, AlertCircle, Info, ChevronRight, Binary, Share2, Database } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { Node, Relationship } from '../../types'
import { useSemanticValidation } from '../../hooks/semantic/useSemanticValidation'

interface SemanticValidationDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
}

interface ValidationReport {
  overallValid: boolean
  ontologyId: string | null
  nodeStatus: Array<{
    id: string
    label: string
    valid: boolean
    classMapped: boolean
    propertiesTotal: number
    propertiesMapped: number
    missingProperties: string[]
  }>
  relationshipStatus: Array<{
    id: string
    type: string
    from: string
    to: string
    valid: boolean
    mapped: boolean
  }>
}

export function SemanticValidationDialog({ open, setOpen }: SemanticValidationDialogProps) {
  const { report, nodes, relationships } = useSemanticValidation()

  const totalSteps = 1 + nodes.length + relationships.length
  const completedSteps = (report.ontologyId ? 1 : 0) + 
    report.nodeStatus.filter((n: any) => n.valid).length + 
    report.relationshipStatus.filter((r: any) => r.valid).length

  const progressPercent = Math.round((completedSteps / totalSteps) * 100)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Semantic Layer Validation
            </DialogTitle>
            <Badge variant={report.overallValid ? "default" : "secondary"} className={cn(
              "px-3 py-1 text-xs",
              report.overallValid ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
            )}>
              {report.overallValid ? "Fully Mapped" : "Incomplete"}
            </Badge>
          </div>
          <DialogDescription>
            Ensuring your graph model is correctly mapped to the selected ontology for linked-data export.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 mb-4">
          <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-4">
            {/* Global Ontology Check */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                Selected Ontology
              </h3>
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                report.ontologyId ? "bg-green-500/5 border-green-500/20" : "bg-amber-500/5 border-amber-500/20 animate-pulse"
              )}>
                <div className="flex items-center gap-3">
                  {report.ontologyId ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm">
                    {report.ontologyId ? (
                      <>Mapped to: <code className="text-primary font-mono bg-primary/5 px-1 rounded">{report.ontologyId}</code></>
                    ) : (
                      "No ontology selected in Model Builder Header"
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* Nodes and Properties Check */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Binary className="h-4 w-4 text-muted-foreground" />
                Nodes & Properties
              </h3>
              <div className="grid gap-2">
                {report.nodeStatus.map((status: any) => (
                  <div key={status.id} className={cn(
                    "p-3 rounded-lg border transition-all",
                    status.valid ? "bg-muted/30 border-transparent" : "bg-background border-dashed border-amber-200"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {status.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="text-sm font-medium">{status.label}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {status.propertiesMapped}/{status.propertiesTotal} Props
                      </Badge>
                    </div>
                    
                    <div className="pl-6 space-y-1">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className={status.classMapped ? "text-green-600" : "text-destructive underline decoration-dotted"}>
                          {status.classMapped ? "✓ Semantic Class Mapped" : "⨯ Semantic Class Missing"}
                        </span>
                      </div>
                      {status.missingProperties.length > 0 && (
                        <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-2">
                          <span className="text-amber-600">Missing mapping for:</span>
                          {status.missingProperties.map((p: string) => (
                            <code key={p} className="bg-amber-50 p-0.5 rounded text-amber-700">{p}</code>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Relationships Check */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                Relationships
              </h3>
              <div className="grid gap-2">
                {report.relationshipStatus.map((status: any) => (
                  <div key={status.id} className={cn(
                    "p-3 rounded-lg border transition-all flex items-center justify-between",
                    status.valid ? "bg-muted/30 border-transparent" : "bg-background border-dashed border-amber-200"
                  )}>
                    <div className="flex items-center gap-3">
                      {status.valid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{status.type}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          {status.from} <ChevronRight className="h-2 w-2" /> {status.to}
                        </span>
                      </div>
                    </div>
                    <Badge variant={status.mapped ? "secondary" : "outline"} className={cn(
                      "text-[10px]",
                      status.mapped ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {status.mapped ? "Mapped" : "Missing"}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t gap-2 flex-col sm:flex-row bg-muted/5">
          {!report.overallValid ? (
            <div className="flex-1 flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200 mb-2 sm:mb-0">
              <Info className="h-3.5 w-3.5" />
              Complete all mappings to enable high-quality RDF/TTL exports.
            </div>
          ) : (
             <div className="flex-1 flex items-center gap-2 text-[11px] text-green-600 bg-green-50 px-3 py-2 rounded-md border border-green-200 mb-2 sm:mb-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Perfect! Your model is fully semantically enriched and ready for Linked Data export.
            </div>
          )}
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          {!report.overallValid && (
             <Button variant="default" onClick={() => setOpen(false)}>Resume Mapping</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
