'use client'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Code, FileCode, BookOpen } from 'lucide-react'
import { useHtml } from '../hooks/util/useHtml'

export function HtmlView () {
  const { loading, convertToHTML } = useHtml()

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Code className="h-4 w-4" />
            <span className="relative">
              HTML Conversion
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
            </span>
          </h1>
          <p className="text-xs mt-1.5 text-muted-foreground/70">
            Convert graph data to HTML in different formats
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => convertToHTML('facsimile')}
              disabled={loading}
              variant="outline"
              size="sm"
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <div className="flex items-center gap-2 w-full">
                <FileCode className="h-4 w-4" />
                <span className="font-medium text-sm">Facsimile</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                Convert to facsimile HTML format
              </p>
            </Button>
            <Button
              onClick={() => convertToHTML('philology')}
              disabled={loading}
              variant="outline"
              size="sm"
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <div className="flex items-center gap-2 w-full">
                <BookOpen className="h-4 w-4" />
                <span className="font-medium text-sm">Philology</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                Convert to philology HTML format
              </p>
            </Button>
          </div>
          <Alert className="py-2 bg-muted/30 border-border/40">
            <AlertDescription className="text-xs">
              <strong>Note:</strong> Full HTML generation logic needs to be ported from Python graph2html.py
            </AlertDescription>
          </Alert>
      </div>
    </div>
  )
}
