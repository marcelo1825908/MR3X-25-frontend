import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  Settings, User, Mail, Phone, Shield, Key, Clock, Eye
} from 'lucide-react';

export function AuditorSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gray-100 rounded-lg">
          <Settings className="w-6 h-6 text-gray-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Configurações do perfil pessoal</p>
        </div>
      </div>

      {/* Read-Only Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex items-center gap-3">
          <Eye className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Acesso Limitado:</strong> Como auditor, você só pode visualizar e editar suas configurações pessoais de perfil. As configurações do sistema são somente leitura.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Perfil Pessoal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Nome Completo</label>
              <Input value="Auditor Legal" className="mt-1" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" /> E-mail
              </label>
              <Input value="auditor@mr3x.com" disabled className="mt-1 bg-gray-50" />
              <p className="text-xs text-muted-foreground mt-1">O e-mail não pode ser alterado</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> Telefone
              </label>
              <Input value="(11) 98765-4321" className="mt-1" />
            </div>
            <Button className="w-full">Salvar Alterações</Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-1">
                <Key className="w-3 h-3" /> Senha Atual
              </label>
              <Input type="password" placeholder="••••••••" className="mt-1" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Nova Senha</label>
              <Input type="password" placeholder="••••••••" className="mt-1" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Confirmar Nova Senha</label>
              <Input type="password" placeholder="••••••••" className="mt-1" />
            </div>
            <Button variant="outline" className="w-full">Alterar Senha</Button>
          </CardContent>
        </Card>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Informações da Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Último Login</span>
                <span className="text-sm">01/12/2024 08:30</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">IP</span>
                <span className="text-sm font-mono">192.168.1.100</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Dispositivo</span>
                <span className="text-sm">Chrome 120 / Windows 11</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Localização</span>
                <span className="text-sm">São Paulo, SP</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground">Sessões Ativas</span>
                <span className="text-sm">1</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Informações do Cargo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Cargo</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">LEGAL_AUDITOR</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Nível de Acesso</span>
                <span className="text-sm">Somente Leitura</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Data de Criação</span>
                <span className="text-sm">15/01/2024</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground">Criado Por</span>
                <span className="text-sm">admin@mr3x.com</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Permissões do Cargo</p>
              <div className="flex flex-wrap gap-1">
                {[
                  'view_logs',
                  'view_signatures',
                  'view_payments',
                  'view_tokens',
                  'view_data_integrity',
                  'view_agencies',
                  'view_users',
                  'view_documents',
                  'use_audit_tools',
                ].map((perm) => (
                  <span key={perm} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
