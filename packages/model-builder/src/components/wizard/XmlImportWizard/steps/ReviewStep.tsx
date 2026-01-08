'use client'

import { CheckCircle, CheckCircle2 } from 'lucide-react'

export function ReviewStep() {
  return (
    <div className="text-center p-12 bg-muted/20 rounded-lg">
      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
      <h3 className="text-base font-semibold mb-2">Model Generated Successfully!</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        Your XML has been converted to a graph model and loaded into the builder. You can now refine nodes, relationships, and add workflows as needed.
      </p>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span>Ready to use in the model builder</span>
      </div>
    </div>
  )
}

