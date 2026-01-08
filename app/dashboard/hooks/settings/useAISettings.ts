
import { useState, useEffect } from 'react'
import type { AISettings } from '@graphdb/model-builder'

// Define the extended type locally for now to match page.tsx
export interface ExtendedAISettings extends Omit<AISettings, 'features'> {
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

export function useAISettings() {
    const [settings, setSettings] = useState<ExtendedAISettings>(DEFAULT_AI_SETTINGS)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/ai-settings')
                if (response.ok) {
                    const data = await response.json()
                    setSettings(data as ExtendedAISettings)
                } else {
                    setError('Failed to fetch AI settings')
                }
            } catch (err) {
                setError('Error fetching AI settings')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [])

    return { settings, loading, error }
}
