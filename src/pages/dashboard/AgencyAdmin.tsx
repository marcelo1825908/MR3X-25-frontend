import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  Building2,
  FileText,
  DollarSign,
  AlertTriangle,
  Settings,
  BarChart3,
  UserPlus,
  Home,
  Calendar,
  Eye
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usersAPI, propertiesAPI, contractsAPI, paymentsAPI } from '@/api'

export function AgencyAdmin() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  // Allow only CEO or ADMIN to view this page
  if (!user || !['CEO', 'ADMIN'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold">Acesso Negado</h3>
          <p className="text-muted-foreground">Voce nao tem permissao para acessar o painel do Diretor da Agencia.</p>
        </div>
      </div>
    )
  }

  // Fetch agency-wide data
  const { data: managers, isLoading: loadingManagers } = useQuery({
    queryKey: ['agency-managers', user?.agencyId],
    queryFn: () => usersAPI.listUsers({ role: 'AGENCY_MANAGER' }),
    enabled: !!user,
  })

  const { data: brokers, isLoading: loadingBrokers } = useQuery({
    queryKey: ['agency-brokers', user?.agencyId],
    queryFn: () => usersAPI.listUsers({ role: 'BROKER' }),
    enabled: !!user,
  })

  const { data: properties, isLoading: loadingProperties } = useQuery({
    queryKey: ['agency-properties', user?.agencyId],
    queryFn: () => propertiesAPI.getProperties(),
    enabled: !!user,
  })

  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ['agency-contracts', user?.agencyId],
    queryFn: () => contractsAPI.getContracts(),
    enabled: !!user,
  })

  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['agency-payments', user?.agencyId],
    queryFn: () => paymentsAPI.getPayments(),
    enabled: !!user,
  })

  // Calculate KPIs
  const totalManagers = managers?.items?.length || 0
  const totalBrokers = brokers?.items?.length || 0
  const totalProperties = properties?.items?.length || 0
  const totalContracts = contracts?.items?.length || 0
  const occupiedProperties = properties?.items?.filter((p: any) => p.status === 'ALUGADO' || p.status === 'RENTED')?.length || 0
  const occupancyRate = totalProperties > 0 ? ((occupiedProperties / totalProperties) * 100).toFixed(1) : '0'

  const totalRevenue = payments?.items?.reduce((sum: number, payment: any) => sum + (Number(payment.amount) || 0), 0) || 0
  const pendingPayments = payments?.items?.filter((p: any) => p.status === 'PENDENTE' || p.status === 'PENDING')?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Painel do Diretor</h1>
          <p className="text-muted-foreground">
            Visao geral da agencia - {totalManagers} gestores - {totalBrokers} corretores - {totalProperties} imoveis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuracoes
          </Button>
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Gestor
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Gestores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalManagers}</div>
            <p className="text-xs text-muted-foreground">
              Supervisionando {totalBrokers} corretores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Total</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              Taxa de ocupacao: {occupancyRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContracts}</div>
            <p className="text-xs text-muted-foreground">
              {occupiedProperties} imoveis ocupados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingPayments} pagamentos pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visao Geral</TabsTrigger>
          <TabsTrigger value="managers">Gestores</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Relatorios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>Ultimas acoes na agencia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Novo contrato aprovado</p>
                    <p className="text-xs text-muted-foreground">Gestor Paulo - ha 2 horas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Propriedade cadastrada</p>
                    <p className="text-xs text-muted-foreground">Corretor Carla - ha 4 horas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pagamento em atraso</p>
                    <p className="text-xs text-muted-foreground">Contrato #1234 - ha 1 dia</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acoes Rapidas</CardTitle>
                <CardDescription>Operacoes frequentes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar Novo Gestor
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Relatorio de Performance
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuracoes da Agencia
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  Auditoria de Acoes
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="managers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestores da Agencia</CardTitle>
              <CardDescription>
                {totalManagers} gestores supervisionando {totalBrokers} corretores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingManagers ? (
                <div className="text-center py-4">Carregando gestores...</div>
              ) : (
                <div className="space-y-4">
                  {managers?.items?.map((manager: any) => (
                    <div key={manager.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{manager.name}</p>
                          <p className="text-sm text-muted-foreground">{manager.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {manager.phone || 'Sem telefone'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!managers?.items || managers.items.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum gestor encontrado
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Gestor</CardTitle>
                <CardDescription>Metricas de cada equipe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Gestor Paulo</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Gestor Ana</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">72%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores Financeiros</CardTitle>
                <CardDescription>Receita e inadimplencia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Receita Mensal</span>
                    <span className="text-sm font-medium text-green-600">
                      R$ 125.000
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Inadimplencia</span>
                    <span className="text-sm font-medium text-red-600">
                      3.2%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Comissao da Agencia</span>
                    <span className="text-sm font-medium text-blue-600">
                      R$ 12.500
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatorios Disponiveis</CardTitle>
              <CardDescription>Gere relatorios detalhados da agencia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span>Relatorio de Performance</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  <span>Relatorio Financeiro</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Home className="h-6 w-6 mb-2" />
                  <span>Relatorio de Ocupacao</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  <span>Relatorio de Vencimentos</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
