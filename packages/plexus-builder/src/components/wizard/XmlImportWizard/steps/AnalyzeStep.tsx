'use client'

import { Loader2 } from 'lucide-react'

export function AnalyzeStep() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Analyzing XML structure...</p>
      </div>
    </div>
  )
}

