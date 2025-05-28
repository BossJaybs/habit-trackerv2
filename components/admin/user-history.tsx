"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, Search, Filter, Eye, Calendar, User, Activity } from "lucide-react"
import { getUserHistory } from "@/app/actions/admin-actions"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"

interface UserHistoryItem {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id?: string
  details?: any
  ip_address?: string
  user_agent?: string
  created_at: string
  profiles?: {
    first_name: string
    last_name: string
    email: string
  }
  learning_materials?: {
    title: string
  }
}

export function UserHistory() {
  const [history, setHistory] = useState<UserHistoryItem[]>([])
  const [filteredHistory, setFilteredHistory] = useState<UserHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all")
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<UserHistoryItem | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function loadHistory() {
      setLoading(true)
      const { history, error } = await getUserHistory()
      if (error) {
        toast({
          title: "Error loading user history",
          description: error.message || "Failed to load user history",
          variant: "destructive",
        })
        setHistory([])
      } else {
        setHistory(history || [])
        setFilteredHistory(history || [])
      }
      setLoading(false)
    }

    loadHistory()
  }, [toast])

  useEffect(() => {
    let filtered = history

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.resource_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter(item => item.action === actionFilter)
    }

    if (resourceTypeFilter !== "all") {
      filtered = filtered.filter(item => item.resource_type === resourceTypeFilter)
    }

    setFilteredHistory(filtered)
  }, [history, searchTerm, actionFilter, resourceTypeFilter])

  const getActionBadge = (action: string) => {
    const actionConfig = {
      login: { variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      logout: { variant: "secondary" as const, color: "bg-gray-100 text-gray-800" },
      register: { variant: "default" as const, color: "bg-green-100 text-green-800" },
      profile_update: { variant: "outline" as const, color: "bg-yellow-100 text-yellow-800" },
      material_view: { variant: "outline" as const, color: "bg-purple-100 text-purple-800" },
      progress_update: { variant: "outline" as const, color: "bg-indigo-100 text-indigo-800" },
      progress_start: { variant: "outline" as const, color: "bg-blue-100 text-blue-800" },
      progress_complete: { variant: "default" as const, color: "bg-green-100 text-green-800" },
      goal_create: { variant: "default" as const, color: "bg-emerald-100 text-emerald-800" },
      goal_complete: { variant: "default" as const, color: "bg-teal-100 text-teal-800" },
      password_reset: { variant: "destructive" as const, color: "bg-red-100 text-red-800" },
      email_verification: { variant: "outline" as const, color: "bg-cyan-100 text-cyan-800" },
    }

    const config = actionConfig[action as keyof typeof actionConfig] || { variant: "outline" as const, color: "bg-gray-100 text-gray-800" }
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {action.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    )
  }

  const getResourceTypeIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'user':
      case 'profile':
        return <User className="h-4 w-4" />
      case 'learning_material':
        return <Activity className="h-4 w-4" />
      case 'progress':
      case 'goal':
        return <Calendar className="h-4 w-4" />
      case 'session':
        return <Activity className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const uniqueActions = [...new Set(history.map(item => item.action))]
  const uniqueResourceTypes = [...new Set(history.map(item => item.resource_type))]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          User History
        </CardTitle>
        <CardDescription>Track user activities and system interactions</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users, actions, or resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>
                  {action.replace(/_/g, ' ').toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              {uniqueResourceTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ').toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setActionFilter("all")
              setResourceTypeFilter("all")
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredHistory.length} of {history.length} history entries
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {loading ? "Loading history..." : "No history entries found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {item.profiles?.first_name} {item.profiles?.last_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.profiles?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionBadge(item.action)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getResourceTypeIcon(item.resource_type)}
                          <span className="capitalize">
                            {item.resource_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(new Date(item.created_at), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), 'HH:mm:ss')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {item.ip_address || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedHistoryItem(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>History Entry Details</DialogTitle>
                              <DialogDescription>
                                Detailed information about this user activity
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">User</label>
                                  <p className="text-sm text-muted-foreground">
                                    {item.profiles?.first_name} {item.profiles?.last_name}
                                    <br />
                                    {item.profiles?.email}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Action</label>
                                  <div className="mt-1">
                                    {getActionBadge(item.action)}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Resource Type</label>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {item.resource_type.replace(/_/g, ' ')}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Timestamp</label>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(item.created_at), 'PPpp')}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">IP Address</label>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {item.ip_address || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Resource ID</label>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {item.resource_id || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              
                              {item.user_agent && (
                                <div>
                                  <label className="text-sm font-medium">User Agent</label>
                                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono break-all">
                                    {item.user_agent}
                                  </p>
                                </div>
                              )}
                              
                              {item.details && (
                                <div>
                                  <label className="text-sm font-medium">Additional Details</label>
                                  <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-auto">
                                    {JSON.stringify(item.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}