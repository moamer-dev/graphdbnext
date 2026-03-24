# Developer Guide: Tools and Actions Registry

This guide explains how to add, register, and modify Tools and Actions in the Model Builder. The system uses a centralized **Workflow Registry** as the single source of truth for both the UI palette and the execution configuration.

---

## Architecture Overview

1.  **Centralized Registry (`src/registry/workflowRegistry.ts`)**: Manages all tools, actions, and categories.
2.  **Registry Definitions (`src/registry/tools/definitions.ts` & `src/registry/actions/definitions.ts`)**: Defines metadata, configuration schemas, and default states.
3.  **Dynamic Palette (`src/components/palette/...`)**: Automatically generates the sidebar sections based on registered items.
4.  **Dynamic Forms (`src/components/shared/SchemaForm.tsx`)**: Renders the configuration UI based on the registry's `configSchema`.

---

## How to Add a New Action

### Step 1: Register the Action Definition
Open `packages/model-builder/src/registry/actions/definitions.ts` and use the `registerAction` helper. This single call now handles both the palette appearance and the sidebar configuration.

```typescript
registerAction({
  id: 'action:slack-notify', // Unique ID used by the executor
  metadata: {
    label: 'Notify Slack',
    description: 'Send a notification to a Slack channel',
    icon: MessageSquare,
    category: 'Node Actions', // Must match a registered category ID
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    order: 1,      // Position in the palette (lower is first)
    hidden: false  // Set to true to hide from the palette
  },
  configSchema: [
    { name: 'channelId', label: 'Channel ID', type: 'text', placeholder: 'e.g. C12345' },
    { name: 'message', label: 'Message Template', type: 'text' },
    { name: 'isUrgent', label: 'Mark as Urgent', type: 'boolean', defaultValue: false }
  ],
  defaultConfig: { channelId: '', message: '', isUrgent: false }
})
```

### Step 2: Implement Execution Logic
Once your executor function is implemented in `src/services/workflowExecutor/actions/`, import it into `src/registry/actions/definitions.ts` and add it to the `executor` property of your definition:

```typescript
registerAction({
  id: 'action:slack-notify',
  // ... metadata ...
  executor: executeSlackNotifyAction, 
  configSchema: [ ... ]
})
```

---

## How to Add a New Tool

### Step 1: Register the Tool Definition
Open `packages/model-builder/src/registry/tools/definitions.ts` and use the `registerTool` helper.

```typescript
registerTool({
  id: 'tool:custom-processor',
  // ... metadata ...
  executor: executeCustomProcessorTool,
  configSchema: [
    { name: 'script', label: 'JavaScript Code', type: 'text' }
  ],
  defaultConfig: { script: '' }
})
```

### Step 2: Implement Execution Logic
Similar to actions, implement your executor in `src/services/workflowExecutor/tools/` and register it in `src/registry/tools/definitions.ts`.

---

## Managing Categories

Categories define how items are grouped in the palette. Categories must be registered with their own metadata (icon, color, order).

```typescript
// Example from definitions.ts
workflowRegistry.registerActionCategory({ 
  id: 'node_actions', 
  label: 'Node Actions', 
  icon: Boxes, 
  color: 'text-blue-600', 
  bgColor: 'bg-blue-100',
  order: 1 
})
```

---

## How to Edit Existing Tools/Actions

1.  **Visuals/Ordering**: Modify the `metadata` (label, icon, colors, `order`, `hidden`) in the corresponding `definitions.ts` file.
2.  **Fields**: Add or remove items from the `configSchema` array.
3.  **Default State**: Update `defaultConfig` to change initial values for new nodes.

---

## Understanding `configSchema`

The `configSchema` is an array of `ConfigField` objects.

### Supported Field Types
- `text`: Standard text input.
- `number`: Numeric input.
- `boolean`: Checkbox/Toggle.
- `select`: Dropdown (requires an `options` array).
- `properties`: Key-Value pair list.
- `mappings`: Advanced source-to-target attribute mapping.
- `separator`: Renders a horizontal divider.

### Field Attributes
- `name`: The key in the configuration object.
- `label`: Display name in the UI.
- `dependsOn`: Name of another field this field depends on.
- `dependsOnValue`: Value the parent field must have for this field to show.

---

## Adding a New Field Type

To support a new type of configuration field (e.g., a color picker, a code editor, or a date range):

### Step 1: Update the Type Definition
Add the new type to the `FieldType` union in `packages/model-builder/src/registry/types.ts`.

```typescript
export type FieldType = 
  | 'text' 
  // ... other types ...
  | 'new-field-type' // Add yours here
```

### Step 2: Handle UI Rendering
Add a new `case` block in the `renderField` function within `packages/model-builder/src/components/shared/SchemaForm.tsx`. Use standard UI components and call the `onChange` prop to update the state.

```tsx
// Example in SchemaForm.tsx
case 'new-field-type':
  return (
    <div key={field.name} className="space-y-2">
      <Label className="text-xs font-medium">{field.label}</Label>
      <YourComponent 
        value={value || field.defaultValue}
        onChange={(val) => onChange(field.name, val)}
      />
    </div>
  )
```

### Step 3: Utilize in Definitions
You can now use your new field type in any tool or action:

```typescript
configSchema: [
  { name: 'mySetting', label: 'My Setting', type: 'new-field-type' }
]
```

---

## Registration Workflow Checklist

- [ ] Add definition to `registry/actions/definitions.ts` OR `registry/tools/definitions.ts`.
- [ ] Define `metadata` (including `order` and `category`).
- [ ] Define `configSchema` fields.
- [ ] Implement execution logic in `src/services/workflowExecutor/`.
- [ ] Verify item appears correctly in the palette.
