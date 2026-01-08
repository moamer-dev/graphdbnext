import type { SchemaRelation } from '@/lib/services/SchemaLoaderService'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { FileText, Network, ArrowRight, ChevronRight } from 'lucide-react'
import { PropertyCard } from './PropertyCard'

interface RelationDetailsProps {
  relation: SchemaRelation
}

export function RelationDetails ({ relation }: RelationDetailsProps) {
  const properties = relation.properties || {}
  
  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={['properties']} className="w-full">
        <AccordionItem value="properties">
          <AccordionTrigger className="text-xs py-2">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              <span>Properties ({Object.keys(properties).length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            {Object.keys(properties).length === 0 ? (
              <div className="text-muted-foreground text-xs py-1.5">No properties defined</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(properties).map(([propName, prop]) => (
                  <PropertyCard key={propName} propName={propName} prop={prop} />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="domains">
          <AccordionTrigger className="text-xs py-2">
            <div className="flex items-center gap-2">
              <Network className="h-3.5 w-3.5" />
              <span>Connection Domains ({Object.keys(relation.domains).length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            {Object.keys(relation.domains).length === 0 ? (
              <div className="text-muted-foreground text-xs py-1.5">No connection domains defined</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(relation.domains).map(([source, targets]) => (
                  <Collapsible key={source} defaultOpen={false} className="group">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-2 h-auto border-l-2 border-l-border hover:bg-accent"
                      >
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-xs h-4 px-1.5">{source}</Badge>
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
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

