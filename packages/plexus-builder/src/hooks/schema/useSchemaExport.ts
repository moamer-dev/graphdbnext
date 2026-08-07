import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { exportToJson, exportToMarkdown, downloadFile } from '../../utils/exportUtils'
import { exportToRdf, exportToTtl } from '../../utils/rdfExportUtils'

export function useSchemaExport() {
  const { nodes, relationships, metadata, groups, relationshipTypes, selectedNode, selectedRelationship, hideUnconnectedNodes, rootNodeId, selectedOntologyId, locale } = useModelBuilderStore()

  const exportToJsonFile = () => {
    const jsonContent = exportToJson({
      nodes,
      relationships,
      metadata,
      groups,
      relationshipTypes,
      selectedNode,
      selectedRelationship,
      hideUnconnectedNodes,
      rootNodeId,
      selectedOntologyId,
      locale
    })
    const filename = metadata.name
      ? `${metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
      : 'schema.json'
    downloadFile(jsonContent, filename, 'application/json')
  }

  const exportToMarkdownFile = () => {
    const mdContent = exportToMarkdown({
      nodes,
      relationships,
      metadata,
      groups,
      relationshipTypes,
      selectedNode,
      selectedRelationship,
      hideUnconnectedNodes,
      rootNodeId,
      selectedOntologyId,
      locale
    })
    const filename = metadata.name
      ? `${metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
      : 'schema.md'
    downloadFile(mdContent, filename, 'text/markdown')
  }

  const exportToRdfFile = () => {
    const rdfContent = exportToRdf({
      nodes, relationships, metadata, groups, relationshipTypes, selectedNode, selectedRelationship, hideUnconnectedNodes, rootNodeId, selectedOntologyId, locale
    })
    const filename = metadata.name
      ? `${metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.rdf`
      : 'schema.rdf'
    downloadFile(rdfContent, filename, 'application/rdf+xml')
  }

  const exportToTtlFile = () => {
    const ttlContent = exportToTtl({
      nodes, relationships, metadata, groups, relationshipTypes, selectedNode, selectedRelationship, hideUnconnectedNodes, rootNodeId, selectedOntologyId, locale
    })
    const filename = metadata.name
      ? `${metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ttl`
      : 'schema.ttl'
    downloadFile(ttlContent, filename, 'text/turtle')
  }

  const hasContent = nodes.length > 0 || relationships.length > 0

  return {
    exportToJsonFile,
    exportToMarkdownFile,
    exportToRdfFile,
    exportToTtlFile,
    hasContent
  }
}

