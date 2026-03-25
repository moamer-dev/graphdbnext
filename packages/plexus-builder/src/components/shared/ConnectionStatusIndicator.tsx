'use client'

import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import { cn } from '../../utils/cn'

export type ConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'error'

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ConnectionStatusIndicator({
  status,
  label,
  size = 'md',
  className
}: ConnectionStatusIndicatorProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const statusConfig: Record<ConnectionStatus, {
    icon: typeof CheckCircle2
    color: string
    bgColor: string
    label: string
    animate?: string
  }> = {
    connected: {
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      label: 'Connected'
    },
    disconnected: {
      icon: XCircle,
      color: 'text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      label: 'Disconnected'
    },
    pending: {
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20',
      label: 'Pending',
      animate: 'animate-pulse'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      label: 'Error'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full p-1',
          config.bgColor,
          config.animate
        )}
      >
        <Icon className={cn(sizeClasses[size], config.color)} />
      </div>
      {label && (
        <span className="text-xs text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  )
}

