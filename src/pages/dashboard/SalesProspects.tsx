import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { CEPInput } from '../../components/ui/cep-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import apiClient from '../../api/client';
import { toast } from 'sonner';
import { usersAPI } from '../../api';
import { Building2, Plus, Search, Mail, Edit, Eye, Clock, CheckCircle, XCircle, User, Filter, Trash2, Loader2, Briefcase } from 'lucide-react';
import { formatCNPJInput, validateCNPJ } from '../../lib/validation';

interface Prospect {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  city?: string;
  state?: string;
  address?: string;
  cep?: string;
  cnpj?: string;
  type?: 'agency' | 'independent_owner';
  status: 'prospecting' | 'qualified' | 'negotiation' | 'won' | 'lost';
  stage?: string;
  source?: string;
  planInterest?: 'starter' | 'business' | 'premium' | 'enterprise';
  estimatedValue?: number;
  probability?: number;
  notes?: string;
  lastContactAt?: string;
  createdAt: string;
  leadId?: string;
}

const statusConfig = {
  prospecting: { label: 'Prospectando', color: 'bg-gray-100 text-gray-800', icon: Clock },
  qualified: { label: 'Qualificado', color: 'bg-blue-100 text-blue-800', icon: Briefcase },
  negotiation: { label: 'Negociação', color: 'bg-yellow-100 text-yellow-800', icon: Edit },
  won: { label: 'Ganho', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  lost: { label: 'Perdido', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const planConfig = {
  starter: { label: 'Starter', color: 'bg-gray-100 text-gray-800' },
  business: { label: 'Business', color: 'bg-blue-100 text-blue-800' },
  premium: { label: 'Premium', color: 'bg-purple-100 text-purple-800' },
  enterprise: { label: 'Enterprise', color: 'bg-emerald-100 text-emerald-800' },
};

const typeConfig = {
  agency: { label: 'Agência', color: 'bg-blue-50 text-blue-700' },
  independent_owner: { label: 'Proprietário Independente', color: 'bg-green-50 text-green-700' },
};

const sourceConfig = {
  manual: { label: 'Criação Manual', color: 'bg-gray-50 text-gray-700' },
  direct_signup: { label: 'Cadastro Direto', color: 'bg-blue-50 text-blue-700' },
  invitation: { label: 'Convite', color: 'bg-purple-50 text-purple-700' },
  referral: { label: 'Indicação', color: 'bg-green-50 text-green-700' },
};

export function SalesProspects() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [formName, setFormName] = useState<string>('');
  const [formContactName, setFormContactName] = useState<string>('');
  const [formContactEmail, setFormContactEmail] = useState<string>('');
  const [formContactPhone, setFormContactPhone] = useState<string>('');
  const [formType, setFormType] = useState<'agency' | 'independent_owner'>('agency');
  const [formStatus, setFormStatus] = useState<Prospect['status']>('prospecting');
  const [formPlanInterest, setFormPlanInterest] = useState<Prospect['planInterest'] | ''>('');
  const [formCEP, setFormCEP] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formCity, setFormCity] = useState<string>('');
  const [formState, setFormState] = useState<string>('');
  const [formCNPJ, setFormCNPJ] = useState<string>('');
  const [formEstimatedValue, setFormEstimatedValue] = useState<string>('');
  const [formProbability, setFormProbability] = useState<string>('20');
  const [formSource, setFormSource] = useState<string>('manual');
  const [formNotes, setFormNotes] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [checkingEmail, setCheckingEmail] = useState<boolean>(false);
  const [cnpjError, setCnpjError] = useState<string>('');
  const [cnpjVerified, setCnpjVerified] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [phoneVerified, setPhoneVerified] = useState<boolean>(false);

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ['sales-prospects'],
    queryFn: async () => {
      const response = await apiClient.get('/sales-rep/prospects');
      return response.data || [];
    },
  });

  const createProspectMutation = useMutation({
    mutationFn: async (data: Partial<Prospect>) => {
      const response = await apiClient.post('/sales-rep/prospects', {
        name: data.name,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        type: data.type,
        city: data.city,
        state: data.state,
        address: data.address,
        cep: data.cep,
        cnpj: data.cnpj,
        source: data.source,
        planInterest: data.planInterest,
        estimatedValue: data.estimatedValue ? Number(data.estimatedValue) : undefined,
        probability: data.probability ? Number(data.probability) : undefined,
        notes: data.notes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-prospects'] });
      setShowAddModal(false);
      resetForm();
      toast.success('Prospecto criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao criar prospecto');
    },
  });

  const updateProspectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Prospect> }) => {
      const response = await apiClient.put(`/sales-rep/prospects/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-prospects'] });
      setShowEditModal(false);
      setSelectedProspect(null);
      resetForm();
      toast.success('Prospecto atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar prospecto');
    },
  });

  const deleteProspectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/sales-rep/prospects/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-prospects'] });
      setShowDeleteModal(false);
      setSelectedProspect(null);
      toast.success('Prospecto excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao excluir prospecto');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Prospect['status'] }) => {
      const response = await apiClient.patch(`/sales-rep/prospects/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-prospects'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar status');
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormContactName('');
    setFormContactEmail('');
    setFormContactPhone('');
    setFormType('agency');
    setFormStatus('prospecting');
    setFormPlanInterest('');
    setFormCEP('');
    setFormAddress('');
    setFormCity('');
    setFormState('');
    setFormCNPJ('');
    setFormEstimatedValue('');
    setFormProbability('20');
    setFormSource('manual');
    setFormNotes('');
    setEmailError('');
    setEmailVerified(false);
    setCnpjError('');
    setCnpjVerified(false);
    setPhoneError('');
    setPhoneVerified(false);
  };

  const filteredProspects = prospects.filter((prospect: Prospect) => {
    const matchesSearch =
      prospect.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.cnpj?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || prospect.status === statusFilter;
    const matchesType = typeFilter === 'all' || prospect.type === typeFilter;
    const matchesPlan = planFilter === 'all' || prospect.planInterest === planFilter;
    return matchesSearch && matchesStatus && matchesType && matchesPlan;
  });

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: Prospect['status']) => {
    const config = statusConfig[status];
    if (!config) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3" />
          {status || 'Desconhecido'}
        </span>
      );
    }
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getPlanBadge = (plan?: Prospect['planInterest']) => {
    if (!plan) return null;
    const config = planConfig[plan];
    if (!config) return null;
    return <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>{config.label}</span>;
  };

  const getTypeBadge = (type?: Prospect['type']) => {
    if (!type) return null;
    const config = typeConfig[type];
    if (!config) return null;
    return <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>{config.label}</span>;
  };

  const handleCEPData = useCallback((data: any) => {
    setFormAddress(data.logradouro || data.street || data.address || formAddress);
    setFormCity(data.cidade || data.city || formCity);
    setFormState(data.estado || data.state || formState);
  }, [formAddress, formCity, formState]);

  const checkEmailExists = useCallback(async (email: string, currentEmail?: string) => {
    setEmailVerified(false);
    if (!email || email === currentEmail) {
      setEmailError('');
      if (email === currentEmail) {
        setEmailVerified(true);
      }
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Formato de email inválido');
      return;
    }
    setCheckingEmail(true);
    try {
      const result = await usersAPI.checkEmailExists(email);
      if (result.exists) {
        setEmailError('Este email já está em uso, por favor altere o email');
        setEmailVerified(false);
        toast.error('Este email já está em uso, por favor altere o email');
      } else {
        setEmailError('');
        setEmailVerified(true);
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailError('Erro ao verificar email');
      setEmailVerified(false);
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  const validateCNPJField = useCallback((cnpj: string) => {
    if (!cnpj || cnpj.trim() === '') {
      setCnpjError('');
      setCnpjVerified(true); // Empty is valid (optional field)
      return;
    }
    const result = validateCNPJ(cnpj);
    if (result.isValid) {
      setCnpjError('');
      setCnpjVerified(true);
    } else {
      setCnpjError(result.error || 'CNPJ inválido');
      setCnpjVerified(false);
    }
  }, []);

  // Format phone input
  const formatPhoneInput = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
  };

  // Validate phone number
  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    const cleaned = phone.replace(/\D/g, '');
    // Brazilian phone: 10 digits (landline) or 11 digits (mobile)
    return cleaned.length === 10 || cleaned.length === 11;
  };

  // Handle phone input change
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneInput(value);
    setFormContactPhone(formatted);
    setPhoneError('');

    if (formatted) {
      const isValid = validatePhone(formatted);
      if (!isValid) {
        setPhoneError('Telefone deve ter 10 ou 11 dígitos');
        setPhoneVerified(false);
      } else {
        setPhoneError('');
        setPhoneVerified(true);
      }
    } else {
      setPhoneVerified(true); // Empty is valid (optional field)
    }
  };

  const handleEditProspect = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setFormName(prospect.name);
    setFormContactName(prospect.contactName);
    setFormContactEmail(prospect.contactEmail);
    const phoneValue = prospect.contactPhone || '';
    setFormContactPhone(phoneValue ? formatPhoneInput(phoneValue) : '');
    setFormType(prospect.type || 'agency');
    setFormStatus(prospect.status);
    setFormPlanInterest(prospect.planInterest || '');
    setFormCEP(prospect.cep || '');
    setFormAddress(prospect.address || '');
    setFormCity(prospect.city || '');
    setFormState(prospect.state || '');
    setFormCNPJ(prospect.cnpj || '');
    setFormEstimatedValue(prospect.estimatedValue?.toString() || '');
    setFormProbability(prospect.probability?.toString() || '20');
    setFormSource(prospect.source || 'manual');
    setFormNotes(prospect.notes || '');
    setEmailVerified(true);
    setEmailError('');
    if (prospect.cnpj) {
      validateCNPJField(prospect.cnpj);
    } else {
      setCnpjVerified(true);
      setCnpjError('');
    }
    setPhoneVerified(phoneValue ? validatePhone(phoneValue) : true);
    setPhoneError('');
    setShowEditModal(true);
  };

  const handleDeleteProspect = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setShowDeleteModal(true);
  };

  const confirmDeleteProspect = () => {
    if (selectedProspect) {
      deleteProspectMutation.mutate(selectedProspect.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold">Prospectos</h1>
          </div>
          <p className="text-muted-foreground">Gerencie seus prospectos comerciais e acompanhe o pipeline de vendas</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Novo Prospecto
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = prospects.filter((p: Prospect) => p.status === key).length;
          const Icon = config.icon;
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${statusFilter === key ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{config.label}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            </div>
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger><SelectValue placeholder="Plano de Interesse" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Planos</SelectItem>
                    {Object.entries(planConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Prospectos ({filteredProspects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contato</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor Estimado</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Criado em</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProspects.map((prospect: Prospect) => (
                  <tr key={prospect.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-sm">{prospect.name}</p>
                      {prospect.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {prospect.cnpj}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{prospect.contactName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        {prospect.contactEmail}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getTypeBadge(prospect.type) || <span className="text-sm text-muted-foreground">-</span>}</td>
                    <td className="py-3 px-4">
                      <Select
                        value={prospect.status}
                        onValueChange={(value) => {
                          updateStatusMutation.mutate({ id: prospect.id, status: value as Prospect['status'] });
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="h-auto py-1 px-2 border-0 bg-transparent hover:bg-gray-100 w-auto min-w-[140px]">
                          <SelectValue>
                            {getStatusBadge(prospect.status)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => {
                            const Icon = config.icon;
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" />
                                  <span>{config.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4 text-sm">{formatCurrency(prospect.estimatedValue)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(prospect.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedProspect(prospect); setShowDetailModal(true); }} title="Ver detalhes">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditProspect(prospect)} title="Editar prospecto">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProspect(prospect)} title="Excluir prospecto" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-3">
            {filteredProspects.map((prospect: Prospect) => (
              <div key={prospect.id} className="border rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm break-words">{prospect.name}</p>
                    {prospect.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {prospect.cnpj}</p>}
                    <p className="text-xs text-muted-foreground">Criado em {formatDate(prospect.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {getStatusBadge(prospect.status)}
                    {getTypeBadge(prospect.type) || <span className="text-xs text-muted-foreground">-</span>}
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="break-words">{prospect.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="break-all">{prospect.contactEmail}</span>
                  </div>
                  {prospect.estimatedValue && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Valor:</span>
                      <span className="font-medium">{formatCurrency(prospect.estimatedValue)}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedProspect(prospect); setShowDetailModal(true); }}>Detalhes</Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditProspect(prospect)}>Editar</Button>
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteProspect(prospect)}>Excluir</Button>
                </div>
              </div>
            ))}
          </div>
          {filteredProspects.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum prospecto encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Prospect Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Novo Prospecto</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!formName || !formContactName || !formContactEmail) {
                toast.error('Por favor, preencha todos os campos obrigatórios');
                return;
              }
              if (!emailVerified) {
                toast.error('Por favor, verifique o email antes de continuar');
                return;
              }
              createProspectMutation.mutate({
                name: formName,
                contactName: formContactName,
                contactEmail: formContactEmail,
                contactPhone: formContactPhone || undefined,
                type: formType,
                city: formCity || undefined,
                state: formState || undefined,
                address: formAddress || undefined,
                cep: formCEP || undefined,
                cnpj: formCNPJ || undefined,
                source: formSource,
                planInterest: formPlanInterest || undefined,
                estimatedValue: formEstimatedValue ? Number(formEstimatedValue) : undefined,
                probability: formProbability ? Number(formProbability) : undefined,
                notes: formNotes || undefined,
              });
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Empresa/Agência *</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">E-mail *</label>
                  <div className="relative">
                    <Input type="email" value={formContactEmail} onChange={(e) => { setFormContactEmail(e.target.value); setEmailVerified(false); setEmailError(''); }} onBlur={(e) => checkEmailExists(e.target.value)} placeholder="email@exemplo.com" required className={`pr-10 ${emailError ? 'border-red-500' : emailVerified ? 'border-green-500' : ''}`} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingEmail && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                      {!checkingEmail && emailVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {!checkingEmail && emailError && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                  {emailVerified && !emailError && <p className="text-green-500 text-sm mt-1">Email disponível</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome do Contato *</label>
                  <Input value={formContactName} onChange={(e) => setFormContactName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <div className="relative">
                    <Input
                      type="tel"
                      value={formContactPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value && !validatePhone(e.target.value)) {
                          setPhoneError('Telefone deve ter 10 ou 11 dígitos');
                          setPhoneVerified(false);
                        }
                      }}
                      placeholder="(11) 99999-9999"
                      className={`pr-10 ${phoneError ? 'border-red-500' : phoneVerified && formContactPhone ? 'border-green-500' : ''}`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {phoneVerified && formContactPhone && !phoneError && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {phoneError && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
                  {phoneVerified && formContactPhone && !phoneError && <p className="text-green-500 text-sm mt-1">Telefone válido</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo *</label>
                  <Select value={formType} onValueChange={(value) => setFormType(value as 'agency' | 'independent_owner')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CNPJ</label>
                  <div className="relative">
                    <Input
                      value={formCNPJ}
                      onChange={(e) => {
                        const formatted = formatCNPJInput(e.target.value);
                        setFormCNPJ(formatted);
                        setCnpjError('');
                        setCnpjVerified(false);
                      }}
                      onBlur={(e) => validateCNPJField(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className={`pr-10 ${cnpjError ? 'border-red-500' : cnpjVerified && formCNPJ ? 'border-green-500' : ''}`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {cnpjVerified && formCNPJ && !cnpjError && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {cnpjError && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  {cnpjError && <p className="text-red-500 text-sm mt-1">{cnpjError}</p>}
                  {cnpjVerified && formCNPJ && !cnpjError && <p className="text-green-500 text-sm mt-1">CNPJ válido</p>}
                </div>
              </div>
              <div>
                <CEPInput value={formCEP} onChange={(value) => setFormCEP(value)} onCEPData={handleCEPData} label="CEP" placeholder="00000-000" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Endereço</label>
                <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cidade</label>
                  <Input value={formCity} onChange={(e) => setFormCity(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <Input maxLength={2} placeholder="SP" value={formState} onChange={(e) => setFormState(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Origem</label>
                  <Select value={formSource} onValueChange={setFormSource}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(sourceConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Plano de Interesse</label>
                  <Select value={formPlanInterest || 'none'} onValueChange={(value) => setFormPlanInterest(value === 'none' ? '' : value as Prospect['planInterest'])}>
                    <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {Object.entries(planConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valor Estimado (R$)</label>
                  <Input type="number" step="0.01" value={formEstimatedValue} onChange={(e) => setFormEstimatedValue(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Probabilidade (%)</label>
                  <Input type="number" min="0" max="100" value={formProbability} onChange={(e) => setFormProbability(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="w-full px-3 py-2 border rounded-lg resize-none" rows={3} placeholder="Observações sobre o prospecto..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit" disabled={createProspectMutation.isPending || checkingEmail || !emailVerified}>
                  {createProspectMutation.isPending ? 'Salvando...' : 'Criar Prospecto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Prospect Modal */}
      {showEditModal && selectedProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowEditModal(false); setSelectedProspect(null); resetForm(); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Editar Prospecto</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!formName || !formContactName || !formContactEmail) {
                toast.error('Por favor, preencha todos os campos obrigatórios');
                return;
              }
              if (!emailVerified) {
                toast.error('Por favor, verifique o email antes de continuar');
                return;
              }
              updateProspectMutation.mutate({
                id: selectedProspect.id,
                data: {
                  name: formName,
                  contactName: formContactName,
                  contactEmail: formContactEmail,
                  contactPhone: formContactPhone || undefined,
                  type: formType,
                  status: formStatus,
                  city: formCity || undefined,
                  state: formState || undefined,
                  address: formAddress || undefined,
                  cep: formCEP || undefined,
                  cnpj: formCNPJ || undefined,
                  source: formSource,
                  planInterest: formPlanInterest || undefined,
                  estimatedValue: formEstimatedValue ? Number(formEstimatedValue) : undefined,
                  probability: formProbability ? Number(formProbability) : undefined,
                  notes: formNotes || undefined,
                },
              });
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Empresa/Agência *</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">E-mail *</label>
                  <div className="relative">
                    <Input type="email" value={formContactEmail} onChange={(e) => { setFormContactEmail(e.target.value); setEmailVerified(false); setEmailError(''); }} onBlur={(e) => checkEmailExists(e.target.value, selectedProspect.contactEmail)} placeholder="email@exemplo.com" required className={`pr-10 ${emailError ? 'border-red-500' : emailVerified ? 'border-green-500' : ''}`} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingEmail && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                      {!checkingEmail && emailVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {!checkingEmail && emailError && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                  {emailVerified && !emailError && <p className="text-green-500 text-sm mt-1">Email disponível</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome do Contato *</label>
                  <Input value={formContactName} onChange={(e) => setFormContactName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <div className="relative">
                    <Input
                      type="tel"
                      value={formContactPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value && !validatePhone(e.target.value)) {
                          setPhoneError('Telefone deve ter 10 ou 11 dígitos');
                          setPhoneVerified(false);
                        }
                      }}
                      placeholder="(11) 99999-9999"
                      className={`pr-10 ${phoneError ? 'border-red-500' : phoneVerified && formContactPhone ? 'border-green-500' : ''}`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {phoneVerified && formContactPhone && !phoneError && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {phoneError && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
                  {phoneVerified && formContactPhone && !phoneError && <p className="text-green-500 text-sm mt-1">Telefone válido</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo *</label>
                  <Select value={formType} onValueChange={(value) => setFormType(value as 'agency' | 'independent_owner')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={formStatus} onValueChange={(value) => setFormStatus(value as Prospect['status'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CNPJ</label>
                <div className="relative">
                  <Input
                    value={formCNPJ}
                    onChange={(e) => {
                      const formatted = formatCNPJInput(e.target.value);
                      setFormCNPJ(formatted);
                      setCnpjError('');
                      setCnpjVerified(false);
                    }}
                    onBlur={(e) => validateCNPJField(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className={`pr-10 ${cnpjError ? 'border-red-500' : cnpjVerified && formCNPJ ? 'border-green-500' : ''}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {cnpjVerified && formCNPJ && !cnpjError && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {cnpjError && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
                {cnpjError && <p className="text-red-500 text-sm mt-1">{cnpjError}</p>}
                {cnpjVerified && formCNPJ && !cnpjError && <p className="text-green-500 text-sm mt-1">CNPJ válido</p>}
              </div>
              <div>
                <CEPInput value={formCEP} onChange={(value) => setFormCEP(value)} onCEPData={handleCEPData} label="CEP" placeholder="00000-000" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Endereço</label>
                <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cidade</label>
                  <Input value={formCity} onChange={(e) => setFormCity(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <Input maxLength={2} placeholder="SP" value={formState} onChange={(e) => setFormState(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Origem</label>
                  <Select value={formSource} onValueChange={setFormSource}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(sourceConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Plano de Interesse</label>
                  <Select value={formPlanInterest || 'none'} onValueChange={(value) => setFormPlanInterest(value === 'none' ? '' : value as Prospect['planInterest'])}>
                    <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {Object.entries(planConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valor Estimado (R$)</label>
                  <Input type="number" step="0.01" value={formEstimatedValue} onChange={(e) => setFormEstimatedValue(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Probabilidade (%)</label>
                  <Input type="number" min="0" max="100" value={formProbability} onChange={(e) => setFormProbability(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="w-full px-3 py-2 border rounded-lg resize-none" rows={3} placeholder="Observações sobre o prospecto..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setShowEditModal(false); setSelectedProspect(null); resetForm(); }}>Cancelar</Button>
                <Button type="submit" disabled={updateProspectMutation.isPending || checkingEmail || !emailVerified}>
                  {updateProspectMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Prospect Modal */}
      {showDetailModal && selectedProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowDetailModal(false); setSelectedProspect(null); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Detalhes do Prospecto</h2>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 pb-4 border-b">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold break-words">{selectedProspect.name}</h3>
                {selectedProspect.cnpj && <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">CNPJ: {selectedProspect.cnpj}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {getStatusBadge(selectedProspect.status)}
                {getTypeBadge(selectedProspect.type)}
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Empresa/Agência</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm">{selectedProspect.name || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">E-mail</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm break-all">{selectedProspect.contactEmail || '-'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome do Contato</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm">{selectedProspect.contactName || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm">{selectedProspect.contactPhone || '-'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">CNPJ</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm">{selectedProspect.cnpj || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CEP</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm">{selectedProspect.cep || '-'}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Endereço</label>
                <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm">{selectedProspect.address || '-'}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cidade</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm">{selectedProspect.city || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm">{selectedProspect.state || '-'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plano de Interesse</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm">{getPlanBadge(selectedProspect.planInterest) || <span className="text-muted-foreground">Não definido</span>}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor Estimado</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm">{formatCurrency(selectedProspect.estimatedValue)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Probabilidade</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm">{selectedProspect.probability ? `${selectedProspect.probability}%` : '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Criado em</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm">{formatDate(selectedProspect.createdAt)}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <div className="px-3 py-2 border rounded-lg bg-yellow-50 text-sm whitespace-pre-wrap min-h-[80px]">{selectedProspect.notes || '-'}</div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => { setShowDetailModal(false); setSelectedProspect(null); }}>Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Prospect Modal */}
      {showDeleteModal && selectedProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowDeleteModal(false); setSelectedProspect(null); }}>
          <div className="bg-white rounded-xl px-6 sm:px-8 py-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Excluir Prospecto</h2>
                <p className="text-sm text-muted-foreground mt-1">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-700">Tem certeza que deseja excluir o prospecto <strong>"{selectedProspect.name}"</strong>?</p>
              <p className="text-xs text-muted-foreground mt-2">Todos os dados relacionados a este prospecto serão permanentemente removidos.</p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setShowDeleteModal(false); setSelectedProspect(null); }} disabled={deleteProspectMutation.isPending}>Cancelar</Button>
              <Button type="button" onClick={confirmDeleteProspect} disabled={deleteProspectMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white">
                {deleteProspectMutation.isPending ? 'Excluindo...' : 'Excluir Prospecto'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
