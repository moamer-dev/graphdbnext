'use client'

import React from 'react'

export interface DetailItemProps {
  label: string
  value?: string | null
  subValue?: string | null
  className?: string
}

export function DetailItem({ label, value, subValue, className }: DetailItemProps) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">{label}</span>
      <div className="flex flex-col">
        <span className={`text-xs font-semibold tracking-tight ${className}`}>{value || '-'}</span>
        {subValue && <span className="text-[10px] text-muted-foreground/60">{subValue}</span>}
      </div>
    </div>
  )
}
