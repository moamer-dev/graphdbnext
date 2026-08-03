'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'

export interface ResourceItemCardProps {
  title: string
  subtitle: string
  description?: string | null
  date: string | Date
  icon: LucideIcon
  onClick?: () => void
}

export function ResourceItemCard({ 
  title, 
  subtitle, 
  description, 
  date, 
  icon: Icon, 
  onClick 
}: ResourceItemCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 p-3 rounded-xl border border-border/30 bg-card/30 hover:border-primary/20 hover:bg-primary/[0.02] transition-all cursor-pointer group`}
    >
      <div className="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{title}</h4>
          <span className="text-[10px] text-muted-foreground/40 font-medium whitespace-nowrap">
            {new Date(date).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">{subtitle}</span>
          <div className="h-1 w-1 rounded-full bg-border" />
          <p className="text-[10px] text-muted-foreground/50 truncate max-w-md italic">{description || 'No additional metadata attached.'}</p>
        </div>
      </div>
    </div>
  )
}
