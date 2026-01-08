# GraphDBNext Architecture Diagrams

This document contains Mermaid diagrams illustrating the various architectural aspects, design patterns, and system layers of the GraphDBNext application.


---
config:
  layout: dagre
---
flowchart TB
 subgraph MD["Option A: Markdown-based Model"]
        MD1["Download MD Template"]
        U["User"]
        MD2["Fill Template"]
        MD3["Upload MD File"]
        MD4["Generate JSON Model Schema"]
  end
 subgraph XML["Option B: XML-based Model"]
        XML1["Upload XML File"]
        XML2["Generate XML Tree"]
        XML3["Visual Canvas"]
        XML4["Define Nodes & Edges"]
        XML5["Generate JSON Model Schema"]
  end
 subgraph SCHEMA["Model Schema Creation"]
    direction TB
        MD
        XML
  end
 subgraph GRAPH["Graph JSON Generation"]
    direction TB
        G1["Model Schema Ready"]
        SCHEMA
        G2["Upload XML Data"]
        G3["Map XML Elements to Schema"]
        G4["Nodes / Edges / Properties / Values"]
        G5["Generate Graph JSON"]
  end
 subgraph DB["Graph Database Layer"]
        DB1["Push to Graph DB"]
        NEO["Neo4j"]
        MEM["Memgraph"]
  end
 subgraph QUERY["Query & Visualization"]
        Q1["User Queries"]
        Q2["Query Engine"]
        Q3["Tabular Results"]
        Q4["Visualized Results"]
        Q5["HTML Graph Rendering"]
  end
    U --> APP["Web Application"] & MD1 & XML1 & Q1
    MD1 --> MD2
    MD2 --> MD3
    MD3 --> MD4
    XML1 --> XML2
    XML2 --> XML3
    XML3 --> XML4
    XML4 --> XML5
    SCHEMA --> G1
    G1 --> G2
    G2 --> G3
    G3 --> G4
    G4 --> G5
    G5 --> DB1
    DB1 -- Neo4j --> NEO
    DB1 -- Memgraph --> MEM
    Q1 --> Q2
    Q2 --> Q3 & Q4 & Q5
    DB --> QUERY



## 1. Overall System Architecture

graph TB
    subgraph "Client Layer"
        UI[React/Next.js Frontend]
        MB[Model Builder Package]
    end

    subgraph "API Layer"
        API[Next.js API Routes]
        AIS[AI Settings API]
        DB_API[Database API]
        XML_API[XML Processing API]
    end

    subgraph "Business Logic Layer"
        Services[Application Services]
        WF[Workflow Engine]
        AI[AI Integration Services]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL)]
        MG[(Memgraph/Neo4j)]
        Cache[(Redis Cache)]
    end

    subgraph "External APIs"
        WD[Wikidata]
        EU[Europeana]
        OR[ORCID]
        GN[GeoNames]
        CR[CrossRef]
    end

    UI --> API
    MB --> API
    API --> Services
    Services --> WF
    Services --> AI
    WF --> PG
    WF --> MG
    AI --> PG
    Services --> PG
    Services --> MG
    WF --> WD
    WF --> EU
    WF --> OR
    WF --> GN
    WF --> CR

    style UI fill:#e1f5fe
    style MB fill:#e1f5fe
    style API fill:#fff3e0
    style Services fill:#e8f5e8
    style WF fill:#e8f5e8
    style AI fill:#e8f5e8
    style PG fill:#fce4ec
    style MG fill:#fce4ec
    style WD fill:#f3e5f5
    style EU fill:#f3e5f5

## 2. Application Layered Architecture

graph TB
    subgraph "Presentation Layer"
        UI[User Interface]
        API[API Gateway]
        MB[Model Builder UI]
    end

    subgraph "Application Layer"
        CTL[Controllers]
        DTO[Data Transfer Objects]
        VAL[Validators]
        AUTH[Authentication]
    end

    subgraph "Domain Layer"
        ENT[Entities/Models]
        SRV[Domain Services]
        WF_SRV[Workflow Services]
        AI_SRV[AI Services]
    end

    subgraph "Infrastructure Layer"
        REPO[Repositories]
        DB_CTX[Database Context]
        EXT_API[External API Clients]
        FILE_SYS[File System]
        CACHE[Cache Providers]
    end

    subgraph "External Systems"
        PG_DB[(PostgreSQL)]
        GRAPH_DB[(Graph DB)]
        AI_PROV[AI Providers]
        EXT_SERV[External Services]
    end

    UI --> CTL
    MB --> CTL
    API --> CTL
    CTL --> DTO
    CTL --> VAL
    CTL --> AUTH
    CTL --> SRV
    SRV --> WF_SRV
    SRV --> AI_SRV
    WF_SRV --> ENT
    AI_SRV --> ENT
    SRV --> REPO
    REPO --> DB_CTX
    DB_CTX --> PG_DB
    DB_CTX --> GRAPH_DB
    EXT_API --> AI_PROV
    EXT_API --> EXT_SERV
    CACHE --> FILE_SYS

    style UI fill:#e3f2fd
    style API fill:#e3f2fd
    style MB fill:#e3f2fd
    style CTL fill:#fff8e1
    style SRV fill:#e8f5e8
    style WF_SRV fill:#e8f5e8
    style AI_SRV fill:#e8f5e8
    style REPO fill:#fce4ec
    style EXT_API fill:#f3e5f5

