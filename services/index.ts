/**
 * Centralized Services Export (Client-Safe)
 * 
 * This registry contains only services and types that are safe for use in the browser.
 * Code that depends on server-side modules (Prisma, PostgreSQL, Neo4j, OpenAI) 
 * has been moved to '@/services/server' to prevent build errors in Client Components.
 */

// Isomorphic/Client-Safe Services
export { ExportService } from './core/ExportService'
export { UpdateMutationService } from './core/UpdateMutationService'
export { GraphVisualizationService, type GraphNode, type GraphEdge, type GraphData } from './graph/GraphVisualizationService'
export { QueryBuilderService, type QueryNode, type QueryRelationship } from './graph/QueryBuilderService'
export { CustomVisualizationService, type VisualizationConfig } from './visualization/CustomVisualizationService'
export { GraphExportService } from './graph/GraphExportService'

// Type-only exports for server services (Safe for browser as they are removed during build)
export type { CollaborativeService } from './core/CollaborativeService'
export type { AIService, NLQueryRequest, NLQueryResponse, QuerySuggestion } from './ai/AIService'
export type { SchemaExplorerService, SchemaStatistics, SchemaNode, SchemaProperty, SchemaRelationship } from './graph/SchemaExplorerService'
export type { SchemaLoaderService, Schema } from './graph/SchemaLoaderService'
export type { GraphAnalyticsService } from './graph/GraphAnalyticsService'
export type { GraphComparisonService } from './graph/GraphComparisonService'
export type { MemgraphService } from './graph/MemgraphService'

// Resource Types
export type { User } from '@/resources/UserResource'
export type { Model } from '@/resources/ModelResource'
export type { SavedQuery } from '@/resources/SavedQueryResource'
