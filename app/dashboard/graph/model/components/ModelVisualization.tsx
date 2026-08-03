'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Schema, SchemaNode, SchemaRelation } from '@/services/graph/SchemaLoaderService'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Database, Network, FileText, Info, GripVertical } from 'lucide-react'
import { useUrlSync, useSchemaItems, useSchemaValidation, type ViewType } from '../hooks'
import { NodeDetails, RelationDetails } from './'

interface ModelVisualizationProps {
  schema: Schema | null
}

import { cn } from '@/utils'
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from '@/components/ui/resizable'

export default function ModelVisualization ({ schema }: ModelVisualizationProps) {
  const searchParams = useSearchParams()
  const viewParam = searchParams.get('view') as ViewType | null
  const itemParam = searchParams.get('item')

  const initialView: ViewType = (viewParam === 'nodes' || viewParam === 'relations') ? viewParam : 'nodes'
  const initialItem = itemParam || null

  const { selectedType, setSelectedType, selectedItem, setSelectedItem } = useUrlSync(initialView, initialItem)
  const [searchTerm, setSearchTerm] = useState('')

  const { items, filteredItems } = useSchemaItems(schema, selectedType, searchTerm)
  useSchemaValidation(schema, selectedType, selectedItem, setSelectedItem)

  if (!schema) {
    return (
      <Card className='border-none shadow-none'>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <Database className="mx-auto h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">Schema not loaded</p>
            <p className="text-xs mt-1.5">Please validate a graph first to load the schema</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedItemData: SchemaNode | SchemaRelation | null = selectedItem
    ? items[selectedItem]
    : null

  const isNode = (item: SchemaNode | SchemaRelation): item is SchemaNode => {
    return 'superclassNames' in item
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden min-h-0">
        <ResizablePanelGroup direction="horizontal" className="gap-3">
          {/* Left panel: List of items */}
          <ResizablePanel defaultSize={22} minSize={15}>
            <div className="h-full flex flex-col bg-muted/10 backdrop-blur-sm rounded-xl border border-border/20 overflow-hidden shadow-sm">
              <div className="shrink-0 px-4 py-4 border-b border-border/20 bg-transparent">
                <Tabs
                  value={selectedType}
                  onValueChange={(value) => {
                    setSelectedType(value as ViewType)
                    setSelectedItem(null)
                  }}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="nodes" className="flex items-center gap-1.5 text-xs">
                      <Database className="h-3.5 w-3.5" />
                      Nodes ({Object.keys(schema.nodes).length})
                    </TabsTrigger>
                    <TabsTrigger value="relations" className="flex items-center gap-1.5 text-xs">
                      <Network className="h-3.5 w-3.5" />
                      Relations ({Object.keys(schema.relations).length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex-1 flex flex-col min-h-0 pb-3 p-4 bg-transparent">
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={`Search ${selectedType}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-1 pr-3">
                    {filteredItems.length === 0 ? (
                      <div className="text-center text-muted-foreground py-6 text-xs">
                        <Info className="mx-auto h-6 w-6 mb-2 opacity-50" />
                        <p>No {selectedType} found matching &quot;{searchTerm}&quot;</p>
                      </div>
                    ) : (
                      filteredItems.map(([name]) => (
                        <button
                          key={name}
                          onClick={() => setSelectedItem(name)}
                          className={cn(
                            "w-full flex items-center p-2.5 mb-1.5 text-left transition-all duration-300 relative border-l-4 text-[13px] group rounded-r-lg",
                            selectedItem === name 
                              ? "bg-primary/[0.06] border-primary shadow-[0_4px_12px_rgba(var(--primary),0.05)] ring-1 ring-primary/10 pl-4" 
                              : "border-transparent bg-background/10 hover:bg-background/30 hover:border-muted-foreground/30 hover:pl-4"
                          )}
                        >
                          <FileText className={cn(
                            "h-4 w-4 mr-2.5 shrink-0 transition-all duration-300",
                            selectedItem === name ? "text-primary scale-110" : "text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-foreground"
                          )} />
                          <span className={cn(
                            "truncate transition-colors duration-300",
                            selectedItem === name ? "text-primary font-bold" : "text-foreground/70 group-hover:text-foreground font-medium"
                          )}>{name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle 
            className="w-1.5 bg-border/20 hover:bg-primary transition-all cursor-col-resize relative flex items-center justify-center group/resize"
          >
            <div className="absolute left-1/2 -translate-x-1/2 h-10 w-5 flex items-center justify-center bg-background border border-border/40 group-hover/resize:border-primary transition-all rounded-full shadow-sm z-10">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground group-hover/resize:text-primary transition-colors" />
            </div>
          </ResizableHandle>

          {/* Right panel: Details */}
          <ResizablePanel defaultSize={65}>
            <div className="h-full flex flex-col bg-muted/10 backdrop-blur-sm rounded-xl border border-border/20 overflow-hidden shadow-sm">
              <div className="shrink-0 px-4 py-4 border-b border-border/20 bg-transparent">
                <CardTitle className="text-sm">
                  {selectedItem || 'Schema Details'}
                </CardTitle>
                {selectedItem && (
                  <CardDescription className="text-xs">
                    {selectedType === 'nodes' ? 'Node type definition and properties' : 'Relation type definition and properties'}
                  </CardDescription>
                )}
              </div>
              <div className="flex-1 overflow-auto min-h-0 p-4 bg-transparent">
                <ScrollArea className="h-full min-h-0">
                  {selectedItemData ? (
                    <div className="space-y-4 pr-3">
                      {selectedType === 'nodes' && isNode(selectedItemData) && (
                        <NodeDetails node={selectedItemData} schema={schema} />
                      )}
                      {selectedType === 'relations' && !isNode(selectedItemData) && (
                        <RelationDetails relation={selectedItemData} />
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-10">
                      <FileText className="mx-auto h-10 w-10 mb-3 opacity-50" />
                      <p className="text-sm font-medium">No item selected</p>
                      <p className="text-xs mt-1.5">Select an item from the list to view its detailed schema definition</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
