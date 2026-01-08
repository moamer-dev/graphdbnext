import { useState, useRef, useEffect } from 'react'
import { useXmlImportWizardStore } from '../../stores/xmlImportWizardStore'
import { useXmlImport } from '../useXmlImport'

export function useXmlImportWizardUI() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [extracting, setExtracting] = useState(false)
  const [showStructure, setShowStructure] = useState(true)
  const [showMapping, setShowMapping] = useState(true)
  const [xmlPreview, setXmlPreview] = useState<string | null>(null)
  const [importingConfig, setImportingConfig] = useState(false)
  const [importingRules, setImportingRules] = useState(false)
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set())
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())

  const { setError: setWizardError } = useXmlImportWizardStore()
  const { error: hookError } = useXmlImport()

  useEffect(() => {
    if (hookError) {
      setWizardError(hookError)
    }
  }, [hookError, setWizardError])

  return {
    fileInputRef,
    extracting,
    setExtracting,
    showStructure,
    setShowStructure,
    showMapping,
    setShowMapping,
    xmlPreview,
    setXmlPreview,
    importingConfig,
    setImportingConfig,
    importingRules,
    setImportingRules,
    addingItems,
    setAddingItems,
    removingItems,
    setRemovingItems
  }
}

