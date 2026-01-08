import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatMistralAI } from '@langchain/mistralai'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { AIModelConfig } from '../config/types'

/**
 * Creates a LangChain chat model based on the AI model configuration
 */
export function createChatModel(config: AIModelConfig): BaseChatModel {
  // Validate API key for providers that require it (except ollama)
  if (config.provider !== 'ollama' && (!config.apiKey || config.apiKey.trim() === '')) {
    throw new Error(`API key is required for ${config.provider} provider. Please configure it in AI settings.`)
  }

  const modelOptions = {
    temperature: config.temperature ?? 0.7,
    maxTokens: config.maxTokens ?? 4000,
    timeout: 30000, // 30 second timeout
    ...config.customConfig,
  }

  switch (config.provider) {
    case 'openai': {
      const modelName = getOpenAIModelName(config.modelName)
      return new ChatOpenAI({
        modelName,
        apiKey: config.apiKey || undefined,
        configuration: config.baseUrl ? { baseURL: config.baseUrl } : undefined,
        temperature: modelOptions.temperature,
        maxTokens: modelOptions.maxTokens,
        timeout: modelOptions.timeout,
      })
    }

    case 'anthropic': {
      const modelName = getAnthropicModelName(config.modelName)
      return new ChatAnthropic({
        model: modelName,
        apiKey: config.apiKey || undefined,
        temperature: modelOptions.temperature,
        maxTokens: modelOptions.maxTokens,
        // Note: Anthropic doesn't support timeout in constructor
      })
    }

    case 'mistral': {
      const modelName = getMistralModelName(config.modelName)
      return new ChatMistralAI({
        model: modelName,
        apiKey: config.apiKey || undefined,
        temperature: modelOptions.temperature,
        maxTokens: modelOptions.maxTokens,
        // Note: Mistral doesn't support timeout in constructor
      })
    }

    case 'ollama': {
      return new ChatOpenAI({
        modelName: config.modelName === 'llama2' ? 'llama2' : config.modelName === 'mistral' ? 'mistral' : 'llama2',
        apiKey: config.apiKey || 'ollama', // Ollama doesn't require a real API key
        configuration: { baseURL: config.baseUrl || 'http://localhost:11434/v1' },
        temperature: modelOptions.temperature,
        maxTokens: modelOptions.maxTokens,
        timeout: modelOptions.timeout,
      })
    }

    case 'custom': {
      if (!config.baseUrl) {
        throw new Error('Custom provider requires a baseUrl')
      }
      return new ChatOpenAI({
        modelName: config.modelName === 'custom' ? 'gpt-4' : config.modelName,
        apiKey: config.apiKey || undefined,
        configuration: config.baseUrl ? { baseURL: config.baseUrl } : undefined,
        temperature: modelOptions.temperature,
        maxTokens: modelOptions.maxTokens,
        timeout: modelOptions.timeout,
      })
    }

    default:
      throw new Error(`Unsupported provider: ${config.provider}`)
  }
}

function getOpenAIModelName(modelName: string): string {
  const mapping: Record<string, string> = {
    'gpt-4': 'gpt-4',
    'gpt-4-turbo': 'gpt-4-turbo-preview',
    'gpt-3.5-turbo': 'gpt-3.5-turbo',
  }
  return mapping[modelName] || 'gpt-4-turbo-preview'
}

function getAnthropicModelName(modelName: string): string {
  const mapping: Record<string, string> = {
    'claude-3-opus': 'claude-3-opus-20240229',
    'claude-3-sonnet': 'claude-3-sonnet-20240229',
    'claude-3-haiku': 'claude-3-haiku-20240307',
  }
  return mapping[modelName] || 'claude-3-sonnet-20240229'
}

function getMistralModelName(modelName: string): string {
  const mapping: Record<string, string> = {
    'mistral-large-latest': 'mistral-large-latest',
    'mistral-medium-latest': 'mistral-medium-latest',
    'mistral-small-latest': 'mistral-small-latest',
    'mistral-tiny': 'mistral-tiny',
    'mistral-7b-instruct': 'mistral-7b-instruct',
    'mistral-7b-instruct-v0.1': 'mistral-7b-instruct-v0.1',
    'mistral-7b-instruct-v0.2': 'mistral-7b-instruct-v0.2',
    'mistral-7b-instruct-v0.3': 'mistral-7b-instruct-v0.3',
    'mixtral-8x7b-instruct': 'mixtral-8x7b-instruct',
  }
  return mapping[modelName] || 'mistral-medium-latest'
}

