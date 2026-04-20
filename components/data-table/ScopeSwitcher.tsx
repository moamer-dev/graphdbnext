'use client'

import React from 'react'
import { LayoutGrid, Globe, Users2 } from 'lucide-react'
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { useUIStore } from '@/stores/uiStore'

export function ScopeSwitcher() {
  const { resourceScope, setResourceScope } = useUIStore()

  return (
    <Tabs 
      value={resourceScope} 
      onValueChange={(val) => setResourceScope(val as 'all' | 'member')}
      className="w-auto h-8"
    >
      <TabsList className="bg-muted/50 h-9 w-fit justify-start gap-1 p-1 rounded-lg border border-border/20">
        <TabsTrigger 
          value="all" 
          className="h-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md px-4 text-[10px] font-bold uppercase tracking-wider transition-all"
        >
          <Globe className="h-3.5 w-3.5 mr-2 opacity-70" />
          Show All
        </TabsTrigger>
        <TabsTrigger 
          value="member" 
          className="h-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md px-4 text-[10px] font-bold uppercase tracking-wider transition-all"
        >
          <Users2 className="h-3.5 w-3.5 mr-2 opacity-70" />
          I am member of
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
