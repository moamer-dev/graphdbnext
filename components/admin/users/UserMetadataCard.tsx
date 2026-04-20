'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Fingerprint, Calendar, Clock, Mail } from 'lucide-react'
import { User as UserType } from '@/resources/UserResource'

interface UserMetadataCardProps {
    user: UserType
    emailVerified: boolean
}

export function UserMetadataCard({ user, emailVerified }: UserMetadataCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Account Metadata</CardTitle>
                <CardDescription>
                    System information and account timestamps
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border border-border/20">
                        <div className="p-2 bg-primary/10 rounded">
                            <Fingerprint className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-muted-foreground mb-0.5 uppercase font-bold tracking-tight">User ID</div>
                            <div className="font-mono text-xs font-semibold truncate text-muted-foreground">{user.id}</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border border-border/20">
                        <div className="p-2 bg-blue-500/10 rounded">
                            <Calendar className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <div className="text-[10px] text-muted-foreground mb-0.5 uppercase font-bold tracking-tight">Created</div>
                            <div className="text-xs font-semibold">{new Date(user.createdAt).toLocaleDateString()}</div>
                            <div className="text-[10px] text-muted-foreground/60">{new Date(user.createdAt).toLocaleTimeString()}</div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border border-border/20">
                        <div className="p-2 bg-green-500/10 rounded">
                            <Clock className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                            <div className="text-[10px] text-muted-foreground mb-0.5 uppercase font-bold tracking-tight">Last Updated</div>
                            <div className="text-xs font-semibold">{new Date(user.updatedAt).toLocaleDateString()}</div>
                            <div className="text-[10px] text-muted-foreground/60">{new Date(user.updatedAt).toLocaleTimeString()}</div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border border-border/20">
                        <div className="p-2 bg-orange-500/10 rounded">
                            <Mail className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                            <div className="text-[10px] text-muted-foreground mb-0.5 uppercase font-bold tracking-tight">Email Status</div>
                            <Badge variant={emailVerified ? 'default' : 'outline'} className="text-[10px] h-4">
                                {emailVerified ? 'Verified' : 'Unverified'}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
