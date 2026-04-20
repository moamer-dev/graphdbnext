'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Pencil, UserCog } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Role } from '@/resources/RBACResource'

interface RoleSelectorProps {
    roles: Role[]
    selectedRoleId: string | null
    selectedResource: string | null
    loadingRoles: boolean
    onRoleSelect: (id: string) => void
    onResourceSelect: (resource: string | null) => void
    onEditRoleName: () => void
    resources: readonly string[]
}

export function RoleSelector({
    roles,
    selectedRoleId,
    selectedResource,
    loadingRoles,
    onRoleSelect,
    onResourceSelect,
    onEditRoleName,
    resources
}: RoleSelectorProps) {
    const selectedRole = roles.find(r => r.id === selectedRoleId)

    return (
        <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Stage 1: Select Role</Label>
                        <div className="flex gap-2">
                            <Select 
                                value={selectedRoleId || ''} 
                                onValueChange={onRoleSelect}
                            >
                                <SelectTrigger className="bg-background border-border/50 h-10">
                                    <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select a security role"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => (
                                        <SelectItem key={role.id} value={role.id}>
                                            <div className="flex items-center gap-2">
                                                <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                                                {role.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedRole && (
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="shrink-0 h-8 w-10 border-border/50"
                                    onClick={onEditRoleName}
                                    title="Rename Role"
                                >
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className={`space-y-2 transition-all duration-300 ${!selectedRoleId ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Stage 2: Select Resource</Label>
                        <Select 
                            value={selectedResource || ''} 
                            onValueChange={onResourceSelect}
                            disabled={!selectedRoleId}
                        >
                            <SelectTrigger className="bg-background border-border/50 h-10 font-medium">
                                <SelectValue placeholder="Identify resource to configure" />
                            </SelectTrigger>
                            <SelectContent>
                                {resources.map(resource => (
                                    <SelectItem key={resource} value={resource}>
                                        {resource.replace('_', ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
