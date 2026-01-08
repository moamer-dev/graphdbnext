import { Schema, SchemaNode, SchemaRelation } from './SchemaLoaderService';

interface GraphNode {
  id: number;
  type: 'node';
  labels?: string[];
  properties?: Record<string, unknown>;
}

interface GraphRelationship {
  id: number;
  type: 'relationship';
  label: string;
  start: number;
  end: number;
  properties?: Record<string, unknown>;
}

type GraphElement = GraphNode | GraphRelationship;

export interface ValidationError {
  elementId: number;
  elementType: 'node' | 'relationship';
  errorType: 'invalid_type' | 'invalid_label' | 'missing_superclass' | 'invalid_property' | 'missing_property' | 'invalid_relation' | 'missing_node';
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  stats: {
    totalElements: number;
    totalNodes: number;
    totalRelations: number;
    validatedNodes: number;
    validatedRelations: number;
  };
}

const DATATYPES: Record<string, (value: unknown) => boolean> = {
  boolean: (v) => typeof v === 'boolean',
  integer: (v) => typeof v === 'number' && Number.isInteger(v),
  float: (v) => typeof v === 'number',
  string: (v) => typeof v === 'string',
  URI: (v) => typeof v === 'string',
}

export class SchemaValidatorService {
  private schema: Schema;
  private nodeMap: Map<number, GraphNode> = new Map();
  private validLabels: Set<string> = new Set();

  constructor(schema: Schema) {
    this.schema = schema;
    // Build set of all valid labels (including superclasses)
    this.buildValidLabelsSet();
  }

  private buildValidLabelsSet(): void {
    // Add all top-level node names
    for (const nodeName of Object.keys(this.schema.nodes)) {
      this.validLabels.add(nodeName);
    }
    
    // Add all superclass names from all nodes
    for (const node of Object.values(this.schema.nodes)) {
      for (const superclassName of node.superclassNames) {
        this.validLabels.add(superclassName);
      }
    }
  }

  validate(graph: GraphElement[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    
    // Build node map for quick lookup
    this.nodeMap.clear();
    for (const elem of graph) {
      if (elem.type === 'node') {
        this.nodeMap.set(elem.id, elem);
      }
    }

    let validatedNodes = 0;
    let validatedRelations = 0;

    for (const elem of graph) {
      if (elem.type === 'node') {
        validatedNodes++;
        this.validateNode(elem, errors);
      } else if (elem.type === 'relationship') {
        validatedRelations++;
        this.validateRelation(elem, errors);
      } else {
        // This should never happen with proper typing, but handle it gracefully
        const elemAsRecord = elem as Record<string, unknown>;
        const elemId = (typeof elemAsRecord.id === 'number') ? elemAsRecord.id : 0;
        const elemType = (typeof elemAsRecord.type === 'string') ? elemAsRecord.type : 'unknown';
        errors.push({
          elementId: elemId,
          elementType: (elemType === 'node' || elemType === 'relationship') ? elemType : 'node',
          errorType: 'invalid_type',
          message: `Invalid type "${elemType}" (id: ${elemId})`,
        });
      }
    }

    // Check for unused nodes/relations
    this.checkUnusedNodesAndRelations(graph, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalElements: graph.length,
        totalNodes: graph.filter(e => e.type === 'node').length,
        totalRelations: graph.filter(e => e.type === 'relationship').length,
        validatedNodes,
        validatedRelations,
      },
    };
  }

