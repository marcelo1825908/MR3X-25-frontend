import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  Users, Search, Eye, Shield, CheckCircle, XCircle, Building2, User
} from 'lucide-react';

type UserRole = 'CEO' | 'ADMIN' | 'PLATFORM_MANAGER' | 'REPRESENTATIVE' |
  'AGENCY_ADMIN' | 'AGENCY_MANAGER' | 'BROKER' | 'PROPRIETARIO' | 'INQUILINO';

type UserCategory = 'internal' | 'agency';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  category: UserCategory;
  agency?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin: string;
  permissions: string[];
}

const mockUsers: SystemUser[] = [
  // MR3X Internal Users
  {
    id: 'usr_001',
    name: 'Roberto Diretor',
    email: 'ceo@mr3x.com',
    role: 'CEO',
    category: 'internal',
    status: 'active',
    createdAt: '2022-01-01',
    lastLogin: '2024-12-01 08:00:00',
    permissions: ['full_access'],
  },
  {
    id: 'usr_002',
    name: 'Carlos Admin',
    email: 'admin@mr3x.com',
    role: 'ADMIN',
    category: 'internal',
    status: 'active',
    createdAt: '2022-01-15',
    lastLogin: '2024-12-01 09:30:00',
    permissions: ['manage_agencies', 'manage_users', 'view_reports', 'manage_plans'],
  },
  {
    id: 'usr_003',
    name: 'Ana Support',
    email: 'support@mr3x.com',
    role: 'PLATFORM_MANAGER',
    category: 'internal',
    status: 'active',
    createdAt: '2023-03-10',
    lastLogin: '2024-12-01 10:15:00',
    permissions: ['view_agencies', 'view_reports', 'support_tickets'],
  },
  {
    id: 'usr_004',
    name: 'Pedro Sales',
    email: 'sales@mr3x.com',
    role: 'REPRESENTATIVE',
    category: 'internal',
    status: 'active',
    createdAt: '2023-06-01',
    lastLogin: '2024-12-01 09:00:00',
    permissions: ['manage_prospects', 'view_commissions', 'create_proposals'],
  },
  // Agency Staff
  {
    id: 'usr_005',
    name: 'Maria Diretora',
    email: 'maria@imobcentro.com',
    role: 'AGENCY_ADMIN',
    category: 'agency',
    agency: 'Imobiliária Centro',
    status: 'active',
    createdAt: '2023-01-20',
    lastLogin: '2024-12-01 10:30:00',
    permissions: ['manage_agency', 'manage_staff', 'manage_properties', 'manage_contracts'],
  },
  {
    id: 'usr_006',
    name: 'João Gestor',
    email: 'joao@imobcentro.com',
    role: 'AGENCY_MANAGER',
    category: 'agency',
    agency: 'Imobiliária Centro',
    status: 'active',
    createdAt: '2023-02-15',
    lastLogin: '2024-12-01 08:45:00',
    permissions: ['manage_brokers', 'manage_properties', 'manage_contracts'],
  },
  {
    id: 'usr_007',
    name: 'Paula Corretora',
    email: 'paula@imobcentro.com',
    role: 'BROKER',
    category: 'agency',
    agency: 'Imobiliária Centro',
    status: 'active',
    createdAt: '2023-04-01',
    lastLogin: '2024-12-01 09:15:00',
    permissions: ['create_properties', 'create_contracts', 'view_tenants'],
  },
  {
    id: 'usr_008',
    name: 'Antônio Silva',
    email: 'antonio@email.com',
    role: 'PROPRIETARIO',
    category: 'agency',
    agency: 'Imobiliária Centro',
    status: 'inactive',
    createdAt: '2023-05-10',
    lastLogin: '2024-10-15 14:00:00',
    permissions: ['view_properties', 'view_contracts', 'view_payments'],
  },
  {
    id: 'usr_009',
    name: 'Fernanda Costa',
    email: 'fernanda@email.com',
    role: 'INQUILINO',
    category: 'agency',
    agency: 'Imobiliária Norte',
    status: 'active',
    createdAt: '2023-08-20',
    lastLogin: '2024-12-01 07:30:00',
    permissions: ['view_contract', 'make_payments', 'view_invoices'],
  },
];

export function AuditorUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | UserCategory>('all');
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  const filteredUsers = mockUsers.filter(user => {
    if (categoryFilter !== 'all' && user.category !== categoryFilter) return false;
    return user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getRoleStyle = (role: UserRole) => {
    const styles: Record<UserRole, string> = {
      CEO: 'bg-purple-100 text-purple-700',
      ADMIN: 'bg-red-100 text-red-700',
      PLATFORM_MANAGER: 'bg-blue-100 text-blue-700',
      REPRESENTATIVE: 'bg-pink-100 text-pink-700',
      AGENCY_ADMIN: 'bg-indigo-100 text-indigo-700',
      AGENCY_MANAGER: 'bg-cyan-100 text-cyan-700',
      BROKER: 'bg-yellow-100 text-yellow-700',
      PROPRIETARIO: 'bg-green-100 text-green-700',
      INQUILINO: 'bg-orange-100 text-orange-700',
    };
    return styles[role];
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      CEO: 'CEO',
      ADMIN: 'Admin',
      PLATFORM_MANAGER: 'Gestor Plataforma',
      REPRESENTATIVE: 'Representante',
      AGENCY_ADMIN: 'Diretor',
      AGENCY_MANAGER: 'Gestor',
      BROKER: 'Corretor',
      PROPRIETARIO: 'Proprietário',
      INQUILINO: 'Inquilino',
    };
    return labels[role];
  };

  const internalCount = mockUsers.filter(u => u.category === 'internal').length;
  const agencyCount = mockUsers.filter(u => u.category === 'agency').length;
  const activeCount = mockUsers.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-cyan-100 rounded-lg">
          <Users className="w-6 h-6 text-cyan-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Visão Geral de Usuários</h1>
          <p className="text-muted-foreground">Todos os usuários do sistema (somente leitura)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Usuários</p>
              <p className="text-xl font-bold">{mockUsers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Usuários MR3X</p>
              <p className="text-xl font-bold">{internalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Usuários Agências</p>
              <p className="text-xl font-bold">{agencyCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ativos</p>
              <p className="text-xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={categoryFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCategoryFilter('all')}
        >
          Todos
        </Button>
        <Button
          variant={categoryFilter === 'internal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCategoryFilter('internal')}
        >
          <Shield className="w-4 h-4 mr-1" />
          MR3X Internos
        </Button>
        <Button
          variant={categoryFilter === 'agency' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCategoryFilter('agency')}
        >
          <Building2 className="w-4 h-4 mr-1" />
          Staff Agências
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários por nome, e-mail ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Lista de Usuários ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUser?.id === user.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getRoleStyle(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.agency && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" /> {user.agency}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.status === 'active' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Detalhes do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedUser.name}</p>
                    <span className={`px-2 py-0.5 rounded text-xs ${getRoleStyle(selectedUser.role)}`}>
                      {getRoleLabel(selectedUser.role)}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>

                {selectedUser.agency && (
                  <div>
                    <p className="text-xs text-muted-foreground">Agência</p>
                    <p className="text-sm flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {selectedUser.agency}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    selectedUser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedUser.status === 'active' ? (
                      <><CheckCircle className="w-3 h-3" /> Ativo</>
                    ) : (
                      <><XCircle className="w-3 h-3" /> Inativo</>
                    )}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Data de Cadastro</p>
                  <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Último Login</p>
                  <p className="text-sm">{selectedUser.lastLogin}</p>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Permissões</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedUser.permissions.map((perm, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Selecione um usuário para ver os detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
