/**
 * @internal
 * 
 * This folder contains PRIVATE implementation details for XML to Graph conversion.
 * 
 * DO NOT import from this folder directly in application code.
 * Use XMLConverterService from @services/XMLConverterService instead.
 * 
 * These files are only exported for internal use by the service.
 */

// Internal implementation - only used by XMLConverterService
export { XMLToGraphConverter, convertXMLToGraph, isGraphNode, isGraphRelationship } from './converter'
export type { GraphNode, GraphRelationship, GraphElement } from './types'

// Internal helper classes (not part of public API)
export { ConverterContext } from './context'
export { ElementHelper } from './elementHelper'
export { NodeFactory } from './nodeFactory'
export { RelationFactory } from './relationFactory'
export { TextProcessor } from './textProcessor'
export { GraphWalker } from './graphWalker'
export { XMLParser } from './parser'

