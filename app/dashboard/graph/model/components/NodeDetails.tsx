import { useState } from 'react'
import type { SchemaNode, Schema } from '@/lib/services/SchemaLoaderService'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Database, FileText, ArrowRight, ArrowLeft, ChevronRight, Network } from 'lucide-react'
import { PropertyCard } from './PropertyCard'
import { NodeTypeVisualization } from './NodeTypeVisualization'

interface NodeDetailsProps {
  node: SchemaNode
  schema: Schema | null
}

export function NodeDetails ({ node, schema }: NodeDetailsProps) {
  const [visualizationOpen, setVisualizationOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Visualize Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setVisualizationOpen(true)}
          size="sm"
          variant="outline"
          className="h-7 text-xs"
        >
          <Network className="h-3 w-3 mr-1.5" />
          Visualize
        </Button>
      </div>

      <NodeTypeVisualization
        node={node}
        schema={schema}
        open={visualizationOpen}
        onOpenChange={setVisualizationOpen}
      />
      {node.superclassNames.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
            <Database className="h-3.5 w-3.5" />
            Taxonomic Hierarchy (Superclasses)
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {node.superclassNames.map((superclass: string) => (
              <Badge key={superclass} variant="secondary" className="text-xs h-5">
                {superclass}
              </Badge>
            ))}
          </div>
          <Separator className="my-3" />
        </div>
      )}

      <Accordion type="multiple" defaultValue={['properties']} className="w-full">
        <AccordionItem value="properties">
          <AccordionTrigger className="text-xs py-2">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              <span>Properties ({Object.keys(node.properties).length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            {Object.keys(node.properties).length === 0 ? (
              <div className="text-muted-foreground text-xs py-1.5">No properties defined</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(node.properties).map(([propName, prop]) => (
                  <PropertyCard key={propName} propName={propName} prop={prop} />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {node.relationsOut && Object.keys(node.relationsOut).length > 0 && (
          <AccordionItem value="relations-out">
            <AccordionTrigger className="text-xs py-2">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-3.5 w-3.5" />
                <span>Outgoing Relations ({Object.keys(node.relationsOut).length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="space-y-2">
                {Object.entries(node.relationsOut).map(([relName, targets]) => (
                  <Collapsible key={relName} defaultOpen={false} className="group">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-2 h-auto border-l-2 border-l-border hover:bg-accent"
                      >
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono font-semibold">{relName}</code>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs h-4 px-1">
                            {targets.length}
                          </Badge>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-1 pb-2 px-2">
                      <div className="flex flex-wrap gap-0.5">
                        {(targets as string[]).map((target: string) => (
                          <Badge key={target} variant="secondary" className="text-xs h-4 px-1.5">
                            {target}
                          </Badge>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {node.relationsIn && Object.keys(node.relationsIn).length > 0 && (
          <AccordionItem value="relations-in">
            <AccordionTrigger className="text-xs py-2">
              <div className="flex items-center gap-2">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Incoming Relations ({Object.keys(node.relationsIn).length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="space-y-2">
                {Object.entries(node.relationsIn).map(([relName, sources]) => (
                  <Collapsible key={relName} defaultOpen={false} className="group">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-2 h-auto border-l-2 border-l-border hover:bg-accent"
                      >
                        <div className="flex items-center gap-1.5">
                          <ArrowLeft className="h-3 w-3 text-muted-foreground" />
                          <code className="text-xs font-mono font-semibold">{relName}</code>
                          <Badge variant="outline" className="text-xs h-4 px-1">
                            {sources.length}
                          </Badge>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-1 pb-2 px-2">
                      <div className="flex flex-wrap gap-0.5">
                        {(sources as string[]).map((source: string) => (
                          <Badge key={source} variant="secondary" className="text-xs h-4 px-1.5">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}

