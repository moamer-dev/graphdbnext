'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { StorageConfig } from '@/resources/StorageConfigResource'
import { Database, HardDrive, Cloud, Settings2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface StorageConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: StorageConfig | null
  onSave: (data: any) => Promise<void>
}

type StorageFormValues = {
  name: string
  type: 'DATABASE' | 'LOCAL_FS' | 'EXTERNAL_S3'
  isActive: boolean
  isDefault: boolean
  config: any
}

export function StorageConfigDialog({
  open,
  onOpenChange,
  item,
  onSave
}: StorageConfigDialogProps) {
  const isEdit = !!item
  const { register, handleSubmit, watch, setValue, reset, formState: { isSubmitting } } = useForm<StorageFormValues>({
    defaultValues: {
      name: '',
      type: 'DATABASE',
      isActive: true,
      isDefault: false,
      config: {}
    }
  })

  const selectedType = watch('type')

  useEffect(() => {
    if (item && open) {
      reset({
        name: item.name,
        type: item.type as any,
        isActive: item.isActive,
        isDefault: item.isDefault,
        config: item.config || {}
      })
    } else if (!open) {
      reset({
        name: '',
        type: 'DATABASE',
        isActive: true,
        isDefault: false,
        config: {}
      })
    }
  }, [item, reset, open])

  const onSubmit = async (data: any) => {
    await onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Storage Provider' : 'Add Storage Provider'}</DialogTitle>
            <DialogDescription>
              Configure how the system stores massive XML/JSON files and API responses.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Provider Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Primary Postgres"
                  {...register('name', { required: true })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Storage Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={(val: any) => setValue('type', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select storage type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DATABASE">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        <span>Database</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="LOCAL_FS">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-green-500" />
                        <span>Local Filesystem</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="EXTERNAL_S3">
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4 text-orange-500" />
                        <span>External S3</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-[10px] text-muted-foreground">Enable this provider for new storage operations.</p>
              </div>
              <Switch
                checked={watch('isActive')}
                onCheckedChange={(val) => setValue('isActive', val)}
              />
            </div>

            {/* Routing Rules */}
            <div className="space-y-3 p-4 border rounded-lg border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-1">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Auto-Routing Rules</h4>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight px-1">
                    Define when the system should automatically use this provider.
                </p>
                
                <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="grid gap-1.5">
                        <Label htmlFor="minSize" className="text-[10px]">Min Size (Bytes)</Label>
                        <Input
                            id="minSize"
                            placeholder="e.g. 2097152"
                            className="h-8 text-xs font-mono"
                            type="number"
                            defaultValue={item?.config?.routingRules?.minSize || ''}
                            onChange={(e) => {
                                const val = e.target.value ? parseInt(e.target.value) : undefined
                                setValue('config', { 
                                    ...watch('config'), 
                                    routingRules: { ...(watch('config').routingRules || {}), minSize: val } 
                                })
                            }}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="maxSize" className="text-[10px]">Max Size (Bytes)</Label>
                        <Input
                            id="maxSize"
                            className="h-8 text-xs font-mono"
                            type="number"
                            placeholder="e.g. 10485760"
                            defaultValue={item?.config?.routingRules?.maxSize || ''}
                            onChange={(e) => {
                                const val = e.target.value ? parseInt(e.target.value) : undefined
                                setValue('config', { 
                                    ...watch('config'), 
                                    routingRules: { ...(watch('config').routingRules || {}), maxSize: val } 
                                })
                            }}
                        />
                    </div>
                </div>

                <div className="grid gap-1.5">
                    <Label className="text-[10px]">Target Types</Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                        {['XML', 'JSON', 'API_RESPONSE'].map(type => {
                            const currentRules = watch('config').routingRules || {}
                            const allowedTypes = currentRules.allowedTypes || []
                            const isSelected = allowedTypes.includes(type)
                            
                            return (
                                <Button
                                    key={type}
                                    type="button"
                                    variant={isSelected ? 'default' : 'outline'}
                                    className={`h-6 px-2 text-[9px] font-bold rounded-md ${isSelected ? 'bg-primary' : 'bg-white opacity-60'}`}
                                    onClick={() => {
                                        const nextTypes = isSelected 
                                            ? allowedTypes.filter((t: string) => t !== type)
                                            : [...allowedTypes, type]
                                        
                                        setValue('config', {
                                            ...watch('config'),
                                            routingRules: { ...currentRules, allowedTypes: nextTypes }
                                        })
                                    }}
                                >
                                    {type}
                                </Button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Type-Specific Configuration */}
            {selectedType === 'LOCAL_FS' && (
              <div className="space-y-3 p-4 border rounded-lg bg-accent/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filesystem Settings</h4>
                <div className="grid gap-2">
                  <Label htmlFor="rootPath" className="text-xs">Root Path</Label>
                  <Input
                    id="rootPath"
                    placeholder="/var/lib/graphdbnext/storage"
                    className="h-8 text-xs font-mono"
                    defaultValue={item?.config?.rootPath || ''}
                    onChange={(e) => setValue('config', { ...watch('config'), rootPath: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground italic">Absolute path where files will be stored on the server.</p>
                </div>
              </div>
            )}

            {selectedType === 'EXTERNAL_S3' && (
              <div className="space-y-3 p-4 border rounded-lg bg-accent/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">S3 Credentials</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="bucket" className="text-xs">Bucket Name</Label>
                    <Input
                      id="bucket"
                      className="h-8 text-xs"
                      defaultValue={item?.config?.bucket || ''}
                      onChange={(e) => setValue('config', { ...watch('config'), bucket: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="region" className="text-xs">Region</Label>
                    <Input
                      id="region"
                      className="h-8 text-xs"
                      placeholder="us-east-1"
                      defaultValue={item?.config?.region || ''}
                      onChange={(e) => setValue('config', { ...watch('config'), region: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="accessKey" className="text-xs">Access Key ID</Label>
                  <Input
                    id="accessKey"
                    className="h-8 text-xs font-mono"
                    type="password"
                    defaultValue={item?.config?.accessKeyId || ''}
                    onChange={(e) => setValue('config', { ...watch('config'), accessKeyId: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="secretKey" className="text-xs">Secret Access Key</Label>
                  <Input
                    id="secretKey"
                    className="h-8 text-xs font-mono"
                    type="password"
                    defaultValue={item?.config?.secretAccessKey || ''}
                    onChange={(e) => setValue('config', { ...watch('config'), secretAccessKey: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="endpoint" className="text-xs">Custom Endpoint (Optional)</Label>
                  <Input
                    id="endpoint"
                    className="h-8 text-xs"
                    placeholder="https://s3.example.com"
                    defaultValue={item?.config?.endpoint || ''}
                    onChange={(e) => setValue('config', { ...watch('config'), endpoint: e.target.value })}
                  />
                </div>
              </div>
            )}

            {selectedType === 'DATABASE' && (
              <Alert className="bg-blue-500/5 border-blue-500/20 py-2">
                <Database className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-xs font-bold text-blue-500">Note</AlertTitle>
                <AlertDescription className="text-[10px] text-blue-500/70">
                  DATABASE storage uses the system's primary relational database. No extra configuration is required.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Provider' : 'Create Provider'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
