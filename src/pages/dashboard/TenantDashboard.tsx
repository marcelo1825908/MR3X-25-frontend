import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../../api';
import { formatCurrency } from '../../lib/utils';
import {
  Home, FileText, DollarSign, Bell, Clock,
  CheckCircle, AlertTriangle, User, Phone, Mail,
  CreditCard, Receipt, TrendingUp, Calendar, Building2
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
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { useMemo } from 'react';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function TenantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['tenant-dashboard', user?.id],
    queryFn: () => dashboardAPI.getDashboard(),
  });

  // Process payment history for charts
  const chartData = useMemo(() => {
    const paymentHistory = dashboard?.paymentHistory || [];

    // Monthly payment trend (last 12 months)
    const monthlyTrend: Record<string, number> = {};
    const now = new Date();

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      monthlyTrend[key] = 0;
    }

    // Fill with actual payments
    paymentHistory.forEach((payment: any) => {
      if (payment.date) {
        const date = new Date(payment.date);
        const key = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        if (monthlyTrend[key] !== undefined) {
          monthlyTrend[key] += Number(payment.amount) || 0;
        }
      }
    });

    const monthlyData = Object.entries(monthlyTrend).map(([month, total]) => ({
      month,
      total,
    }));

    // Payment by type (pie chart)
    const byType: Record<string, number> = {
      'Aluguel': 0,
      'Condomínio': 0,
      'IPTU': 0,
      'Outros': 0,
    };

    paymentHistory.forEach((payment: any) => {
      const amount = Number(payment.amount) || 0;
      if (payment.type === 'ALUGUEL') byType['Aluguel'] += amount;
      else if (payment.type === 'CONDOMINIO') byType['Condomínio'] += amount;
      else if (payment.type === 'IPTU') byType['IPTU'] += amount;
      else byType['Outros'] += amount;
    });

    const pieData = Object.entries(byType)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    // Payment status distribution
    const statusData = [
      { name: 'Pagos', value: paymentHistory.filter((p: any) => p.status === 'PAGO' || p.status === 'paid').length, color: '#10B981' },
      { name: 'Pendentes', value: paymentHistory.filter((p: any) => p.status === 'PENDENTE' || p.status === 'pending').length, color: '#F59E0B' },
      { name: 'Atrasados', value: paymentHistory.filter((p: any) => p.status === 'ATRASADO' || p.status === 'overdue').length, color: '#EF4444' },
    ].filter(item => item.value > 0);

    // Calculate totals
    const totalPaid = paymentHistory.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const totalPayments = paymentHistory.length;
    const avgPayment = totalPayments > 0 ? totalPaid / totalPayments : 0;

    return {
      monthlyData,
      pieData,
      statusData,
      totalPaid,
      totalPayments,
      avgPayment,
    };
  }, [dashboard?.paymentHistory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const property = dashboard?.property;
  const contract = dashboard?.contract;
  const paymentHistory = dashboard?.paymentHistory || [];

  // Calculate payment status
  const getPaymentStatus = () => {
    if (!property?.nextDueDate) return { status: 'unknown', label: 'Sem data', color: 'gray' };

    const daysUntilDue = property.daysUntilDue;
    if (daysUntilDue === null) return { status: 'unknown', label: 'Sem data', color: 'gray' };

    if (daysUntilDue < 0) {
      return { status: 'overdue', label: `${Math.abs(daysUntilDue)} dias em atraso`, color: 'red' };
    } else if (daysUntilDue <= 5) {
      return { status: 'upcoming', label: `Vence em ${daysUntilDue} dias`, color: 'yellow' };
    } else {
      return { status: 'ok', label: 'Em dia', color: 'green' };
    }
  };

  const paymentStatus = getPaymentStatus();

  // Calculate contract progress
  const getContractProgress = () => {
    if (!contract?.startDate || !contract?.endDate) return { progress: 0, remaining: 0 };

    const start = new Date(contract.startDate).getTime();
    const end = new Date(contract.endDate).getTime();
    const now = Date.now();

    const total = end - start;
    const elapsed = now - start;
    const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
    const remainingDays = Math.max(Math.ceil((end - now) / (1000 * 60 * 60 * 24)), 0);

    return { progress, remaining: remainingDays };
  };

  const contractProgress = getContractProgress();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Olá, {user?.name || 'Inquilino'}!
        </h1>
        <p className="text-blue-100">
          Bem-vindo ao seu painel de locação. Aqui você pode acompanhar seu contrato, pagamentos e documentos.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Pago</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(chartData.totalPaid)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Pagamentos</p>
                <p className="text-2xl font-bold text-blue-700">
                  {chartData.totalPayments}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Média Mensal</p>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(chartData.avgPayment)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Dias Restantes</p>
                <p className="text-2xl font-bold text-orange-700">
                  {contractProgress.remaining}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Payment Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Evolução dos Pagamentos
            </CardTitle>
            <CardDescription>Histórico mensal dos últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="month"
                    fontSize={11}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis
                    tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`}
                    fontSize={11}
                    tick={{ fill: '#6B7280' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Total']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum dado de pagamento disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment by Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Distribuição por Tipo
            </CardTitle>
            <CardDescription>Valores pagos por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {chartData.pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum dado de pagamento disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Property Info Card */}
      {property ? (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-lg">Meu Imóvel</CardTitle>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Alugado
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{property.name || 'Imóvel'}</h3>
                <p className="text-muted-foreground">{property.address}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Valor do Aluguel</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(Number(property.monthlyRent) || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próximo Vencimento</p>
                  <p className="text-lg font-semibold">
                    {property.nextDueDate
                      ? new Date(property.nextDueDate).toLocaleDateString('pt-BR')
                      : 'Não definido'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status do Pagamento</p>
                  <Badge
                    className={`
                      ${paymentStatus.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                      ${paymentStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                      ${paymentStatus.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                      ${paymentStatus.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                    `}
                  >
                    {paymentStatus.status === 'ok' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {paymentStatus.status === 'upcoming' && <Clock className="w-3 h-3 mr-1" />}
                    {paymentStatus.status === 'overdue' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {paymentStatus.label}
                  </Badge>
                </div>
              </div>

              {/* Property Owner Info */}
              {property.owner && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Proprietário / Administrador</p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{property.owner.name}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {property.owner.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {property.owner.email}
                          </span>
                        )}
                        {property.owner.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {property.owner.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhum imóvel vinculado</h3>
            <p className="text-muted-foreground">
              Você ainda não possui um imóvel vinculado à sua conta.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contract Progress & Status */}
      {contract && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Progress */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <CardTitle className="text-lg">Progresso do Contrato</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Início: {contract.startDate ? new Date(contract.startDate).toLocaleDateString('pt-BR') : '-'}
                  </span>
                  <span className="text-muted-foreground">
                    Término: {contract.endDate ? new Date(contract.endDate).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${contractProgress.progress}%` }}
                    />
                  </div>
                  <p className="text-center mt-2 text-sm font-medium">
                    {contractProgress.progress.toFixed(1)}% concluído
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{contractProgress.remaining}</p>
                    <p className="text-sm text-muted-foreground">Dias restantes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(Number(contract.monthlyRent) || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Valor mensal</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <CardTitle className="text-lg">Status dos Pagamentos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {chartData.statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData.statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {chartData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/dashboard/tenant-contract')}
        >
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="font-medium text-sm">Meu Contrato</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/dashboard/tenant-payments')}
        >
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="font-medium text-sm">Pagamentos</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/dashboard/notifications')}
        >
          <CardContent className="p-4 text-center">
            <Bell className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <p className="font-medium text-sm">Notificações</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/dashboard/tenant-profile')}
        >
          <CardContent className="p-4 text-center">
            <User className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="font-medium text-sm">Meu Perfil</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-500" />
              <CardTitle className="text-lg">Histórico de Pagamentos</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/tenant-payments')}
            >
              Ver Todos
            </Button>
          </div>
          <CardDescription>Pagamentos mensais realizados</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.monthlyData.some(d => d.total > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  fontSize={11}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis
                  tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`}
                  fontSize={11}
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                />
                <Bar
                  dataKey="total"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum pagamento registrado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments List */}
      {paymentHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              Últimos Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentHistory.slice(0, 5).map((payment: any, index: number) => (
                <div
                  key={payment.id || index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {payment.type === 'ALUGUEL' ? 'Aluguel' :
                         payment.type === 'CONDOMINIO' ? 'Condomínio' :
                         payment.type === 'IPTU' ? 'IPTU' : payment.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.date
                          ? new Date(payment.date).toLocaleDateString('pt-BR')
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(Number(payment.amount) || 0)}
                    </p>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Pago
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Alert */}
      {paymentStatus.status === 'overdue' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-700">Pagamento em Atraso</h4>
                <p className="text-sm text-red-600 mt-1">
                  Você possui um pagamento em atraso. Regularize sua situação para evitar multas e juros.
                </p>
                <Button
                  className="mt-3 bg-red-600 hover:bg-red-700"
                  size="sm"
                  onClick={() => navigate('/dashboard/tenant-payments')}
                >
                  Realizar Pagamento
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentStatus.status === 'upcoming' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-700">Pagamento Próximo</h4>
                <p className="text-sm text-yellow-600 mt-1">
                  Seu próximo pagamento vence em breve. Fique atento à data de vencimento.
                </p>
                <Button
                  className="mt-3 bg-yellow-600 hover:bg-yellow-700"
                  size="sm"
                  onClick={() => navigate('/dashboard/tenant-payments')}
                >
                  Ver Pagamentos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
