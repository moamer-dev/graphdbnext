'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

export interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  bgColor: string
}

export function StatCard({ label, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <Card className="shadow-none border-border/40 bg-card/40 hover:bg-card transition-colors overflow-hidden relative group">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-1">{label}</p>
            <h3 className="text-2xl font-bold tracking-tighter">{value}</h3>
          </div>
          <div className={`h-10 w-10 rounded-xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-500" />
      </CardContent>
    </Card>
  )
}
