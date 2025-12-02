import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, Search, Filter, CheckCircle,
  XCircle, AlertTriangle, ChevronDown, ChevronRight, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';

export function ApiLogs() {
  const { user } = useAuth();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Filters
  const [searchEndpoint, setSearchEndpoint] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['api-logs', user?.id, filterMethod, filterStatus, filterDateFrom, filterDateTo],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api-client/logs', {
          params: {
            method: filterMethod !== 'all' ? filterMethod : undefined,
            status: filterStatus !== 'all' ? filterStatus : undefined,
            dateFrom: filterDateFrom || undefined,
            dateTo: filterDateTo || undefined,
          },
        });
        return response.data;
      } catch {
        // Return mock data for development
        return {
          logs: [
            {
              id: '1',
              timestamp: new Date(Date.now() - 60000).toISOString(),
              method: 'GET',
              endpoint: '/api/v1/properties',
              statusCode: 200,
              responseTime: 45,
              ipAddress: '192.168.1.100',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              requestHeaders: { 'Authorization': 'Bearer ***', 'Content-Type': 'application/json' },
              requestBody: null,
              responseBody: { success: true, data: [{ id: 1, name: 'Property 1' }] },
            },
            {
              id: '2',
              timestamp: new Date(Date.now() - 120000).toISOString(),
              method: 'POST',
              endpoint: '/api/v1/contracts',
              statusCode: 201,
              responseTime: 156,
              ipAddress: '192.168.1.100',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              requestHeaders: { 'Authorization': 'Bearer ***', 'Content-Type': 'application/json' },
              requestBody: { propertyId: 1, tenantId: 5, startDate: '2024-01-01' },
              responseBody: { success: true, data: { id: 15, status: 'ACTIVE' } },
            },
            {
              id: '3',
              timestamp: new Date(Date.now() - 180000).toISOString(),
              method: 'PUT',
              endpoint: '/api/v1/tenants/15',
              statusCode: 200,
              responseTime: 89,
              ipAddress: '10.0.0.50',
              userAgent: 'PostmanRuntime/7.32.3',
              requestHeaders: { 'Authorization': 'Bearer ***', 'Content-Type': 'application/json' },
              requestBody: { name: 'John Doe Updated', email: 'john.updated@example.com' },
              responseBody: { success: true, message: 'Tenant updated' },
            },
            {
              id: '4',
              timestamp: new Date(Date.now() - 240000).toISOString(),
              method: 'GET',
              endpoint: '/api/v1/payments?month=12&year=2024',
              statusCode: 401,
              responseTime: 12,
              ipAddress: '192.168.1.100',
              userAgent: 'curl/7.84.0',
              requestHeaders: { 'Authorization': 'Bearer expired_token' },
              requestBody: null,
              responseBody: { error: 'Unauthorized', message: 'Token expired' },
            },
            {
              id: '5',
              timestamp: new Date(Date.now() - 300000).toISOString(),
              method: 'DELETE',
              endpoint: '/api/v1/documents/8',
              statusCode: 204,
              responseTime: 23,
              ipAddress: '192.168.1.100',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              requestHeaders: { 'Authorization': 'Bearer ***' },
              requestBody: null,
              responseBody: null,
            },
            {
              id: '6',
              timestamp: new Date(Date.now() - 360000).toISOString(),
              method: 'POST',
              endpoint: '/api/v1/payments',
              statusCode: 500,
              responseTime: 2500,
              ipAddress: '10.0.0.50',
              userAgent: 'Node.js/18.0.0',
              requestHeaders: { 'Authorization': 'Bearer ***', 'Content-Type': 'application/json' },
              requestBody: { contractId: 999, amount: 1500.00 },
              responseBody: { error: 'Internal Server Error', message: 'Database connection failed' },
            },
            {
              id: '7',
              timestamp: new Date(Date.now() - 420000).toISOString(),
              method: 'GET',
              endpoint: '/api/v1/properties/123',
              statusCode: 404,
              responseTime: 18,
              ipAddress: '192.168.1.100',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              requestHeaders: { 'Authorization': 'Bearer ***' },
              requestBody: null,
              responseBody: { error: 'Not Found', message: 'Property not found' },
            },
          ],
          summary: {
            total: 1520,
            success: 1420,
            clientErrors: 65,
            serverErrors: 35,
            avgResponseTime: 78,
          },
        };
      }
    },
  });

  const filteredLogs = useMemo(() => {
    if (!logs?.logs) return [];
    return logs.logs.filter((log: any) => {
      if (searchEndpoint && !log.endpoint.toLowerCase().includes(searchEndpoint.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [logs, searchEndpoint]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'PATCH': return 'bg-orange-100 text-orange-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
    if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-800';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800';
    if (status >= 500) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status >= 400 && status < 500) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    if (status >= 500) return <XCircle className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 100) return 'text-green-600';
    if (time < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const clearFilters = () => {
    setSearchEndpoint('');
    setFilterMethod('all');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Logs</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and analyze your API requests
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{logs?.summary?.total?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Successful (2xx)</p>
            <p className="text-2xl font-bold text-green-600">{logs?.summary?.success?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Client Errors (4xx)</p>
            <p className="text-2xl font-bold text-yellow-600">{logs?.summary?.clientErrors?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Server Errors (5xx)</p>
            <p className="text-2xl font-bold text-red-600">{logs?.summary?.serverErrors?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Avg Response Time</p>
            <p className="text-2xl font-bold">{logs?.summary?.avgResponseTime || 0}ms</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="searchEndpoint">Endpoint</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="searchEndpoint"
                  value={searchEndpoint}
                  onChange={(e) => setSearchEndpoint(e.target.value)}
                  placeholder="Search endpoint..."
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="filterMethod">Method</Label>
              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatus">Status Code</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="2xx">2xx Success</SelectItem>
                  <SelectItem value="3xx">3xx Redirect</SelectItem>
                  <SelectItem value="4xx">4xx Client Error</SelectItem>
                  <SelectItem value="5xx">5xx Server Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterDateFrom">From</Label>
              <Input
                id="filterDateFrom"
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="filterDateTo">To</Label>
              <Input
                id="filterDateTo"
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Request Logs
          </CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs?.logs?.length || 0} requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No logs found matching your filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log: any) => (
                <div key={log.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <div className="flex items-center gap-4">
                      {expandedLog === log.id ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <Badge className={getMethodColor(log.method)}>
                        {log.method}
                      </Badge>
                      <code className="text-sm font-mono">{log.endpoint}</code>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(log.statusCode)}
                        <Badge className={getStatusColor(log.statusCode)}>
                          {log.statusCode}
                        </Badge>
                      </div>
                      <span className={`text-sm font-mono ${getResponseTimeColor(log.responseTime)}`}>
                        {log.responseTime}ms
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                  </div>

                  {expandedLog === log.id && (
                    <div className="border-t bg-gray-50 p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">IP Address</p>
                          <p className="font-mono">{log.ipAddress}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-muted-foreground">User Agent</p>
                          <p className="font-mono text-xs truncate">{log.userAgent}</p>
                        </div>
                      </div>

                      {log.requestHeaders && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Request Headers</p>
                          <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                            {JSON.stringify(log.requestHeaders, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.requestBody && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Request Body</p>
                          <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                            {JSON.stringify(log.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.responseBody && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Response Body</p>
                          <pre className={`p-3 rounded-lg text-xs overflow-x-auto ${log.statusCode >= 400 ? 'bg-red-50' : 'bg-green-50'}`}>
                            {JSON.stringify(log.responseBody, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ApiLogs;
