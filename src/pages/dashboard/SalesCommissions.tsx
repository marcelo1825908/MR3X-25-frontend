import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import apiClient from '../../api/client';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import {
  DollarSign, Award, Clock, CheckCircle, Calendar, Building2,
  TrendingUp, Download, Filter, X, BarChart3
} from 'lucide-react';

interface Commission {
  id: string;
  agencyName: string;
  planType: string;
  dealValue: number;
  commissionRate: number;
  commissionValue: number;
  status: 'calculated' | 'pending' | 'released' | 'processing' | 'paid' | 'canceled' | 'rejected';
  closedAt: string;
  paidAt: string | null;
  paymentMonth: string;
}

const emptySummary = {
  totalEarned: 0,
  totalPending: 0,
  totalProcessing: 0,
  totalPaid: 0,
  thisMonth: 0,
  lastMonth: 0,
  avgCommission: 0,
  totalDeals: 0,
  commissionRate: 0,
  monthlyCommissions: [],
  byPlan: [],
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  calculated: { label: 'Calculada', color: 'bg-purple-100 text-purple-800', icon: Clock },
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  released: { label: 'Liberada', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  processing: { label: 'Processando', color: 'bg-indigo-100 text-indigo-800', icon: Clock },
  paid: { label: 'Pago', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  canceled: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: X },
  rejected: { label: 'Rejeitada', color: 'bg-red-100 text-red-800', icon: X },
};

const COLORS = ['#94A3B8', '#3B82F6', '#8B5CF6', '#10B981'];

export function SalesCommissions() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: commissions = [], isLoading: loadingCommissions } = useQuery({
    queryKey: ['sales-commissions'],
    queryFn: async () => {
      const response = await apiClient.get('/sales-rep/commissions');
      return response.data || [];
    },
  });

  const { data: summary = emptySummary, isLoading: loadingSummary } = useQuery({
    queryKey: ['sales-commissions-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/sales-rep/commissions/summary');
      return response.data || emptySummary;
    },
  });

  const filteredCommissions = commissions.filter((commission: Commission) => {
    const matchesStatus = selectedStatus === 'all' || commission.status === selectedStatus;
    return matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: Commission['status']) => {
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: Clock };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const isLoading = loadingCommissions || loadingSummary;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Comissionamento</h1>
          <p className="text-muted-foreground">Acompanhe sua produção, comissões e pagamentos da MR3X</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ganho</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalEarned || 0)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {summary.totalCalculated > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Período de Segurança</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalCalculated || 0)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {summary.totalReleased > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Liberadas</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalReleased || 0)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recebido</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalPending)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Este Mês</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.thisMonth)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mês anterior: {formatCurrency(summary.lastMonth)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Comissões Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlyCommissions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                  <Legend />
                  <Bar dataKey="paid" name="Pago" fill="#10B981" stackId="a" />
                  <Bar dataKey="pending" name="Pendente" fill="#F59E0B" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Comissões por Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {summary.byPlan && summary.byPlan.length > 0 && summary.byPlan.some((entry: { name: string; value: number; color: string }) => entry.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.byPlan}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }: PieLabelRenderProps) => `${name || ''}: ${((percent as number) * 100).toFixed(0)}%`}
                    >
                      {summary.byPlan.map((entry: { name: string; value: number; color: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Comissão']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-sm font-medium">Nenhum dado disponível</p>
                  <p className="text-xs mt-1">Não há comissões por plano para exibir</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Negócios Fechados</p>
            <p className="text-3xl font-bold mt-2">{summary.totalDeals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Comissão Média</p>
            <p className="text-3xl font-bold mt-2">{formatCurrency(summary.avgCommission)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Taxa Média</p>
            <p className="text-3xl font-bold mt-2">{summary.commissionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filtrar por Status:</span>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="calculated">Calculada</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="released">Liberada</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
                <SelectItem value="rejected">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Histórico de Comissões ({filteredCommissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Agência</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Plano</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor do Negócio</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Taxa</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Comissão</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fechamento</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((commission: Commission) => (
                  <tr key={commission.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{commission.agencyName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        commission.planType === 'Starter' ? 'bg-gray-100 text-gray-800' :
                        commission.planType === 'Business' ? 'bg-blue-100 text-blue-800' :
                        commission.planType === 'Premium' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {commission.planType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{formatCurrency(commission.dealValue)}</td>
                    <td className="py-3 px-4 text-sm">{commission.commissionRate}%</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-green-600">{formatCurrency(commission.commissionValue)}</span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(commission.status)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(commission.closedAt)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(commission.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCommissions.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma comissão encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Informações de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Ciclo de Pagamento</h4>
              <p className="text-sm text-blue-600">
                Comissões são processadas no último dia útil de cada mês para negócios fechados até o dia 25.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Método de Pagamento</h4>
              <p className="text-sm text-green-600">
                Transferência bancária na conta cadastrada. Confira seus dados bancários no perfil.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">Taxas de Comissão</h4>
              <p className="text-sm text-purple-600">
                Starter: 8% | Business: 10% | Premium: 12% | Enterprise: 15%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
