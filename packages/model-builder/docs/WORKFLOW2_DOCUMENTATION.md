# Model Builder Workflow Documentation

This document describes the end-to-end lifecycle of a model in the GraphDBNext Model Builder, from initial XML ingestion to automated graph generation.

## Overview

The Model Builder is a sophisticated visual orchestration platform that transforms structured XML data into high-fidelity graph representations. It combines automated structural analysis with a flexible, flow-based execution engine.

---

## Phase 1: Structural Ingestion & Mapping

The process begins with the ingestion of source XML data.

### 1. XML Selection and Initial Parsing
Users select an XML file through the **XML Import Wizard**. The system immediately performs a shallow extraction to identify all unique element tags and attributes present in the document.

### 2. Rule Configuration
Before deep analysis, users can configure global extraction rules:
- **Ignored Elements**: Skip noise tags that don't represent business entities.
- **Reference Attributes**: Identify attributes that function as primary or foreign keys.
- **Text Content Rules**: Define how character data should be handled (e.g., tokenization).

### 3. Automated Structural Analysis
The `XmlAnalyzer` service performs a deep walk of the XML tree to:
- Calculate frequency and density of each element type.
- Map child-parent relationships and cardinalities.
- Infer data types for attributes based on content patterns (e.g., date, number, UUID).

### 4. Semantic Mapping
Users map XML elements to graph constructs:
- **Elements → Nodes**: Assign node labels and base types.
- **Attributes → Properties**: Map XML attributes to node/relationship properties.
- **Hierarchies → Relationships**: Define how parent-child XML structures translate to graph edges (e.g., `CONTAINS`, `BELONGS_TO`).

---

## Phase 2: Workflow Orchestration

Once the base schema is defined, users can enhance the transformation logic using the **Workflow Designer**.

### 1. Tool and Action Palette
The platform provides a registry of modular components:
- **Tools**: Perform data enrichment or side-effects (e.g., API calls, lookups).
- **Actions**: Define conditional logic, transformations, or graph-specific mutations (e.g., `Conditional Walk`, `Property Mapping`).

### 2. Visual Logic Design
Items are placed on a dual-canvas system:
- **Tool Canvas**: Links tools to specific Node/Relationship types in the schema.
- **Action Canvas**: Defines the sequential or conditional flow of operations applied to data during the walker process.

### 3. Granular Configuration
Each item is configured using the **Schema Form**, which dynamically renders input fields based on the item's `configSchema`. This allows for highly specific behavior, such as custom regex transforms or API endpoint configurations.

---

## Phase 3: The Execution Engine (Graph Generation)

The "Generate" process is a multi-stage execution pipeline managed by the `workflowExecutor`.

### 1. Pipeline Preparation
- The `modelBuilderStore` state is converted into a standard `SchemaJson`.
- The `workflowRegistry` resolves all active tools and actions.
- The source XML document is loaded into a searchable DOM structure.

### 2. The Recursive Walker
The engine performs a depth-first traversal of the XML tree:
1. **Node Matching**: For each XML element, it identifies matching Node Definitions in the schema.
2. **Pre-Processing (Tools)**: Executes assigned Tools to fetch external data or prepare context.
3. **Node Creation**: Instantiates a graph node with properties derived from XML attributes and tool results.
4. **Action Execution**: Applies defined Actions (e.g., conditional skipping or property enrichment).
5. **Relationship Resolution**: Automatically links nodes based on the XML hierarchy or explicit reference attributes.

### 3. Post-Processing and Preview
- **Relationship Stitching**: Resolves all late-binding references (foreign keys).
- **Graph Materialization**: The raw list of nodes and edges is processed into a `GraphPreview`.
- **Validation**: Ensures the output respects the defined constraints and metadata.

---

## Phase 4: Output and Integration

The final graph can be:
- **Previewed**: Explored visually in the Graph Preview panel.
- **Exported**: Downloaded as JSON, RDF, Turtle, or Markdown.
- **Committed**: Pushed directly to the connected Graph Database.

---

## Technical Appendix: Services Involved

- `XmlAnalyzer`: Deep structural scanning and inference.
- `XmlConverter`: Coordinate mappings and attribute transformations.
- `workflowExecutor`: The core runtime for the walker and action pipeline.
- `workflowService`: Management of workflow persistence and application.
- `mappingValidator`: Integrity checks for the defined mappings.