## 3. Design Patterns Used

graph TD
    subgraph "Creational Patterns"
        FACTORY[Factory Pattern<br/>GraphDatabaseFactory]
        BUILDER[Builder Pattern<br/>ModelBuilder]
        SINGLETON[Singleton Pattern<br/>Database Connections]
    end

    subgraph "Structural Patterns"
        ADAPTER[Adapter Pattern<br/>Database Adapters]
        FACADE[Facade Pattern<br/>Service Layer]
        COMPOSITE[Composite Pattern<br/>Workflow Nodes]
    end

    subgraph "Behavioral Patterns"
        STRATEGY[Strategy Pattern<br/>AI Providers]
        OBSERVER[Observer Pattern<br/>State Management]
        COMMAND[Command Pattern<br/>Workflow Actions]
        TEMPLATE[Template Method<br/>XML Processing]
    end

    subgraph "Architectural Patterns"
        MVC[MVC Pattern<br/>Next.js App Router]
        REPO[Repository Pattern<br/>Data Access]
        CQRS[CQRS Pattern<br/>Read/Write Operations]
        LAYERED[Layered Architecture<br/>Presentation → Domain → Infra]
    end

    FACTORY --> ADAPTER
    BUILDER --> COMPOSITE
    SINGLETON --> FACADE
    ADAPTER --> STRATEGY
    FACADE --> REPO
    COMPOSITE --> COMMAND
    STRATEGY --> CQRS
    OBSERVER --> MVC
    COMMAND --> TEMPLATE
    REPO --> LAYERED
    CQRS --> LAYERED
    MVC --> LAYERED
    TEMPLATE --> LAYERED

## 4. Workflow System Architecture

```mermaid
graph TD
    subgraph "Workflow Canvas"
        CANVAS[Visual Canvas<br/>ReactFlow]
        PALETTE[Tool Palette<br/>Drag & Drop]
        PROPERTIES[Property Panel<br/>Configuration]
    end

    subgraph "Workflow Engine"
        EXECUTOR[Workflow Executor<br/>Execution Engine]
        VALIDATOR[Workflow Validator<br/>Schema Validation]
        LOGGER[Execution Logger<br/>Debug & Audit]
    end

    subgraph "Tool Registry"
        CONTROL[Control Tools<br/>if, switch, loop]
        DATA[Data Tools<br/>filter, transform, merge]
        API[API Tools<br/>fetch-wikidata, etc.]
        QUALITY[Quality Tools<br/>validate, clean, enrich]
    end

    subgraph "Action Registry"
        NODE[Node Actions<br/>create-node, update-node]
        RELATION[Relationship Actions<br/>create-relationship]
        PROPERTY[Property Actions<br/>set-property, extract]
        SPECIAL[Special Actions<br/>process-children, skip]
    end

    subgraph "Execution Context"
        XML_CTX[XML Document Context<br/>Current Element]
        GRAPH_CTX[Graph Context<br/>Created Nodes/Relationships]
        API_CTX[API Context<br/>Fetched External Data]
        VAR_CTX[Variable Context<br/>Workflow Variables]
    end

    CANVAS --> EXECUTOR
    PALETTE --> CANVAS
    PROPERTIES --> CANVAS
    EXECUTOR --> VALIDATOR
    EXECUTOR --> LOGGER
    EXECUTOR --> CONTROL
    EXECUTOR --> DATA
    EXECUTOR --> API
    EXECUTOR --> QUALITY
    EXECUTOR --> NODE
    EXECUTOR --> RELATION
    EXECUTOR --> PROPERTY
    EXECUTOR --> SPECIAL
    CONTROL --> XML_CTX
    DATA --> GRAPH_CTX
    API --> API_CTX
    NODE --> GRAPH_CTX
    RELATION --> GRAPH_CTX
    PROPERTY --> VAR_CTX
    XML_CTX --> GRAPH_CTX
    GRAPH_CTX --> API_CTX
    API_CTX --> VAR_CTX
```

## 5. AI Integration Architecture

```mermaid
graph TD
    subgraph "AI Service Layer"
        PROVIDER[AI Provider Manager<br/>OpenAI, Anthropic, Local]
        SETTINGS[AI Settings Storage<br/>Database Persistence]
        CONTEXT[Context Builder<br/>Application State]
    end

    subgraph "LangChain Integration"
        AGENTS[LangChain Agents<br/>SchemaDesignAgent<br/>MappingAssistantAgent<br/>WorkflowGenerationAgent<br/>ResearchAssistantAgent]
        CHAINS[LangChain Chains<br/>Mapping Chain<br/>Schema Chain<br/>Workflow Chain]
        TOOLS[LangChain Tools<br/>Model Builder Tools<br/>XML Tools<br/>App State Tools]
        MEMORY[Conversation Memory<br/>Chat History]
    end

    subgraph "AI Agents"
        SCHEMA[Schema Design Agent<br/>Generates Graph Schemas]
        MAPPING[XML Mapping Agent<br/>Suggests Mappings]
        WORKFLOW[Workflow Generation Agent<br/>Creates Workflows]
        RESEARCH[Research Assistant Agent<br/>Contextual Help]
    end

    subgraph "AI Tools"
        NODE_TOOLS[Node Management Tools<br/>create_node, update_node]
        XML_TOOLS[XML Processing Tools<br/>analyze_xml, suggest_mapping]
        QUERY_TOOLS[Query Tools<br/>execute_query, optimize_query]
        WORKFLOW_TOOLS[Workflow Tools<br/>generate_workflow, validate_workflow]
    end

    subgraph "Integration Points"
        CHAT[Research Assistant Chat<br/>Floating Widget]
        SUGGESTIONS[AI Suggestions Panel<br/>Contextual Help]
        AUTOCOMPLETE[Smart Autocomplete<br/>Schema & Query]
        VALIDATION[AI-Powered Validation<br/>Real-time Feedback]
    end

    PROVIDER --> AGENTS
    SETTINGS --> CONTEXT
    CONTEXT --> AGENTS
    AGENTS --> CHAINS
    CHAINS --> TOOLS
    TOOLS --> MEMORY
    AGENTS --> SCHEMA
    AGENTS --> MAPPING
    AGENTS --> WORKFLOW
    AGENTS --> RESEARCH
    SCHEMA --> NODE_TOOLS
    MAPPING --> XML_TOOLS
    WORKFLOW --> WORKFLOW_TOOLS
    RESEARCH --> QUERY_TOOLS
    CHAT --> RESEARCH
    SUGGESTIONS --> AGENTS
    AUTOCOMPLETE --> CHAINS
    VALIDATION --> CHAINS
```

