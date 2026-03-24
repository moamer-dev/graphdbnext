import { useState, useRef } from 'react'

export function useModelBuilderUI() {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [workflowConfigDialogOpen, setWorkflowConfigDialogOpen] = useState(false)
  const [workflowConfigFile, setWorkflowConfigFile] = useState<File | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [nodesSidebarOpen, setNodesSidebarOpen] = useState(true)
  const [runDialogOpen, setRunDialogOpen] = useState(false)
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false)
  const [xmlFile, setXmlFile] = useState<File | null>(null)
  const [running, setRunning] = useState(false)
  const [executionProgress, setExecutionProgress] = useState<{ current: number; total: number; currentStep?: string } | null>(null)
  const [graphPreview, setGraphPreview] = useState<{
    items: Array<Record<string, unknown>>
    fullGraph: Array<Record<string, unknown>>
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const focusNodeFnRef = useRef<((id: string) => void) | null>(null)
  const focusRelationshipFnRef = useRef<((fromId: string, toId: string) => void) | null>(null)

  return {
    importDialogOpen,
    setImportDialogOpen,
    importFile,
    setImportFile,
    workflowConfigDialogOpen,
    setWorkflowConfigDialogOpen,
    workflowConfigFile,
    setWorkflowConfigFile,
    sidebarOpen,
    setSidebarOpen,
    nodesSidebarOpen,
    setNodesSidebarOpen,
    runDialogOpen,
    setRunDialogOpen,
    credentialsDialogOpen,
    setCredentialsDialogOpen,
    xmlFile,
    setXmlFile,
    running,
    setRunning,
    executionProgress,
    setExecutionProgress,
    graphPreview,
    setGraphPreview,
    fileInputRef,
    focusNodeFnRef,
    focusRelationshipFnRef
  }
}

