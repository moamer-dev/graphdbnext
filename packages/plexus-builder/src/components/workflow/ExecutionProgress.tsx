'use client'

import { Progress } from '../ui/progress'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ExecutionProgressProps {
  current: number
  total: number
  currentStep?: string
  status?: 'running' | 'completed' | 'error'
  className?: string
}

export function ExecutionProgress({
  current,
  total,
  currentStep,
  status = 'running',
  className
}: ExecutionProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {status === 'running' && (
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          )}
          {status === 'completed' && (
            <CheckCircle2 className="h-3 w-3 text-green-600" />
          )}
          {status === 'error' && (
            <XCircle className="h-3 w-3 text-red-600" />
          )}
          <span className="font-medium">
            {status === 'running' && 'Executing...'}
            {status === 'completed' && 'Completed'}
            {status === 'error' && 'Error'}
          </span>
        </div>
        <span className="text-muted-foreground">
          {current} / {total} ({percentage}%)
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      {currentStep && (
        <div className="text-[10px] text-muted-foreground truncate">
          {currentStep}
        </div>
      )}
    </div>
  )
}

