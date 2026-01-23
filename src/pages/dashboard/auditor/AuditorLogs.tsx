import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import {
  Eye, Activity, Shield, Server, AlertTriangle, Search, Download, Filter, Loader2, FileText
} from 'lucide-react';
import { auditorAPI } from '../../../api';
import { toast } from 'sonner';

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

const mapApiLogToEntry = (log: any): LogEntry => {
  
  let type: LogType = 'activity';
  const eventLower = (log.event || '').toLowerCase();
  if (eventLower.includes('login') || eventLower.includes('logout') || eventLower.includes('access')) {
    type = 'access';
  } else if (eventLower.includes('auth') || eventLower.includes('token') || eventLower.includes('password')) {
    type = 'auth';
  } else if (eventLower.includes('error') || eventLower.includes('fail')) {
    type = 'error';
  } else if (eventLower.includes('system') || eventLower.includes('backup') || eventLower.includes('deploy')) {
    type = 'system';
  }

  let level: 'info' | 'warning' | 'error' | 'success' = 'info';
  if (eventLower.includes('error') || eventLower.includes('fail')) {
    level = 'error';
  } else if (eventLower.includes('warning') || eventLower.includes('alert')) {
    level = 'warning';
  } else if (eventLower.includes('success') || eventLower.includes('create') || eventLower.includes('sign')) {
    level = 'success';
  }

  const timestamp = log.timestamp
    ? new Date(log.timestamp).toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).replace(',', '')
    : '';

  return {
    id: log.id,
    timestamp,
    type,
    level,
    user: log.user || undefined,
    ip: log.ip || undefined,
    action: log.event || 'UNKNOWN',
    details: log.entity ? `${log.entity} #${log.entityId}` : (log.event || 'N/A'),
  };
};

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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    event: '',
    entity: '',
    dateFrom: '',
    dateTo: '',
    user: '',
    module: '',
  });

  const { data: apiLogs = [], isLoading, error } = useQuery({
    queryKey: ['auditor-logs', filters],
    queryFn: () => auditorAPI.getLogs(filters),
    refetchInterval: 30000, 
  });

  const logs: LogEntry[] = Array.isArray(apiLogs) ? apiLogs.map(mapApiLogToEntry) : [];

  const filteredLogs = logs.filter(log => {
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
      {}
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={async () => {
              try {
                const blob = await auditorAPI.exportLogsToCSV(filters);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Logs exportados com sucesso!');
              } catch (error) {
                toast.error('Erro ao exportar logs');
              }
            }}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={async () => {
              try {
                const blob = await auditorAPI.exportLogsToPDF(filters);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Logs exportados com sucesso!');
              } catch (error) {
                toast.error('Erro ao exportar logs');
              }
            }}
          >
            <FileText className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {}
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

      {}
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
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros Avançados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event">Tipo de Evento</Label>
                <Input
                  id="event"
                  placeholder="Ex: LOGIN, CREATE, UPDATE"
                  value={filters.event}
                  onChange={(e) => setFilters({ ...filters, event: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity">Entidade</Label>
                <Input
                  id="entity"
                  placeholder="Ex: User, Contract, Payment"
                  value={filters.entity}
                  onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="module">Módulo</Label>
                <Select value={filters.module} onValueChange={(v) => setFilters({ ...filters, module: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="contracts">Contratos</SelectItem>
                    <SelectItem value="payments">Pagamentos</SelectItem>
                    <SelectItem value="properties">Propriedades</SelectItem>
                    <SelectItem value="users">Usuários</SelectItem>
                    <SelectItem value="agencies">Agências</SelectItem>
                    <SelectItem value="documents">Documentos</SelectItem>
                    <SelectItem value="inspections">Vistorias</SelectItem>
                    <SelectItem value="notifications">Notificações</SelectItem>
                    <SelectItem value="agreements">Acordos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user">Usuário</Label>
                <Input
                  id="user"
                  placeholder="Nome ou email do usuário"
                  value={filters.user}
                  onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Data Inicial</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Data Final</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({
                    event: '',
                    entity: '',
                    dateFrom: '',
                    dateTo: '',
                    user: '',
                    module: '',
                  });
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Registros ({filteredLogs.length})
            {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <span>Erro ao carregar logs. Tente novamente.</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum log encontrado</p>
              <p className="text-sm">Não há registros de auditoria no sistema ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">Timestamp</th>
                    <th className="text-left p-4 text-sm font-medium">Tipo</th>
                    <th className="text-left p-4 text-sm font-medium">Nível</th>
                    <th className="text-left p-4 text-sm font-medium">Usuário</th>
                    <th className="text-left p-4 text-sm font-medium">Função</th>
                    <th className="text-left p-4 text-sm font-medium">IP</th>
                    <th className="text-left p-4 text-sm font-medium">Ação</th>
                    <th className="text-left p-4 text-sm font-medium">Detalhes</th>
                    <th className="text-left p-4 text-sm font-medium">Hash</th>
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
                        <td className="p-4 text-sm">
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
                            {apiLogs.find((l: any) => l.id === log.id)?.userRole || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-mono">{log.ip || '-'}</td>
                        <td className="p-4 text-sm font-medium">{log.action}</td>
                        <td className="p-4 text-sm text-muted-foreground">{log.details}</td>
                        <td className="p-4 text-xs font-mono text-muted-foreground">
                          {apiLogs.find((l: any) => l.id === log.id)?.integrityHash?.substring(0, 16) || 'N/A'}...
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