## 6. Database Abstraction Layer

```mermaid
graph TD
    subgraph "Abstraction Interface"
        IGRAPH[IGraphDatabaseService<br/>Common Interface]
        FACTORY[GraphDatabaseFactory<br/>Provider Selection]
        CONFIG[Configuration Manager<br/>Environment Variables]
    end

    subgraph "Database Adapters"
        MEMGRAPH[MemgraphAdapter<br/>Memgraph Implementation]
        NEO4J[Neo4jAdapter<br/>Neo4j Implementation]
        FUTURE[FutureAdapter<br/>Extensible Design]
    end

    subgraph "Query Translation"
        CYPHER[Cypher Translator<br/>Dialect Normalization]
        PARAM[Parameter Binder<br/>Type Safety]
        RESULT[Result Mapper<br/>Unified Format]
    end

    subgraph "Connection Management"
        POOL[Connection Pool<br/>Resource Management]
        RETRY[Retry Logic<br/>Fault Tolerance]
        MONITOR[Health Monitor<br/>Status Checks]
    end

    subgraph "Supported Databases"
        MG[(Memgraph)]
        NJ[(Neo4j)]
        FUTURE_DB[(Future Graph DB)]
    end

    IGRAPH --> MEMGRAPH
    IGRAPH --> NEO4J
    IGRAPH --> FUTURE
    FACTORY --> IGRAPH
    CONFIG --> FACTORY
    MEMGRAPH --> CYPHER
    NEO4J --> CYPHER
    FUTURE --> CYPHER
    CYPHER --> PARAM
    PARAM --> RESULT
    MEMGRAPH --> POOL
    NEO4J --> POOL
    FUTURE --> POOL
    POOL --> RETRY
    RETRY --> MONITOR
    MEMGRAPH --> MG
    NEO4J --> NJ
    FUTURE --> FUTURE_DB
    MONITOR --> MG
    MONITOR --> NJ
    MONITOR --> FUTURE_DB
```

## 7. Data Flow Architecture

```mermaid
graph TD
    subgraph "Input Sources"
        TEI_XML[TEI XML Documents]
        JSON_DATA[JSON Datasets]
        CSV_DATA[CSV Files]
        API_DATA[External APIs]
        MANUAL[Manual Input]
    end

    subgraph "Ingestion Layer"
        UPLOAD[File Upload<br/>Drag & Drop]
        API_CLIENT[API Client<br/>HTTP Requests]
        VALIDATOR[Input Validator<br/>Format Checking]
        PARSER[Data Parser<br/>XML/JSON/CSV]
    end

    subgraph "Processing Layer"
        ANALYZER[Structure Analyzer<br/>Schema Inference]
        TRANSFORMER[Data Transformer<br/>Format Conversion]
        ENRICHER[Data Enricher<br/>External Data]
        VALIDATOR2[Data Validator<br/>Quality Checks]
    end

    subgraph "Workflow Layer"
        WF_ENGINE[Workflow Engine<br/>Tool Execution]
        TOOL_REGISTRY[Tool Registry<br/>40+ Tools]
        ACTION_REGISTRY[Action Registry<br/>35+ Actions]
        EXECUTOR[Workflow Executor<br/>Parallel Processing]
    end

    subgraph "Graph Layer"
        SCHEMA_BUILDER[Schema Builder<br/>Visual Design]
        NODE_CREATOR[Node Creator<br/>Entity Generation]
        RELATIONSHIP_BUILDER[Relationship Builder<br/>Link Creation]
        PROPERTY_MAPPER[Property Mapper<br/>Attribute Mapping]
    end

    subgraph "Storage Layer"
        GRAPH_DB[Graph Database<br/>Memgraph/Neo4j]
        METADATA_DB[Metadata Database<br/>PostgreSQL]
        CACHE_LAYER[Cache Layer<br/>Redis]
        INDEX_LAYER[Index Layer<br/>Full-text Search]
    end

    subgraph "Output Layer"
        QUERY_API[Query API<br/>Cypher/REST]
        EXPORT_API[Export API<br/>JSON/CSV/GraphML]
        VISUALIZATION_API[Visualization API<br/>Interactive Graphs]
        REPORTING_API[Reporting API<br/>Analytics]
    end

    TEI_XML --> UPLOAD
    JSON_DATA --> UPLOAD
    CSV_DATA --> UPLOAD
    API_DATA --> API_CLIENT
    MANUAL --> VALIDATOR

    UPLOAD --> VALIDATOR
    API_CLIENT --> VALIDATOR
    VALIDATOR --> PARSER
    PARSER --> ANALYZER
    ANALYZER --> TRANSFORMER
    TRANSFORMER --> ENRICHER
    ENRICHER --> VALIDATOR2
    VALIDATOR2 --> WF_ENGINE

    WF_ENGINE --> TOOL_REGISTRY
    WF_ENGINE --> ACTION_REGISTRY
    WF_ENGINE --> EXECUTOR
    EXECUTOR --> SCHEMA_BUILDER
    EXECUTOR --> NODE_CREATOR
    EXECUTOR --> RELATIONSHIP_BUILDER
    EXECUTOR --> PROPERTY_MAPPER

    SCHEMA_BUILDER --> GRAPH_DB
    NODE_CREATOR --> GRAPH_DB
    RELATIONSHIP_BUILDER --> GRAPH_DB
    PROPERTY_MAPPER --> GRAPH_DB
    WF_ENGINE --> METADATA_DB
    ENRICHER --> CACHE_LAYER
    ANALYZER --> INDEX_LAYER

    GRAPH_DB --> QUERY_API
    METADATA_DB --> QUERY_API
    CACHE_LAYER --> QUERY_API
    INDEX_LAYER --> QUERY_API

    QUERY_API --> EXPORT_API
    QUERY_API --> VISUALIZATION_API
    QUERY_API --> REPORTING_API
```

