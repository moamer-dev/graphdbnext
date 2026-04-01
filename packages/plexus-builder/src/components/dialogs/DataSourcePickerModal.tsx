'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { ApiResponseViewer } from '../viewer/ApiResponseViewer'
import { useDataSourcesStore, DataSource } from '../../stores/dataSourcesStore'
import { Database, Search } from 'lucide-react'
import { Input } from '../ui/input'

interface DataSourcePickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (expression: string) => void
  title?: string
}

export function DataSourcePickerModal({
  open,
  onOpenChange,
  onSelect,
  title = 'Pick from Data Source'
}: DataSourcePickerModalProps) {
  const { sources, getAllSources } = useDataSourcesStore()
  const allSources = getAllSources({ type: ['JSON', 'API_RESPONSE'] })
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(
    allSources.length > 0 ? allSources[0].id : null
  )
  const [searchQuery, setSearchQuery] = useState('')

  const selectedSource = selectedSourceId ? sources[selectedSourceId] : null

  const handleFieldSelect = (path: string) => {
    if (selectedSource) {
      onSelect(`{{ $${selectedSource.name}.${path} }}`)
      onOpenChange(false)
    }
  }

  const filteredSources = allSources.filter((s: DataSource) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>
            Select a saved data source and pick a field to insert it into your configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sources..."
                className="pl-9 h-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="w-1/3">
            <Select
              value={selectedSourceId || ''}
              onValueChange={setSelectedSourceId}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Source" />
              </SelectTrigger>
              <SelectContent>
                {filteredSources.map((source: DataSource) => (
                  <SelectItem key={source.id} value={source.id} className="text-xs">
                    {source.name}
                  </SelectItem>
                ))}
                {filteredSources.length === 0 && (
                  <div className="p-2 text-xs text-muted-foreground italic">
                    No sources found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-hidden min-h-0 border rounded-lg bg-muted/5">
          {selectedSource ? (
            <ApiResponseViewer
              data={selectedSource.data}
              title={selectedSource.name}
              className="h-full border-0"
              onFieldSelect={handleFieldSelect}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Database className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-sm font-medium text-muted-foreground">No Data Source Selected</h3>
              <p className="text-xs text-muted-foreground/60 max-w-xs mt-1">
                Execute an API tool step and save it to see it here, or select one from the dropdown.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-md text-[11px] text-primary/80">
          <strong>Tip:</strong> The expression will be inserted as <code>{'{{ $source.path }}'}</code>. 
          Make sure your Output Alias in the tool configuration matches the source name.
        </div>
      </DialogContent>
    </Dialog>
  )
}
