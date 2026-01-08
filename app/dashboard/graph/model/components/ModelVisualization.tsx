'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Schema, SchemaNode, SchemaRelation } from '@/lib/services/SchemaLoaderService'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Database, Network, FileText, Info } from 'lucide-react'
import { useUrlSync, useSchemaItems, useSchemaValidation, type ViewType } from '../hooks'
import { NodeDetails, RelationDetails } from './'

interface ModelVisualizationProps {
  schema: Schema | null
}

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
      <div className="flex-1 flex flex-col md:flex-row gap-3 overflow-hidden min-h-0">
        {/* Left panel: List of items */}
        <Card className="w-full md:w-1/3 flex flex-col min-h-[300px] md:min-h-[400px]">
          <CardHeader className="pb-2">
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
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 pb-3">
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
                    <Button
                      key={name}
                      variant={selectedItem === name ? 'default' : 'ghost'}
                      onClick={() => setSelectedItem(name)}
                      size="sm"
                      className="w-full justify-start text-left font-normal h-auto py-2 px-3 text-sm"
                    >
                      <FileText className="h-4 w-4 mr-2 shrink-0" />
                      <span className="truncate">{name}</span>
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right panel: Details */}
        <Card className="w-full md:flex-1 flex flex-col min-h-[400px] md:min-h-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {selectedItem || 'Schema Details'}
            </CardTitle>
            {selectedItem && (
              <CardDescription className="text-xs">
                {selectedType === 'nodes' ? 'Node type definition and properties' : 'Relation type definition and properties'}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-auto min-h-0">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
