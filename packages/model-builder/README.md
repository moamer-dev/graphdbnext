# @graphdb/model-builder

A professional, self-contained React package for designing graph schemas, mapping complex XML data to graph structures, and orchestrating data transformation workflows.

## 🌟 Overview

The `model-builder` package is the core engine of the GraphDBNext model designer. It provides a visual interface for:
1.  **Schema Design**: Creating nodes, relationships, and groups.
2.  **Semantic Enrichment**: Mapping graph elements to ontologies and CURIEs/IRIs.
3.  **Workflow Orchestration**: Configuring "Tools" and "Actions" to transform XML data into graph nodes.
4.  **Data Ingestion**: Executing workflows against XML files to generate graph previews and push to databases.

---

## 📦 Installation

This package is designed for the GraphDBNext ecosystem but is fully portable and can be used in any React application.

### Prerequisites
Ensure your project has the following peer dependencies:
- **React** >= 18.0.0
- **Lucide-react** (for icons)
- **Zustand** (for state management)
- **Tailwind CSS** (for styling)

---

## 🚀 Usage Pattern: The Adapter

The `ModelBuilder` is designed as a self-contained component. To successfully integrate it into your application, you should implement an **Adapter Pattern**. 

> [!NOTE]
> The `useModelBuilderAdapter` hook mentioned in our examples is **not exported** from the package. It is a custom implementation pattern specific to your parent application (e.g., `lib/adapters/useModelBuilderAdapter.ts`) used to bridge the builder's generic state with your app-specific APIs.

### 1. Implement your Adapter Hook
Create a hook to handle the communication between your database and the builder.

```typescript
// lib/adapters/useModelBuilderAdapter.ts
import { useState, useMemo } from 'react';
import type { AISettings, WorkflowPersistence } from '@graphdb/model-builder';

export function useModelBuilderAdapter({ model }) {
  // 1. Fetch AI Settings from your API
  // 2. Implement the persistence interface (onSaveWorkflow, onLoadWorkflows, etc.)
  // 3. Orchestrate model save logic
  return { 
    aiSettings, 
    effectivePersistence, 
    handleSaveModel,
    // ...
  };
}
```

### 2. Wrap the Builder
Use the hook in your adapter component.

```tsx
import { ModelBuilder, AISettingsProvider } from '@graphdb/model-builder';
import '@graphdb/model-builder/dist/index.css';
import { useModelBuilderAdapter } from './useModelBuilderAdapter';

export function ModelBuilderAdapter({ model }) {
  const state = useModelBuilderAdapter({ model });

  return (
    <AISettingsProvider settings={state.aiSettings}>
      <ModelBuilder
        initialWorkflow={state.currentWorkflow}
        workflowPersistence={state.effectivePersistence}
        onSaveModel={state.handleSaveModel}
        isNewModel={model.id === 'new'}
      />
    </AISettingsProvider>
  );
}
```

---

## 🤖 AI Configuration

The `model-builder` features several AI-driven agents. Configuration is handled via the `AISettingsProvider`. For persistent, user-specific configurations, it is recommended to fetch these settings from your application's database via an API endpoint.

### 1. Fetch Settings from API
In your adapter hook, fetch the settings (e.g., from `/api/ai-settings`):

```typescript
// lib/adapters/useModelBuilderAdapter.ts
import { useState, useEffect } from 'react';
import type { AISettings } from '@graphdb/model-builder';

export function useModelBuilderAdapter() {
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);

  useEffect(() => {
    fetch('/api/ai-settings')
      .then(res => res.json())
      .then(data => setAiSettings(data));
  }, []);

  return { aiSettings, ... };
}
```

### 2. AISettings Structure
The settings fetched from your API should match this schema:

```typescript
{
  enabled: boolean;          // Global toggle
  model: {
    provider: string;        // 'openai', 'anthropic', 'ollama', etc.
    modelName: string;
    temperature: number;
    maxTokens: number;
    apiKey?: string;
  };
  features: {
    enabled: boolean;        // Sub-features toggle
    researchAssistantChatbot: boolean;
    xmlMappingAssistant: boolean;
    schemaDesignAgent: boolean;
    workflowGenerationAgent: boolean;
    relationshipRecommendation: boolean;
    nodePropertySuggestion: boolean;
    schemaOptimization: boolean;
    aiAgentsAsTools: boolean;
    semanticEnrichment: boolean;
  }
}
```

### 3. Apply Settings in your Adapter
```tsx
<AISettingsProvider settings={aiSettings}>
  <ModelBuilder />
</AISettingsProvider>
```

---

## 💾 Workflow Persistence

The package handles the internal UI for saving and switching workflows, but it requires the parent app to provide the "Storage" layer via the `workflowPersistence` prop.

| Property | Type | Description |
| :--- | :--- | :--- |
| `onSaveWorkflow` | `(wf) => Promise<{id}>` | Called when creating a new workflow. |
| `onUpdateWorkflow` | `(id, wf) => Promise<void>` | Called when updating an existing workflow. |
| `onLoadWorkflows` | `(modelId) => Promise<wf[]>` | Fetches the list of workflows for the current model. |
| `onLoadWorkflow` | `(id) => Promise<wf>` | Fetches the full configuration for a specific workflow. |

---

## 🔧 Ref API

To interact with the builder programmatically, use the `ModelBuilderRef` interface.

```typescript
export interface ModelBuilderRef {
  exportData: () => { schemaJson: any; schemaMd: string };
  triggerSave: () => void;           // Orchestrates workflow + model save
  loadData: (data: any) => void;     // Handles JSON or Markdown schema formats
  clear: () => void;
  clearWorkflow: () => void;
  getWorkflowConfig: () => any;      // Returns current WorkflowConfigExport
  hasChanges: () => boolean;         // Checks both schema and workflow changes
}
```

---

## 🎨 Styling

The package uses **Tailwind CSS**. Ensure your parent app's Tailwind configuration includes the package's `src` directory to ensure all styles are rendered correctly:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@graphdb/model-builder/src/**/*.{js,ts,jsx,tsx}",
  ],
}
```

---

## 📄 License
Private / Proprietary - Subconscious University.
