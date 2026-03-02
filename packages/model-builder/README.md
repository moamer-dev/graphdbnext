# @graphdb/model-builder

A powerful, React-based visual tool for designing graph schemas, mapping complex XML data to graph structures, and enriching them with semantic layer information. This package is the core engine behind the GraphDBNext model designer.

![Model Builder Overview](https://raw.githubusercontent.com/moamer-dev/graphdbnext/main/packages/model-builder/docs/assets/overview-placeholder.png)

## 🚀 Features

- **Visual Graph Schema Designer**: 
  - Drag-and-drop interface for creating Nodes and Relationships.
  - Grouping support for organizing complex models.
  - Real-time canvas powered by ReactFlow.
- **Advanced XML Mapping**:
  - Automated XML structure analysis to identify potential nodes and relations.
  - Intuitive mapping wizard to connect XML elements to your graph schema.
  - Support for attribute mappings, text content rules, and relationship cardinality.
- **Semantic Layer Integration**:
  - Direct connection to ontology services (e.g., TIB Terminology Service).
  - Map nodes to Ontology Classes and properties to Semantic Properties.
  - CURIE/IRI support with auto-completion.
- **Workflow & Transformation Engine**:
  - Create repeatable workflows for data ingestion.
  - Built-in "Tools" and "Actions" for custom data transformations during the graph generation process.
- **Multi-format Export/Import**:
  - Export models as **JSON**, **Markdown**, **RDF/TTL**, or serialized **Workflow Configs**.
  - Versioned schema definitions for safe updates.
- **AI-Assisted Modeling**:
  - Integrated AI agents for schema suggestions, optimization, and validation.
  - Chat-based assistant to help you build models using natural language.

---

## 📦 Installation

This package is intended to be used within the GraphDBNext ecosystem but can be installed as a standalone dependency:

```bash
npm install @graphdb/model-builder
```

### Peer Dependencies
Ensure you have the following installed in your host project:
- `react` >= 18.0.0
- `react-dom` >= 18.0.0
- `lucide-react`
- `zustand`

---

## 🛠️ Getting Started

### Basic Usage

```tsx
import { ModelBuilder } from '@graphdb/model-builder';
import '@graphdb/model-builder/dist/index.css';

function MyDesigner() {
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <ModelBuilder 
        metadata={{ name: "My New Model", version: "1.0.0" }}
        onPushToDB={async (graph) => {
          console.log("Generated Graph Data:", graph);
        }}
      />
    </div>
  );
}
```

### Persistence Configuration

To enable saving and loading workflows, provide the `workflowPersistence` prop:

```tsx
<ModelBuilder 
  workflowPersistence={{
    onSaveWorkflow: async (wf) => { /* Save to API */ },
    onLoadWorkflows: async (modelId) => { /* Fetch list from API */ },
    onLoadWorkflow: async (id) => { /* Fetch single config */ }
  }}
/>
```

---

## 📂 Project Structure

- `src/components`: UI components (Canvas, Editors, Palettes, Wizards).
- `src/stores`: State management using Zustand (Centralized graph state, XML state, Workflow state).
- `src/services`: Business logic (XML Analysis, Graph Conversion, API Clients).
- `src/hooks`: Custom React hooks for specialized operations.
- `src/utils`: Helper functions for parsing, exporting, and transformations.
- `src/ai`: Agent configurations and AI-specific components.

---

## 📄 Documentation

- [User Guide](./docs/USER_GUIDE.md) - How to build your first model.
- [Developer Guide](./DEVELOPER_GUIDE.md) - Architecture and technical deep dive.
- [XML Mapping Guide](./docs/XML_MAPPING.md) - Detailed rules for data ingestion.

## ⚖️ License

Private / Proprietary - Subconscious University.
