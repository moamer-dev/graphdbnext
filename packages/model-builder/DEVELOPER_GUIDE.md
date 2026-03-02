# Developer Guide: @graphdb/model-builder

This document provides a technical overview of the `@graphdb/model-builder` architecture, internal workflows, data models, and extension patterns. It's intended for engineers maintaining or extending the package.

## 🏗️ Architecture Overview Overview

The package follows a **Modular Monolith** architecture, separating UI, application state, and business logic into distinct layers.

- **UI Layer (`src/components`)**: React components (Radix, Tailwind) for layout and interaction.
- **State Layer (`src/stores`)**: Global state managed by [Zustand](https://zustand-demo.pmnd.rs/), providing reactive updates across the canvas and editors.
- **Logic Layer (`src/services`)**: In-memory data processing, XML analysis, and API orchestration.
- **AI Layer (`src/ai`)**: LangChain-powered agents for automated schema design.

---

## 💾 State Management (Zustand)

State is highly decentralized to minimize unnecessary re-renders in the complex graph canvas.

- **`modelBuilderStore`**: 
  - **Graph Definition**: Nodes, Relationships, Groups.
  - **Hierarchy**: Parent-child relationships for grouped nodes.
  - **Metadata**: Model name, version, and global settings.
  - **Persistence**: `loadState` and `clear` functions for importing models.
- **`xmlImportWizardStore`**:
  - **File State**: The currently active XML file and its structure.
  - **Mapping State**: User-defined mapping from XML paths to graph elements.
  - **Analysis Results**: Elements types, attribute patterns, and cardinality.
- **`workflowStore`**:
  - **Steps**: Execution plan for generating the graph.
  - **Tools/Actions**: In-memory representation of custom transformation logic.
  - **Execution State**: Progress tracking during generation.

---

## 🧬 Key Services

- **`XmlAnalyzer`**:
  - Uses `xmldom` to traverse uploaded files.
  - Infers complex structures (e.g., nested elements that should be relationships vs. nodes).
  - Identifies unique attribute keys and generates path-based selectors.
- **`XmlConverter`**:
  - The core "mapping engine".
  - Applies **Mapping Rules** (attribute to property, element to node).
  - Handles **Cardinality** (1:1, 1:N) and **Text Content Rules**.
- **`WorkflowExecutor`**:
  - Orchestrates the sequential execution of transformation tools.
  - Implements a plugin-like system where each "Step" can modify the resulting graph.
- **`TibTerminologyService`**:
  - Adapts external ontology APIs (like TIB) into a consistent internal format (`Class`, `Property`).

---

## 🛠️ Tools & Actions Extension Model

Tools and Actions permit users to inject custom logic into the graph generation pipeline.

### Adding a New Tool/Action
1.  **Define the Logic**: Implement the transformation logic in `src/services/workflowExecutor/tools/`.
2.  **Declare UI Node**: Add the visual representation in `src/components/canvas/nodes/` (e.g., `ToolNode.tsx`).
3.  **Register the Type**: Update `WorkflowStepType` in `src/types/index.ts`.
4.  **Register UI Palette**: Add the new tool to the `NodePalette` in `src/components/palette/NodePalette.tsx`.

---

## 🔗 Adapters & Integration Patterns

### `ModelBuilderAdapter` (Consuming App)
A standard pattern used in `graphdbnext` is to wrap the `ModelBuilder` in an **Adapter** component. This component:
- Maps database IDs (e.g., `modelId`) to props.
- Handles the actual save/update API calls.
- Injects environment-specific AI settings.

---

## 📄 Data Models

### `Node` Definition
```typescript
interface Node {
  id: string;
  label: string;
  type: string;
  properties: Property[];
  position: { x: number; y: number };
  groupId?: string;
  data?: {
    semantic?: {
      classIri: string;
      classLabel: string;
      classCurie?: string;
      ontologyId: string;
    }
  }
}
```

### `MappingConfig` Definition
```typescript
interface ElementMapping {
  elementPath: string; // XPath-like selector
  nodeLabel: string;
  propertyMappings: Array<{
    attributeName?: string;
    propertyName: string;
    isTextContent?: boolean;
  }>;
}
```

---

## 🧪 Development Workflow

- **Build**: `npm run build` (outputs to `dist/` using `tsup`).
- **Dev Mode**: `npm run dev` (watch mode).
- **Styling**: Uses TailwindCSS. Global styles are defined in `src/index.css`.
- **Icons**: Standardized on `lucide-react`.

---

## 🔄 Workflow Lifecycle

1.  **Input**: XML Content + Mapping Config.
2.  **Phase 1 (Analysis)**: `XmlAnalyzer` groups elements and identifies relationships.
3.  **Phase 2 (Conversion)**: `XmlConverter` iterates through mappings to create the base graph nodes.
4.  **Phase 3 (Workflow)**: `WorkflowExecutor` runs any "Tools" (e.g., merging nodes) or "Actions" connected in the workflow canvas.
5.  **Output**: Final Graph (`ConversionResult`) ready to be pushed to the database.

---

## 📘 Maintenance Checklist
- When adding a new **Property Type**, update `mappingValidator.ts` and `schemaConverter.ts`.
- When modifying **Semantic Fields**, ensure both JSON and Markdown exporters in `exportUtils.ts` are updated.
- Always run `npm run build` to verify TypeScript types across the package.
