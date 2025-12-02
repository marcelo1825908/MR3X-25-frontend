import { useQuery } from '@tanstack/react-query';
import {
  Activity, Code, Webhook, Clock, CheckCircle, XCircle,
  TrendingUp, Shield, Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useMemo } from 'react';
import apiClient from '../../api/client';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function ApiClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: apiStats, isLoading } = useQuery({
    queryKey: ['api-client-stats', user?.id],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api-client/stats');
        return response.data;
      } catch {
        // Return mock data for development
        return {
          totalRequests: 15420,
          successfulRequests: 14850,
          failedRequests: 570,
          averageResponseTime: 245,
          activeTokens: 3,
          webhooksConfigured: 5,
          lastRequestAt: new Date().toISOString(),
          tokenHealth: 'healthy',
          requestsThisMonth: 4523,
          requestsLastMonth: 3890,
          dailyRequests: [
            { date: '01/12', requests: 450, errors: 12 },
            { date: '02/12', requests: 520, errors: 8 },
            { date: '03/12', requests: 380, errors: 15 },
            { date: '04/12', requests: 610, errors: 5 },
            { date: '05/12', requests: 490, errors: 10 },
            { date: '06/12', requests: 550, errors: 7 },
            { date: '07/12', requests: 420, errors: 18 },
          ],
          requestsByMethod: [
            { name: 'GET', value: 8500, color: '#10B981' },
            { name: 'POST', value: 4200, color: '#3B82F6' },
            { name: 'PUT', value: 1800, color: '#F59E0B' },
            { name: 'DELETE', value: 920, color: '#EF4444' },
          ],
          requestsByEndpoint: [
            { endpoint: '/properties', count: 5200 },
            { endpoint: '/contracts', count: 3800 },
            { endpoint: '/payments', count: 2900 },
            { endpoint: '/tenants', count: 2100 },
            { endpoint: '/users', count: 1420 },
          ],
          recentRequests: [
            { id: 1, method: 'GET', endpoint: '/api/properties', status: 200, time: '2ms', timestamp: new Date(Date.now() - 60000).toISOString() },
            { id: 2, method: 'POST', endpoint: '/api/contracts', status: 201, time: '45ms', timestamp: new Date(Date.now() - 120000).toISOString() },
            { id: 3, method: 'GET', endpoint: '/api/payments', status: 200, time: '12ms', timestamp: new Date(Date.now() - 180000).toISOString() },
            { id: 4, method: 'PUT', endpoint: '/api/tenants/15', status: 500, time: '150ms', timestamp: new Date(Date.now() - 240000).toISOString() },
            { id: 5, method: 'DELETE', endpoint: '/api/documents/8', status: 204, time: '8ms', timestamp: new Date(Date.now() - 300000).toISOString() },
          ],
        };
      }
    },
  });

  const chartData = useMemo(() => {
    if (!apiStats) return { dailyRequests: [], methodDistribution: [], endpointStats: [] };

    return {
      dailyRequests: apiStats.dailyRequests || [],
      methodDistribution: apiStats.requestsByMethod || [],
      endpointStats: apiStats.requestsByEndpoint || [],
    };
  }, [apiStats]);

  const errorRate = useMemo(() => {
    if (!apiStats || !apiStats.totalRequests) return 0;
    return ((apiStats.failedRequests / apiStats.totalRequests) * 100).toFixed(2);
  }, [apiStats]);

  const successRate = useMemo(() => {
    if (!apiStats || !apiStats.totalRequests) return 0;
    return ((apiStats.successfulRequests / apiStats.totalRequests) * 100).toFixed(2);
  }, [apiStats]);

  const getTokenHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">API Dashboard</h1>
        <p className="text-purple-100 mt-1">
          Welcome, {user?.name || 'API Client'}! Monitor your API usage and performance.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <Badge className={`${getTokenHealthColor(apiStats?.tokenHealth || 'healthy')}`}>
            <Shield className="w-3 h-3 mr-1" />
            Token Status: {apiStats?.tokenHealth || 'Healthy'}
          </Badge>
          <span className="text-sm text-purple-200">
            Last request: {apiStats?.lastRequestAt ? formatTimestamp(apiStats.lastRequestAt) : 'N/A'}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{apiStats?.totalRequests?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This month: {apiStats?.requestsThisMonth?.toLocaleString() || 0}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{successRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {apiStats?.successfulRequests?.toLocaleString() || 0} successful
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold text-red-600">{errorRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {apiStats?.failedRequests?.toLocaleString() || 0} failed
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{apiStats?.averageResponseTime || 0}ms</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Active tokens: {apiStats?.activeTokens || 0}
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Requests Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Request Volume (Last 7 Days)
            </CardTitle>
            <CardDescription>API requests and errors over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.dailyRequests}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorRequests)"
                    name="Requests"
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    stroke="#EF4444"
                    fillOpacity={1}
                    fill="url(#colorErrors)"
                    name="Errors"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-purple-500" />
              Requests by Method
            </CardTitle>
            <CardDescription>Distribution of HTTP methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.methodDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {chartData.methodDistribution.map((entry: { name: string; value: number; color?: string }, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString()}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Top Endpoints
          </CardTitle>
          <CardDescription>Most frequently accessed endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.endpointStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="endpoint" type="category" tick={{ fontSize: 12 }} width={120} />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Token Status & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token & API Health Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              API Health & Status
            </CardTitle>
            <CardDescription>Current integration status overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Token Health */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Token Status</span>
                  <Badge className={getTokenHealthColor(apiStats?.tokenHealth || 'healthy')}>
                    {apiStats?.tokenHealth === 'healthy' ? 'Healthy' :
                     apiStats?.tokenHealth === 'warning' ? 'Expiring Soon' : 'Critical'}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Tokens</span>
                    <span className="font-medium">{apiStats?.activeTokens || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Webhooks Active</span>
                    <span className="font-medium">{apiStats?.webhooksConfigured || 0}</span>
                  </div>
                </div>
              </div>

              {/* API Performance */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Performance</span>
                  <Badge className={Number(errorRate) < 2 ? 'bg-green-100 text-green-800' :
                                   Number(errorRate) < 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                    {Number(errorRate) < 2 ? 'Excellent' : Number(errorRate) < 5 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Response</span>
                    <span className="font-medium">{apiStats?.averageResponseTime || 0}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Error Rate</span>
                    <span className="font-medium">{errorRate}%</span>
                  </div>
                </div>
              </div>

              {/* Monthly Usage */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Monthly Usage</span>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">This Month</span>
                    <span className="font-medium">{apiStats?.requestsThisMonth?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Month</span>
                    <span className="font-medium">{apiStats?.requestsLastMonth?.toLocaleString() || 0}</span>
                  </div>
                  {apiStats?.requestsThisMonth && apiStats?.requestsLastMonth && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Change</span>
                      <span className={`font-medium ${apiStats.requestsThisMonth > apiStats.requestsLastMonth ? 'text-green-600' : 'text-red-600'}`}>
                        {apiStats.requestsThisMonth > apiStats.requestsLastMonth ? '+' : ''}
                        {(((apiStats.requestsThisMonth - apiStats.requestsLastMonth) / apiStats.requestsLastMonth) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Last Activity */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Last Activity</span>
                  <Clock className="w-4 h-4 text-gray-500" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Request</span>
                    <span className="font-medium">
                      {apiStats?.lastRequestAt ? formatTimestamp(apiStats.lastRequestAt) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Requests</span>
                    <span className="font-medium">{apiStats?.totalRequests?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/api-credentials')}
            >
              <Shield className="w-4 h-4 mr-2" />
              View Credentials
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/api-tokens')}
            >
              <Code className="w-4 h-4 mr-2" />
              Manage Tokens
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/api-webhooks')}
            >
              <Webhook className="w-4 h-4 mr-2" />
              Configure Webhooks
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/api-docs')}
            >
              <Activity className="w-4 h-4 mr-2" />
              API Documentation
            </Button>
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">Webhooks Configured</div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{apiStats?.webhooksConfigured || 0} active</span>
                <Webhook className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ApiClientDashboard;
