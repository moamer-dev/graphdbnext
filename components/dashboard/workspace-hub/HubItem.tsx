'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils'

export interface HubItemProps {
  title: string
  subtitle?: string | null
  isActive: boolean
  onClick: () => void
  badge?: string
  noArrow?: boolean
}

export function HubItem({ 
  title, 
  isActive, 
  onClick, 
  badge 
}: HubItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex flex-col p-4 mb-2 first:mt-1 last:mb-10 text-left transition-all duration-300 relative border-l-4",
        isActive 
          ? "bg-primary/[0.04] border-primary shadow-[2px_2px_12px_rgba(var(--primary),0.05)] ring-1 ring-primary/10" 
          : "border-transparent hover:bg-background/60 hover:border-muted-foreground/30 hover:pl-5 bg-background/20"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className={cn(
          "text-[13px] font-bold leading-tight line-clamp-1 transition-colors",
          isActive ? "text-primary" : "text-foreground/70 group-hover:text-foreground"
        )}>
          {title}
        </h4>
        {badge && (
          <Badge 
            className={cn(
              "text-[8px] h-4 px-1.5 font-black uppercase tracking-tighter border-0 shadow-sm transition-all animate-in fade-in zoom-in duration-300",
              (badge === 'Inactive' || badge === 'Locked' || badge === 'Draft') 
                ? "bg-rose-500 text-white shadow-rose-200/50" 
                : isActive 
                    ? "bg-primary text-primary-foreground scale-110" 
                    : "bg-muted text-muted-foreground group-hover:bg-muted/80"
            )}
          >
            {badge}
          </Badge>
        )}
      </div>
    </button>
  )
}
