# AI Settings Integration Guide

This guide shows how to integrate the AI settings system into your application, allowing users to configure AI features while maintaining separation from the main app's database.

## Overview

The AI settings system uses a **dependency injection pattern** that allows:
- **Standalone use**: Works out-of-the-box with localStorage
- **Parent app integration**: Parent apps can provide custom storage (database, API, etc.)
- **User-specific settings**: Each user can have their own settings
- **Feature flags**: Individual AI features can be enabled/disabled

## Quick Start

### 1. Wrap ModelBuilder with AISettingsProvider

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

That's it! The AI settings will now be stored in localStorage by default.

### 2. Add AI Settings Button to UI

The `AISettingsPanel` component provides a complete settings UI. Add it to your toolbar:

```tsx
import { AISettingsPanel } from '@graphdb/model-builder'

function MyToolbar() {
  return (
    <div className="toolbar">
      {/* Other buttons */}
      <AISettingsPanel />
    </div>
  )
}
```

## Advanced Integration

### Custom Storage with Database

For parent apps that want to store settings in their database:

#### Step 1: Create a Storage Implementation

```tsx
// lib/ai/ApiAISettings.ts
import type { AISettingsStorage, AISettings } from '@graphdb/model-builder'

export class ApiAISettings implements AISettingsStorage {
  constructor(private userId: string, private baseUrl: string = '/api') {}

  async getSettings(): Promise<AISettings> {
    const response = await fetch(`${this.baseUrl}/ai-settings`)
    if (!response.ok) {
      // Return defaults if settings don't exist
      return DEFAULT_AI_SETTINGS
    }
    return response.json()
  }

  async saveSettings(settings: AISettings): Promise<void> {
    const response = await fetch(`${this.baseUrl}/ai-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    if (!response.ok) {
      throw new Error('Failed to save AI settings')
    }
  }

  async clearSettings(): Promise<void> {
    await fetch(`${this.baseUrl}/ai-settings`, {
      method: 'DELETE'
    })
  }
}
```

#### Step 2: Create API Routes

```tsx
// app/api/ai-settings/route.ts (Next.js)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_AI_SETTINGS } from '@graphdb/model-builder'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userSettings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
    select: { aiSettings: true }
  })

  return NextResponse.json(
    userSettings?.aiSettings || DEFAULT_AI_SETTINGS
  )
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await req.json()

  await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      aiSettings: settings
    },
    update: {
      aiSettings: settings
    }
  })

  return NextResponse.json({ success: true })
}
```

#### Step 3: Use Custom Storage

```tsx
import { AISettingsProvider, ModelBuilder } from '@graphdb/model-builder'
import { ApiAISettings } from '@/lib/ai/ApiAISettings'
import { useSession } from 'next-auth/react'

function App() {
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

### Database Schema (Example)

If using Prisma:

```prisma
model UserSettings {
  id         String   @id @default(cuid())
  userId     String   @unique
  aiSettings Json?    // Stores AISettings object
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Using Settings in Components

### Check if Feature is Enabled

```tsx
import { useAIFeature } from '@graphdb/model-builder'

function MyComponent() {
  const isChatbotEnabled = useAIFeature('researchAssistantChatbot')
  
  if (!isChatbotEnabled) {
    return null // Don't render AI features if disabled
  }
  
  return <AIChatbot />
}
```

### Access Full Settings

```tsx
import { useAISettings } from '@graphdb/model-builder'

function MyComponent() {
  const { settings, updateSettings } = useAISettings()
  
  const handleModelChange = async (model: string) => {
    await updateSettings({
      model: {
        ...settings.model,
        modelName: model
      }
    })
  }
  
  return (
    <select value={settings.model.modelName} onChange={(e) => handleModelChange(e.target.value)}>
      <option value="gpt-4">GPT-4</option>
      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
    </select>
  )
}
```

## Initial Settings

You can provide initial settings when the provider mounts:

```tsx
import { AISettingsProvider } from '@graphdb/model-builder'

function App() {
  const initialSettings = {
    enabled: true,
    model: {
      provider: 'openai',
      modelName: 'gpt-4-turbo',
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY // From environment
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

**Note**: Initial settings are merged with stored settings (stored settings take precedence).

## Settings Structure

```typescript
interface AISettings {
  enabled: boolean                    // Master toggle for all AI features
  model: {
    provider: 'openai' | 'anthropic' | 'ollama' | 'custom'
    modelName: string                 // e.g., 'gpt-4', 'claude-3-opus'
    apiKey?: string                   // Optional, can be provided by parent app
    baseUrl?: string                  // For custom providers
    temperature?: number              // 0-2, default 0.7
    maxTokens?: number               // Default 4000
    customConfig?: Record<string, unknown>
  }
  features: {
    enabled: boolean                 // Master toggle for individual features
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

## Best Practices

### 1. API Key Management

**Option A: User provides their own key**
- Store in settings (encrypted in database)
- User manages their own keys
- No costs to your app

**Option B: App provides keys**
- Store keys server-side only
- Never expose to client
- Pass through secure API proxy

```tsx
// Option B: Secure proxy approach
class ProxyAISettings implements AISettingsStorage {
  // Settings don't include API key
  // API calls go through your backend which has the key
}
```

### 2. User-Specific Settings

Always scope settings to the current user:

```tsx
const storage = new ApiAISettings(currentUserId)
```

### 3. Default Settings

Use `DEFAULT_AI_SETTINGS` as a fallback:

```tsx
import { DEFAULT_AI_SETTINGS } from '@graphdb/model-builder'

const settings = await storage.getSettings() || DEFAULT_AI_SETTINGS
```

### 4. Error Handling

Handle storage errors gracefully:

```tsx
try {
  await updateSettings(newSettings)
} catch (error) {
  console.error('Failed to save settings:', error)
  // Show user-friendly error message
  toast.error('Failed to save AI settings')
}
```

## Testing

For testing, use `MemoryAISettings`:

```tsx
import { AISettingsProvider, MemoryAISettings } from '@graphdb/model-builder'

test('MyComponent with AI settings', () => {
  const storage = new MemoryAISettings()
  
  render(
    <AISettingsProvider storage={storage}>
      <MyComponent />
    </AISettingsProvider>
  )
  
  // Test with different settings
  storage.saveSettings({
    ...DEFAULT_AI_SETTINGS,
    enabled: true
  })
})
```

## Migration Guide

If you already have AI settings stored elsewhere:

```tsx
class MigratedAISettings implements AISettingsStorage {
  async getSettings(): Promise<AISettings> {
    // Fetch from old storage
    const oldSettings = await fetchOldSettings()
    
    // Transform to new format
    return transformToNewFormat(oldSettings)
  }
  
  async saveSettings(settings: AISettings): Promise<void> {
    // Save to new storage
    await saveToNewStorage(settings)
    
    // Optionally: migrate old settings to new format
  }
}
```

## Troubleshooting

### Settings not persisting

- Check that storage implementation is working
- Verify API routes are accessible
- Check browser console for errors

### Features not enabling

- Ensure `settings.enabled` is `true`
- Ensure `settings.features.enabled` is `true`
- Ensure specific feature flag is `true`

### API key not working

- Verify API key is correct for the selected provider
- Check if API key is being passed correctly
- Ensure API key has required permissions

