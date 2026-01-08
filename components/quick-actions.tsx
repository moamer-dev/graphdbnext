'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { quickActionNavItems } from '@/config/quickAction-nav'
import { cn } from '@/lib/utils'

export function QuickActions({ className }: { className?: string }) {
    const router = useRouter()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn("h-8 border-dashed", className)}
                >
                    <span className="mr-2">Quick Actions</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                {quickActionNavItems.map((group, index) => (
                    <React.Fragment key={group.title}>
                        {index > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground font-normal uppercase tracking-wider">
                            {group.title}
                        </DropdownMenuLabel>
                        <DropdownMenuGroup>
                            {group.items.map((item) => (
                                <DropdownMenuItem
                                    key={item.label}
                                    onClick={() => {
                                        if (item.href) {
                                            router.push(item.href)
                                        } else if (item.onClick) {
                                            item.onClick()
                                        }
                                    }}
                                    className="cursor-pointer"
                                >
                                    <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>{item.label}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </React.Fragment>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