## 8. User Interface Architecture

```mermaid
graph TD
    subgraph "UI Framework"
        NEXT[Next.js 16<br/>App Router]
        REACT[React 19<br/>Concurrent Features]
        TAILWIND[Tailwind CSS<br/>Utility Classes]
        RADIX[Radix UI<br/>Accessible Components]
    end

    subgraph "State Management"
        ZUSTAND[Zustand Stores<br/>Local State]
        RQ[TanStack Query<br/>Server State]
        CONTEXT[React Context<br/>Global State]
        JOTAI[Jotai Atoms<br/>Reactive State]
    end

    subgraph "UI Components"
        SIDEBAR[Sidebar Navigation<br/>Collapsible Menu]
        CANVAS[Visual Canvas<br/>ReactFlow Integration]
        FORMS[Dynamic Forms<br/>Schema-driven]
        CHARTS[Data Visualization<br/>D3.js Integration]
        TABLES[Data Tables<br/>TanStack Table]
    end

    subgraph "Specialized Views"
        MODEL_BUILDER[Model Builder<br/>Schema Design]
        XML_WIZARD[XML Import Wizard<br/>Multi-step Process]
        WF_BUILDER[Workflow Builder<br/>Visual Programming]
        DB_VIEW[Database View<br/>Query Interface]
        AI_CHAT[AI Chat Widget<br/>Contextual Help]
    end

    subgraph "Layout System"
        DASHBOARD[Dashboard Layout<br/>Responsive Grid]
        MODAL[Modal System<br/>Overlay Management]
        TOAST[Toast Notifications<br/>User Feedback]
        LOADING[Loading States<br/>Progressive UI]
    end

    NEXT --> REACT
    REACT --> TAILWIND
    REACT --> RADIX
    REACT --> ZUSTAND
    REACT --> RQ
    REACT --> CONTEXT
    REACT --> JOTAI

    ZUSTAND --> UI_COMPONENTS
    RQ --> UI_COMPONENTS
    CONTEXT --> UI_COMPONENTS
    JOTAI --> UI_COMPONENTS

    UI_COMPONENTS --> SIDEBAR
    UI_COMPONENTS --> CANVAS
    UI_COMPONENTS --> FORMS
    UI_COMPONENTS --> CHARTS
    UI_COMPONENTS --> TABLES

    SIDEBAR --> DASHBOARD
    CANVAS --> MODEL_BUILDER
    FORMS --> XML_WIZARD
    CANVAS --> WF_BUILDER
    CHARTS --> DB_VIEW
    SIDEBAR --> AI_CHAT

    DASHBOARD --> MODAL
    DASHBOARD --> TOAST
    DASHBOARD --> LOADING
```

## 9. XML Processing Pipeline

