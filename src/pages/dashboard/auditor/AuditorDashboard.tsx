import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  Building2, FileText, Receipt, FileSignature, Server, Eye, Users,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { auditorAPI } from '../../../api';

function ChartContainer({ children, height = 220 }: { children: React.ReactNode; height?: number }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);
  if (!isMounted) {
    return <div style={{ height }} className="flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

const iconMap: Record<string, any> = {
  Building2,
  FileText,
  Receipt,
  FileSignature,
  Server,
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function AuditorDashboard() {
  
  const { data: metrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: ['auditor', 'metrics'],
    queryFn: auditorAPI.getDashboardMetrics,
  });

  const { data: agencyPlanData = [], isLoading: agencyLoading } = useQuery({
    queryKey: ['auditor', 'agency-plan-distribution'],
    queryFn: auditorAPI.getAgencyPlanDistribution,
  });

  const { data: contractStatusData = [], isLoading: contractLoading } = useQuery({
    queryKey: ['auditor', 'contract-status-distribution'],
    queryFn: auditorAPI.getContractStatusDistribution,
  });

  const { data: monthlyTransactionsData = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['auditor', 'monthly-transactions'],
    queryFn: auditorAPI.getMonthlyTransactions,
  });

  const { data: signatureActivityData = [], isLoading: signatureLoading } = useQuery({
    queryKey: ['auditor', 'signature-activity'],
    queryFn: auditorAPI.getSignatureActivity,
  });

  const { data: userRoleData = [], isLoading: userRoleLoading } = useQuery({
    queryKey: ['auditor', 'user-role-distribution'],
    queryFn: auditorAPI.getUserRoleDistribution,
  });

  const { data: paymentStatusData = [], isLoading: paymentLoading } = useQuery({
    queryKey: ['auditor', 'payment-status-distribution'],
    queryFn: auditorAPI.getPaymentStatusDistribution,
  });

  const { data: logsData = [], isLoading: logsLoading } = useQuery({
    queryKey: ['auditor', 'logs-summary'],
    queryFn: auditorAPI.getLogsSummary,
  });

  const { data: revenueTrendData = [], isLoading: revenueLoading } = useQuery({
    queryKey: ['auditor', 'revenue-trend'],
    queryFn: auditorAPI.getRevenueTrend,
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['auditor', 'recent-activity'],
    queryFn: auditorAPI.getRecentActivity,
  });

  const { data: systemStatus = [], isLoading: statusLoading } = useQuery({
    queryKey: ['auditor', 'system-status'],
    queryFn: auditorAPI.getSystemStatus,
  });

  const { data: summaryStats = {}, isLoading: summaryLoading } = useQuery({
    queryKey: ['auditor', 'summary-stats'],
    queryFn: auditorAPI.getSummaryStats,
  });

  const { data: documentUploadLogs = [], isLoading: documentLogsLoading } = useQuery({
    queryKey: ['auditor', 'document-upload-logs'],
    queryFn: () => auditorAPI.getDocumentUploadLogs(20),
  });

  const { data: extrajudicialNotifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['auditor', 'extrajudicial-notifications'],
    queryFn: () => auditorAPI.getExtrajudicialNotifications(20),
  });

  const { data: criticalAlerts = {}, isLoading: alertsLoading } = useQuery({
    queryKey: ['auditor', 'critical-alerts'],
    queryFn: auditorAPI.getCriticalAlerts,
  });

  const isLoading = metricsLoading || agencyLoading || contractLoading || transactionsLoading ||
    signatureLoading || userRoleLoading || paymentLoading || logsLoading || revenueLoading ||
    activityLoading || statusLoading || summaryLoading || documentLogsLoading || notificationsLoading || alertsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <Skeleton className="h-8 w-32" />
        </div>

        {/* Alert Skeleton */}
        <Skeleton className="h-14 w-full rounded-lg" />

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[220px]">
                  <Skeleton className="w-36 h-36 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Second Charts Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <Skeleton className="w-full h-[280px] rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Stats Row Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <Skeleton className="w-8 h-8 mx-auto mb-2 rounded" />
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gray-100 rounded-lg">
          <Eye className="w-6 h-6 text-gray-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
      </div>

      {}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex items-center gap-3">
          <Eye className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Modo Somente Leitura:</strong> Você tem acesso de visualização a todos os dados do sistema para fins de auditoria. Nenhuma modificação é permitida.
          </p>
        </CardContent>
      </Card>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric: any) => {
          const IconComponent = iconMap[metric.icon] || Building2;
          return (
            <Card key={metric.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 ${metric.bgColor} rounded-lg`}>
                    <IconComponent className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {metric.change}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">
                    {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{metric.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Distribuição de Agências por Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer height={280}>
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={agencyPlanData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {agencyPlanData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartContainer>
            <div className="flex justify-center gap-4 mt-2">
              {agencyPlanData.map((item: any) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Status dos Contratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer height={280}>
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={contractStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={40}
                  outerRadius={70}
                  label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {contractStatusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Status dos Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer height={280}>
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={paymentStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {paymentStatusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transações Mensais</CardTitle>
            <CardDescription>Volume de transações e receita nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer height={280}>
              <BarChart data={monthlyTransactionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis yAxisId="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value.toLocaleString(),
                    name === 'revenue' ? 'Receita' : 'Transações'
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="transactions" name="Transações" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendência de Receita</CardTitle>
            <CardDescription>Receita total e taxa MR3X (2%)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer height={280}>
              <AreaChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `R$${(v/1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="receita" name="Receita Total" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="taxa" name="Taxa MR3X" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSignature className="w-4 h-4" />
              Atividade de Assinaturas (Última Semana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer height={250}>
              <LineChart data={signatureActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="assinaturas" name="Assinaturas" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="verificacoes" name="Verificações" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Distribuição de Usuários por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer height={250}>
              <BarChart data={userRoleData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" fontSize={12} width={80} />
                <Tooltip />
                <Bar dataKey="value" name="Usuários" radius={[0, 4, 4, 0]}>
                  {userRoleData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logs do Sistema (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer height={200}>
              <BarChart data={logsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" name="Registros" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">Nenhuma atividade recente</p>
              ) : (
                recentActivity.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <span className="text-xs text-muted-foreground w-12">{item.time}</span>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      item.type === 'success' ? 'bg-green-500' :
                      item.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-sm truncate">{item.event}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status dos Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {systemStatus.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">Nenhum serviço encontrado</p>
              ) : (
                systemStatus.map((service: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{service.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{service.latency}</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{summaryStats.successRate || '0%'}</p>
            <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-yellow-600 mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{summaryStats.avgResponseTime || '0s'}</p>
            <p className="text-xs text-muted-foreground">Tempo Médio Resp.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{(summaryStats.activeUsers || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Usuários Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-purple-600 mb-2">
              <FileSignature className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{(summaryStats.weeklySignatures || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Assinaturas/Semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-orange-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{summaryStats.delinquencyRate || '0%'}</p>
            <p className="text-xs text-muted-foreground">Inadimplência</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{summaryStats.monthlyFee || 'R$ 0'}</p>
            <p className="text-xs text-muted-foreground">Taxa MR3X (Mês)</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Section */}
      {criticalAlerts && criticalAlerts.totalAlerts !== undefined && (
        <Card className={criticalAlerts.totalAlerts > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${criticalAlerts.totalAlerts > 0 ? 'text-red-600' : 'text-green-600'}`} />
              Alertas Críticos
            </CardTitle>
            <CardDescription>
              {criticalAlerts.totalAlerts > 0 
                ? `${criticalAlerts.totalAlerts} alerta(s) crítico(s) detectado(s)`
                : 'Nenhum alerta crítico detectado'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Documentos Expirados</p>
                <p className="text-lg font-bold">{criticalAlerts.expiredDocuments || 0}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Inconsistências de Assinatura</p>
                <p className="text-lg font-bold">{criticalAlerts.signatureInconsistencies || 0}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Falhas de Integridade</p>
                <p className="text-lg font-bold">{criticalAlerts.integrityFailures || 0}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Eventos Sensíveis (24h)</p>
                <p className="text-lg font-bold">{criticalAlerts.sensitiveEvents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Upload Logs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Logs de Upload de Documentos
          </CardTitle>
          <CardDescription>Registros de upload de documentos legais (quem, quando, IP, hash)</CardDescription>
        </CardHeader>
        <CardContent>
          {documentUploadLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum registro de upload encontrado</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {documentUploadLogs.map((log: any) => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-lg border text-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{log.fileName || log.documentType}</p>
                      <p className="text-xs text-muted-foreground">
                        Propriedade: {log.propertyName} | Upload por: {log.uploadedBy} ({log.uploadedByRole})
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.uploadedAt).toLocaleString('pt-BR')} | IP: {log.ip} | Hash: {log.hash?.substring(0, 16)}...
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extrajudicial Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Notificações Extrajudiciais
          </CardTitle>
          <CardDescription>Registros de notificações extrajudiciais enviadas</CardDescription>
        </CardHeader>
        <CardContent>
          {extrajudicialNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação extrajudicial encontrada</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {extrajudicialNotifications.map((notif: any) => (
                <div key={notif.id} className="p-3 bg-gray-50 rounded-lg border text-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">Token: {notif.token}</p>
                      <p className="text-xs text-muted-foreground">
                        Tipo: {notif.type} | Propriedade: {notif.propertyName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Credor: {notif.creditorName} | Devedor: {notif.debtorName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {notif.status} | Valor: {formatCurrency(notif.totalAmount || 0)} | 
                        Criado em: {new Date(notif.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
