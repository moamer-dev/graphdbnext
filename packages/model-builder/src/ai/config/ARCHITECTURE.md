# AI Settings Architecture

## Overview

The AI settings system is designed with **dependency injection** to work both standalone and integrated with parent apps. It provides a clean separation between the model-builder package and any database or storage system.

## Design Principles

1. **No Database Dependency**: The package never directly accesses a database
2. **Storage Abstraction**: Storage is injected via an interface
3. **Standalone Ready**: Works out-of-the-box with localStorage
4. **Type Safe**: Full TypeScript support
5. **User-Specific**: Parent apps can provide user-specific storage

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Parent App                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AISettingsProvider                            │  │
│  │  (Injects storage implementation)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Model Builder Package                    │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │     AISettingsContext                        │   │  │
│  │  │  - Manages settings state                    │   │  │
│  │  │  - Provides hooks (useAISettings, etc.)      │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                          │                            │  │
│  │                          ▼                            │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │     AISettingsStorage Interface              │   │  │
│  │  │  - getSettings()                             │   │  │
│  │  │  - saveSettings()                            │   │  │
│  │  │  - clearSettings()                           │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                          ▲                            │  │
│  │                          │                            │  │
│  └──────────────────────────┼────────────────────────────┘  │
│                             │                                │
│                             │                                │
│       ┌─────────────────────┴─────────────────────┐          │
│       │                                            │          │
│  ┌────▼─────┐                          ┌─────────▼────┐     │
│  │          │                          │              │     │
│  │Database  │                          │  localStorage│     │
│  │Storage   │                          │  (Default)   │     │
│  │(Custom)  │                          │              │     │
│  └──────────┘                          └──────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Components

### 1. AISettingsStorage Interface

Defines the contract for storage implementations:

```typescript
interface AISettingsStorage {
  getSettings(): Promise<AISettings>
  saveSettings(settings: AISettings): Promise<void>
  clearSettings(): Promise<void>
}
```

### 2. Storage Implementations

#### LocalStorageAISettings (Default)
- Stores settings in browser localStorage
- Used when no storage is provided
- Works standalone

#### MemoryAISettings
- In-memory storage
- Useful for testing
- Lost on page refresh

#### Custom Storage (Parent App)
- Implements `AISettingsStorage`
- Can store in database, API, etc.
- User-specific or global

### 3. AISettingsProvider

React context provider that:
- Accepts optional `storage` prop
- Accepts optional `initialSettings` prop
- Manages settings state
- Provides context to children

### 4. Hooks

#### `useAISettings()`
Returns:
- `settings`: Current settings object
- `updateSettings()`: Update settings (saves to storage)
- `isFeatureEnabled()`: Check if a feature is enabled
- `reloadSettings()`: Reload from storage
- `isReady`: Whether settings have been loaded

#### `useAIFeature(feature)`
Convenience hook to check if a specific feature is enabled.

## Data Flow

### Loading Settings

```
Component uses useAISettings()
         │
         ▼
AISettingsContext
         │
         ▼
storage.getSettings()
         │
         ▼
  [Database/API/localStorage]
         │
         ▼
  Returns AISettings
         │
         ▼
  Updates context state
         │
         ▼
  Component receives settings
```

### Saving Settings

```
User updates settings via UI
         │
         ▼
Component calls updateSettings()
         │
         ▼
AISettingsContext
         │
         ▼
storage.saveSettings(settings)
         │
         ▼
  [Database/API/localStorage]
         │
         ▼
  Settings persisted
         │
         ▼
  Context state updated
         │
         ▼
  UI updates
```

## Usage Patterns

### Pattern 1: Standalone (localStorage)

```tsx
<AISettingsProvider>
  <ModelBuilder />
</AISettingsProvider>
```

### Pattern 2: Custom Storage

```tsx
const storage = new DatabaseAISettings(userId)

<AISettingsProvider storage={storage}>
  <ModelBuilder />
</AISettingsProvider>
```

### Pattern 3: With Initial Settings

```tsx
<AISettingsProvider 
  storage={storage}
  initialSettings={{
    enabled: true,
    model: { provider: 'openai', modelName: 'gpt-4' }
  }}
>
  <ModelBuilder />
</AISettingsProvider>
```

## Feature Gating

All AI features check settings before enabling:

```tsx
function AIChatbot() {
  const isEnabled = useAIFeature('researchAssistantChatbot')
  
  if (!isEnabled) {
    return null // Feature is disabled
  }
  
  return <ChatbotUI />
}
```

This ensures:
- Features respect user preferences
- Features respect master toggles
- Features can be disabled without code changes

## Benefits

1. **Separation of Concerns**: Package doesn't know about databases
2. **Flexibility**: Parent apps choose storage mechanism
3. **Testability**: Easy to test with MemoryAISettings
4. **User-Specific**: Each user can have their own settings
5. **Type Safety**: Full TypeScript support
6. **Backward Compatible**: Works without any configuration

## Security Considerations

### API Keys

**Option 1: User Provides Keys**
- Store in settings (encrypted in database)
- User manages their own keys
- No costs to your app

**Option 2: App Provides Keys**
- Keys stored server-side only
- Never exposed to client
- Pass through secure API proxy
- Your app incurs costs

### Recommendations

- Encrypt API keys in database
- Use environment variables for default keys (if any)
- Provide clear UI for key management
- Support key rotation

## Migration Path

If you have existing settings:

1. Create adapter implementing `AISettingsStorage`
2. Transform old format to new format in `getSettings()`
3. Save in new format in `saveSettings()`
4. Gradually migrate users

```tsx
class MigratedAISettings implements AISettingsStorage {
  async getSettings(): Promise<AISettings> {
    const old = await getOldSettings()
    return transformToNewFormat(old)
  }
  
  async saveSettings(settings: AISettings): Promise<void> {
    await saveNewFormat(settings)
    // Optionally: keep old format in sync
  }
}
```

## Future Enhancements

1. **Settings Sync**: Real-time sync across tabs/devices
2. **Settings Templates**: Pre-configured settings for different use cases
3. **Settings Sharing**: Share settings between users/organizations
4. **Settings Versioning**: Track settings changes over time
5. **Settings Validation**: Validate settings before saving