```mermaid
graph TD
    subgraph "Input Stage"
        XML_FILE[XML File Upload<br/>TEI, MODS, etc.]
        URL_INPUT[URL Input<br/>Remote XML]
        API_INPUT[API Stream<br/>Real-time Data]
    end

    subgraph "Parsing Stage"
        XML_PARSER[XML Parser<br/>@xmldom/xmldom]
        SCHEMA_VALIDATOR[Schema Validator<br/>TEI/XSD Validation]
        NAMESPACE_RESOLVER[Namespace Resolver<br/>XML Namespace Handling]
        ENCODING_DETECTOR[Encoding Detector<br/>Character Set Handling]
    end

    subgraph "Analysis Stage"
        STRUCTURE_ANALYZER[Structure Analyzer<br/>Element Hierarchy]
        ELEMENT_COUNTER[Element Counter<br/>Frequency Analysis]
        ATTRIBUTE_ANALYZER[Attribute Analyzer<br/>Property Inference]
        RELATIONSHIP_DETECTOR[Relationship Detector<br/>Reference Patterns]
        TEXT_ANALYZER[Text Analyzer<br/>Content Patterns]
    end

    subgraph "Mapping Stage"
        RULE_ENGINE[Mapping Rule Engine<br/>Element → Node Rules]
        PROPERTY_MAPPER[Property Mapper<br/>Attribute → Property]
        RELATIONSHIP_MAPPER[Relationship Mapper<br/>Reference → Edge]
        TOKENIZER[Text Tokenizer<br/>Word/Character Splitting]
        CONTEXT_INHERITOR[Context Inheritor<br/>Property Inheritance]
    end

    subgraph "Transformation Stage"
        NODE_GENERATOR[Node Generator<br/>Graph Node Creation]
        RELATIONSHIP_GENERATOR[Relationship Generator<br/>Edge Creation]
        PROPERTY_SETTER[Property Setter<br/>Attribute Assignment]
        VALIDATION_ENGINE[Validation Engine<br/>Schema Compliance]
        ERROR_HANDLER[Error Handler<br/>Fault Tolerance]
    end

    subgraph "Enrichment Stage"
        API_ENRICHER[API Enricher<br/>External Data Fetching]
        AUTHORITY_LINKER[Authority Linker<br/>GND, VIAF, Wikidata]
        GEOCODER[Geospatial Enricher<br/>GeoNames Integration]
        METADATA_ADDER[Metadata Adder<br/>Processing Metadata]
        QUALITY_SCORER[Quality Scorer<br/>Data Quality Metrics]
    end

    subgraph "Output Stage"
        GRAPH_JSON[Graph JSON<br/>Node/Relationship Format]
        VALIDATION_REPORT[Validation Report<br/>Quality Assessment]
        STATISTICS_REPORT[Statistics Report<br/>Processing Metrics]
        ERROR_LOG[Error Log<br/>Issue Tracking]
    end

    XML_FILE --> XML_PARSER
    URL_INPUT --> XML_PARSER
    API_INPUT --> XML_PARSER

    XML_PARSER --> SCHEMA_VALIDATOR
    XML_PARSER --> NAMESPACE_RESOLVER
    XML_PARSER --> ENCODING_DETECTOR

    SCHEMA_VALIDATOR --> STRUCTURE_ANALYZER
    NAMESPACE_RESOLVER --> ELEMENT_COUNTER
    ENCODING_DETECTOR --> ATTRIBUTE_ANALYZER

    STRUCTURE_ANALYZER --> RELATIONSHIP_DETECTOR
    ELEMENT_COUNTER --> TEXT_ANALYZER
    ATTRIBUTE_ANALYZER --> RULE_ENGINE

    RELATIONSHIP_DETECTOR --> PROPERTY_MAPPER
    TEXT_ANALYZER --> RELATIONSHIP_MAPPER

    RULE_ENGINE --> TOKENIZER
    PROPERTY_MAPPER --> CONTEXT_INHERITOR
    RELATIONSHIP_MAPPER --> NODE_GENERATOR

    TOKENIZER --> RELATIONSHIP_GENERATOR
    CONTEXT_INHERITOR --> PROPERTY_SETTER

    NODE_GENERATOR --> VALIDATION_ENGINE
    RELATIONSHIP_GENERATOR --> ERROR_HANDLER
    PROPERTY_SETTER --> API_ENRICHER

    VALIDATION_ENGINE --> AUTHORITY_LINKER
    ERROR_HANDLER --> GEOCODER

    API_ENRICHER --> METADATA_ADDER
    AUTHORITY_LINKER --> QUALITY_SCORER
    GEOCODER --> GRAPH_JSON

    METADATA_ADDER --> VALIDATION_REPORT
    QUALITY_SCORER --> STATISTICS_REPORT
    GRAPH_JSON --> ERROR_LOG
```

## 10. Deployment Architecture

