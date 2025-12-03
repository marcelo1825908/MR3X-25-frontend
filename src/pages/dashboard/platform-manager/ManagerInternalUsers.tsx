import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Search, Eye, Shield, UserCog, Award, Code,
  Scale, Mail, Phone, Calendar, Clock, CheckCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { platformManagerAPI } from '../../../api';

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'CEO':
      return <Shield className="w-4 h-4" />;
    case 'ADMIN':
      return <UserCog className="w-4 h-4" />;
    case 'PLATFORM_MANAGER':
      return <Users className="w-4 h-4" />;
    case 'SALES_REP':
      return <Award className="w-4 h-4" />;
    case 'LEGAL_AUDITOR':
      return <Scale className="w-4 h-4" />;
    case 'API_CLIENT':
      return <Code className="w-4 h-4" />;
    default:
      return <Users className="w-4 h-4" />;
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'CEO':
      return 'CEO';
    case 'ADMIN':
      return 'Administrador';
    case 'PLATFORM_MANAGER':
      return 'Gerente de Plataforma';
    case 'SALES_REP':
      return 'Representante de Vendas';
    case 'LEGAL_AUDITOR':
      return 'Auditor Legal';
    case 'API_CLIENT':
      return 'Cliente API';
    default:
      return role;
  }
};

export function ManagerInternalUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch internal users
  const { data: internalUsers = [], isLoading } = useQuery({
    queryKey: ['platform-manager', 'internal-users', searchTerm, roleFilter, statusFilter],
    queryFn: () => platformManagerAPI.getInternalUsers({
      search: searchTerm || undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  });

  const users = Array.isArray(internalUsers) ? internalUsers : (internalUsers.users || []);

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const openDetails = (user: any) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const adminCount = users.filter((u: any) => u.role === 'ADMIN' || u.role === 'CEO').length;
  const managerCount = users.filter((u: any) => u.role === 'PLATFORM_MANAGER').length;
  const salesCount = users.filter((u: any) => u.role === 'SALES_REP').length;
  const auditorCount = users.filter((u: any) => u.role === 'LEGAL_AUDITOR').length;
  const apiCount = users.filter((u: any) => u.role === 'API_CLIENT').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Usuários Internos MR3X</h1>
        <p className="text-muted-foreground">Visualize a equipe interna da plataforma (somente leitura)</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adminCount}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{managerCount}</p>
                <p className="text-sm text-muted-foreground">Gerentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{salesCount}</p>
                <p className="text-sm text-muted-foreground">Vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Scale className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{auditorCount}</p>
                <p className="text-sm text-muted-foreground">Auditores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Code className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{apiCount}</p>
                <p className="text-sm text-muted-foreground">API Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Funções</SelectItem>
                <SelectItem value="CEO">CEO</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="PLATFORM_MANAGER">Gerente de Plataforma</SelectItem>
                <SelectItem value="SALES_REP">Representante de Vendas</SelectItem>
                <SelectItem value="LEGAL_AUDITOR">Auditor Legal</SelectItem>
                <SelectItem value="API_CLIENT">Cliente API</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equipe Interna</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuários encontrados
            <span className="ml-2 text-orange-600">• Gerente não pode criar ou excluir usuários</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum usuário encontrado</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Usuário</th>
                    <th className="text-left py-3 px-4 font-medium">Função</th>
                    <th className="text-left py-3 px-4 font-medium">Departamento</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Último Acesso</th>
                    <th className="text-left py-3 px-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: any) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span>{getRoleLabel(user.role)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{user.department}</td>
                      <td className="py-3 px-4">
                        <Badge className={user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" onClick={() => openDetails(user)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>Informações do membro da equipe MR3X</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 mt-4">
              {/* User Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedUser.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleIcon(selectedUser.role)}
                    <span className="text-muted-foreground">{getRoleLabel(selectedUser.role)}</span>
                    <Badge className={selectedUser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {selectedUser.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{selectedUser.phone || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Membro desde</p>
                      <p className="font-medium">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Último acesso</p>
                      <p className="font-medium">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString('pt-BR') : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Permissões</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.permissions?.length > 0 ? (
                      selectedUser.permissions.map((perm: string) => (
                        <Badge key={perm} variant="outline" className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {perm === 'all' ? 'Acesso Total' : perm}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Nenhuma permissão especial</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700">
                  <strong>Nota:</strong> Como Gerente de Plataforma, você pode visualizar os usuários internos mas não pode criar, editar ou excluir. Essas ações são exclusivas do Administrador.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
