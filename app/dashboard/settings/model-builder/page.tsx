'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react'
import type { AISettings } from '@graphdb/model-builder'
import { toast } from 'sonner'

// Define the Extended type to ensure we capture everything
interface ExtendedAISettings extends Omit<AISettings, 'features'> {
    features: AISettings['features'] & {
        queryAiAgent?: boolean
        semanticEnrichment?: boolean
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
        queryAiAgent: false,
        semanticEnrichment: false
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

export default function ModelBuilderSettingsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [settings, setSettings] = useState<ExtendedAISettings>(DEFAULT_AI_SETTINGS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const isAdmin = session?.user?.role === 'ADMIN'

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
                toast.success('Model Builder settings saved successfully')
            } else {
                const error = await response.json().catch(() => ({ error: 'Failed to save settings' }))
                throw new Error(error.error || 'Failed to save settings')
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save settings')
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
                            onClick={() => router.push('/dashboard/settings/modules')}
                            className="h-7 text-xs hover:bg-muted/40"
                        >
                            <ArrowLeft className="h-3 w-3 mr-1.5" />
                            Back to Modules
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                                {/* <Sparkles className="h-4 w-4" /> */}
                                <span className="relative">
                                    Model Builder Settings
                                    <span className="absolute -bottom-1 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent"></span>
                                </span>
                            </h1>
                            <p className="text-xs mt-1.5 text-muted-foreground/70">
                                Configure AI features for the Model Builder package
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="border-border/20 bg-muted/10 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-sm">Package Features</CardTitle>
                    <CardDescription className="text-xs">
                        Enable or disable specific AI capabilities for the Model Builder
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="space-y-4">

                            {/* Note: We rely on the App Settings page for the Master "Enable AI" and "Model Config". 
                    Here we strictly manage the package features. However, checking "checked" statuses still relies on the master switch being potentially on.
                    For clarity, we show the features regardless, or we could warn if AI is disabled globally.
                    Given requirements, we just show the old toggles.
                */}

                            <div className="space-y-3">
                                <FeatureToggle
                                    label="Research Assistant Chatbot"
                                    description="Context-aware chatbot that helps throughout the application"
                                    checked={settings.features.researchAssistantChatbot}
                                    onCheckedChange={(checked) =>
                                        updateSettings({
                                            features: { ...settings.features, researchAssistantChatbot: checked }
                                        })
                                    }
                                />

                                <FeatureToggle
                                    label="XML Mapping Assistant"
                                    description="AI-powered suggestions for XML to graph mappings"
                                    checked={settings.features.xmlMappingAssistant}
                                    onCheckedChange={(checked) =>
                                        updateSettings({
                                            features: { ...settings.features, xmlMappingAssistant: checked }
                                        })
                                    }
                                />

                                <FeatureToggle
                                    label="Schema Design Agent"
                                    description="Generate and optimize graph schemas from descriptions"
                                    checked={settings.features.schemaDesignAgent}
                                    onCheckedChange={(checked) =>
                                        updateSettings({
                                            features: { ...settings.features, schemaDesignAgent: checked }
                                        })
                                    }
                                />

                                <FeatureToggle
                                    label="Workflow Generation"
                                    description="Convert natural language descriptions to executable workflows"
                                    checked={settings.features.workflowGenerationAgent}
                                    onCheckedChange={(checked) =>
                                        updateSettings({
                                            features: { ...settings.features, workflowGenerationAgent: checked }
                                        })
                                    }
                                />

                                <FeatureToggle
                                    label="Relationship Recommendations"
                                    description="AI suggestions for relationships between nodes"
                                    checked={settings.features.relationshipRecommendation}
                                    onCheckedChange={(checked) =>
                                        updateSettings({
                                            features: { ...settings.features, relationshipRecommendation: checked }
                                        })
                                    }
                                />

                                <FeatureToggle
                                    label="Node Property Suggestions"
                                    description="AI-powered property suggestions based on node understanding"
                                    checked={settings.features.nodePropertySuggestion}
                                    onCheckedChange={(checked) =>
                                        updateSettings({
                                            features: { ...settings.features, nodePropertySuggestion: checked }
                                        })
                                    }
                                />

                                <FeatureToggle
                                    label="Schema Optimization"
                                    description="AI-powered schema validation and optimization suggestions"
                                    checked={settings.features.schemaOptimization}
                                    onCheckedChange={(checked) =>
                                        updateSettings({
                                            features: { ...settings.features, schemaOptimization: checked }
                                        })
                                    }
                                />

                                <FeatureToggle
                                    label="AI Agents as Workflow Tools"
                                    description="Use AI agents as executable nodes in workflows"
                                    checked={settings.features.aiAgentsAsTools}
                                    onCheckedChange={(checked) =>
                                        updateSettings({
                                            features: { ...settings.features, aiAgentsAsTools: checked }
                                        })
                                    }
                                />

                                <FeatureToggle
                                    label="Semantic Enrichment"
                                    description="Attach ontology-based semantic metadata to nodes and relationships via TIB API"
                                    checked={settings.features.semanticEnrichment || false}
                                    onCheckedChange={(checked) =>
                                        updateSettings({
                                            features: { ...settings.features, semanticEnrichment: checked }
                                        })
                                    }
                                />
                            </div>
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
