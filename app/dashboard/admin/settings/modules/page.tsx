'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useModules, MODULES_QUERY_KEY } from '@/hooks/settings/useModules'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Settings, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ModulesSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { modules, loading, isModuleEnabled } = useModules()
  const queryClient = useQueryClient()
  const [updating, setUpdating] = useState<string | null>(null)

  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, router])

  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    setUpdating(moduleId)
    try {
      const response = await fetch('/api/modules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ moduleId, enabled })
      })

      if (response.ok) {
        // Invalidate query to update AppSidebar and other components
        await queryClient.invalidateQueries({ queryKey: MODULES_QUERY_KEY })
        toast.success(`Module ${enabled ? 'enabled' : 'disabled'} successfully`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update module')
      }
    } catch (error) {
      console.error('Error updating module:', error)
      toast.error('Error updating module')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/admin/settings')}
              className="h-7 text-xs hover:bg-muted/40"
            >
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Back to Settings
            </Button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="relative">
                  Module Management
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
                </span>
              </h1>
              <p className="text-xs mt-1.5 text-muted-foreground/70">
                Manage platform-wide optional modules
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-muted/20 rounded-lg border border-border/20 backdrop-blur-sm">
          <p className="text-xs text-muted-foreground mb-4">
            Modules extend the functionality of the application. These settings affect the entire platform and all users.
          </p>

          <div className="space-y-4">
            {modules.map((module) => (
              <div
                key={module.id}
                className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-border/20"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor={`module-${module.id}`} className="font-medium text-sm">
                      {module.name}
                    </Label>
                    {module.version && (
                      <span className="text-xs text-muted-foreground">
                        v{module.version}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {module.description}
                  </p>
                  {module.id === 'plexus-builder' && module.enabled && (
                    <div className="mt-2 pt-2 border-t border-border/20">
                      <Link href="/dashboard/admin/settings/plexus-builder">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-2">
                          <Settings className="h-3 w-3" />
                          Configure AI Settings
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {updating === module.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Switch
                      id={`module-${module.id}`}
                      checked={module.enabled}
                      onCheckedChange={(checked) => handleToggleModule(module.id, checked)}
                      disabled={updating !== null}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {modules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No modules available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

