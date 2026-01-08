'use client'

import ValidationPanel from '@/app/dashboard/(components)/convert/ValidationPanel'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { FileText, Loader2, Upload, Database, Download, ChevronDown, ChevronRight } from 'lucide-react'
import { useConvert } from '../../hooks/util/useConvert'

export function ConvertView () {
  const {
    loading,
    convertedGraph,
    previewExpanded,
    stats,
    handleFileUpload,
    downloadConvertedJSON,
    loadToDatabase,
    togglePreview
  } = useConvert()

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="relative">
              XML to Graph Conversion
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
            </span>
          </h1>
          <p className="text-xs mt-1.5 text-muted-foreground/70">
            Upload and convert XML files to graph JSON format
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="border-2 border-dashed border-border/40 rounded-md p-6 text-center bg-muted/20 backdrop-blur-sm">
            <input
              type="file"
              accept=".xml"
              onChange={handleFileUpload}
              disabled={loading}
              className="hidden"
              id="xml-upload"
            />
            <label
              htmlFor="xml-upload"
              className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                loading
                  ? 'bg-muted cursor-not-allowed opacity-50'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload XML File
                </>
              )}
            </label>
            <p className="mt-3 text-xs text-muted-foreground">
              Select an XML file to convert to graph JSON format
            </p>
          </div>

        {convertedGraph && stats && (
          <>
            <Separator className="opacity-30" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Conversion Results</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={loadToDatabase}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-border/40 bg-muted/30 hover:bg-muted/50 backdrop-blur-sm"
                  >
                    <Database className="h-3 w-3 mr-1.5" />
                    Load to DB
                  </Button>
                  <Button
                    onClick={downloadConvertedJSON}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-border/40 bg-muted/30 hover:bg-muted/50 backdrop-blur-sm"
                  >
                    <Download className="h-3 w-3 mr-1.5" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 p-3 bg-muted/20 rounded-md border border-border/20 backdrop-blur-sm">
                  <div className="text-xl font-bold text-primary">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total Elements</div>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-muted/20 rounded-md border border-border/20 backdrop-blur-sm">
                  <div className="text-xl font-bold text-green-600">{stats.nodes}</div>
                  <div className="text-xs text-muted-foreground">Nodes</div>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-muted/20 rounded-md border border-border/20 backdrop-blur-sm">
                  <div className="text-xl font-bold text-purple-600">{stats.relationships}</div>
                  <div className="text-xs text-muted-foreground">Relationships</div>
                </div>
              </div>
              <Button
                onClick={togglePreview}
                variant="ghost"
                size="sm"
                className="w-full justify-between h-8 text-xs hover:bg-muted/40"
              >
                <span>JSON Preview</span>
                {previewExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
              {previewExpanded && (
                <div className="p-3 bg-muted/30 rounded-md max-h-64 overflow-auto border border-border/30 backdrop-blur-sm">
                  <pre className="text-xs font-mono">
                    {JSON.stringify(convertedGraph.slice(0, 10), null, 2)}
                    {convertedGraph.length > 10 && (
                      <span className="text-muted-foreground">
                        {'\n\n... and ' + (convertedGraph.length - 10) + ' more elements'}
                      </span>
                    )}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}

        {convertedGraph && (
          <>
            <Separator className="opacity-30" />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Schema Validation</h3>
              <ValidationPanel graph={convertedGraph as unknown as Array<Record<string, unknown>>} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
