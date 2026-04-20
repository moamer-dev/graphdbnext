import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { MoreHorizontal, Calendar, User, ArrowRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils'
import { useRBAC } from '@/hooks/useRBAC'
import React from 'react'

interface ResourceCardProps {
  item: any
  resourceName: string
  title: string
  description?: string | null
  status?: boolean
  date?: string
  creator?: string
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  onClick?: () => void
  showQuickPerspective?: boolean
  actions?: {
      label: string
      icon: any
      action: (item?: any) => void
      variant?: 'default' | 'destructive'
      permission?: {
          action: string
          resource?: string
      }
      visible?: (item: any) => boolean
  }[]
  icon?: any
  color?: string
}

export function ResourceCard({
  item,
  resourceName,
  title,
  description,
  status,
  date,
  creator,
  isSelected,
  onSelect,
  onClick,
  showQuickPerspective = true,
  actions,
  icon: Icon,
  color = 'primary'
}: ResourceCardProps) {
  const { can } = useRBAC()

  const filteredActions = React.useMemo(() => {
     return actions?.filter(action => {
         // 1. Check custom visibility logic
         if (action.visible && !action.visible(item)) return false
         
         // 2. Check RBAC permissions
         if (action.permission) {
             const resource = action.permission.resource || resourceName.toUpperCase()
             if (!can(action.permission.action, resource, item)) return false
         }
         
         return true
     })
  }, [actions, item, resourceName, can])

  return (
    <Card 
        onClick={onClick}
        className={cn(
            "group relative overflow-hidden transition-all duration-300 hover:shadow-md border-muted/60",
            onClick && "cursor-pointer",
            isSelected && "ring-2 ring-primary border-primary/20 bg-primary/5 shadow-inner"
        )}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-all duration-300" />
      
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
             {onSelect && (
                 <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={(val) => onSelect?.(!!val)}
                        className="translate-y-0.5"
                        disabled={!can('DELETE', resourceName.toUpperCase(), item)}
                    />
                 </div>
             )}
             <div className="flex flex-col gap-0.5">
                <h3 className="font-semibold text-sm tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                    {title}
                </h3>
                {status !== undefined && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={cn("size-1.5 rounded-full", status ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">
                            {status ? 'Active' : 'Paused'}
                        </span>
                    </div>
                )}
             </div>
          </div>

          {filteredActions && filteredActions.length > 0 && (
            <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="size-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                    {filteredActions.map((action, i) => {
                        const ActionIcon = action.icon
                        return (
                            <DropdownMenuItem 
                                key={i} 
                                onClick={() => action.action(item)}
                                className={cn("gap-2", action.variant === 'destructive' && "text-destructive")}
                            >
                                {ActionIcon && <ActionIcon className="size-3.5" />}
                                {action.label}
                            </DropdownMenuItem>
                        )
                    })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <p className="text-xs text-muted-foreground/80 line-clamp-2 min-h-[2rem]">
          {description || 'No description provided.'}
        </p>
        
        <div className="flex flex-col gap-2 mt-4 border-t border-muted/40 pt-4">
            {date && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                    <Calendar className="size-3" />
                    <span>Created {new Date(date).toLocaleDateString()}</span>
                </div>
            )}
            {creator && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                    <User className="size-3" />
                    <span>Owner: {creator}</span>
                </div>
            )}
        </div>
      </CardContent>

      {showQuickPerspective && (
          <div className="mt-auto px-4 pb-4" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between h-8 text-[11px] font-medium bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all group/btn"
                onClick={actions?.find(a => a.label === 'View')?.action || (() => {})}
              >
                  Quick Perspective
                  <ArrowRight className="size-3 transition-transform group-hover/btn:translate-x-1" />
              </Button>
          </div>
      )}
    </Card>
  )
}
