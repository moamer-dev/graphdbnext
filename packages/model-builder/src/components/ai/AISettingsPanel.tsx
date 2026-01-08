'use client'

import React from 'react'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog'
import { Settings, Sparkles } from 'lucide-react'
import { useAISettingsPanel } from '../../hooks'

interface AISettingsPanelProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AISettingsPanel({ open: externalOpen, onOpenChange: externalOnOpenChange }: AISettingsPanelProps = {}) {
  const {
    settings,
    isReady,
    open,
    apiKey,
    setApiKey,
    isControlled,
    handleOpenChange,
    handleSave,
    handleFeatureToggle,
    handleModelChange,
    handleEnableToggle,
    handleFeaturesToggle,
    handleBaseUrlChange,
    handleTemperatureChange
  } = useAISettingsPanel({ open: externalOpen, onOpenChange: externalOnOpenChange })

  if (!isReady) {
    return null
  }

  const dialogContent = (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Settings
          </DialogTitle>
          <DialogDescription>
            Configure AI features and model settings. All AI features are optional and can be enabled individually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
                onCheckedChange={handleEnableToggle}
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
                        handleModelChange(value as any, settings.model.modelName)
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
                        handleModelChange(settings.model.provider, value as any)
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
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {settings.model.provider === 'ollama'
                        ? 'Ollama runs locally and may not require an API key'
                        : 'Your API key is stored locally and never sent to our servers'}
                    </p>
                  </div>

                  {settings.model.provider === 'custom' && (
                    <div className="space-y-2">
                      <Label htmlFor="base-url">Base URL</Label>
                      <Input
                        id="base-url"
                        placeholder="https://api.example.com/v1"
                        value={settings.model.baseUrl || ''}
                        onChange={(e) => handleBaseUrlChange(e.target.value)}
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
                      onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
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
                        Enable specific AI features individually
                      </p>
                    </div>
                    <Switch
                      checked={settings.features.enabled}
                      onCheckedChange={handleFeaturesToggle}
                    />
                  </div>

                  {settings.features.enabled && (
                    <div className="space-y-3 pl-4">
                      <FeatureToggle
                        label="Research Assistant Chatbot"
                        description="Context-aware chatbot that helps throughout the application"
                        checked={settings.features.researchAssistantChatbot}
                        onCheckedChange={(checked) =>
                          handleFeatureToggle('researchAssistantChatbot', checked)
                        }
                      />

                      <FeatureToggle
                        label="XML Mapping Assistant"
                        description="AI-powered suggestions for XML to graph mappings"
                        checked={settings.features.xmlMappingAssistant}
                        onCheckedChange={(checked) =>
                          handleFeatureToggle('xmlMappingAssistant', checked)
                        }
                      />

                      <FeatureToggle
                        label="Schema Design Agent"
                        description="Generate and optimize graph schemas from descriptions"
                        checked={settings.features.schemaDesignAgent}
                        onCheckedChange={(checked) =>
                          handleFeatureToggle('schemaDesignAgent', checked)
                        }
                      />

                      <FeatureToggle
                        label="Workflow Generation"
                        description="Convert natural language descriptions to executable workflows"
                        checked={settings.features.workflowGenerationAgent}
                        onCheckedChange={(checked) =>
                          handleFeatureToggle('workflowGenerationAgent', checked)
                        }
                      />

                      <FeatureToggle
                        label="Relationship Recommendations"
                        description="AI suggestions for relationships between nodes"
                        checked={settings.features.relationshipRecommendation}
                        onCheckedChange={(checked) =>
                          handleFeatureToggle('relationshipRecommendation', checked)
                        }
                      />

                      <FeatureToggle
                        label="Node Property Suggestions"
                        description="AI-powered property suggestions based on node understanding"
                        checked={settings.features.nodePropertySuggestion}
                        onCheckedChange={(checked) =>
                          handleFeatureToggle('nodePropertySuggestion', checked)
                        }
                      />

                      <FeatureToggle
                        label="Schema Optimization"
                        description="AI-powered schema validation and optimization suggestions"
                        checked={settings.features.schemaOptimization}
                        onCheckedChange={(checked) =>
                          handleFeatureToggle('schemaOptimization', checked)
                        }
                      />

                      <FeatureToggle
                        label="AI Agents as Workflow Tools"
                        description="Use AI agents as executable nodes in workflows"
                        checked={settings.features.aiAgentsAsTools}
                        onCheckedChange={(checked) =>
                          handleFeatureToggle('aiAgentsAsTools', checked)
                        }
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
  )

  // If controlled externally, return just the dialog without trigger
  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {dialogContent}
      </Dialog>
    )
  }
  
  // Otherwise, return dialog with trigger button
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          AI Settings
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  )
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

