'use client'

import { useState, useEffect } from 'react'
import { useCredentialsStore, type CredentialType, type ApiCredential } from '../../stores/credentialsStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { Plus, Trash2, Key, Globe, Lock, Database, User, Server } from 'lucide-react'
import { toast } from '../../utils/toast'
import type { CredentialsPersistence } from '../ModelBuilder'

interface CredentialFormData {
  name: string
  type: CredentialType
  data: Record<string, string>
  storageSource: 'local' | 'db'
  scope: 'personal' | 'workspace'
}

interface CredentialsManagerProps {
  persistence?: CredentialsPersistence
  mode?: 'manager' | 'create' | 'edit'
  initialEditingId?: string
  forceStorageSource?: 'local' | 'db'
  workspaces?: Array<{ id: string; name: string }>
  onSuccess?: () => void
  onCancel?: () => void
}

const credentialFields: Record<CredentialType, Array<{ key: string; label: string; type: 'text' | 'password'; placeholder: string }>> = {
  orcid: [
    { key: 'apiKey', label: 'ORCID API Key', type: 'password', placeholder: 'Enter your ORCID API key' }
  ],
  geonames: [
    { key: 'username', label: 'GeoNames Username', type: 'text', placeholder: 'Enter your GeoNames username' }
  ],
  europeana: [
    { key: 'apiKey', label: 'Europeana API Key', type: 'password', placeholder: 'Enter your Europeana API key (wskey)' }
  ],
  getty: [
    { key: 'apiKey', label: 'Getty API Key', type: 'password', placeholder: 'Enter your Getty API key (optional)' }
  ],
  apiKey: [
    { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter your API key' },
    { key: 'apiKeyHeader', label: 'Header Name', type: 'text', placeholder: 'X-API-Key (default)' }
  ],
  bearer: [
    { key: 'bearerToken', label: 'Bearer Token', type: 'password', placeholder: 'Enter your Bearer token' }
  ],
  basic: [
    { key: 'basicUsername', label: 'Username', type: 'text', placeholder: 'Enter username' },
    { key: 'basicPassword', label: 'Password', type: 'password', placeholder: 'Enter password' }
  ],
  custom: [
    { key: 'endpoint', label: 'API Endpoint', type: 'text', placeholder: 'https://api.example.com/{id}' },
    { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter API key (optional)' },
    { key: 'headerName', label: 'Header Name', type: 'text', placeholder: 'Authorization (optional)' },
    { key: 'headerValue', label: 'Header Value', type: 'text', placeholder: 'Bearer {token} (optional)' }
  ]
}

export function CredentialsManager({ 
  persistence,
  mode = 'manager',
  initialEditingId,
  forceStorageSource,
  workspaces,
  onSuccess,
  onCancel
}: CredentialsManagerProps) {
  const { credentials, addCredential, updateCredential, deleteCredential, setCredentials } = useCredentialsStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState<CredentialFormData & { workspaceId?: string | null }>({
    name: '',
    type: 'orcid',
    data: {},
    storageSource: forceStorageSource || 'local',
    scope: 'personal',
    workspaceId: persistence?.activeWorkspaceId || null
  })

  // Sync forced storage source
  useEffect(() => {
    if (forceStorageSource) {
      setFormData(prev => ({ ...prev, storageSource: forceStorageSource }))
    }
  }, [forceStorageSource])

  // Load DB credentials if persistence is provided
  useEffect(() => {
    if (persistence?.onLoad) {
      const loadDbCreds = async () => {
        try {
          setIsLoading(true)
          const dbCredsRaw = await persistence.onLoad!()
          const dbCreds = dbCredsRaw.map((cred: any) => ({
            id: cred.id,
            name: cred.name,
            type: cred.type,
            data: cred.data,
            storageSource: 'db' as const,
            workspaceId: cred.workspaceId,
            createdAt: new Date(cred.createdAt).getTime(),
            updatedAt: new Date(cred.updatedAt).getTime(),
            isActive: cred.isActive
          }))

          const localCreds = credentials.filter(c => c.storageSource === 'local')
          const merged = [...localCreds, ...dbCreds]
          setCredentials(merged)

          // If in edit mode with initial ID, prepare form
          if ((mode === 'edit' || initialEditingId) && initialEditingId) {
            const cred = merged.find(c => c.id === initialEditingId)
            if (cred) {
              setFormData({
                name: cred.name,
                type: cred.type,
                data: { ...cred.data },
                storageSource: cred.storageSource,
                scope: cred.workspaceId ? 'workspace' : 'personal',
                workspaceId: cred.workspaceId || null
              })
              setEditingId(initialEditingId)
            }
          }
        } catch (error) {
          console.error('Failed to load DB credentials:', error)
        } finally {
          setIsLoading(false)
        }
      }
      loadDbCreds()
    }
  }, [persistence?.onLoad, initialEditingId, mode])

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'orcid',
      data: {},
      storageSource: 'local',
      scope: 'personal'
    })
    setEditingId(null)
  }

  const handleOpenDialog = (credentialId?: string) => {
    if (credentialId) {
      const cred = credentials.find(c => c.id === credentialId)
      if (cred) {
        setFormData({
          name: cred.name,
          type: cred.type,
          data: { ...cred.data },
          storageSource: cred.storageSource,
          scope: cred.workspaceId ? 'workspace' : 'personal',
          workspaceId: cred.workspaceId || null
        })
        setEditingId(credentialId)
      }
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a name for the credential')
      return
    }

    const fields = credentialFields[formData.type]
    const missingFields = fields.filter(f => {
      if (f.key === 'apiKey' && formData.type === 'getty') return false
      if (f.key.startsWith('header') && formData.type === 'custom') return false
      return !formData.data[f.key]?.trim()
    })

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.map(f => f.label).join(', ')}`)
      return
    }

    try {
      if (formData.storageSource === 'db' && persistence) {
        const payload = {
          name: formData.name,
          type: formData.type,
          data: formData.data,
          workspaceId: formData.scope === 'workspace' ? (formData.workspaceId || persistence.activeWorkspaceId) : null,
          isActive: true
        }

        if (editingId) {
          if (persistence.onUpdate) {
            await persistence.onUpdate(editingId, payload)
            toast.success('Persistent credential updated')
          }
        } else {
          if (persistence.onSave) {
            await persistence.onSave(payload)
            toast.success('Persistent credential created')
          }
        }
        
        // Reload to sync
        if (persistence.onLoad) {
          const dbCredsRaw = await persistence.onLoad()
           const dbCreds = dbCredsRaw.map((cred: any) => ({
            id: cred.id,
            name: cred.name,
            type: cred.type,
            data: cred.data,
            storageSource: 'db' as const,
            workspaceId: cred.workspaceId,
            createdAt: new Date(cred.createdAt).getTime(),
            updatedAt: new Date(cred.updatedAt).getTime(),
            isActive: cred.isActive
          }))
          const localCreds = credentials.filter(c => c.storageSource === 'local')
          setCredentials([...localCreds, ...dbCreds])
        }
      } else {
        // Local Store
        const payload = {
          name: formData.name,
          type: formData.type,
          data: formData.data,
          storageSource: 'local' as const
        }

        if (editingId) {
          updateCredential(editingId, payload)
          toast.success('Local credential updated')
        } else {
          addCredential(payload)
          toast.success('Local credential created')
        }
      }
      
      setIsDialogOpen(false)
      resetForm()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save credential:', error)
      toast.error('Failed to save credential')
    }
  }

  const handleDelete = async (cred: ApiCredential) => {
    if (confirm('Are you sure you want to delete this credential?')) {
      try {
        if (cred.storageSource === 'db' && persistence?.onDelete) {
          await persistence.onDelete(cred.id)
          toast.success('Persistent credential deleted')
          // Reload
          if (persistence.onLoad) {
             const dbCredsRaw = await persistence.onLoad()
             const dbCreds = dbCredsRaw.map((cred: any) => ({
                id: cred.id,
                name: cred.name,
                type: cred.type,
                data: cred.data,
                storageSource: 'db' as const,
                workspaceId: cred.workspaceId,
                createdAt: new Date(cred.createdAt).getTime(),
                updatedAt: new Date(cred.updatedAt).getTime(),
                isActive: cred.isActive
              }))
              const localCreds = credentials.filter(c => c.storageSource === 'local')
              setCredentials([...localCreds, ...dbCreds])
          }
        } else {
          deleteCredential(cred.id)
        }
      } catch (error) {
        console.error('Failed to delete credential:', error)
        toast.error('Failed to delete credential')
      }
    }
  }

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [key]: value
      }
    }))
  }

  const getCredentialIcon = (type: CredentialType) => {
    switch (type) {
      case 'orcid': return <Key className="h-4 w-4" />
      case 'geonames': return <Globe className="h-4 w-4" />
      case 'europeana': return <Globe className="h-4 w-4" />
      case 'getty': return <Key className="h-4 w-4" />
      case 'apiKey': return <Key className="h-4 w-4" />
      case 'bearer': return <Lock className="h-4 w-4" />
      case 'basic': return <Lock className="h-4 w-4" />
      case 'custom': return <Lock className="h-4 w-4" />
    }
  }

  const fields = credentialFields[formData.type]

  // Stats
  const localCount = credentials.filter(c => c.storageSource === 'local').length
  const dbCount = credentials.filter(c => c.storageSource === 'db').length

  // Render only the form if in create mode
  const renderForm = () => (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cred-name">Name</Label>
          <Input
            id="cred-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My API Credentials"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cred-type">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, type: value as CredentialType, data: {} }))
            }}
          >
            <SelectTrigger id="cred-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="orcid">ORCID</SelectItem>
              <SelectItem value="geonames">GeoNames</SelectItem>
              <SelectItem value="europeana">Europeana</SelectItem>
              <SelectItem value="getty">Getty Vocabularies</SelectItem>
              <SelectItem value="apiKey">API Key</SelectItem>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="basic">Basic Auth</SelectItem>
              <SelectItem value="custom">Custom API</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-y py-4 bg-muted/20 px-4 rounded-lg">
        {!forceStorageSource && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Server className="h-3 w-3" />
              Storage Mode
            </Label>
            <Select
              value={formData.storageSource}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, storageSource: value as 'local' | 'db' }))
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Local Browser
                  </div>
                </SelectItem>
                {persistence && (
                  <SelectItem value="db">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Persistent Database
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {(formData.storageSource === 'db' || forceStorageSource === 'db') && (
          <>
            <div className="space-y-2">
              <Label>Assignment Scope</Label>
              <Select
                value={formData.scope}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, scope: value as 'personal' | 'workspace' }))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal (Only Me)</SelectItem>
                  <SelectItem value="workspace">Workspace Scoped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.scope === 'workspace' && workspaces && workspaces.length > 0 && (
              <div className="space-y-2 col-span-2 mt-2 pt-2 border-t border-dashed border-primary/20">
                <Label>Select Workspace</Label>
                <Select
                  value={formData.workspaceId || ''}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, workspaceId: value }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workspace..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map(ws => (
                      <SelectItem key={ws.id} value={ws.id}>
                        {ws.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium border-b pb-1">Connection Details</h4>
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`cred-${field.key}`}>{field.label}</Label>
            <Input
              id={`cred-${field.key}`}
              type={field.type}
              value={formData.data[field.key] || ''}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => (mode === 'create' ? onCancel?.() : setIsDialogOpen(false))}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {editingId ? 'Update' : 'Create'} Credential
        </Button>
      </div>
    </div>
  )

  if (mode === 'create' || mode === 'edit' || (mode === 'manager' && editingId && !initialEditingId)) {
    return renderForm()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            API Credentials
            <div className="flex gap-1 ml-2">
              <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0.5">
                {localCount} Local
              </Badge>
              <Badge variant="outline" className="text-[10px] uppercase font-bold py-0.5 border-primary/30 text-primary/80">
                {dbCount} DB
              </Badge>
              {isLoading && <span className="text-[10px] animate-pulse text-muted-foreground ml-2">Syncing...</span>}
            </div>
          </h3>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Credential' : 'Add New Credential'}</DialogTitle>
              <DialogDescription>
                Create a credential profile to securely store API keys and authentication information.
              </DialogDescription>
            </DialogHeader>
            {renderForm()}
          </DialogContent>
        </Dialog>
      </div>

      {credentials.length === 0 && !isLoading ? (
        <div className="p-8 text-center rounded-lg border-2 border-dashed border-muted bg-muted/20">
          <Key className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            No credentials configured. Click &quot;Add Credential&quot; to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  {getCredentialIcon(cred.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cred.name}</span>
                    {cred.storageSource === 'db' ? (
                      <Badge variant="outline" className="text-[9px] uppercase h-4 px-1.5 border-primary/20 bg-primary/5 text-primary/70">
                        {cred.workspaceId ? 'Workspace' : 'Personal'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] uppercase h-4 px-1.5 opacity-60">
                        Local
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">{cred.type}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={() => handleOpenDialog(cred.id)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDelete(cred)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
