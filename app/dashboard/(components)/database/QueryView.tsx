'use client'

import { useCallback, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Label } from '@/components/ui/label'
import { Play, BookOpen, Wrench, Code, FileText, Loader2, Sparkles } from 'lucide-react'
import { useAISettings } from '../../hooks/settings/useAISettings'
import { useQueryView } from '../../hooks/query/useQueryView'
import { SavedQueries } from './SavedQueries'
import { QueryBuilder } from './QueryBuilder'
import { QueryResults } from './QueryResults'
import { ChatAgent } from './ChatAgent'
import { cn } from '@/lib/utils'

type QueryMode = 'library' | 'builder' | 'cypher' | 'agent'

export function QueryView() {
  const { settings: aiSettings, loading: aiSettingsLoading } = useAISettings()
  const {
    mounted,
    activeMode,
    loading: queryLoading,
    query,
    setQuery,
    queryResults,
    cypherQueryForBuilder,
    handleModeChange,
    handleQuerySelect,
    handleExecuteFromBuilder,
    handleExecuteCypher,
    executeQuery
  } = useQueryView()

  const loading = queryLoading // Alias back to loading for existing code

  const modes: Array<{ id: QueryMode; label: string; icon: typeof BookOpen; description: string }> = useMemo(() => {
    const allModes: Array<{ id: QueryMode; label: string; icon: typeof BookOpen; description: string }> = [
      { id: 'library', label: 'Library', icon: BookOpen, description: 'Pre-built queries' },
      { id: 'builder', label: 'Query Builder', icon: Wrench, description: 'Build custom queries' },
      { id: 'cypher', label: 'Cypher Editor', icon: Code, description: 'Write Cypher directly' }
    ]

    if (aiSettings.enabled && aiSettings.features.queryAiAgent) {
      allModes.push({ id: 'agent', label: 'AI Agent', icon: Sparkles, description: 'Ask in natural language' })
    }

    return allModes
  }, [aiSettings])

  const handleCypherChange = useCallback((val: string) => {
    setQuery(val)
  }, [setQuery])

  const cypherLanguage = useMemo(() => {
    const cypherKeywords = [
      'MATCH', 'WHERE', 'RETURN', 'CREATE', 'DELETE', 'SET', 'REMOVE', 'MERGE',
      'WITH', 'UNWIND', 'CALL', 'YIELD', 'ORDER', 'BY', 'LIMIT', 'SKIP',
      'DISTINCT', 'AS', 'AND', 'OR', 'NOT', 'XOR', 'IN', 'STARTS', 'ENDS',
      'CONTAINS', 'IS', 'NULL', 'TRUE', 'FALSE', 'CASE', 'WHEN', 'THEN',
      'ELSE', 'END', 'OPTIONAL', 'USING', 'INDEX', 'CONSTRAINT', 'ON',
      'ASSERT', 'DROP', 'EXISTS', 'UNIQUE', 'REQUIRE', 'SCAN', 'SHOW',
      'FOREACH', 'DETACH', 'LOAD', 'CSV', 'FROM', 'HEADERS', 'FIELDTERMINATOR',
      'PERIODIC', 'COMMIT', 'USING', 'PERIODIC', 'COMMIT', 'FOREACH', 'IN',
      'CREATE', 'INDEX', 'ON', 'DROP', 'INDEX', 'ON', 'CREATE', 'CONSTRAINT',
      'ON', 'DROP', 'CONSTRAINT', 'ON', 'ASSERT', 'EXISTS', 'ON', 'ASSERT',
      'UNIQUE', 'ON', 'ASSERT', 'REQUIRE', 'ON', 'SHOW', 'INDEXES', 'SHOW',
      'CONSTRAINTS', 'SHOW', 'PROCEDURES', 'SHOW', 'FUNCTIONS', 'SHOW',
      'TRANSACTIONS', 'SHOW', 'USERS', 'SHOW', 'ROLES', 'SHOW', 'PRIVILEGES'
    ]

    return StreamLanguage.define({
      token: (stream) => {
        if (stream.eatSpace()) return null
        if (stream.match(/^\/\/.*/)) return 'comment'
        if (stream.match(/^\/\*[\s\S]*?\*\//)) return 'comment'
        if (stream.match(/^"([^"\\]|\\.)*"/)) return 'string'
        if (stream.match(/^'([^'\\]|\\.)*'/)) return 'string'
        if (stream.match(/^\d+\.\d+/)) return 'number'
        if (stream.match(/^\d+/)) return 'number'
        if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
          const word = stream.current().toUpperCase()
          if (cypherKeywords.includes(word)) {
            return 'keyword'
          }
          return 'variable'
        }
        if (stream.match(/^[(){}\[\],.;:=+\-*/%<>!&|]/)) return 'operator'
        stream.next()
        return null
      }
    })
  }, [])

  // Prevent hydration mismatch by only rendering ResizablePanelGroup after mount
  if (!mounted) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <ResizablePanelGroup
        id="query-view-panel-group"
        direction="horizontal"
        className="h-full"
      >
        {/* Sidebar: Query Options */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="border-r border-border/30 bg-muted/10 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            {/* Mode Selector */}
            <div className="gradient-header-minimal p-4">
              <h2 className="text-sm font-semibold mb-1">Query Options</h2>
              <p className="text-xs text-muted-foreground/70">Select a query method</p>
            </div>

            <div className="p-3 border-b border-border/30 bg-muted/5">
              <div className="grid grid-cols-3 gap-2">
                {modes.map((mode) => {
                  const Icon = mode.icon
                  const isActive = activeMode === mode.id
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleModeChange(mode.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-2.5 rounded-md text-xs transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                          : 'hover:bg-muted/40 border border-transparent'
                      )}
                      title={mode.description}
                    >
                      <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="font-medium">{mode.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Query Content in Sidebar */}
            <div className="flex-1 overflow-hidden bg-muted/5">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {activeMode === 'library' && (
                    <SavedQueries
                      onQuerySelect={handleQuerySelect}
                      onExecute={handleExecuteFromBuilder}
                    />
                  )}

                  {activeMode === 'builder' && (
                    <QueryBuilder
                      onQueryGenerate={handleQuerySelect}
                      onExecute={handleExecuteFromBuilder}
                      initialCypherQuery={cypherQueryForBuilder}
                    />
                  )}

                  {activeMode === 'cypher' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Cypher Query</Label>
                        <p className="text-xs text-muted-foreground/70">
                          Write and execute Cypher queries directly
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="border border-border/40 rounded-md overflow-hidden bg-muted/30 backdrop-blur-sm focus-within:ring-2 focus-within:ring-primary/20 text-xs w-full">
                          <CodeMirror
                            value={query || ''}
                            onChange={handleCypherChange}
                            extensions={[cypherLanguage, EditorView.lineWrapping]}
                            basicSetup={{
                              lineNumbers: true,
                              foldGutter: true,
                            }}
                            theme="light"
                            height="300px"

                          />
                        </div>
                        <Button
                          onClick={handleExecuteCypher}
                          disabled={loading}
                          size="sm"
                          className="w-full h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1.5" />
                              Execute Query
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeMode === 'agent' && (
                    <ChatAgent onVisualize={handleExecuteFromBuilder} />
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main Content: Query Results */}
        <ResizablePanel defaultSize={75} minSize={60} className="bg-muted/5 backdrop-blur-sm">
          <div className="h-full p-4">
            {loading ? (
              <div className="h-full flex flex-col gradient-section rounded-lg border border-border/20">
                <div className="gradient-header-minimal p-4">
                  <h2 className="text-base font-semibold">Query Results</h2>
                  <p className="text-xs text-muted-foreground/70">
                    Executing query...
                  </p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Loader2 className="h-12 w-12 mb-4 animate-spin opacity-50" />
                    <p className="text-sm font-medium">Executing query...</p>
                    <p className="text-xs mt-1.5">Please wait while the query is being processed</p>
                  </div>
                </div>
              </div>
            ) : queryResults !== null && queryResults.length > 0 ? (
              <QueryResults results={queryResults} loading={loading} currentQuery={query} onRefresh={() => executeQuery()} />
            ) : (
              <div className="h-full flex flex-col gradient-section rounded-lg border border-border/20">
                <div className="gradient-header-minimal p-4">
                  <h2 className="text-base font-semibold">Query Results</h2>
                  <p className="text-xs text-muted-foreground/70">
                    {queryResults !== null && queryResults.length === 0
                      ? 'No results found for this query'
                      : 'Execute a query to see results here'}
                  </p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <FileText className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-sm font-medium">
                      {queryResults !== null && queryResults.length === 0
                        ? 'No results found'
                        : 'No query executed yet'}
                    </p>
                    <p className="text-xs mt-1.5">
                      {queryResults !== null && queryResults.length === 0
                        ? 'Try modifying your query or filters'
                        : 'Select a query method from the sidebar and execute it'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

