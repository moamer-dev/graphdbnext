'use client'

import { useState } from 'react'
import { useCredentialsStore, type CredentialType } from '../../stores/credentialsStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
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
import { Plus, Trash2, Key, Globe, User, Lock } from 'lucide-react'
// Note: Alert component - using a simple div for now

interface CredentialFormData {
  name: string
  type: CredentialType
  data: Record<string, string>
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
  custom: [
    { key: 'endpoint', label: 'API Endpoint', type: 'text', placeholder: 'https://api.example.com/{id}' },
    { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter API key (optional)' },
    { key: 'headerName', label: 'Header Name', type: 'text', placeholder: 'Authorization (optional)' },
    { key: 'headerValue', label: 'Header Value', type: 'text', placeholder: 'Bearer {token} (optional)' }
  ]
}

export function CredentialsManager() {
  const { credentials, addCredential, updateCredential, deleteCredential } = useCredentialsStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CredentialFormData>({
    name: '',
    type: 'orcid',
    data: {}
  })

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'orcid',
      data: {}
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
          data: { ...cred.data }
        })
        setEditingId(credentialId)
      }
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a name for the credential')
      return
    }

    const fields = credentialFields[formData.type]
    const missingFields = fields.filter(f => {
      if (f.key === 'apiKey' && formData.type === 'getty') return false // Getty API key is optional
      if (f.key.startsWith('header') && formData.type === 'custom') return false // Custom headers are optional
      return !formData.data[f.key]?.trim()
    })

    if (missingFields.length > 0) {
      alert(`Please fill in: ${missingFields.map(f => f.label).join(', ')}`)
      return
    }

    if (editingId) {
      updateCredential(editingId, formData)
    } else {
      addCredential(formData)
    }
    
    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this credential?')) {
      deleteCredential(id)
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
      case 'custom': return <Lock className="h-4 w-4" />
    }
  }

  const fields = credentialFields[formData.type]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">API Credentials</h3>
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
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cred-name">Name</Label>
                <Input
                  id="cred-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My ORCID Credentials"
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
                    <SelectItem value="custom">Custom API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 border-t pt-4">
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

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingId ? 'Update' : 'Create'} Credential
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {credentials.length === 0 ? (
        <div className="p-3 rounded-lg border border-muted bg-muted/50">
          <p className="text-sm text-muted-foreground">
            No credentials configured. Click &quot;Add Credential&quot; to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                {getCredentialIcon(cred.type)}
                <div>
                  <div className="font-medium">{cred.name}</div>
                  <div className="text-sm text-muted-foreground capitalize">{cred.type}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenDialog(cred.id)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(cred.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

