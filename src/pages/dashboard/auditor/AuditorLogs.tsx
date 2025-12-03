import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  Eye, Activity, Shield, Server, AlertTriangle, Search, Download, Filter
} from 'lucide-react';

type LogType = 'access' | 'activity' | 'system' | 'auth' | 'error';

interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  level: 'info' | 'warning' | 'error' | 'success';
  user?: string;
  ip?: string;
  action: string;
  details: string;
}

const mockLogs: LogEntry[] = [
  { id: '1', timestamp: '2024-12-01 10:45:23', type: 'access', level: 'info', user: 'admin@mr3x.com', ip: '192.168.1.100', action: 'LOGIN', details: 'Login bem-sucedido via web' },
  { id: '2', timestamp: '2024-12-01 10:44:15', type: 'activity', level: 'info', user: 'gestor@imob.com', ip: '192.168.1.105', action: 'CREATE', details: 'Contrato #2834 criado' },
  { id: '3', timestamp: '2024-12-01 10:43:00', type: 'system', level: 'info', action: 'BACKUP', details: 'Backup automático iniciado' },
  { id: '4', timestamp: '2024-12-01 10:42:30', type: 'auth', level: 'warning', user: 'unknown', ip: '45.67.89.123', action: 'FAILED_LOGIN', details: 'Tentativa de login falhou (3x)' },
  { id: '5', timestamp: '2024-12-01 10:41:00', type: 'error', level: 'error', action: 'API_ERROR', details: 'Timeout na conexão com Asaas API' },
  { id: '6', timestamp: '2024-12-01 10:40:45', type: 'access', level: 'info', user: 'corretor@imob.com', ip: '192.168.1.110', action: 'LOGOUT', details: 'Logout realizado' },
  { id: '7', timestamp: '2024-12-01 10:39:20', type: 'activity', level: 'success', user: 'diretor@imob.com', ip: '192.168.1.108', action: 'SIGN', details: 'Documento assinado digitalmente' },
  { id: '8', timestamp: '2024-12-01 10:38:00', type: 'system', level: 'info', action: 'DEPLOY', details: 'Nova versão v2.3.1 implantada' },
  { id: '9', timestamp: '2024-12-01 10:37:15', type: 'auth', level: 'info', user: 'api@cliente.com', ip: '200.100.50.25', action: 'TOKEN_REFRESH', details: 'Token de API renovado' },
  { id: '10', timestamp: '2024-12-01 10:36:00', type: 'error', level: 'warning', action: 'DISK_SPACE', details: 'Espaço em disco abaixo de 20%' },
];

const logTypeConfig: Record<LogType, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  access: { label: 'Acesso', icon: Eye, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  activity: { label: 'Atividade', icon: Activity, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  system: { label: 'Sistema', icon: Server, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  auth: { label: 'Autenticação', icon: Shield, color: 'text-green-600', bgColor: 'bg-green-100' },
  error: { label: 'Erro', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

export function AuditorLogs() {
  const [activeTab, setActiveTab] = useState<LogType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = mockLogs.filter(log => {
    if (activeTab !== 'all' && log.type !== activeTab) return false;
    if (searchTerm && !log.details.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.action.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(log.user?.toLowerCase().includes(searchTerm.toLowerCase()))) return false;
    return true;
  });

  const getLevelStyle = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <Activity className="w-6 h-6 text-green-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Logs do Sistema</h1>
            <p className="text-muted-foreground">Visualização de todos os logs (somente leitura)</p>
          </div>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Log Type Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('all')}
        >
          Todos
        </Button>
        {Object.entries(logTypeConfig).map(([type, config]) => (
          <Button
            key={type}
            variant={activeTab === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(type as LogType)}
            className="flex items-center gap-2"
          >
            <config.icon className="w-4 h-4" />
            {config.label}
          </Button>
        ))}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nos logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Registros ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Timestamp</th>
                  <th className="text-left p-4 text-sm font-medium">Tipo</th>
                  <th className="text-left p-4 text-sm font-medium">Nível</th>
                  <th className="text-left p-4 text-sm font-medium">Usuário</th>
                  <th className="text-left p-4 text-sm font-medium">IP</th>
                  <th className="text-left p-4 text-sm font-medium">Ação</th>
                  <th className="text-left p-4 text-sm font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((log) => {
                  const typeConfig = logTypeConfig[log.type];
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm font-mono text-muted-foreground">{log.timestamp}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${typeConfig.bgColor} ${typeConfig.color}`}>
                          <typeConfig.icon className="w-3 h-3" />
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getLevelStyle(log.level)}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{log.user || '-'}</td>
                      <td className="p-4 text-sm font-mono">{log.ip || '-'}</td>
                      <td className="p-4 text-sm font-medium">{log.action}</td>
                      <td className="p-4 text-sm text-muted-foreground">{log.details}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
