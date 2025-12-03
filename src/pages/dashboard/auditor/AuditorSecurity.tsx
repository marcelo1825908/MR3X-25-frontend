import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import {
  Shield, Search, Key, Webhook, Clock, Eye, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';

interface ApiToken {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  createdAt: string;
  lastUsed: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
  usageCount: number;
}

interface WebhookEvent {
  id: string;
  endpoint: string;
  event: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  responseCode?: number;
  payload: string;
}

const mockTokens: ApiToken[] = [
  {
    id: 'tok_001',
    name: 'Production API Key',
    clientId: 'client_abc123',
    clientName: 'Imobiliária Centro',
    createdAt: '2024-01-15 10:00:00',
    lastUsed: '2024-12-01 10:45:23',
    expiresAt: '2025-01-15 10:00:00',
    status: 'active',
    usageCount: 15420,
  },
  {
    id: 'tok_002',
    name: 'Staging API Key',
    clientId: 'client_def456',
    clientName: 'Imobiliária Norte',
    createdAt: '2024-06-01 14:30:00',
    lastUsed: '2024-11-28 09:15:00',
    expiresAt: '2025-06-01 14:30:00',
    status: 'active',
    usageCount: 8932,
  },
  {
    id: 'tok_003',
    name: 'Legacy Integration',
    clientId: 'client_ghi789',
    clientName: 'Sistema Antigo',
    createdAt: '2023-03-10 08:00:00',
    lastUsed: '2024-10-15 16:20:00',
    expiresAt: '2024-11-10 08:00:00',
    status: 'expired',
    usageCount: 45678,
  },
  {
    id: 'tok_004',
    name: 'Test Environment',
    clientId: 'client_jkl012',
    clientName: 'Dev Team',
    createdAt: '2024-08-20 11:00:00',
    lastUsed: '2024-09-01 10:00:00',
    expiresAt: '2025-08-20 11:00:00',
    status: 'revoked',
    usageCount: 156,
  },
];

const mockWebhookEvents: WebhookEvent[] = [
  {
    id: 'evt_001',
    endpoint: 'https://api.imobcentro.com/webhooks',
    event: 'payment.completed',
    timestamp: '2024-12-01 10:45:30',
    status: 'success',
    responseCode: 200,
    payload: '{"payment_id": "pay_123", "amount": 2500}',
  },
  {
    id: 'evt_002',
    endpoint: 'https://api.imobnorte.com/hooks',
    event: 'contract.signed',
    timestamp: '2024-12-01 10:32:15',
    status: 'success',
    responseCode: 200,
    payload: '{"contract_id": "ctr_456", "signer": "joao@email.com"}',
  },
  {
    id: 'evt_003',
    endpoint: 'https://old-system.example.com/callback',
    event: 'tenant.created',
    timestamp: '2024-12-01 10:15:00',
    status: 'failed',
    responseCode: 500,
    payload: '{"tenant_id": "tnt_789"}',
  },
  {
    id: 'evt_004',
    endpoint: 'https://api.imobcentro.com/webhooks',
    event: 'inspection.completed',
    timestamp: '2024-12-01 09:45:00',
    status: 'success',
    responseCode: 200,
    payload: '{"inspection_id": "insp_012", "status": "approved"}',
  },
];

export function AuditorSecurity() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'webhooks'>('tokens');

  const filteredTokens = mockTokens.filter(token =>
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = mockWebhookEvents.filter(event =>
    event.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTokenStatusStyle = (status: ApiToken['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'expired': return 'bg-yellow-100 text-yellow-700';
      case 'revoked': return 'bg-red-100 text-red-700';
    }
  };

  const getWebhookStatusIcon = (status: WebhookEvent['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-100 rounded-lg">
          <Shield className="w-6 h-6 text-red-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Segurança e Tokens</h1>
          <p className="text-muted-foreground">Tokens de API e eventos de webhook (somente leitura)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Key className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tokens Ativos</p>
              <p className="text-xl font-bold">24</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expiram em 30 dias</p>
              <p className="text-xl font-bold">3</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Webhook className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Webhooks (24h)</p>
              <p className="text-xl font-bold">1,234</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Falhas (24h)</p>
              <p className="text-xl font-bold">12</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'tokens' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('tokens')}
        >
          <Key className="w-4 h-4 inline mr-2" />
          Tokens de API
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'webhooks' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('webhooks')}
        >
          <Webhook className="w-4 h-4 inline mr-2" />
          Eventos de Webhook
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'tokens' ? 'Buscar tokens...' : 'Buscar eventos...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tokens Tab */}
      {activeTab === 'tokens' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Listagem de Tokens ({filteredTokens.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">Nome</th>
                    <th className="text-left p-4 text-sm font-medium">Cliente</th>
                    <th className="text-left p-4 text-sm font-medium">Status</th>
                    <th className="text-left p-4 text-sm font-medium">Último Uso</th>
                    <th className="text-left p-4 text-sm font-medium">Expira em</th>
                    <th className="text-left p-4 text-sm font-medium">Uso Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTokens.map((token) => (
                    <tr key={token.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-medium text-sm">{token.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{token.id}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{token.clientName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{token.clientId}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getTokenStatusStyle(token.status)}`}>
                          {token.status === 'active' ? 'Ativo' : token.status === 'expired' ? 'Expirado' : 'Revogado'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{token.lastUsed}</td>
                      <td className="p-4 text-sm text-muted-foreground">{token.expiresAt}</td>
                      <td className="p-4 text-sm font-medium">{token.usageCount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Eventos de Webhook ({filteredEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">Evento</th>
                    <th className="text-left p-4 text-sm font-medium">Endpoint</th>
                    <th className="text-left p-4 text-sm font-medium">Status</th>
                    <th className="text-left p-4 text-sm font-medium">Timestamp</th>
                    <th className="text-left p-4 text-sm font-medium">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-mono">
                          {event.event}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-mono text-muted-foreground truncate max-w-[200px]">
                        {event.endpoint}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getWebhookStatusIcon(event.status)}
                          {event.responseCode && (
                            <span className="text-xs text-muted-foreground">{event.responseCode}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{event.timestamp}</td>
                      <td className="p-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-[200px] block">
                          {event.payload}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
