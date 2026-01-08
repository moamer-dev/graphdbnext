# AI Settings Configuration

This module provides a flexible, dependency-injection-based settings system for AI features in the model-builder package.

## Architecture

The settings system uses a **provider pattern** with **dependency injection** for storage, allowing:
- **Standalone use**: Default localStorage implementation
- **Parent app integration**: Parent apps can provide their own storage implementation (database, API, etc.)

## Usage

### Basic Usage (Standalone)

```tsx
import { AISettingsProvider, ModelBuilder } from '@graphdb/model-builder'

function App() {
  return (
    <AISettingsProvider>
      <ModelBuilder />
    </AISettingsProvider>
  )
}
```

### With Custom Storage (Parent App)

```tsx
import { AISettingsProvider, ModelBuilder } from '@graphdb/model-builder'
import type { AISettingsStorage, AISettings } from '@graphdb/model-builder'

class DatabaseAISettings implements AISettingsStorage {
  async getSettings(): Promise<AISettings> {
    // Fetch from your database
    const response = await fetch('/api/ai-settings')
    return response.json()
  }

  async saveSettings(settings: AISettings): Promise<void> {
    // Save to your database
    await fetch('/api/ai-settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    })
  }

  async clearSettings(): Promise<void> {
    await fetch('/api/ai-settings', { method: 'DELETE' })
  }
}

function App() {
  const storage = new DatabaseAISettings()
  
  return (
    <AISettingsProvider storage={storage}>
      <ModelBuilder />
    </AISettingsProvider>
  )
}
```

### With Initial Settings

```tsx
import { AISettingsProvider } from '@graphdb/model-builder'

function App() {
  const initialSettings = {
    enabled: true,
    model: {
      provider: 'openai',
      modelName: 'gpt-4',
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
    },
    features: {
      enabled: true,
      researchAssistantChatbot: true,
      xmlMappingAssistant: true
    }
  }

  return (
    <AISettingsProvider initialSettings={initialSettings}>
      <ModelBuilder />
    </AISettingsProvider>
  )
}
```

## Using Settings in Components

### Check if a Feature is Enabled

```tsx
import { useAIFeature } from '@graphdb/model-builder'

function MyComponent() {
  const isChatbotEnabled = useAIFeature('researchAssistantChatbot')
  
  if (!isChatbotEnabled) {
    return null
  }
  
  return <AIChatbot />
}
```

### Access Full Settings

```tsx
import { useAISettings } from '@graphdb/model-builder'

function MyComponent() {
  const { settings, updateSettings, isFeatureEnabled } = useAISettings()
  
  const handleToggle = async () => {
    await updateSettings({
      features: {
        ...settings.features,
        xmlMappingAssistant: !settings.features.xmlMappingAssistant
      }
    })
  }
  
  return (
    <button onClick={handleToggle}>
      {isFeatureEnabled('xmlMappingAssistant') ? 'Disable' : 'Enable'} AI Mapping
    </button>
  )
}
```

## Storage Implementations

### LocalStorage (Default)

Used automatically when no storage is provided. Stores settings in browser localStorage.

```tsx
import { LocalStorageAISettings } from '@graphdb/model-builder'

const storage = new LocalStorageAISettings('my-custom-key')
```

### Memory Storage

For testing or temporary storage:

```tsx
import { MemoryAISettings } from '@graphdb/model-builder'

const storage = new MemoryAISettings()
```

### Custom Storage

Implement the `AISettingsStorage` interface:

```tsx
import type { AISettingsStorage, AISettings } from '@graphdb/model-builder'

class MyCustomStorage implements AISettingsStorage {
  async getSettings(): Promise<AISettings> {
    // Your implementation
  }
  
  async saveSettings(settings: AISettings): Promise<void> {
    // Your implementation
  }
  
  async clearSettings(): Promise<void> {
    // Your implementation
  }
}
```

## Settings Structure

```typescript
interface AISettings {
  enabled: boolean                           // Master toggle
  model: {
    provider: 'openai' | 'anthropic' | 'ollama' | 'custom'
    modelName: string
    apiKey?: string
    baseUrl?: string
    temperature?: number
    maxTokens?: number
    customConfig?: Record<string, unknown>
  }
  features: {
    enabled: boolean                         // Features master toggle
    researchAssistantChatbot: boolean
    xmlMappingAssistant: boolean
    schemaDesignAgent: boolean
    workflowGenerationAgent: boolean
    relationshipRecommendation: boolean
    schemaOptimization: boolean
    aiAgentsAsTools: boolean
  }
}
```

## Integration with Main App

### Example: Next.js App with Database

```tsx
// app/components/ModelBuilderWithAI.tsx
'use client'

import { AISettingsProvider, ModelBuilder } from '@graphdb/model-builder'
import type { AISettingsStorage, AISettings } from '@graphdb/model-builder'
import { useSession } from 'next-auth/react'

class ApiAISettings implements AISettingsStorage {
  constructor(private userId: string) {}

  async getSettings(): Promise<AISettings> {
    const res = await fetch(`/api/users/${this.userId}/ai-settings`)
    if (!res.ok) {
      return DEFAULT_AI_SETTINGS
    }
    return res.json()
  }

  async saveSettings(settings: AISettings): Promise<void> {
    await fetch(`/api/users/${this.userId}/ai-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
  }

  async clearSettings(): Promise<void> {
    await fetch(`/api/users/${this.userId}/ai-settings`, {
      method: 'DELETE'
    })
  }
}

export function ModelBuilderWithAI() {
  const { data: session } = useSession()
  const storage = session?.user?.id 
    ? new ApiAISettings(session.user.id)
    : undefined

  return (
    <AISettingsProvider storage={storage}>
      <ModelBuilder />
    </AISettingsProvider>
  )
}
```

### API Route Example

```tsx
// app/api/users/[userId]/ai-settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId: params.userId },
    select: { aiSettings: true }
  })

  return NextResponse.json(settings?.aiSettings || DEFAULT_AI_SETTINGS)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const settings = await req.json()

  await prisma.userSettings.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      aiSettings: settings
    },
    update: {
      aiSettings: settings
    }
  })

  return NextResponse.json({ success: true })
}
```

## Benefits

1. **No Database Dependency**: Package doesn't depend on parent app's database
2. **Flexible Storage**: Parent apps can use any storage mechanism
3. **Standalone Ready**: Works out-of-the-box with localStorage
4. **Type Safe**: Full TypeScript support
5. **Easy Testing**: Memory storage for tests
6. **User-Specific**: Parent apps can provide user-specific storage

