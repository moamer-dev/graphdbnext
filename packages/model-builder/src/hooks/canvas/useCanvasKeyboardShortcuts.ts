import { useEffect } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useWorkflowCanvasStore } from '../../stores/workflowCanvasStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'

interface UseCanvasKeyboardShortcutsProps {
  handleDeleteNode: (id: string, type?: 'model' | 'tool' | 'action') => void
  handleDeleteRelationship: (id: string) => void
}

export function useCanvasKeyboardShortcuts({
  handleDeleteNode,
  handleDeleteRelationship
}: UseCanvasKeyboardShortcutsProps) {
  const { 
    selectedNode, 
    selectedRelationship,
    selectNode,
    selectRelationship
  } = useModelBuilderStore()

  const { 
    selectedNodeId: selectedWfNodeId, 
    deleteNode: deleteWfNode,
    selectNode: selectWfNode
  } = useWorkflowCanvasStore()

  const { 
    selectedNodeId: selectedToolNodeId, 
    deleteNode: deleteToolNode,
    selectNode: selectToolNode
  } = useToolCanvasStore()

  const { 
    selectedNodeId: selectedActionNodeId, 
    deleteNode: deleteActionNode,
    selectNode: selectActionNode
  } = useActionCanvasStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && !event.defaultPrevented) {
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }

        if (selectedNode) {
          event.preventDefault()
          handleDeleteNode(selectedNode)
        } else if (selectedWfNodeId) {
          event.preventDefault()
          deleteWfNode(selectedWfNodeId)
          selectWfNode(null)
        } else if (selectedRelationship) {
          event.preventDefault()
          handleDeleteRelationship(selectedRelationship)
        } else if (selectedToolNodeId) {
          event.preventDefault()
          deleteToolNode(selectedToolNodeId)
          selectToolNode(null)
        } else if (selectedActionNodeId) {
          event.preventDefault()
          deleteActionNode(selectedActionNodeId)
          selectActionNode(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedNode, 
    selectedRelationship, 
    selectedWfNodeId, 
    selectedToolNodeId, 
    selectedActionNodeId, 
    handleDeleteRelationship, 
    deleteWfNode, 
    deleteToolNode, 
    deleteActionNode, 
    selectNode, 
    selectRelationship, 
    selectWfNode, 
    selectToolNode, 
    selectActionNode, 
    handleDeleteNode
  ])
}
