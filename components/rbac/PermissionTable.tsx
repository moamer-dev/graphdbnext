'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ShieldAlert, CheckCircle2 } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Role } from '@/resources/RBACResource'

interface PermissionTableProps {
    selectedRole: Role | null
    selectedResource: string | null
    permissionsBuffer: any[]
    onPermissionChange: (resource: string, action: string, scope: string | null) => void
    onSave: () => void
    isPending: boolean
    hasChanges: boolean
    actions: readonly string[]
    scopes: readonly string[]
}

export function PermissionTable({
    selectedRole,
    selectedResource,
    permissionsBuffer,
    onPermissionChange,
    onSave,
    isPending,
    hasChanges,
    actions,
    scopes
}: PermissionTableProps) {
    if (!selectedRole || !selectedResource) {
        return (
            <div className="h-64 flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-muted/5 text-muted-foreground/50 text-center space-y-4">
                <ShieldAlert className="h-12 w-12 opacity-10" />
                <div className="space-y-1">
                    <p className="text-sm font-medium">Progressive Configuration</p>
                    <p className="text-xs">
                        {!selectedRole 
                            ? 'Please start by selecting a security role above' 
                            : 'Select a platform resource to define granular access levels'
                        }
                    </p>
                </div>
            </div>
        )
    }

    return (
        <Card className="border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CardHeader className="border-b border-border/50 bg-muted/5 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            {selectedResource.replace('_', ' ')} Access Control
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase tracking-tighter">
                            Configuring permissions for "{selectedRole.name}"
                        </CardDescription>
                    </div>
                    {hasChanges && (
                        <Button 
                            variant="default" 
                            size="sm"
                            className="h-8 shadow-sm px-4"
                            onClick={onSave}
                            disabled={isPending}
                        >
                            {isPending ? 'Saving...' : 'Save All Changes'}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
                <div className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/10 border-b">
                            <tr>
                                <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground border-r border-border/30">Action</th>
                                <th className="p-4 text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">Permission Level (Scope)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {actions
                                .filter(action => {
                                    const isSpecial = ['DATABASE', 'QUERY', 'ANALYTICS'].includes(selectedResource)
                                    return isSpecial ? action === 'ACCESS' : action !== 'ACCESS'
                                })
                                .map(action => {
                                const perm = permissionsBuffer.find(p => 
                                    p.resource === selectedResource && p.action === action && p.isActive
                                )
                                
                                return (
                                    <tr key={action} className="hover:bg-muted/5 transition-colors">
                                        <td className="p-4 font-bold text-xs uppercase tracking-widest border-r border-border/30 w-1/3">
                                            {action}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center">
                                {action === 'CREATE' || action === 'ACCESS' || ['DATABASE', 'QUERY', 'ANALYTICS'].includes(selectedResource) ? (
                                    <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg px-6 border border-border/10">
                                        <Checkbox 
                                            id={`check-${action}`}
                                            checked={!!perm} 
                                            onCheckedChange={(checked) => {
                                                onPermissionChange(selectedResource, action, checked ? 'ALL' : null)
                                            }}
                                        />
                                        <Label htmlFor={`check-${action}`} className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">
                                            {perm ? 'ENABLED' : 'DISABLED'}
                                        </Label>
                                    </div>
                                ) : (
                                    <Select 
                                        value={perm ? perm.scope : 'NONE'} 
                                        onValueChange={(val) => onPermissionChange(selectedResource, action, val === 'NONE' ? null : val)}
                                    >
                                        <SelectTrigger className={`h-9 min-w-[160px] text-[10px] uppercase font-black tracking-widest border-border/30 bg-background ${perm ? 'text-primary border-primary/20' : 'text-muted-foreground/40'}`}>
                                            <SelectValue placeholder="NONE" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NONE" className="text-[10px] uppercase font-bold">NONE</SelectItem>
                                            {scopes.map(s => (
                                                <SelectItem key={s} value={s} className="text-[10px] uppercase font-bold">{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
            <div className="p-4 bg-muted/5 border-t border-border/50 flex justify-between items-center">
                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1.5 font-medium">
                    <ShieldAlert className="h-3 w-3" />
                    Changes are only applied globally after clicking 'Save All Changes'
                </p>
            </div>
        </Card>
    )
}
