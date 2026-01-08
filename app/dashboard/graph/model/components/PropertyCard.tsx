import type { SchemaProperty } from '@/lib/services/SchemaLoaderService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronRight } from 'lucide-react'

interface PropertyCardProps {
  propName: string
  prop: SchemaProperty
}

export function PropertyCard ({ propName, prop }: PropertyCardProps) {
  return (
    <Collapsible defaultOpen={false} className="group">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-2 h-auto border-l-2 border-l-border hover:bg-accent"
        >
          <div className="flex items-center gap-1.5">
            <code className="text-xs font-mono font-semibold">@{propName}</code>
            <Badge variant={prop.required ? 'destructive' : 'outline'} className="text-xs h-4 px-1">
              {prop.required ? 'Required' : 'Optional'}
            </Badge>
            {prop.values.length > 0 && (
              <Badge variant="outline" className="text-xs h-4 px-1">
                {prop.values.length} values
              </Badge>
            )}
          </div>
          <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 pb-2 px-2">
        <div className="text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-1">
            <span className="font-medium">Type:</span>
            <span>{prop.datatype ?? 'any'}</span>
          </div>
          {prop.values.length > 0 && (
            <div>
              <span className="font-medium">Values:</span>
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {prop.values.map((value: string) => (
                  <Badge key={value} variant="outline" className="text-xs h-4 px-1">
                    {value}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

