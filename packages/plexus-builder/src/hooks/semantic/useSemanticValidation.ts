'use client'

import { useMemo } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'

export interface ValidationReport {
  overallValid: boolean
  ontologyId: string | null
  nodeStatus: Array<{
    id: string
    label: string
    valid: boolean
    classMapped: boolean
    propertiesTotal: number
    propertiesMapped: number
    missingProperties: string[]
  }>
  relationshipStatus: Array<{
    id: string
    type: string
    from: string
    to: string
    valid: boolean
    mapped: boolean
  }>
}

export function useSemanticValidation() {
  const { nodes, relationships, selectedOntologyId, isSemanticEnabled } = useModelBuilderStore()

  const report = useMemo<ValidationReport>(() => {
    const nodeStatus = nodes.map(node => {
      const semantic = (node.data as any)?.semantic
      const classMapped = !!semantic?.classIri
      
      const properties = node.properties || []
      const propertySemantics = (node.data as any)?.propertySemantics || {}
      
      const missingProperties: string[] = []
      let propertiesMapped = 0
      
      properties.forEach(prop => {
        if (propertySemantics[prop.key]?.propertyIri) {
          propertiesMapped++
        } else {
          missingProperties.push(prop.key)
        }
      });

      return {
        id: node.id,
        label: node.label,
        valid: classMapped && missingProperties.length === 0,
        classMapped,
        propertiesTotal: properties.length,
        propertiesMapped,
        missingProperties
      }
    })

    const relationshipStatus = relationships.map(rel => {
      const semantic = (rel.data as any)?.semantic
      const mapped = !!semantic?.propertyIri

      return {
        id: rel.id,
        type: rel.type,
        from: nodes.find(n => n.id === rel.from)?.label || 'Deleted Node',
        to: nodes.find(n => n.id === rel.to)?.label || 'Deleted Node',
        valid: mapped,
        mapped
      }
    })

    const allNodesValid = nodeStatus.every(s => s.valid)
    const allRelationshipsValid = relationshipStatus.every(s => s.valid)
    const ontologySelected = !!selectedOntologyId

    return {
      overallValid: ontologySelected && allNodesValid && allRelationshipsValid,
      ontologyId: selectedOntologyId,
      nodeStatus,
      relationshipStatus
    }
  }, [nodes, relationships, selectedOntologyId])

  return {
    report,
    isSemanticEnabled,
    nodes,
    relationships
  }
}
