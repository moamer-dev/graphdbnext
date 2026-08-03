'use client'

import React from 'react'

export interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed bg-muted/5 border-border/40">
      <p className="text-[11px] font-medium text-muted-foreground/50 italic">{message}</p>
    </div>
  )
}
