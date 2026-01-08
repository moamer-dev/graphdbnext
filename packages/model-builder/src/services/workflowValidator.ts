import type { WorkflowStep } from '../stores/workflowStore'
import type { SchemaJson } from '../types/mappingConfig'
import type { GraphJson } from './workflowExecutor'
import type { Node as BuilderNode } from '../types'

export interface ValidationIssue {
  type: 'error' | 'warning'
  message: string
}

export function validateWorkflowAgainstSchema (
  stepsByNodeId: Record<string, WorkflowStep[]>,
  nodes: BuilderNode[],
  schema: SchemaJson
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  Object.entries(stepsByNodeId).forEach(([nodeId, steps]) => {
    const node = nodeById.get(nodeId)
    steps.forEach((step) => {
      if (step.type === 'create-node') {
        const label = node?.label
        if (label && !schema.nodes?.[label]) {
          issues.push({
            type: 'warning',
            message: `Node "${label}" workflow creates node not found in schema`
          })
        }
      }
      if (step.type === 'create-relationship') {
        const relType = step.config.relationshipType
        if (relType && !schema.relations?.[relType]) {
          issues.push({
            type: 'warning',
            message: `Workflow uses relationship "${relType}" not found in schema`
          })
        }
      }
    })
  })
  return issues
}

export function validateGraphAgainstSchema (graph: GraphJson, schema: SchemaJson): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const nodes = graph.filter((n: any) => n.type === 'node') as Array<{ id: number; labels: string[]; properties: Record<string, unknown> }>
  const rels = graph.filter((n: any) => n.type === 'relationship') as Array<{ id: number; label: string; start: number; end: number; properties: Record<string, unknown> }>

  nodes.forEach((node) => {
    const primary = node.labels[0]
    const schemaNode = schema.nodes?.[primary]
    if (!schemaNode) {
      issues.push({ type: 'warning', message: `Node ${node.id} label "${primary}" not in schema` })
      return
    }
    Object.entries(schemaNode.properties || {}).forEach(([key, prop]) => {
      if (prop.required && !(key in node.properties)) {
        issues.push({ type: 'warning', message: `Node ${node.id} missing required property "${key}"` })
      }
    })
  })

  rels.forEach((rel) => {
    const schemaRel = schema.relations?.[rel.label]
    if (!schemaRel) {
      issues.push({ type: 'warning', message: `Relationship ${rel.id} type "${rel.label}" not in schema` })
      return
    }
    validateDomain(rel, nodes, schemaRel, issues)
  })

  return issues
}

function validateDomain (
  rel: { start: number; end: number; label: string },
  nodes: Array<{ id: number; labels: string[] }>,
  schemaRel: SchemaJson['relations'][string],
  issues: ValidationIssue[]
) {
  const from = nodes.find((n) => n.id === rel.start)
  const to = nodes.find((n) => n.id === rel.end)
  if (!from || !to) {
    issues.push({ type: 'warning', message: `Relationship ${rel.label} references missing nodes` })
    return
  }
  const fromLabel = from.labels[0]
  const toLabel = to.labels[0]
  const allowedTargets = schemaRel?.domains?.[fromLabel] || []
  if (!allowedTargets.includes(toLabel)) {
    issues.push({
      type: 'warning',
      message: `Relationship ${rel.label} domain mismatch: ${fromLabel} -> ${toLabel}`
    })
  }
}

