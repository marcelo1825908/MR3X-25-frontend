import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import {
  Database, Search, Eye, GitBranch, History, CheckCircle, Edit, Trash2, Plus
} from 'lucide-react';

interface ChangeRecord {
  id: string;
  entityType: 'contract' | 'property' | 'tenant' | 'payment' | 'user' | 'agency';
  entityId: string;
  entityName: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  changedBy: string;
  changedAt: string;
  changes: { field: string; oldValue: string; newValue: string }[];
  version: number;
}

interface LedgerEntry {
  id: string;
  hash: string;
  previousHash: string;
  timestamp: string;
  data: string;
  verified: boolean;
}

const mockChanges: ChangeRecord[] = [
  {
    id: 'chg_001',
    entityType: 'contract',
    entityId: 'ctr_2834',
    entityName: 'Contrato Apt 501',
    operation: 'UPDATE',
    changedBy: 'gestor@imob.com',
    changedAt: '2024-12-01 10:45:00',
    changes: [
      { field: 'status', oldValue: 'draft', newValue: 'active' },
      { field: 'signedAt', oldValue: '', newValue: '2024-12-01T10:44:00Z' },
    ],
    version: 3,
  },
  {
    id: 'chg_002',
    entityType: 'tenant',
    entityId: 'tnt_456',
    entityName: 'João Silva',
    operation: 'CREATE',
    changedBy: 'corretor@imob.com',
    changedAt: '2024-12-01 10:30:00',
    changes: [
      { field: 'name', oldValue: '', newValue: 'João Silva' },
      { field: 'email', oldValue: '', newValue: 'joao@email.com' },
      { field: 'phone', oldValue: '', newValue: '11999887766' },
    ],
    version: 1,
  },
  {
    id: 'chg_003',
    entityType: 'property',
    entityId: 'prp_789',
    entityName: 'Apartamento 501 - Ed. Central',
    operation: 'UPDATE',
    changedBy: 'admin@mr3x.com',
    changedAt: '2024-12-01 09:15:00',
    changes: [
      { field: 'rentAmount', oldValue: '2300.00', newValue: '2500.00' },
    ],
    version: 5,
  },
  {
    id: 'chg_004',
    entityType: 'payment',
    entityId: 'pay_012',
    entityName: 'Pagamento Aluguel Dez/2024',
    operation: 'UPDATE',
    changedBy: 'system',
    changedAt: '2024-12-01 08:00:00',
    changes: [
      { field: 'status', oldValue: 'pending', newValue: 'completed' },
      { field: 'paidAt', oldValue: '', newValue: '2024-12-01T08:00:00Z' },
    ],
    version: 2,
  },
  {
    id: 'chg_005',
    entityType: 'user',
    entityId: 'usr_345',
    entityName: 'Maria Santos',
    operation: 'DELETE',
    changedBy: 'diretor@imob.com',
    changedAt: '2024-11-30 16:00:00',
    changes: [
      { field: 'deletedAt', oldValue: '', newValue: '2024-11-30T16:00:00Z' },
      { field: 'deletedBy', oldValue: '', newValue: 'diretor@imob.com' },
    ],
    version: 4,
  },
];

const mockLedger: LedgerEntry[] = [
  {
    id: 'blk_001',
    hash: 'sha256:a7f3c2e1d4b5...9f8e',
    previousHash: 'sha256:z6y5x4w3v2u1...0p9o',
    timestamp: '2024-12-01 10:45:00',
    data: 'contract:ctr_2834:status:active',
    verified: true,
  },
  {
    id: 'blk_002',
    hash: 'sha256:z6y5x4w3v2u1...0p9o',
    previousHash: 'sha256:n8m7l6k5j4i3...2h1g',
    timestamp: '2024-12-01 10:30:00',
    data: 'tenant:tnt_456:created',
    verified: true,
  },
  {
    id: 'blk_003',
    hash: 'sha256:n8m7l6k5j4i3...2h1g',
    previousHash: 'sha256:f5e4d3c2b1a0...9z8y',
    timestamp: '2024-12-01 09:15:00',
    data: 'property:prp_789:rentAmount:2500.00',
    verified: true,
  },
];

export function AuditorDataIntegrity() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'changes' | 'ledger'>('changes');

  const filteredChanges = mockChanges.filter(change =>
    change.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    change.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    change.changedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEntityTypeStyle = (type: ChangeRecord['entityType']) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-700';
      case 'property': return 'bg-green-100 text-green-700';
      case 'tenant': return 'bg-purple-100 text-purple-700';
      case 'payment': return 'bg-orange-100 text-orange-700';
      case 'user': return 'bg-cyan-100 text-cyan-700';
      case 'agency': return 'bg-red-100 text-red-700';
    }
  };

  const getOperationIcon = (operation: ChangeRecord['operation']) => {
    switch (operation) {
      case 'CREATE': return <Plus className="w-4 h-4 text-green-600" />;
      case 'UPDATE': return <Edit className="w-4 h-4 text-blue-600" />;
      case 'DELETE': return <Trash2 className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-100 rounded-lg">
          <Database className="w-6 h-6 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Integridade de Dados</h1>
          <p className="text-muted-foreground">Histórico de alterações e ledger imutável (somente leitura)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alterações (30d)</p>
              <p className="text-xl font-bold">2,456</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Criações</p>
              <p className="text-xl font-bold">834</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Edit className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Atualizações</p>
              <p className="text-xl font-bold">1,578</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Exclusões</p>
              <p className="text-xl font-bold">44</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'changes' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('changes')}
        >
          <History className="w-4 h-4 inline mr-2" />
          Histórico de Alterações
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'ledger' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('ledger')}
        >
          <GitBranch className="w-4 h-4 inline mr-2" />
          Ledger Imutável
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar alterações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Changes Tab */}
      {activeTab === 'changes' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Registros de Alteração ({filteredChanges.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredChanges.map((change) => (
                <div key={change.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getOperationIcon(change.operation)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${getEntityTypeStyle(change.entityType)}`}>
                            {change.entityType}
                          </span>
                          <span className="font-medium text-sm">{change.entityName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{change.entityId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{change.changedAt}</p>
                      <p className="text-xs text-muted-foreground">por {change.changedBy}</p>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">v{change.version}</span>
                    </div>
                  </div>

                  {change.changes.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {change.changes.map((ch, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-muted-foreground w-24">{ch.field}:</span>
                          {ch.oldValue && (
                            <>
                              <span className="text-red-600 line-through">{ch.oldValue}</span>
                              <span className="text-muted-foreground">→</span>
                            </>
                          )}
                          <span className="text-green-600">{ch.newValue || '(vazio)'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger Tab */}
      {activeTab === 'ledger' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Ledger Imutável (Blockchain-like)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockLedger.map((entry, index) => (
                <div key={entry.id} className="relative">
                  {/* Connecting line */}
                  {index < mockLedger.length - 1 && (
                    <div className="absolute left-6 top-14 w-0.5 h-8 bg-gray-200" />
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      entry.verified ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      {entry.verified ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Eye className="w-6 h-6 text-yellow-600" />
                      )}
                    </div>

                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                          {entry.id}
                        </span>
                        <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p>
                          <span className="text-muted-foreground">Hash: </span>
                          <span className="font-mono">{entry.hash}</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Hash Anterior: </span>
                          <span className="font-mono">{entry.previousHash}</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Dados: </span>
                          <span className="font-mono bg-blue-50 px-1 rounded">{entry.data}</span>
                        </p>
                      </div>

                      {entry.verified && (
                        <div className="mt-2 flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          Verificado e válido
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