```mermaid
graph TD
    subgraph "Development Environment"
        DEV_LOCAL[Local Development<br/>npm run dev]
        DEV_DB[Local Databases<br/>Docker Compose]
        DEV_CACHE[Local Cache<br/>Redis/Memory]
    end

    subgraph "Staging Environment"
        STAGING_APP[Staging App<br/>Vercel Preview]
        STAGING_DB[Staging Databases<br/>Cloud Instances]
        STAGING_CACHE[Staging Cache<br/>Redis Cloud]
        STAGING_CI[CI/CD Pipeline<br/>GitHub Actions]
    end

    subgraph "Production Environment"
        PROD_APP[Production App<br/>Vercel Production]
        PROD_DB[Production Databases<br/>Managed Services]
        PROD_CACHE[Production Cache<br/>Redis Enterprise]
        PROD_CDN[CDN<br/>Vercel Edge Network]
        PROD_MONITOR[Monitoring<br/>Vercel Analytics]
    end

    subgraph "Infrastructure Components"
        LOAD_BALANCER[Load Balancer<br/>Vercel Edge]
        API_GATEWAY[API Gateway<br/>Next.js API Routes]
        DATABASE_PROXY[Database Proxy<br/>Connection Pooling]
        CACHE_CLUSTER[Cache Cluster<br/>Redis Cluster]
        FILE_STORAGE[File Storage<br/>Cloud Storage]
    end

    subgraph "Security & Compliance"
        AUTH_PROVIDER[Auth Provider<br/>NextAuth.js]
        API_KEYS[API Key Management<br/>Environment Variables]
        RATE_LIMITER[Rate Limiter<br/>Request Throttling]
        CORS[CORS Policy<br/>Domain Restrictions]
        SSL[SSL/TLS<br/>Automatic Certificates]
    end

    subgraph "External Services"
        GRAPH_DB_PROV[Graph DB Provider<br/>Memgraph Cloud/Neo4j Aura]
        AI_PROVIDERS[AI Providers<br/>OpenAI/Anthropic]
        RESEARCH_APIS[Research APIs<br/>CrossRef, ORCID, etc.]
        EMAIL_SERVICE[Email Service<br/>Transactional Email]
    end

    DEV_LOCAL --> DEV_DB
    DEV_LOCAL --> DEV_CACHE
    DEV_LOCAL --> STAGING_CI
    STAGING_CI --> STAGING_APP
    STAGING_APP --> STAGING_DB
    STAGING_APP --> STAGING_CACHE
    STAGING_APP --> PROD_APP
    PROD_APP --> PROD_DB
    PROD_APP --> PROD_CACHE
    PROD_APP --> PROD_CDN
    PROD_APP --> PROD_MONITOR

    PROD_APP --> LOAD_BALANCER
    LOAD_BALANCER --> API_GATEWAY
    API_GATEWAY --> DATABASE_PROXY
    DATABASE_PROXY --> CACHE_CLUSTER
    CACHE_CLUSTER --> FILE_STORAGE

    API_GATEWAY --> AUTH_PROVIDER
    API_GATEWAY --> API_KEYS
    API_GATEWAY --> RATE_LIMITER
    API_GATEWAY --> CORS
    API_GATEWAY --> SSL

    DATABASE_PROXY --> GRAPH_DB_PROV
    API_GATEWAY --> AI_PROVIDERS
    API_GATEWAY --> RESEARCH_APIS
    API_GATEWAY --> EMAIL_SERVICE

    style DEV_LOCAL fill:#e3f2fd
    style STAGING_APP fill:#fff8e1
    style PROD_APP fill:#e8f5e8
    style LOAD_BALANCER fill:#fce4ec
    style AUTH_PROVIDER fill:#f3e5f5
    style GRAPH_DB_PROV fill:#e1f5fe
```

## 11. Component Architecture (Model Builder Package)

```mermaid
graph TD
    subgraph "Core Components"
        MODEL_BUILDER[ModelBuilder<br/>Main Component]
        CANVAS[ModelBuilderCanvas<br/>ReactFlow Canvas]
        PALETTE[NodePalette<br/>Component Library]
        EDITOR[NodeEditor<br/>Property Editor]
    end

    subgraph "Wizard Components"
        XML_WIZARD[XmlImportWizard<br/>Multi-step Import]
        WF_BUILDER[WorkflowBuilder<br/>Visual Workflow Editor]
        MAPPING_CONFIG[XmlMappingConfigurator<br/>Mapping Rules]
    end

    subgraph "UI Primitives"
        DIALOG[Dialog Components<br/>Modals & Popups]
        FORM[Form Components<br/>Input Controls]
        TABLE[Table Components<br/>Data Display]
        CHART[Chart Components<br/>Visualizations]
        SIDEBAR[Sidebar Components<br/>Navigation]
    end

    subgraph "Specialized Components"
        AI_CHAT[AIChatbot<br/>Research Assistant]
        AI_SUGGESTIONS[AISuggestionPanel<br/>Contextual Help]
        WF_CANVAS[WorkflowCanvas<br/>Tool/Action Editor]
        DB_CONNECTOR[DatabaseConnector<br/>Connection Manager]
    end

    subgraph "Hooks & Utilities"
        USE_SCHEMA[useSchema Hooks<br/>Schema Management]
        USE_WORKFLOW[useWorkflow Hooks<br/>Workflow Logic]
        USE_XML[useXml Hooks<br/>XML Processing]
        USE_AI[useAi Hooks<br/>AI Integration]
        UTILS[Utility Functions<br/>Helper Methods]
    end

    subgraph "State Management"
        MODEL_STORE[modelBuilderStore<br/>Schema State]
        WF_STORE[workflowStore<br/>Workflow Steps]
        WF_CANVAS_STORE[workflowCanvasStore<br/>Visual State]
        XML_STORE[xmlImportWizardStore<br/>Import State]
    end

    MODEL_BUILDER --> CANVAS
    MODEL_BUILDER --> PALETTE
    MODEL_BUILDER --> EDITOR
    MODEL_BUILDER --> XML_WIZARD
    MODEL_BUILDER --> WF_BUILDER
    MODEL_BUILDER --> MAPPING_CONFIG

    CANVAS --> DIALOG
    PALETTE --> FORM
    EDITOR --> TABLE
    XML_WIZARD --> CHART
    WF_BUILDER --> SIDEBAR

    MODEL_BUILDER --> AI_CHAT
    MODEL_BUILDER --> AI_SUGGESTIONS
    MODEL_BUILDER --> WF_CANVAS
    MODEL_BUILDER --> DB_CONNECTOR

    CANVAS --> USE_SCHEMA
    XML_WIZARD --> USE_XML
    WF_BUILDER --> USE_WORKFLOW
    AI_CHAT --> USE_AI
    MODEL_BUILDER --> UTILS

    USE_SCHEMA --> MODEL_STORE
    USE_WORKFLOW --> WF_STORE
    WF_CANVAS --> WF_CANVAS_STORE
    USE_XML --> XML_STORE
    USE_AI --> MODEL_STORE
```

