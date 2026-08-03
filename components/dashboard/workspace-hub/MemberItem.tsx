'use client'

import React from 'react'

export interface MemberItemProps {
  member: any
}

export function MemberItem({ member }: MemberItemProps) {
  return (
    <div 
      className="group flex flex-col p-2 mx-2 mb-2 rounded-md bg-background/40 hover:bg-background/80 border border-border/20 transition-all cursor-default shadow-xs hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-inner">
          <span className="text-[10px] font-bold text-primary uppercase">{(member.user?.name || member.user?.email || '?').substring(0, 2)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{member.user?.name || member.user?.email}</p>
          <p className="text-[9px] text-muted-foreground truncate opacity-70 italic">{member.role || 'Contributor'}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>
      </div>
    </div>
  )
}
