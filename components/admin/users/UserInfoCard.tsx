'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Shield, Loader2, Fingerprint, Calendar, Clock } from 'lucide-react'
import { User as UserType } from '@/resources/UserResource'

interface UserInfoCardProps {
    user: UserType
    name: string
    setName: (name: string) => void
    role: string
    setRole: (role: string) => void
    emailVerified: boolean
    setEmailVerified: (verified: boolean) => void
    isActive: boolean
    setIsActive: (active: boolean) => void
    password: string
    setPassword: (password: string) => void
    isSelf: boolean
    globalRoles: any[]
    loadingRoles: boolean
    isProfileView?: boolean
}

export function UserInfoCard({
    user,
    name,
    setName,
    role,
    setRole,
    emailVerified,
    setEmailVerified,
    isActive,
    setIsActive,
    password,
    setPassword,
    isSelf,
    globalRoles,
    loadingRoles,
    isProfileView
}: UserInfoCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Information
                </CardTitle>
                <CardDescription>
                    Edit basic user details and account information
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                        </Label>
                        <Input
                            id="email"
                            value={user.email}
                            disabled
                            className="h-10 text-sm"
                        />
                        <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter user name"
                            className="h-10 text-sm"
                        />
                    </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label htmlFor="role" className="text-sm font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            User Role
                        </Label>
                        <Select value={role} onValueChange={setRole} disabled={isProfileView}>
                            <SelectTrigger id="role" className="h-10 text-sm" suppressHydrationWarning>
                                <SelectValue suppressHydrationWarning />
                            </SelectTrigger>
                            <SelectContent>
                                {loadingRoles && (
                                    <div className="p-2 text-[10px] text-muted-foreground flex items-center gap-2 border-b border-border/30 mb-1">
                                        <Loader2 className="h-2.5 w-2.5 animate-spin"/>
                                        Syncing platform roles...
                                    </div>
                                )}
                                {globalRoles.length > 0 ? (
                                    globalRoles.map((r: any) => (
                                        <SelectItem key={r.id} value={r.name}>
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                {r.name}
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : !loadingRoles ? (
                                    <>
                                        <SelectItem value="USER">Standard User</SelectItem>
                                        <SelectItem value="ADMIN">Administrator</SelectItem>
                                    </>
                                ) : (
                                    /* Temporary item to ensure the SelectValue can display the current role while loading */
                                    <SelectItem value={role}>
                                        <div className="flex items-center gap-2 opacity-70">
                                            <Shield className="h-4 w-4" />
                                            {role}
                                        </div>
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {role === 'ADMIN' 
                                ? 'Full access to all features and settings'
                                : 'Limited access to basic features'
                            }
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="emailVerified" className="text-sm font-medium">Email Verification</Label>
                        <div className="flex items-center space-x-3">
                            <Switch
                                id="emailVerified"
                                checked={emailVerified}
                                onCheckedChange={setEmailVerified}
                                disabled={isProfileView}
                            />
                            <Label htmlFor="emailVerified" className="text-sm">
                                {emailVerified ? 'Email verified' : 'Email not verified'}
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {emailVerified 
                                ? 'Your email address is verified'
                                : 'Your email address is not yet verified'
                            }
                        </p>
                    </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label htmlFor="isActive" className="text-sm font-medium">Account Status</Label>
                        <div className="flex items-center space-x-3">
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                                disabled={isSelf || isProfileView}
                            />
                            <Label htmlFor="isActive" className="text-sm">
                                {isActive ? 'Account Active' : 'Account Disabled'}
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isSelf 
                                ? 'You cannot disable your own account'
                                : isActive 
                                    ? 'User can log in and access the platform'
                                    : 'User is prohibited from logging in'
                            }
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter new password to reset"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-10 text-sm"
                        />
                        <p className="text-xs text-muted-foreground">Leave blank to keep current password</p>
                    </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <div className="space-y-1.5 px-3 py-2 bg-muted/20 rounded-md border border-border/10">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/70 flex items-center gap-1.5">
                            <Fingerprint className="h-3 w-3" />
                            User ID
                        </span>
                        <p className="text-xs font-mono font-medium truncate text-muted-foreground/80">{user.id}</p>
                    </div>
                    <div className="space-y-1.5 px-3 py-2 bg-muted/20 rounded-md border border-border/10">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/70 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            Joined Platform
                        </span>
                        <p className="text-xs font-medium">{new Date(user.createdAt).toLocaleDateString()} at {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="space-y-1.5 px-3 py-2 bg-muted/20 rounded-md border border-border/10">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/70 flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            Last Updated
                        </span>
                        <p className="text-xs font-medium">{new Date(user.updatedAt).toLocaleDateString()} at {new Date(user.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
