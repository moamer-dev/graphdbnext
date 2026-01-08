'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Database as DatabaseIcon, Loader2, RefreshCw, Upload, Activity, Network, Link2 } from 'lucide-react'
import { useDatabase } from '../hooks/database/useDatabase'

export function DatabaseView () {
  const {
    loading,
    dbStatus,
    isInitializing,
    checkStatus,
    loadGraphFromFile
  } = useDatabase()
  
  const [dbInfo, setDbInfo] = useState<{ displayName: string } | null>(null)
  
  useEffect(() => {
    fetch('/api/database/info')
      .then(res => res.json())
      .then(data => setDbInfo(data))
      .catch(() => setDbInfo({ displayName: 'Graph DB:7687' }))
  }, [])

  const isConnected = dbStatus?.connected ?? false
  const nodeCount = dbStatus?.stats?.nodeCount ?? 0
  const relationshipCount = dbStatus?.stats?.relationshipCount ?? 0
  const showLoading = isInitializing || (loading && !dbStatus)

  return (
    <div className="space-y-4 mt-4">
      {/* Database Status & Insights */}
      <div className="gradient-header-minimal pb-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <DatabaseIcon className="h-4 w-4" />
            <span className="relative">
              Database Status & Insights
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
            </span>
          </h1>
          <p className="text-xs mt-1.5 text-muted-foreground/70">
            Real-time database connection status and statistics
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Status Section */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Connection Status</div>
                {showLoading ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Checking...</span>
                  </div>
                ) : (
                  <Badge 
                    variant={isConnected ? 'outline' : 'destructive'} 
                    className={`text-xs ${isConnected ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : ''}`}
                  >
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                )}
              </div>
              <Separator orientation="vertical" className="h-6 opacity-30" />
              <div>
                <div className="text-xs text-muted-foreground mb-1">Nodes</div>
                <div className="flex items-center gap-1.5">
                  <Network className="h-3 w-3 text-muted-foreground" />
                  <div className="text-sm font-semibold">{nodeCount.toLocaleString()}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Relationships</div>
                <div className="flex items-center gap-1.5">
                  <Link2 className="h-3 w-3 text-muted-foreground" />
                  <div className="text-sm font-semibold">{relationshipCount.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <Button
              onClick={() => checkStatus(false)}
              disabled={loading}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Refresh
                </>
              )}
            </Button>
          </div>

        {/* Insights Section */}
        {dbStatus && (
          <>
            <Separator className="opacity-30" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-muted/20 rounded-md border border-border/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="text-xs font-semibold">Database Health</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {isConnected ? 'All systems operational' : 'Connection unavailable'}
                </div>
              </div>
              <div className="p-3 bg-muted/20 rounded-md border border-border/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Network className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="text-xs font-semibold">Graph Size</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {nodeCount > 0 || relationshipCount > 0
                    ? `${nodeCount.toLocaleString()} nodes, ${relationshipCount.toLocaleString()} relationships`
                    : 'No data loaded'}
                </div>
              </div>
              <div className="p-3 bg-muted/20 rounded-md border border-border/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="text-xs font-semibold">Connectivity</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {isConnected ? (dbInfo?.displayName || 'Graph DB:7687') : 'Not connected'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Database Management */}
      <div className="gradient-header-minimal pb-3 mt-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <DatabaseIcon className="h-4 w-4" />
            <span className="relative">
              Database Management
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
            </span>
          </h2>
          <p className="text-xs mt-1.5 text-muted-foreground/70">
            Manage connections and load data into the database
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
          <div className="space-y-2">

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Load Graph Data</h3>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={loadGraphFromFile}
              disabled={loading}
              className="hidden"
              id="json-upload"
            />
            <label
              htmlFor="json-upload"
              className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                loading
                  ? 'bg-muted cursor-not-allowed opacity-50'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              <Upload className="h-3 w-3" />
              {loading ? 'Loading...' : 'Upload JSON'}
            </label>
          </div>
      </div>
    </div>
  )
}