## 12. API Integration Patterns

```mermaid
graph TD
    subgraph "API Client Architecture"
        BASE_CLIENT[Base API Client<br/>Common Functionality]
        AUTHENTICATED_CLIENT[Authenticated Client<br/>API Key Management]
        GRAPHQL_CLIENT[GraphQL Client<br/>Query Support]
        REST_CLIENT[REST Client<br/>HTTP Methods]
        STREAMING_CLIENT[Streaming Client<br/>Real-time Data]
    end

    subgraph "Provider-Specific Clients"
        WIKIDATA_CLIENT[Wikidata Client<br/>Entity Lookup]
        EUROPEANA_CLIENT[Europeana Client<br/>Cultural Objects]
        ORCID_CLIENT[ORCID Client<br/>Researcher Profiles]
        GEONAMES_CLIENT[GeoNames Client<br/>Geographic Data]
        CROSSREF_CLIENT[CrossRef Client<br/>Publications]
    end

    subgraph "Data Processing Pipeline"
        REQUEST_BUILDER[Request Builder<br/>URL & Parameter Construction]
        AUTH_HANDLER[Authentication Handler<br/>Token/API Key Management]
        RESPONSE_PARSER[Response Parser<br/>JSON/XML Processing]
        ERROR_HANDLER[Error Handler<br/>Retry & Fallback Logic]
        DATA_NORMALIZER[Data Normalizer<br/>Schema Alignment]
    end

    subgraph "Caching & Optimization"
        MEMORY_CACHE[Memory Cache<br/>Request Deduplication]
        PERSISTENT_CACHE[Persistent Cache<br/>Cross-session Storage]
        RATE_LIMITER[Rate Limiter<br/>API Quota Management]
        COMPRESSION[Response Compression<br/>Bandwidth Optimization]
    end

    subgraph "Integration Points"
        WF_TOOLS[Workflow Tools<br/>tool:fetch-*]
        AI_AGENTS[AI Agents<br/>Data Enrichment]
        VALIDATION[Data Validation<br/>Quality Assurance]
        ENRICHMENT[Entity Enrichment<br/>Metadata Addition]
    end

    BASE_CLIENT --> AUTHENTICATED_CLIENT
    BASE_CLIENT --> GRAPHQL_CLIENT
    BASE_CLIENT --> REST_CLIENT
    BASE_CLIENT --> STREAMING_CLIENT

    AUTHENTICATED_CLIENT --> WIKIDATA_CLIENT
    AUTHENTICATED_CLIENT --> EUROPEANA_CLIENT
    AUTHENTICATED_CLIENT --> ORCID_CLIENT
    AUTHENTICATED_CLIENT --> GEONAMES_CLIENT
    REST_CLIENT --> CROSSREF_CLIENT

    WIKIDATA_CLIENT --> REQUEST_BUILDER
    EUROPEANA_CLIENT --> REQUEST_BUILDER
    ORCID_CLIENT --> REQUEST_BUILDER
    GEONAMES_CLIENT --> REQUEST_BUILDER
    CROSSREF_CLIENT --> REQUEST_BUILDER

    REQUEST_BUILDER --> AUTH_HANDLER
    AUTH_HANDLER --> RESPONSE_PARSER
    RESPONSE_PARSER --> ERROR_HANDLER
    ERROR_HANDLER --> DATA_NORMALIZER

    DATA_NORMALIZER --> MEMORY_CACHE
    DATA_NORMALIZER --> PERSISTENT_CACHE
    DATA_NORMALIZER --> RATE_LIMITER
    DATA_NORMALIZER --> COMPRESSION

    MEMORY_CACHE --> WF_TOOLS
    PERSISTENT_CACHE --> AI_AGENTS
    RATE_LIMITER --> VALIDATION
    COMPRESSION --> ENRICHMENT
```

## 13. Performance Optimization Patterns