  private validateNode(node: GraphNode, errors: ValidationError[]): void {
    const labels = node.labels || [];
    
    if (labels.length === 0) {
      errors.push({
        elementId: node.id,
        elementType: 'node',
        errorType: 'invalid_label',
        message: `Node (id: ${node.id}) has no labels`,
      });
      return;
    }

    // Find the most specific label (the last label that is a top-level node)
    let mostSpecificLabel: string | null = null;
    for (let i = labels.length - 1; i >= 0; i--) {
      if (this.schema.nodes[labels[i]]) {
        mostSpecificLabel = labels[i];
        break;
      }
    }

    // Validate each label
    for (const label of labels) {
      // Check if label is valid (either a top-level node or a superclass)
      if (!this.validLabels.has(label)) {
        errors.push({
          elementId: node.id,
          elementType: 'node',
          errorType: 'invalid_label',
          message: `Invalid label "${label}" for node (id: ${node.id})`,
          details: { label },
        });
        continue;
      }

      // Only validate properties and superclasses if this is a top-level node definition
      const schemaNode = this.schema.nodes[label];
      if (schemaNode) {
        // Check for missing superclasses
        for (const superclassName of schemaNode.superclassNames) {
          if (!labels.includes(superclassName)) {
            errors.push({
              elementId: node.id,
              elementType: 'node',
              errorType: 'missing_superclass',
              message: `Label "${superclassName}" missing for node (id: ${node.id})`,
              details: { label, missingSuperclass: superclassName },
            });
          }
        }

        // Only validate required properties for the most specific label
        // This prevents false positives where a superclass requires a property
        // but the concrete type doesn't
        if (label === mostSpecificLabel) {
          this.validateNodeProperties(node, schemaNode, errors);
        }
      }
      // If label is only a superclass (not a top-level node), skip property validation
    }

    // Check for invalid properties
    // A property is valid if it's defined in ANY of the node's labels (including superclasses)
    for (const propName of Object.keys(node.properties || {})) {
      let validProperty = false;
      // Check all labels (including superclasses, recursively)
      const allLabels = new Set<string>(labels);
      
      // Recursively add all superclasses
      const addSuperclasses = (label: string) => {
        const schemaNode = this.schema.nodes[label];
        if (schemaNode) {
          for (const superclassName of schemaNode.superclassNames) {
            if (!allLabels.has(superclassName)) {
              allLabels.add(superclassName);
              // Recursively add superclasses of superclasses
              addSuperclasses(superclassName);
            }
          }
        }
      };
      
      // Add superclasses for all labels
      for (const label of labels) {
        addSuperclasses(label);
      }
      
      // Check if property exists in any label (including superclasses)
      for (const label of allLabels) {
        if (this.schema.nodes[label]?.properties[propName]) {
          validProperty = true;
          break;
        }
      }
      
      if (!validProperty) {
        errors.push({
          elementId: node.id,
          elementType: 'node',
          errorType: 'invalid_property',
          message: `Invalid property "${propName}" for node (id: ${node.id})`,
          details: { property: propName },
        });
      }
    }
  }

  private validateNodeProperties(node: GraphNode, schemaNode: SchemaNode, errors: ValidationError[]): void {
    for (const [propName, schemaProp] of Object.entries(schemaNode.properties)) {
      const propValue = node.properties?.[propName];
      
      if (propValue === undefined || propValue === null) {
        if (schemaProp.required) {
          errors.push({
            elementId: node.id,
            elementType: 'node',
            errorType: 'missing_property',
            message: `Property "${propName}" missing for node (id: ${node.id})`,
            details: { property: propName },
          });
        }
        continue;
      }

      // Validate datatype
      if (schemaProp.datatype && DATATYPES[schemaProp.datatype]) {
        if (!DATATYPES[schemaProp.datatype](propValue)) {
          errors.push({
            elementId: node.id,
            elementType: 'node',
            errorType: 'invalid_property',
            message: `Invalid value for property "${propName}" for node (id: ${node.id}): expected ${schemaProp.datatype}, got ${typeof propValue}`,
            details: { property: propName, expectedType: schemaProp.datatype, actualValue: propValue },
          });
        }
      }

      // Validate allowed values
      if (schemaProp.values.length > 0 && typeof propValue === 'string' && !schemaProp.values.includes(propValue)) {
        errors.push({
          elementId: node.id,
          elementType: 'node',
          errorType: 'invalid_property',
          message: `Invalid value for property "${propName}" for node (id: ${node.id}): "${propValue}" not in allowed values [${schemaProp.values.join(', ')}]`,
          details: { property: propName, value: propValue, allowedValues: schemaProp.values },
        });
      }
    }
  }

