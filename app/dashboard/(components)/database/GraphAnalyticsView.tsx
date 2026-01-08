'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, RefreshCw, BarChart3, Network, Link2, TrendingUp, AlertCircle } from 'lucide-react'
import { useGraphAnalytics } from '@/app/dashboard/hooks/analytics/useGraphAnalytics'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function GraphAnalyticsView() {
  const { data, loading, error, fetchAnalytics } = useGraphAnalytics()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!data && !loading) {
      fetchAnalytics().catch(() => {
        // Error already handled in fetchAnalytics
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  if (loading && !data) {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchAnalytics} className="mt-4" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="relative">
                Graph Analytics Dashboard
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
              </span>
            </h1>
            <p className="text-xs mt-1.5 text-muted-foreground/70">
              Analyze your graph database with statistics, distributions, and centrality metrics
            </p>
          </div>
          <Button onClick={fetchAnalytics} disabled={loading} size="sm" variant="outline">
            {loading ? (
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1.5" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nodes">Node Distribution</TabsTrigger>
          <TabsTrigger value="relationships">Relationship Distribution</TabsTrigger>
          <TabsTrigger value="centrality">Degree Centrality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Node Labels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data?.nodeDistribution.slice(0, 5).map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Network className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{item.count.toLocaleString()}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Relationship Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data?.relationshipDistribution.slice(0, 5).map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{item.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{item.count.toLocaleString()}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nodes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Node Label Distribution</CardTitle>
              <CardDescription>Distribution of nodes across different labels</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-xs">Label</TableHead>
                    <TableHead className="h-8 text-xs">Count</TableHead>
                    <TableHead className="h-8 text-xs">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.nodeDistribution.map((item) => (
                    <TableRow key={item.label}>
                      <TableCell className="text-xs font-medium">{item.label}</TableCell>
                      <TableCell className="text-xs">{item.count.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span>{item.percentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationships" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Relationship Type Distribution</CardTitle>
              <CardDescription>Distribution of relationships across different types</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-xs">Type</TableHead>
                    <TableHead className="h-8 text-xs">Count</TableHead>
                    <TableHead className="h-8 text-xs">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.relationshipDistribution.map((item) => (
                    <TableRow key={item.type}>
                      <TableCell className="text-xs font-medium">{item.type}</TableCell>
                      <TableCell className="text-xs">{item.count.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span>{item.percentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="centrality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Degree Centrality</CardTitle>
              <CardDescription>Nodes with highest connectivity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-xs">Node ID</TableHead>
                    <TableHead className="h-8 text-xs">Labels</TableHead>
                    <TableHead className="h-8 text-xs">In Degree</TableHead>
                    <TableHead className="h-8 text-xs">Out Degree</TableHead>
                    <TableHead className="h-8 text-xs">Total Degree</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.degreeCentrality.slice(0, 20).map((item) => (
                    <TableRow key={item.nodeId}>
                      <TableCell className="text-xs font-mono">{item.nodeId}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-wrap gap-1">
                          {item.labels.map((label) => (
                            <Badge key={label} variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{item.inDegree}</TableCell>
                      <TableCell className="text-xs">{item.outDegree}</TableCell>
                      <TableCell className="text-xs font-semibold">{item.totalDegree}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

