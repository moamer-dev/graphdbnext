'use client'

import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '../../utils/cn'

export type ValidationLevel = 'error' | 'warning' | 'info' | 'success'

interface ValidationFeedbackProps {
  level: ValidationLevel
  message: string
  className?: string
}

export function ValidationFeedback({
  level,
  message,
  className
}: ValidationFeedbackProps) {
  const config = {
    error: {
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800'
    },
    warning: {
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800'
    },
    info: {
      icon: Info,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    success: {
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800'
    }
  }

  const { icon: Icon, color, bgColor, borderColor } = config[level]

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-3 py-2 rounded-md border text-xs',
        bgColor,
        borderColor,
        className
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', color)} />
      <span className={cn('flex-1', color)}>{message}</span>
    </div>
  )
}

