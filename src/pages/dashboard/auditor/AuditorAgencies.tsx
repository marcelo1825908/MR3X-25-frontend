import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Input } from '../../../components/ui/input';
import {
  Building2, Search, Eye, FileText, Clock, CheckCircle, XCircle, Package
} from 'lucide-react';
import { auditorAPI } from '../../../api';

interface Agency {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastActivity: string;
  stats: {
    properties: number;
    contracts: number;
    users: number;
    documents: number;
  };
}

export function AuditorAgencies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);

  const [activeTab, setActiveTab] = useState<'agencies' | 'owners'>('agencies');

  const { data: agenciesData = { agencies: [], independentOwners: [], stats: { total: 0, active: 0, inactive: 0, suspended: 0, totalOwners: 0 } }, isLoading } = useQuery({
    queryKey: ['auditor', 'agencies', searchTerm],
    queryFn: () => auditorAPI.getAgencies({ search: searchTerm || undefined }),
  });

  const agencies = agenciesData.agencies || [];
  const independentOwners = agenciesData.independentOwners || [];
  const stats = agenciesData.stats || { total: 0, active: 0, inactive: 0, suspended: 0, totalOwners: 0 };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredAgencies = agencies.filter((agency: Agency) =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.cnpj.includes(searchTerm) ||
    agency.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOwners = independentOwners.filter((owner: any) =>
    owner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (owner.cpf && owner.cpf.includes(searchTerm)) ||
    owner.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Skeleton */}
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-10 w-full rounded" />
          </CardContent>
        </Card>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-32 mb-2" />
                        <div className="flex gap-4">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Skeleton className="w-12 h-12 mx-auto mb-3 rounded" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusStyle = (status: Agency['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'suspended': return 'bg-red-100 text-red-700';
    }
  };

  const getStatusLabel = (status: Agency['status']) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'inactive': return 'Inativa';
      case 'suspended': return 'Suspensa';
    }
  };

  const getPlanStyle = (plan: Agency['plan']) => {
    switch (plan) {
      case 'starter': return 'bg-blue-100 text-blue-700';
      case 'professional': return 'bg-purple-100 text-purple-700';
      case 'enterprise': return 'bg-orange-100 text-orange-700';
    }
  };

  const getPlanLabel = (plan: Agency['plan']) => {
    switch (plan) {
      case 'starter': return 'Starter';
      case 'professional': return 'Professional';
      case 'enterprise': return 'Enterprise';
    }
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Building2 className="w-6 h-6 text-blue-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Agências / Proprietários Independentes</h1>
          <p className="text-muted-foreground">Lista de todas as agências e proprietários independentes (somente leitura)</p>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Agências</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ativas</p>
              <p className="text-xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inativas</p>
              <p className="text-xl font-bold">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Suspensas</p>
              <p className="text-xl font-bold">{stats.suspended}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Proprietários</p>
              <p className="text-xl font-bold">{stats.totalOwners || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar agências ou proprietários por nome, CNPJ/CPF ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('agencies')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'agencies' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground'
            }`}
          >
            Agências ({filteredAgencies.length})
          </button>
          <button
            onClick={() => setActiveTab('owners')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'owners' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground'
            }`}
          >
            Proprietários Independentes ({filteredOwners.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {activeTab === 'agencies' ? `Lista de Agências (${filteredAgencies.length})` : `Proprietários Independentes (${filteredOwners.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeTab === 'agencies' ? (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {filteredAgencies.map((agency: Agency) => (
                <div
                  key={agency.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedAgency?.id === agency.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedAgency(agency)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{agency.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusStyle(agency.status)}`}>
                          {getStatusLabel(agency.status)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{agency.cnpj}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {agency.stats.properties} imóveis
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {agency.stats.contracts} contratos
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getPlanStyle(agency.plan)}`}>
                      {getPlanLabel(agency.plan)}
                    </span>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {filteredOwners.map((owner: any) => (
                  <div
                    key={owner.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedAgency?.id === owner.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedAgency(owner as any)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{owner.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusStyle(owner.status)}`}>
                            {getStatusLabel(owner.status)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-1">{owner.cpf || 'N/A'}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {owner.stats.properties} imóveis
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {owner.stats.contracts} contratos
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" /> {formatCurrency(owner.stats.totalRevenue || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {activeTab === 'agencies' ? 'Detalhes da Agência' : 'Detalhes do Proprietário'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAgency ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{selectedAgency.name}</p>
                </div>

                {activeTab === 'agencies' ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">CNPJ</p>
                      <p className="font-mono">{selectedAgency.cnpj}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${getPlanStyle(selectedAgency.plan)}`}>
                        <Package className="w-3 h-3 inline mr-1" />
                        {getPlanLabel(selectedAgency.plan)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(selectedAgency.status)}`}>
                        {getStatusLabel(selectedAgency.status)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">CPF</p>
                      <p className="font-mono">{(selectedAgency as any).cpf || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Endereço</p>
                      <p className="text-sm">{(selectedAgency as any).address || 'N/A'}</p>
                      <p className="text-sm">{(selectedAgency as any).city || ''} - {(selectedAgency as any).state || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Último Login</p>
                      <p className="text-sm">{(selectedAgency as any).lastLogin ? new Date((selectedAgency as any).lastLogin).toLocaleString('pt-BR') : 'Nunca'}</p>
                    </div>
                  </>
                )}

                <div>
                  <p className="text-xs text-muted-foreground">Contato</p>
                  <p className="text-sm">{selectedAgency.email}</p>
                  <p className="text-sm">{selectedAgency.phone}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Data de Cadastro</p>
                  <p className="text-sm">{new Date(selectedAgency.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>

                {activeTab === 'agencies' && (
                  <div>
                    <p className="text-xs text-muted-foreground">Última Atividade</p>
                    <p className="text-sm">{selectedAgency.lastActivity}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Estatísticas</p>
                  <div className={`grid gap-3 ${activeTab === 'agencies' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-lg font-bold">{selectedAgency.stats.properties}</p>
                      <p className="text-xs text-muted-foreground">Imóveis</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-lg font-bold">{selectedAgency.stats.contracts}</p>
                      <p className="text-xs text-muted-foreground">Contratos</p>
                    </div>
                    {activeTab === 'agencies' && (
                      <>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-lg font-bold">{selectedAgency.stats.users}</p>
                          <p className="text-xs text-muted-foreground">Usuários</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-lg font-bold">{selectedAgency.stats.documents}</p>
                          <p className="text-xs text-muted-foreground">Documentos</p>
                        </div>
                      </>
                    )}
                    {activeTab === 'owners' && (
                      <>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-lg font-bold">{selectedAgency.stats.documents}</p>
                          <p className="text-xs text-muted-foreground">Documentos</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-lg font-bold">{formatCurrency((selectedAgency.stats as any).totalRevenue || 0)}</p>
                          <p className="text-xs text-muted-foreground">Receita Total</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Selecione {activeTab === 'agencies' ? 'uma agência' : 'um proprietário'} para ver os detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
