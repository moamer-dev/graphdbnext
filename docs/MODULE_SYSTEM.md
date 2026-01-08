# Module System Documentation

## Overview

The application uses a modular architecture that allows optional features (modules) to be enabled or disabled dynamically. This system keeps the core application lightweight while allowing extensibility through pluggable modules.

The **Model Builder** is the first module implemented using this system, allowing users to visually create and edit graph database schemas.

## Quick Start

### For Administrators

1. **Access Settings**: Navigate to `/dashboard/settings`
2. **Manage Modules**: Click "Manage Modules" card
3. **Enable/Disable**: Toggle switches to activate or deactivate modules
4. **Save**: Changes are saved automatically

### For Developers

1. **Check Module Status**: Use `useModelBuilder()` hook
2. **Load Adapter**: Conditionally load adapter based on status
3. **Handle Save**: Implement save callback to persist changes

## Table of Contents

1. [Architecture](#architecture)
2. [Module Registry](#1-module-registry-libmodules)
3. [Adapter Pattern](#2-adapter-pattern-libadapters)
4. [Service Layer](#3-service-layer-libservices)
5. [React Hooks](#4-react-hooks-libhooks)
6. [API Routes](#5-api-routes-appapimodules)
7. [Settings UI](#6-settings-ui-appdashboardsettingsmodules)
8. [Model Edit Integration](#7-model-edit-integration-appdashboardgraphmodelidedit)
9. [Data Flow](#data-flow)
10. [Adding New Modules](#adding-a-new-module)
11. [Settings Pages](#settings-pages-location)
12. [Configuration](#configuration)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)

## Architecture

### 1. Module Registry (`@lib/modules/`)

The module registry is the central system that manages all optional modules.

#### Files:
- **`types.ts`**: Defines the `Module` interface and `ModuleRegistry` interface
- **`registry.ts`**: Implements the in-memory module registry with feature flags

#### Key Concepts:

```typescript
interface Module {
  id: string           // Unique module identifier
  name: string         // Display name
  description: string   // Module description
  enabled: boolean      // Whether module is active
  version?: string      // Module version
}
```

#### Module IDs:
- `MODULE_IDS.MODEL_BUILDER = 'model-builder'`

### 2. Adapter Pattern (`@lib/adapters/`)

Adapters bridge the gap between standalone packages and the main application.

#### ModelBuilderAdapter (`ModelBuilderAdapter.tsx`)

**Purpose**: Wraps the `@graphdb/model-builder` package and connects it to the Model database entity.

**Responsibilities**:
- Loads model data from database (JSON/MD format) into builder state
- Exports builder state back to JSON/MD format for database storage
- Handles save events via custom browser events
- Manages the lifecycle of model data in the builder

**How it works**:
1. Receives a `Model` object from the database
2. Converts schema data (JSON or MD) to builder format using package utilities
3. Loads data into the Zustand store via `loadState()`
4. Listens for save events (`model-builder:save`)
5. Exports current builder state to JSON/MD
6. Calls `onSave` callback to persist to database

**Key Features**:
- Dynamic imports to avoid loading if module is disabled
- Supports both JSON and Markdown schema formats
- Handles empty schemas (initializes with metadata only)
- Event-driven save mechanism

### 3. Service Layer (`@lib/services/`)

#### ModuleService (`ModuleService.ts`)

**Purpose**: Provides a service interface for module management operations.

**Methods**:
- `getAllModules()`: Returns all registered modules
- `getModule(moduleId)`: Gets a specific module
- `isEnabled(moduleId)`: Checks if a module is enabled
- `enableModule(moduleId)`: Enables a module
- `disableModule(moduleId)`: Disables a module
- `updateModuleState(moduleId, enabled)`: Updates module state

**Note**: Currently uses in-memory storage. In production, this should persist to database/config.

### 4. React Hooks (`@lib/hooks/`)

#### useModelBuilder (`useModelBuilder.ts`)

**Purpose**: React hook that conditionally loads the Model Builder adapter.

**Returns**:
```typescript
{
  isEnabled: boolean              // Whether module is enabled
  loading: boolean                 // Loading state
  ModelBuilderAdapter: Component    // Adapter component (null if disabled)
}
```

**How it works**:
1. Fetches module status from `/api/modules` on mount
2. Dynamically imports adapter only if module is enabled
3. Returns adapter component or null based on status

**Usage**:
```typescript
const { isEnabled, loading, ModelBuilderAdapter } = useModelBuilder()

if (!isEnabled) {
  return <Alert>Module not enabled</Alert>
}

return <ModelBuilderAdapter model={model} onSave={handleSave} />
```

### 5. API Routes (`@app/api/modules/`)

#### `route.ts`

**Endpoints**:

**GET `/api/modules`**
- Returns all registered modules
- **Access**: Admin only
- **Response**: `{ modules: Module[] }`

**PUT `/api/modules`**
- Updates module state (enable/disable)
- **Access**: Admin only
- **Body**: `{ moduleId: string, enabled: boolean }`
- **Response**: `{ success: boolean }`

### 6. Settings UI (`@app/dashboard/settings/modules/`)

#### `page.tsx`

**Location**: `/dashboard/settings/modules`

**Purpose**: Admin interface for managing modules

**Features**:
- Lists all available modules
- Shows module name, description, and version
- Toggle switches to enable/disable modules
- Real-time updates via API
- Admin-only access (redirects non-admins)

**UI Components**:
- Module cards with information
- Switch components for toggling
- Loading states during updates
- Toast notifications for success/error

### 7. Model Edit Integration (`@app/dashboard/graph/model/[id]/edit/`)

#### `page.tsx`

**Location**: `/dashboard/graph/model/[id]/edit`

**Purpose**: Edit page that uses Model Builder when enabled

**Flow**:
1. Checks if Model Builder module is enabled
2. Shows error message if disabled
3. Loads ModelBuilderAdapter if enabled
4. Provides Save/Cancel buttons
5. Handles save via React Query mutation
6. Redirects to view page on success

**Features**:
- Module status checking
- Conditional adapter loading
- Save confirmation dialog
- Error handling
- Loading states

## Data Flow

### Loading a Model for Editing

```
1. User clicks "Edit" on model view page
   ↓
2. Navigate to /dashboard/graph/model/[id]/edit
   ↓
3. Edit page calls useModelBuilder() hook
   ↓
4. Hook fetches module status from /api/modules
   ↓
5. If enabled, dynamically imports ModelBuilderAdapter
   ↓
6. Edit page fetches model data via React Query
   ↓
7. ModelBuilderAdapter receives model prop
   ↓
8. Adapter converts schemaJson/schemaMd to builder format
   ↓
9. Adapter calls loadState() to populate builder store
   ↓
10. ModelBuilder component renders with loaded data
```

### Saving a Model

```
1. User makes changes in Model Builder
   ↓
2. User clicks "Save Changes" button
   ↓
3. Button dispatches 'model-builder:save' custom event
   ↓
4. ModelBuilderAdapter listens for event
   ↓
5. Adapter exports current builder state:
   - exportToJson() → schemaJson
   - exportToMarkdown() → schemaMd
   ↓
6. Adapter calls onSave() callback with exported data
   ↓
7. Edit page's handleSave() receives data
   ↓
8. Calls React Query mutation (updateModelMutation)
   ↓
9. PUT /api/models/[id] updates database
   ↓
10. React Query invalidates cache
   ↓
11. Redirect to model view page
```

## Module Lifecycle

### Initialization

1. **Server-side**: Module registry initializes with default modules
2. **Client-side**: Settings page fetches module status from API
3. **Runtime**: Hooks check module status before loading adapters

### Activation

1. Admin enables module in Settings → Modules
2. PUT request to `/api/modules` updates state
3. Module registry updates in-memory state
4. Next page load will have module enabled

### Deactivation

1. Admin disables module in Settings → Modules
2. PUT request to `/api/modules` updates state
3. Module registry updates in-memory state
4. Existing adapter instances continue working until page reload
5. New page loads will not load the adapter

## Adding a New Module

To add a new module to the system:

### 1. Define Module ID

```typescript
// @lib/modules/types.ts
export const MODULE_IDS = {
  MODEL_BUILDER: 'model-builder',
  NEW_MODULE: 'new-module'  // Add here
} as const
```

### 2. Register Module

```typescript
// @lib/modules/registry.ts
private initializeDefaultModules(): void {
  // ... existing modules
  
  this.modules.set(MODULE_IDS.NEW_MODULE, {
    id: MODULE_IDS.NEW_MODULE,
    name: 'New Module',
    description: 'Description of new module',
    enabled: false, // Default disabled
    version: '1.0.0'
  })
}
```

### 3. Create Adapter (if needed)

```typescript
// @lib/adapters/NewModuleAdapter.tsx
export function NewModuleAdapter({ ... }) {
  // Adapter implementation
}
```

### 4. Create Hook (if needed)

```typescript
// @lib/hooks/useNewModule.ts
export function useNewModule() {
  // Hook implementation similar to useModelBuilder
}
```

### 5. Integrate in Pages

```typescript
// @app/dashboard/.../page.tsx
const { isEnabled, NewModuleAdapter } = useNewModule()

if (!isEnabled) {
  return <Alert>Module not enabled</Alert>
}

return <NewModuleAdapter {...props} />
```

## Settings Pages Location

### Main Settings Page

**URL**: `/dashboard/settings`

**File Path**: `@app/dashboard/settings/page.tsx`

**Purpose**: Main settings hub with cards linking to different settings sections

**Access**: Admin only (redirects non-admins to dashboard)

**Features**:
- Overview of all available settings
- Quick navigation to specific settings sections
- Card-based layout for easy access
- Currently includes:
  - **Modules**: Manage application modules

**How to Access**:
- Direct URL: `/dashboard/settings`
- Can be added to navigation menu
- Currently accessible via direct navigation

### Module Settings Page

**URL**: `/dashboard/settings/modules`

**File Path**: `@app/dashboard/settings/modules/page.tsx`

**Access**: Admin only (redirects non-admins to dashboard)

**Navigation**: 
- Direct URL: `/dashboard/settings/modules`
- From main settings page: Click "Manage Modules" card
- "Back to Settings" button returns to main settings page

**Features**:
- List all available modules
- Toggle switches to enable/disable modules
- Real-time updates via API
- Module information (name, description, version)
- Loading states during updates
- Toast notifications for success/error

**UI Components**:
- Module cards with information display
- Switch components for toggling
- Loading indicators
- Error handling

## Configuration

### Current Implementation

- **Storage**: In-memory (module registry)
- **Persistence**: None (resets on server restart)
- **Default State**: Model Builder enabled by default

### Production Recommendations

1. **Database Persistence**: Store module state in database
   ```sql
   CREATE TABLE modules (
     id VARCHAR PRIMARY KEY,
     enabled BOOLEAN DEFAULT false,
     updated_at TIMESTAMP
   )
   ```

2. **Config File**: Store in `config/modules.json`
   ```json
   {
     "model-builder": {
       "enabled": true,
       "version": "1.0.0"
     }
   }
   ```

3. **Environment Variables**: For critical modules
   ```env
   MODULE_MODEL_BUILDER_ENABLED=true
   ```

## Best Practices

1. **Always check module status** before loading adapters
2. **Use dynamic imports** to avoid loading disabled modules
3. **Handle disabled state gracefully** with user-friendly messages
4. **Keep adapters thin** - business logic should be in services
5. **Test module enable/disable** scenarios
6. **Document module dependencies** if any
7. **Version modules** for compatibility tracking

## Troubleshooting

### Module not appearing in settings
- Check if module is registered in `registry.ts`
- Verify module ID matches `MODULE_IDS` constant
- Check admin access permissions

### Adapter not loading
- Verify module is enabled via API
- Check browser console for import errors
- Ensure package exports are correct
- Verify dynamic import path

### Save not working
- Check event listener registration
- Verify `onSave` callback is provided
- Check API endpoint permissions
- Review React Query mutation setup

## Future Enhancements

1. **Database Persistence**: Store module state in database
2. **Module Dependencies**: Support module dependencies
3. **Module Configuration**: Per-module configuration UI
4. **Module Marketplace**: Install/remove modules dynamically
5. **Module Versioning**: Handle module version conflicts
6. **Module Analytics**: Track module usage
7. **Module Permissions**: Fine-grained access control

## Related Files

### Core Module System
- **Module Types**: `@lib/modules/types.ts`
- **Module Registry**: `@lib/modules/registry.ts`
- **Module Service**: `@lib/services/ModuleService.ts`

### Adapters & Hooks
- **Model Builder Adapter**: `@lib/adapters/ModelBuilderAdapter.tsx`
- **useModelBuilder Hook**: `@lib/hooks/useModelBuilder.ts`

### API Routes
- **Modules API**: `@app/api/modules/route.ts`

### UI Pages
- **Main Settings**: `@app/dashboard/settings/page.tsx`
- **Module Settings**: `@app/dashboard/settings/modules/page.tsx`
- **Model Edit**: `@app/dashboard/graph/model/[id]/edit/page.tsx`

### Package
- **Model Builder Package**: `@packages/model-builder/`

## File Structure

```
graphdbnext/
├── lib/
│   ├── modules/
│   │   ├── types.ts              # Module interfaces
│   │   └── registry.ts           # Module registry implementation
│   ├── adapters/
│   │   └── ModelBuilderAdapter.tsx  # Model Builder adapter
│   ├── services/
│   │   └── ModuleService.ts      # Module management service
│   └── hooks/
│       └── useModelBuilder.ts    # React hook for Model Builder
├── app/
│   ├── api/
│   │   └── modules/
│   │       └── route.ts          # Module API endpoints
│   └── dashboard/
│       ├── settings/
│       │   ├── page.tsx          # Main settings page
│       │   └── modules/
│       │       └── page.tsx     # Module management page
│       └── graph/
│           └── model/
│               └── [id]/
│                   └── edit/
│                       └── page.tsx  # Model edit page with builder
└── packages/
    └── model-builder/            # Standalone Model Builder package
```