```mermaid
graph TD
    subgraph "Caching Strategies"
        QUERY_CACHE[Query Result Cache<br/>Redis/Memory]
        API_CACHE[API Response Cache<br/>TTL-based]
        COMPUTATION_CACHE[Computation Cache<br/>Derived Data]
        SESSION_CACHE[Session Cache<br/>User State]
    end

    subgraph "Database Optimization"
        CONNECTION_POOL[Connection Pooling<br/>Resource Management]
        QUERY_OPTIMIZATION[Query Optimization<br/>EXPLAIN/PROFILE]
        INDEX_STRATEGY[Index Strategy<br/>Composite Indexes]
        PARTITIONING[Data Partitioning<br/>Scalability]
    end

    subgraph "Processing Optimization"
        PARALLEL_PROCESSING[Parallel Processing<br/>Worker Threads]
        BATCH_PROCESSING[Batch Processing<br/>Bulk Operations]
        LAZY_LOADING[Lazy Loading<br/>On-demand Data]
        STREAM_PROCESSING[Stream Processing<br/>Memory Efficient]
    end

    subgraph "Network Optimization"
        COMPRESSION[Response Compression<br/>GZIP/Brotli]
        CDN[CDN Integration<br/>Edge Caching]
        API_BATCHING[API Batching<br/>Request Consolidation]
        WEBSOCKETS[WebSocket Connections<br/>Real-time Updates]
    end

    subgraph "Code Optimization"
        CODE_SPLITTING[Code Splitting<br/>Bundle Optimization]
        TREE_SHAKING[Tree Shaking<br/>Dead Code Elimination]
        MEMOIZATION[Memoization<br/>Computation Caching]
        VIRTUALIZATION[Virtual Scrolling<br/>Large Dataset Handling]
    end

    QUERY_CACHE --> CONNECTION_POOL
    API_CACHE --> QUERY_OPTIMIZATION
    COMPUTATION_CACHE --> INDEX_STRATEGY
    SESSION_CACHE --> PARTITIONING

    CONNECTION_POOL --> PARALLEL_PROCESSING
    QUERY_OPTIMIZATION --> BATCH_PROCESSING
    INDEX_STRATEGY --> LAZY_LOADING
    PARTITIONING --> STREAM_PROCESSING

    PARALLEL_PROCESSING --> COMPRESSION
    BATCH_PROCESSING --> CDN
    LAZY_LOADING --> API_BATCHING
    STREAM_PROCESSING --> WEBSOCKETS

    COMPRESSION --> CODE_SPLITTING
    CDN --> TREE_SHAKING
    API_BATCHING --> MEMOIZATION
    WEBSOCKETS --> VIRTUALIZATION
```

## 14. Security Architecture

```mermaid
graph TD
    subgraph "Authentication"
        NEXTAUTH[NextAuth.js<br/>Multi-provider Auth]
        JWT_TOKENS[JWT Tokens<br/>Stateless Sessions]
        SESSION_MANAGEMENT[Session Management<br/>Secure Cookies]
        MFA[Multi-factor Auth<br/>Enhanced Security]
    end

    subgraph "Authorization"
        ROLE_BASED_ACCESS[Role-based Access<br/>RBAC System]
        PERMISSION_SYSTEM[Permission System<br/>Granular Control]
        API_ACCESS_CONTROL[API Access Control<br/>Endpoint Protection]
        DATA_LEVEL_SECURITY[Data-level Security<br/>Row-level Security]
    end

    subgraph "Data Protection"
        ENCRYPTION_AT_REST[Encryption at Rest<br/>Database Encryption]
        ENCRYPTION_IN_TRANSIT[Encryption in Transit<br/>TLS 1.3]
        API_KEY_ENCRYPTION[API Key Encryption<br/>Secure Storage]
        SENSITIVE_DATA_MASKING[Sensitive Data Masking<br/>PII Protection]
    end

    subgraph "Input Validation"
        REQUEST_VALIDATION[Request Validation<br/>Schema Validation]
        SANITIZATION[Input Sanitization<br/>XSS Prevention]
        RATE_LIMITING[Rate Limiting<br/>DoS Protection]
        SQL_INJECTION_PREVENTION[SQL Injection Prevention<br/>Parameterized Queries]
    end

    subgraph "Monitoring & Audit"
        SECURITY_LOGGING[Security Event Logging<br/>Audit Trails]
        INTRUSION_DETECTION[Intrusion Detection<br/>Anomaly Detection]
        VULNERABILITY_SCANNING[Vulnerability Scanning<br/>Automated Checks]
        COMPLIANCE_MONITORING[Compliance Monitoring<br/>Regulatory Requirements]
    end

    NEXTAUTH --> ROLE_BASED_ACCESS
    JWT_TOKENS --> PERMISSION_SYSTEM
    SESSION_MANAGEMENT --> API_ACCESS_CONTROL
    MFA --> DATA_LEVEL_SECURITY

    ROLE_BASED_ACCESS --> ENCRYPTION_AT_REST
    PERMISSION_SYSTEM --> ENCRYPTION_IN_TRANSIT
    API_ACCESS_CONTROL --> API_KEY_ENCRYPTION
    DATA_LEVEL_SECURITY --> SENSITIVE_DATA_MASKING

    ENCRYPTION_AT_REST --> REQUEST_VALIDATION
    ENCRYPTION_IN_TRANSIT --> SANITIZATION
    API_KEY_ENCRYPTION --> RATE_LIMITING
    SENSITIVE_DATA_MASKING --> SQL_INJECTION_PREVENTION

    REQUEST_VALIDATION --> SECURITY_LOGGING
    SANITIZATION --> INTRUSION_DETECTION
    RATE_LIMITING --> VULNERABILITY_SCANNING
    SQL_INJECTION_PREVENTION --> COMPLIANCE_MONITORING
```

---

## Usage Instructions

These Mermaid diagrams can be rendered in:

1. **GitHub/GitLab**: Direct rendering in Markdown files
2. **VS Code**: With Mermaid Preview extension
3. **Documentation Sites**: Like Docusaurus, MkDocs with Mermaid plugins
4. **Confluence**: With draw.io or Mermaid macros
5. **Presentation Tools**: PowerPoint, Google Slides with Mermaid add-ons

## Legend

- 🟦 **Client Layer**: User interface components
- 🟨 **API Layer**: Backend API endpoints
- 🟩 **Business Logic**: Core application logic
- 🟥 **Data Layer**: Database and storage systems
- 🟪 **External Services**: Third-party APIs and services

Each diagram is designed to be self-contained and can be used independently in presentations, documentation, or technical discussions about the GraphDBNext architecture.
 
