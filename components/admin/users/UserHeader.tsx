'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Save, Shield, Loader2 } from 'lucide-react'
import { UserResource, type User as UserType } from '@/resources/UserResource'

interface UserHeaderProps {
    user: UserType
    role: string
    onSave: () => void
    isSaving: boolean
    isProfileView?: boolean
}

export function UserHeader({ user, role, onSave, isSaving, isProfileView }: UserHeaderProps) {
    const router = useRouter()

    return (
        <div className="gradient-header-minimal pb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {!isProfileView && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(UserResource.LIST_PATH)}
                            className="h-8 text-xs hover:bg-muted/40"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Users
                        </Button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <span className="relative">
                                {user.email}
                                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></span>
                            </span>
                        </h1>
                        <p className="text-sm mt-2 text-muted-foreground">
                            {isProfileView 
                                ? 'Manage your personal account details and settings'
                                : 'Manage user account details and permissions'
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className="h-8 text-sm"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
