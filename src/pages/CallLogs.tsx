import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Phone, 
  Clock, 
  User, 
  MessageSquare, 
  Filter, 
  Search, 
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";
import { CallLog, CallLogsFilters } from "@/types/callLog";
import { callLogsAPI } from "./services/api";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CallLogs() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCalls, setTotalCalls] = useState(0);
  const [filters, setFilters] = useState<CallLogsFilters>({
    limit: 50,
    offset: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Fetch call logs
  const fetchCallLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await callLogsAPI.getCallLogs(filters);
      setCallLogs(response.calls);
      setTotalCalls(response.total_calls);
    } catch (err: any) {
      console.error("Error fetching call logs:", err);
      setError(err.message || "Failed to fetch call logs");
      toast.error("Failed to load call logs");
    } finally {
      setLoading(false);
    }
  };

  // Get display status (mask 'expire' and 'expired' as 'completed')
  const getDisplayStatus = (status: string) => {
    return status === 'expire' || status === 'expired' ? 'completed' : status;
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    const displayStatus = getDisplayStatus(status);
    switch (displayStatus) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  useEffect(() => {
    fetchCallLogs();
  }, [filters]);

  // Filter call logs based on search term and status
  const filteredCallLogs = callLogs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.participant_identity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.agent_instructions.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.from_number && log.from_number.includes(searchTerm)) ||
      (log.to_number && log.to_number.includes(searchTerm));
    
    // Handle status filtering - treat 'expire' as 'completed' for filtering
    const displayStatus = getDisplayStatus(log.status);
    const matchesStatus = selectedStatus === "all" || displayStatus === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Handle pagination
  const handlePageChange = (newOffset: number) => {
    setFilters(prev => ({ ...prev, offset: newOffset }));
  };

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  // Calculate duration
  const calculateDuration = (createdAt: string, lastAccessed: string) => {
    try {
      const start = new Date(createdAt);
      const end = new Date(lastAccessed);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      if (diffMins > 0) {
        return `${diffMins}m ${diffSecs}s`;
      }
      return `${diffSecs}s`;
    } catch {
      return 'N/A';
    }
  };

  const totalPages = Math.ceil(totalCalls / (filters.limit || 50));
  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call Logs</h1>
          <p className="text-muted-foreground">
            View and manage all voice call sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchCallLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">{totalCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Calls</p>
                <p className="text-2xl font-bold">
                  {callLogs.filter(log => log.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
                 <Card>
           <CardContent className="p-6">
             <div className="flex items-center space-x-2">
               <MessageSquare className="w-5 h-5 text-blue-500" />
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Completed</p>
                 <p className="text-2xl font-bold">
                   {callLogs.filter(log => getDisplayStatus(log.status) === 'completed').length}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">
                  {callLogs.filter(log => log.status === 'failed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by participant, phone number, or instructions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Results per page</label>
              <Select 
                value={filters.limit?.toString() || "50"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, limit: parseInt(value), offset: 0 }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Call Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading call logs...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : filteredCallLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No call logs found
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Agent ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Phone Numbers</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Accessed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCallLogs.map((log) => (
                      <TableRow key={log.session_id}>
                        <TableCell className="font-mono text-xs">
                          {log.session_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.participant_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {log.participant_identity}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {log.agent_id}
                        </TableCell>
                                                 <TableCell>
                           <Badge variant={getStatusBadgeVariant(log.status)}>
                             {getDisplayStatus(log.status)}
                           </Badge>
                         </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {log.from_number && (
                              <div>From: {log.from_number}</div>
                            )}
                            {log.to_number && (
                              <div>To: {log.to_number}</div>
                            )}
                            {!log.from_number && !log.to_number && (
                              <span className="text-muted-foreground">No phone data</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {calculateDuration(log.created_at, log.last_accessed)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(log.last_accessed)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * (filters.limit || 50)) + 1} to{" "}
                    {Math.min(currentPage * (filters.limit || 50), totalCalls)} of {totalCalls} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(0, (filters.offset || 0) - (filters.limit || 50)))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange((filters.offset || 0) + (filters.limit || 50))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
