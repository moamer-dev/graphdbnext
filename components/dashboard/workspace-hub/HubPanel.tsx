'use client'

import React from 'react'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils'
import { Button } from '@/components/ui/button'

export interface HubPanelProps {
  title: string
  icon: React.ReactNode
  loading?: boolean
  children?: React.ReactNode
  emptyText?: string
  count?: number
  isVisible?: boolean
  searchValue?: string
  onSearchChange?: (val: string) => void
  onAddClick?: () => void
}

export function HubPanel({ 
  title, 
  icon, 
  loading, 
  children, 
  emptyText, 
  count,
  isVisible = true,
  searchValue,
  onSearchChange,
  onAddClick
}: HubPanelProps) {
  return (
    <div className={cn(
      "w-[320px] flex flex-col transition-all duration-500 relative bg-muted/10 backdrop-blur-sm rounded-xl border border-border/20 overflow-hidden shadow-sm m-3 h-[calc(100%-1.5rem)]",
      !isVisible && "opacity-30 blur-[1px] grayscale-[0.5]"
    )}>
       <div className="shrink-0 px-4 py-4 border-b border-border/20 bg-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
               <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground border border-border/40">
                {icon}
               </div>
               <h3 className="text-sm font-bold tracking-tight text-foreground/80">{title}</h3>
            </div>
            <div className="flex items-center gap-1.5">
               {onAddClick && (
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                   onClick={onAddClick}
                 >
                   <Plus className="h-3.5 w-3.5" />
                 </Button>
               )}
               {count !== undefined && (
                   <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-muted/50 border-border/20">{count}</Badge>
               )}
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
            <Input 
              placeholder={`Search ${title.toLowerCase()}...`} 
              className="h-9 pl-8 bg-background/30 border-border/30 focus-visible:ring-1 focus-visible:ring-primary/40 text-xs transition-all w-full"
              value={searchValue || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
       </div>

       <ScrollArea className="flex-1 w-full bg-transparent">
          <div className="py-3 px-1">
            {loading ? (
              <div className="space-y-4 px-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2 mt-1">
                      <Skeleton className="h-3 w-[80%]" />
                      <Skeleton className="h-2 w-[40%]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : React.Children.count(children) > 0 ? (
               <div className="flex flex-col">
                 {children}
               </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center opacity-40">
                  <div className="h-12 w-12 rounded-full border border-dashed border-border mb-3 flex items-center justify-center text-muted-foreground/60">
                    {icon}
                  </div>
                  <p className="text-[11px] font-medium italic text-muted-foreground leading-relaxed">{emptyText || "Nothing to display"}</p>
                </div>
            )}
          </div>
       </ScrollArea>
    </div>
  )
}
