'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  headerClassName?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
  className,
  headerClassName,
  icon: Icon
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn('space-y-2', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 w-full text-left text-xs font-medium text-foreground hover:text-primary transition-colors',
          headerClassName
        )}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {Icon && <Icon className="h-4 w-4" />}
        <span>{title}</span>
      </button>
      {isOpen && <div className="pl-6 space-y-2">{children}</div>}
    </div>
  )
}

