'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react'
import type { AIModelProvider, AIModelName, AISettings } from '@graphdb/model-builder'
import { toast } from 'sonner'

// Extend the base type to include our new feature
interface ExtendedAISettings extends Omit<AISettings, 'features'> {
  features: AISettings['features'] & {
    queryAiAgent?: boolean
  }
}

const DEFAULT_AI_SETTINGS: ExtendedAISettings = {
  enabled: false,
  model: {
    provider: 'openai',
    modelName: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 4000
  },
  features: {
    enabled: false,
    researchAssistantChatbot: false,
    xmlMappingAssistant: false,
    schemaDesignAgent: false,
    workflowGenerationAgent: false,
    relationshipRecommendation: false,
    nodePropertySuggestion: false,
    schemaOptimization: false,
    aiAgentsAsTools: false,
    queryAiAgent: false
  }
}

function FeatureToggle({
  label,
  description,
  checked,
  onCheckedChange
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5 flex-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export default function AISettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<ExtendedAISettings>(DEFAULT_AI_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/ai-settings', {
          method: 'GET',
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json() as ExtendedAISettings
          setSettings(data)
        } else {
          console.error('Failed to fetch AI settings')
          setSettings(DEFAULT_AI_SETTINGS)
        }
      } catch (error) {
        console.error('Error fetching AI settings:', error)
        setSettings(DEFAULT_AI_SETTINGS)
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchSettings()
    }
  }, [status])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/ai-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('AI settings saved successfully')
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to save settings' }))
        throw new Error(error.error || 'Failed to save settings')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save AI settings')
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (updates: Partial<ExtendedAISettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
      features: {
        ...prev.features,
        ...updates.features
      },
      model: {
        ...prev.model,
        ...updates.model
      }
    }))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (status === 'authenticated' && !isAdmin) {
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
              onClick={() => router.push('/dashboard/settings')}
              className="h-7 text-xs hover:bg-muted/40"
            >
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Back to Settings
            </Button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="relative">
                  AI Settings
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent"></span>
                </span>
              </h1>
              <p className="text-xs mt-1.5 text-muted-foreground/70">
                Configure AI features and model settings for the Model Builder
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-border/20 bg-muted/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm">AI Configuration</CardTitle>
          <CardDescription className="text-xs">
            Manage AI features, model providers, and individual feature toggles. Settings are saved to your account and sync across devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-enabled">Enable AI Features</Label>
                  <p className="text-sm text-muted-foreground">
                    Master toggle for all AI features
                  </p>
                </div>
                <Switch
                  id="ai-enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => {
                    updateSettings({ enabled: checked })
                    if (checked && !settings.features.enabled) {
                      updateSettings({ features: { ...settings.features, enabled: true } })
                    }
                  }}
                />
              </div>

              {settings.enabled && (
                <>
                  <div className="border-t pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Model Provider</Label>
                      <Select
                        value={settings.model.provider}
                        onValueChange={(value) =>
                          updateSettings({
                            model: { ...settings.model, provider: value as AIModelProvider }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                          <SelectItem value="mistral">Mistral AI</SelectItem>
                          <SelectItem value="ollama">Ollama (Local)</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Select
                        value={settings.model.modelName}
                        onValueChange={(value) =>
                          updateSettings({
                            model: { ...settings.model, modelName: value as AIModelName }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {settings.model.provider === 'openai' && (
                            <>
                              <SelectItem value="gpt-4">GPT-4</SelectItem>
                              <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            </>
                          )}
                          {settings.model.provider === 'anthropic' && (
                            <>
                              <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                              <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                              <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                            </>
                          )}
                          {settings.model.provider === 'mistral' && (
                            <>
                              <SelectItem value="mistral-large-latest">Mistral Large (Latest)</SelectItem>
                              <SelectItem value="mistral-medium-latest">Mistral Medium (Latest)</SelectItem>
                              <SelectItem value="mistral-small-latest">Mistral Small (Latest)</SelectItem>
                              <SelectItem value="mistral-tiny">Mistral Tiny</SelectItem>
                              <SelectItem value="mistral-7b-instruct">Mistral 7B Instruct</SelectItem>
                              <SelectItem value="mistral-7b-instruct-v0.1">Mistral 7B Instruct v0.1</SelectItem>
                              <SelectItem value="mistral-7b-instruct-v0.2">Mistral 7B Instruct v0.2</SelectItem>
                              <SelectItem value="mistral-7b-instruct-v0.3">Mistral 7B Instruct v0.3</SelectItem>
                              <SelectItem value="mixtral-8x7b-instruct">Mixtral 8x7B Instruct</SelectItem>
                            </>
                          )}
                          {settings.model.provider === 'ollama' && (
                            <>
                              <SelectItem value="llama2">Llama 2</SelectItem>
                              <SelectItem value="mistral">Mistral</SelectItem>
                            </>
                          )}
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key {settings.model.provider === 'ollama' ? '(Optional)' : ''}</Label>
                      <Input
                        id="api-key"
                        type="password"
                        placeholder={
                          settings.model.provider === 'ollama'
                            ? 'Leave empty for local Ollama'
                            : 'Enter your API key'
                        }
                        value={settings.model.apiKey || ''}
                        onChange={(e) =>
                          updateSettings({
                            model: { ...settings.model, apiKey: e.target.value || undefined }
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {settings.model.provider === 'ollama'
                          ? 'Ollama runs locally and may not require an API key'
                          : 'Your API key is stored securely and never exposed'}
                      </p>
                    </div>

                    {settings.model.provider === 'custom' && (
                      <div className="space-y-2">
                        <Label htmlFor="base-url">Base URL</Label>
                        <Input
                          id="base-url"
                          placeholder="https://api.example.com/v1"
                          value={settings.model.baseUrl || ''}
                          onChange={(e) =>
                            updateSettings({
                              model: { ...settings.model, baseUrl: e.target.value || undefined }
                            })
                          }
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={settings.model.temperature || 0.7}
                        onChange={(e) =>
                          updateSettings({
                            model: {
                              ...settings.model,
                              temperature: parseFloat(e.target.value) || 0.7
                            }
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Controls randomness (0 = deterministic, 2 = very creative)
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Individual Features</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable specific AI features
                        </p>
                      </div>
                      {/* Global features enabled toggle - handled by parent enabled now? 
                          Actually user said "individual features that only include enable/disable the query ai agent"
                          So maybe we don't need a master "features.enabled" toggle anymore?
                          The original code had `settings.features.enabled`. 
                          Let's keep it simplest: Just show the Query AI Agent toggle.
                          If we want to respect the user's "Individual Features" list literally, 
                          we might want to remove the "Individual Features" header toggle if it's redundant.
                          However, existing structure assumes `features: { enabled: boolean, ... }`.
                          I will keep the master toggle for now as it wraps the section.
                      */}
                      <Switch
                        checked={settings.features.enabled}
                        onCheckedChange={(checked) =>
                          updateSettings({
                            features: { ...settings.features, enabled: checked }
                          })
                        }
                      />
                    </div>

                    {settings.features.enabled && (
                      <div className="space-y-3 pl-4">
                        <FeatureToggle
                          label="Query AI Agent"
                          description="Enable the AI Chat Agent in the Query View for natural language querying"
                          checked={settings.features.queryAiAgent || false}
                          onCheckedChange={(checked) =>
                            updateSettings({
                              features: { ...settings.features, queryAiAgent: checked }
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
