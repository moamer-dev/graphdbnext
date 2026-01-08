'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../ui/tooltip'
import { HelpCircle } from 'lucide-react'

interface HelpTooltipProps {
  content: string | React.ReactNode
  children?: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function HelpTooltip({
  content,
  children,
  side = 'top'
}: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

