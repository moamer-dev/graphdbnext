export type AIModelProvider = 'openai' | 'anthropic' | 'mistral' | 'ollama' | 'custom'

export type AIModelName =
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku'
  | 'mistral-large-latest'
  | 'mistral-medium-latest'
  | 'mistral-small-latest'
  | 'mistral-tiny'
  | 'mistral-7b-instruct'
  | 'mixtral-8x7b-instruct'
  | 'mistral-7b-instruct-v0.1'
  | 'mistral-7b-instruct-v0.2'
  | 'mistral-7b-instruct-v0.3'
  | 'llama2'
  | 'mistral'
  | 'custom'

export interface AIModelConfig {
  provider: AIModelProvider
  modelName: AIModelName
  apiKey?: string
  baseUrl?: string
  temperature?: number
  maxTokens?: number
  customConfig?: Record<string, unknown>
}

export interface AISettingsStorage {
  getSettings(): Promise<AISettings>
  saveSettings(settings: AISettings): Promise<void>
  clearSettings(): Promise<void>
}

export interface AIFeatureFlags {
  enabled: boolean
  researchAssistantChatbot: boolean
  xmlMappingAssistant: boolean
  schemaDesignAgent: boolean
  workflowGenerationAgent: boolean
  relationshipRecommendation: boolean
  nodePropertySuggestion: boolean
  schemaOptimization: boolean
  aiAgentsAsTools: boolean
  semanticEnrichment: boolean
}

export interface AISettings {
  enabled: boolean
  model: AIModelConfig
  features: AIFeatureFlags
  storageKey?: string
}

export const DEFAULT_AI_SETTINGS: AISettings = {
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
    semanticEnrichment: false
  }
}

