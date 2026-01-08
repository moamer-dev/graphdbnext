import { useModelBuilderStore } from '../stores/modelBuilderStore'
import { exportToJson, exportToMarkdown, downloadFile } from '../utils/exportUtils'

export function useSchemaExport() {
  const { nodes, relationships, metadata, groups, relationshipTypes, selectedNode, selectedRelationship, hideUnconnectedNodes, rootNodeId, selectedOntologyId } = useModelBuilderStore()

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
      selectedOntologyId
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
      selectedOntologyId
    })
    const filename = metadata.name
      ? `${metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
      : 'schema.md'
    downloadFile(mdContent, filename, 'text/markdown')
  }

  const hasContent = nodes.length > 0 || relationships.length > 0

  return {
    exportToJsonFile,
    exportToMarkdownFile,
    hasContent
  }
}

