import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';
import {
  Shield, Key, Clock, Eye, CheckCircle, XCircle, AlertTriangle, LogIn, Lock, RefreshCw, Settings
} from 'lucide-react';
import { auditorAPI } from '../../../api';

interface SecurityData {
  recentLogins: number;
  failedLogins: number;
  activeTokens: number;
  usersWith2FA: number;
  totalUsers: number;
  twoFactorPercentage: string;
  accountLockouts: number;
  passwordResets: number;
  permissionChanges: number;
  securityStatus: 'healthy' | 'warning' | 'critical';
  loginAttempts: Array<{
    id: string;
    event: string;
    user: string;
    userEmail: string;
    userRole: string;
    twoFactorEnabled: boolean;
    timestamp: string;
    ip: string;
    userAgent: string;
    success: boolean;
  }>;
}

export function AuditorSecurity() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: securityData, isLoading } = useQuery<SecurityData>({
    queryKey: ['auditor-security'],
    queryFn: () => auditorAPI.getSecurity(),
  });

  const { data: twoFAStatus = [], isLoading: twoFALoading } = useQuery({
    queryKey: ['auditor-2fa-status'],
    queryFn: () => auditorAPI.get2FAStatus(),
  });

  const { data: accountLockouts = [], isLoading: lockoutsLoading } = useQuery({
    queryKey: ['auditor-account-lockouts'],
    queryFn: () => auditorAPI.getAccountLockouts(),
  });

  const { data: passwordResets = [], isLoading: resetsLoading } = useQuery({
    queryKey: ['auditor-password-resets'],
    queryFn: () => auditorAPI.getPasswordResets(),
  });

  const { data: permissionChanges = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['auditor-permission-changes'],
    queryFn: () => auditorAPI.getPermissionChanges(),
  });

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'critical': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'healthy': return 'Saudável';
      case 'warning': return 'Atenção';
      case 'critical': return 'Crítico';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-100 rounded-lg">
          <Shield className="w-6 h-6 text-red-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Segurança</h1>
          <p className="text-muted-foreground">Monitoramento de segurança do sistema (somente leitura)</p>
        </div>
      </div>

      {}
      {isLoading ? (
        <div className="space-y-6">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <div>
                    <Skeleton className="h-3 w-24 mb-2" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Overview Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-5 h-5 rounded" />
                      <div>
                        <Skeleton className="h-5 w-40 mb-1" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <LogIn className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Logins (24h)</p>
                  <p className="text-xl font-bold">{securityData?.recentLogins || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Falhas de Login (24h)</p>
                  <p className="text-xl font-bold">{securityData?.failedLogins || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">2FA Ativado</p>
                  <p className="text-xl font-bold">{securityData?.twoFactorPercentage || '0%'}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusStyle(securityData?.securityStatus)}`}>
                  {getStatusIcon(securityData?.securityStatus)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status Geral</p>
                  <p className="text-xl font-bold">{getStatusLabel(securityData?.securityStatus)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Key className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tokens Ativos</p>
                  <p className="text-xl font-bold">{securityData?.activeTokens || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Lock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bloqueios (7d)</p>
                  <p className="text-xl font-bold">{securityData?.accountLockouts || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reset Senha (7d)</p>
                  <p className="text-xl font-bold">{securityData?.passwordResets || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Settings className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mudanças Perm. (7d)</p>
                  <p className="text-xl font-bold">{securityData?.permissionChanges || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Security Information */}
          <div className="space-y-4">
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground'
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('2fa')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === '2fa' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground'
                }`}
              >
                2FA Status
              </button>
              <button
                onClick={() => setActiveTab('logins')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'logins' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground'
                }`}
              >
                Tentativas Login
              </button>
              <button
                onClick={() => setActiveTab('lockouts')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'lockouts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground'
                }`}
              >
                Bloqueios
              </button>
              <button
                onClick={() => setActiveTab('changes')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'changes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground'
                }`}
              >
                Mudanças
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Resumo de Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <LogIn className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">Logins bem-sucedidos</p>
                          <p className="text-sm text-muted-foreground">Últimas 24 horas</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold">{securityData?.recentLogins || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-medium">Tentativas de login falhas</p>
                          <p className="text-sm text-muted-foreground">Últimas 24 horas</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-red-600">{securityData?.failedLogins || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-medium">Usuários com 2FA</p>
                          <p className="text-sm text-muted-foreground">{securityData?.usersWith2FA || 0} de {securityData?.totalUsers || 0}</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">{securityData?.twoFactorPercentage || '0%'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            )}

            {activeTab === '2fa' && (
              <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Status de Autenticação de Dois Fatores (2FA)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {twoFALoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : twoFAStatus.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum usuário encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {twoFAStatus.map((user: any) => (
                        <div key={user.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email} ({user.role})</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Último login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
                            </p>
                          </div>
                          <Badge className={user.twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {user.twoFactorEnabled ? '2FA Ativo' : '2FA Inativo'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              </div>
            )}

            {activeTab === 'logins' && (
              <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Tentativas de Login (24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {securityData?.loginAttempts && securityData.loginAttempts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <LogIn className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma tentativa de login registrada</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {securityData?.loginAttempts?.map((attempt: any) => (
                        <div key={attempt.id} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={attempt.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                  {attempt.success ? 'Sucesso' : 'Falha'}
                                </Badge>
                                {attempt.twoFactorEnabled && (
                                  <Badge className="bg-purple-100 text-purple-700">2FA</Badge>
                                )}
                              </div>
                              <p className="font-medium">{attempt.user}</p>
                              <p className="text-xs text-muted-foreground">{attempt.userEmail} ({attempt.userRole})</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(attempt.timestamp).toLocaleString('pt-BR')} | IP: {attempt.ip}
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
            )}

            {activeTab === 'lockouts' && (
              <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Bloqueios de Conta (7 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lockoutsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : accountLockouts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum bloqueio de conta registrado</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {accountLockouts.map((lockout: any) => (
                        <div key={lockout.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="font-medium">{lockout.user}</p>
                          <p className="text-xs text-muted-foreground">{lockout.userEmail} ({lockout.userRole})</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(lockout.timestamp).toLocaleString('pt-BR')} | IP: {lockout.ip}
                          </p>
                          <p className="text-xs text-red-600 mt-1">Motivo: {lockout.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              </div>
            )}

            {activeTab === 'changes' && (
              <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Reset de Senhas (7 dias)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {resetsLoading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : passwordResets.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum reset de senha registrado</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {passwordResets.map((reset: any) => (
                          <div key={reset.id} className="p-3 bg-cyan-50 rounded-lg border">
                            <p className="font-medium">{reset.user}</p>
                            <p className="text-xs text-muted-foreground">{reset.userEmail} ({reset.userRole})</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(reset.timestamp).toLocaleString('pt-BR')} | IP: {reset.ip} | Método: {reset.method}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Mudanças de Permissões (7 dias)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {permissionsLoading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : permissionChanges.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma mudança de permissão registrada</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {permissionChanges.map((change: any) => (
                          <div key={change.id} className="p-3 bg-indigo-50 rounded-lg border">
                            <p className="font-medium">{change.user}</p>
                            <p className="text-xs text-muted-foreground">{change.userEmail} ({change.userRole})</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(change.timestamp).toLocaleString('pt-BR')} | IP: {change.ip}
                            </p>
                            {change.dataBefore && change.dataAfter && (
                              <div className="mt-2 text-xs">
                                <p className="text-red-600">Antes: {change.dataBefore.substring(0, 50)}...</p>
                                <p className="text-green-600">Depois: {change.dataAfter.substring(0, 50)}...</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