  private validateRelation(relation: GraphRelationship, errors: ValidationError[]): void {
    const label = String(relation.label);
    
    if (!this.schema.relations[label]) {
      errors.push({
        elementId: relation.id,
        elementType: 'relationship',
        errorType: 'invalid_label',
        message: `Invalid label "${label}" for relationship (id: ${relation.id})`,
        details: { label },
      });
      return;
    }

    const schemaRelation = this.schema.relations[label];

    // Validate properties
    this.validateRelationProperties(relation, schemaRelation, errors);

    // Validate domain/range (start/end nodes)
    const startNode = this.nodeMap.get(relation.start);
    const endNode = this.nodeMap.get(relation.end);

    if (!startNode) {
      errors.push({
        elementId: relation.id,
        elementType: 'relationship',
        errorType: 'missing_node',
        message: `Missing start node (id: ${relation.start}) for relationship "${label}" (id: ${relation.id})`,
        details: { nodeId: relation.start },
      });
      return;
    }

    if (!endNode) {
      errors.push({
        elementId: relation.id,
        elementType: 'relationship',
        errorType: 'missing_node',
        message: `Missing end node (id: ${relation.end}) for relationship "${label}" (id: ${relation.id})`,
        details: { nodeId: relation.end },
      });
      return;
    }

    // Check if the relation is valid between these node types
    let validRelation = false;
    
    // If domains is empty, the relation can connect any nodes (e.g., annotates, mentions)
    if (Object.keys(schemaRelation.domains).length === 0) {
      validRelation = true;
    } else {
      // Check if start node matches any domain and end node matches allowed targets
      for (const startLabel of startNode.labels || []) {
        if (schemaRelation.domains[startLabel]) {
          const allowedTargets = schemaRelation.domains[startLabel];
          const endLabels = endNode.labels || [];
          
          // If allowedTargets is empty, any target is allowed
          if (allowedTargets.length === 0 || endLabels.some((endLabel: string) => allowedTargets.includes(endLabel))) {
            validRelation = true;
            break;
          }
        }
      }
    }

    if (!validRelation) {
      errors.push({
        elementId: relation.id,
        elementType: 'relationship',
        errorType: 'invalid_relation',
        message: `Invalid start/end for relationship "${label}" (id: ${relation.id})`,
        details: {
          startLabels: startNode.labels,
          endLabels: endNode.labels,
          allowedDomains: Object.keys(schemaRelation.domains),
        },
      });
    }
  }

  private validateRelationProperties(relation: GraphRelationship, schemaRelation: SchemaRelation, errors: ValidationError[]): void {
    for (const [propName, schemaProp] of Object.entries(schemaRelation.properties)) {
      const propValue = relation.properties?.[propName];
      
      if (propValue === undefined || propValue === null) {
        if (schemaProp.required) {
          errors.push({
            elementId: relation.id,
            elementType: 'relationship',
            errorType: 'missing_property',
            message: `Property "${propName}" missing for relationship "${relation.label}" (id: ${relation.id})`,
            details: { property: propName },
          });
        }
        continue;
      }

      // Validate datatype
      if (schemaProp.datatype && DATATYPES[schemaProp.datatype]) {
        if (!DATATYPES[schemaProp.datatype](propValue)) {
          errors.push({
            elementId: relation.id,
            elementType: 'relationship',
            errorType: 'invalid_property',
            message: `Invalid value for property "${propName}" for relationship "${relation.label}" (id: ${relation.id}): expected ${schemaProp.datatype}, got ${typeof propValue}`,
            details: { property: propName, expectedType: schemaProp.datatype, actualValue: propValue },
          });
        }
      }

      // Validate allowed values
      if (schemaProp.values.length > 0 && typeof propValue === 'string' && !schemaProp.values.includes(propValue)) {
        errors.push({
          elementId: relation.id,
          elementType: 'relationship',
          errorType: 'invalid_property',
          message: `Invalid value for property "${propName}" for relationship "${relation.label}" (id: ${relation.id}): "${propValue}" not in allowed values [${schemaProp.values.join(', ')}]`,
          details: { property: propName, value: propValue, allowedValues: schemaProp.values },
        });
      }
    }
  }

  private checkUnusedNodesAndRelations(graph: GraphElement[], warnings: string[]): void {
    const usedNodes = new Set<string>();
    const usedRelations = new Set<string>();

    for (const elem of graph) {
      if (elem.type === 'node') {
        for (const label of elem.labels || []) {
          usedNodes.add(label);
        }
      } else if (elem.type === 'relationship') {
        usedRelations.add(String(elem.label));
      }
    }

    for (const nodeName of Object.keys(this.schema.nodes)) {
      if (!usedNodes.has(nodeName)) {
        warnings.push(`Unused node "${nodeName}"`);
      }
    }

    for (const relationName of Object.keys(this.schema.relations)) {
      if (!usedRelations.has(relationName)) {
        warnings.push(`Unused relation "${relationName}"`);
      }
    }
  }
}

// Backward compatibility export
export { SchemaValidatorService as SchemaValidator }