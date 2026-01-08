// Main export
export { ModelBuilder } from './components/ModelBuilder'
export type { WorkflowPersistence, ModelBuilderProps } from './components/ModelBuilder'
export { ModelBuilderCanvas } from './components/canvas/ModelBuilderCanvas'
export { NodePalette } from './components/palette/NodePalette'
export { NodeEditor } from './components/editor/NodeEditor'
export { RelationshipEditor } from './components/editor/RelationshipEditor'
export { NodeGroupComponent } from './components/nodes/NodeGroup'
export { CanvasToolbar } from './components/canvas/CanvasToolbar'
export { XmlImportWizard } from './components/wizard/XmlImportWizard/XmlImportWizard'
export { XmlStructureViewer } from './components/wizard/XmlImportWizard/XmlStructureViewer'
export { XmlMappingConfigurator } from './components/wizard/XmlMappingConfigurator'
export { XmlAnalysisRulesConfigurator } from './components/wizard/XmlAnalysisRulesConfigurator'
export { XmlConversionPreview } from './components/viewer/XmlConversionPreview'
export { SaveWorkflowDialog } from './components/dialogs/SaveWorkflowDialog'
export { WorkflowChangeConfirmDialog } from './components/dialogs/WorkflowChangeConfirmDialog'

// UI Components
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './components/ui/dialog'
export { Button } from './components/ui/button'
export { Input } from './components/ui/input'
export { Label } from './components/ui/label'
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './components/ui/tooltip'

// Store
export { useModelBuilderStore } from './stores/modelBuilderStore'
export type { ModelBuilderStore } from './stores/modelBuilderStore'
export { useXmlImportWizardStore } from './stores/xmlImportWizardStore'
export type { XmlImportWizardStore, WizardStep } from './stores/xmlImportWizardStore'
export { useWorkflowStore } from './stores/workflowStore'
export type {
  WorkflowStep,
  WorkflowStepType,
  WorkflowStepKind,
  WorkflowStepGuard
} from './stores/workflowStore'
export { useToolCanvasStore } from './stores/toolCanvasStore'
export { useActionCanvasStore } from './stores/actionCanvasStore'

// Types
export type {
  Node,
  Relationship,
  Property,
  ModelBuilderState,
  NodeGroup,
  Schema
} from './types'

// Hooks
export * from './hooks'

// Services
export * from './services'

// Utils
export {
  convertBuilderToSchema,
  convertSchemaToBuilder,
  convertSchemaJsonToBuilder
} from './utils/schemaConverter'
export { parseMarkdownSchema, convertMarkdownSchemaToBuilder } from './utils/markdownParser'
export { exportToJson, exportToMarkdown } from './utils/exportUtils'

// XML Analysis
export { XmlAnalyzer } from './services/xmlAnalyzer'
export type {
  XmlStructureAnalysis,
  XmlElementType,
  XmlRelationshipPattern,
  XmlMappingConfig,
  XmlAnalysisRules
} from './services/xmlAnalyzer'

// XML Converter
export { XmlConverter, convertXmlToGraph } from './services/xmlConverter'
export { MappingValidator } from './services/mappingValidator'
export type {
  MappingConfig,
  SchemaJson,
  ConversionResult,
  ConversionError,
  ConversionWarning,
  ElementMapping,
  RelationshipMapping,
  TextContentRule
} from './types/mappingConfig'

// Utils
export {
  convertXmlMappingToGenericMapping,
  convertGenericMappingToXmlMapping
} from './utils/mappingConfigConverter'
export { convertBuilderToSchemaJson } from './utils/schemaJsonConverter'

// Workflow execution
export { executeWorkflow } from './services/workflowExecutor'
export { validateWorkflowAgainstSchema, validateGraphAgainstSchema } from './services/workflowValidator'
export { exportWorkflowConfig, importWorkflowConfig } from './utils/workflowConfigExport'
export type { WorkflowConfigExport } from './utils/workflowConfigExport'

// AI Settings
export { AISettingsProvider, useAISettings, useAIFeature } from './ai/config'
export { AISettingsPanel } from './components/ai/AISettingsPanel'
export { AIChatbot } from './components/ai/AIChatbot'
export type {
  AISettings,
  AIModelConfig,
  AIFeatureFlags,
  AIModelProvider,
  AIModelName,
  AISettingsStorage
} from './ai/config/types'
export { DEFAULT_AI_SETTINGS } from './ai/config/types'
export { LocalStorageAISettings, MemoryAISettings } from './ai/config/storage'

