import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  Wrench, Search, GitCompare, Eye, CheckCircle, AlertTriangle, FileText, ArrowRight
} from 'lucide-react';

interface VersionComparison {
  documentId: string;
  documentName: string;
  version1: { version: number; date: string; author: string };
  version2: { version: number; date: string; author: string };
  changes: {
    field: string;
    v1Value: string;
    v2Value: string;
    type: 'added' | 'removed' | 'modified';
  }[];
}

interface IntegrityCheck {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  checkType: 'hash' | 'signature' | 'reference' | 'constraint';
  status: 'valid' | 'warning' | 'error';
  message: string;
  checkedAt: string;
}

const mockComparison: VersionComparison = {
  documentId: 'ctr_2834',
  documentName: 'Contrato de Locação - Apt 501',
  version1: { version: 2, date: '2024-11-28', author: 'gestor@imobcentro.com' },
  version2: { version: 3, date: '2024-12-01', author: 'gestor@imobcentro.com' },
  changes: [
    { field: 'status', v1Value: 'draft', v2Value: 'active', type: 'modified' },
    { field: 'signedAt', v1Value: '', v2Value: '2024-12-01T10:44:00Z', type: 'added' },
    { field: 'signedBy', v1Value: '', v2Value: 'João Silva', type: 'added' },
    { field: 'rentAmount', v1Value: '2300.00', v2Value: '2500.00', type: 'modified' },
    { field: 'oldClause5', v1Value: 'Texto antigo da cláusula 5', v2Value: '', type: 'removed' },
  ],
};

const mockIntegrityChecks: IntegrityCheck[] = [
  {
    id: 'chk_001',
    entityType: 'contract',
    entityId: 'ctr_2834',
    entityName: 'Contrato Apt 501',
    checkType: 'hash',
    status: 'valid',
    message: 'Hash do documento verificado com sucesso',
    checkedAt: '2024-12-01 10:50:00',
  },
  {
    id: 'chk_002',
    entityType: 'contract',
    entityId: 'ctr_2833',
    entityName: 'Contrato Casa 12',
    checkType: 'signature',
    status: 'valid',
    message: 'Assinatura digital válida',
    checkedAt: '2024-12-01 10:50:00',
  },
  {
    id: 'chk_003',
    entityType: 'payment',
    entityId: 'pay_456',
    entityName: 'Pagamento #456',
    checkType: 'reference',
    status: 'warning',
    message: 'Referência de contrato não encontrada no sistema externo',
    checkedAt: '2024-12-01 10:50:00',
  },
  {
    id: 'chk_004',
    entityType: 'tenant',
    entityId: 'tnt_789',
    entityName: 'Pedro Lima',
    checkType: 'constraint',
    status: 'error',
    message: 'CPF duplicado encontrado no sistema',
    checkedAt: '2024-12-01 10:50:00',
  },
  {
    id: 'chk_005',
    entityType: 'property',
    entityId: 'prp_012',
    entityName: 'Sala 302',
    checkType: 'reference',
    status: 'valid',
    message: 'Todas as referências válidas',
    checkedAt: '2024-12-01 10:50:00',
  },
];

export function AuditorTools() {
  const [activeTab, setActiveTab] = useState<'compare' | 'integrity'>('compare');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChecks = mockIntegrityChecks.filter(check =>
    check.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    check.entityId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChangeStyle = (type: 'added' | 'removed' | 'modified') => {
    switch (type) {
      case 'added': return 'bg-green-50 border-green-200';
      case 'removed': return 'bg-red-50 border-red-200';
      case 'modified': return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: IntegrityCheck['status']) => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusStyle = (status: IntegrityCheck['status']) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'error': return 'bg-red-100 text-red-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-violet-100 rounded-lg">
          <Wrench className="w-6 h-6 text-violet-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Ferramentas de Auditoria</h1>
          <p className="text-muted-foreground">Comparação de versões e verificação de integridade (somente leitura)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'compare' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('compare')}
        >
          <GitCompare className="w-4 h-4 inline mr-2" />
          Comparar Versões
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'integrity' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('integrity')}
        >
          <CheckCircle className="w-4 h-4 inline mr-2" />
          Scanner de Integridade
        </button>
      </div>

      {/* Compare Versions Tab */}
      {activeTab === 'compare' && (
        <>
          {/* Version Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selecionar Documento para Comparação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">Documento</label>
                  <Input placeholder="Buscar documento..." disabled />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Versão 1</label>
                  <select className="w-full p-2 border rounded-lg" disabled>
                    <option>v2</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Versão 2</label>
                  <select className="w-full p-2 border rounded-lg" disabled>
                    <option>v3</option>
                  </select>
                </div>
                <Button disabled className="mt-5">Comparar</Button>
              </div>
            </CardContent>
          </Card>

          {/* Diff Viewer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitCompare className="w-4 h-4" />
                Comparação: {mockComparison.documentName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Version Info */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">Versão</span>
                  <p className="font-bold">v{mockComparison.version1.version}</p>
                  <p className="text-xs text-muted-foreground">{mockComparison.version1.date}</p>
                  <p className="text-xs text-muted-foreground">{mockComparison.version1.author}</p>
                </div>
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">Versão</span>
                  <p className="font-bold">v{mockComparison.version2.version}</p>
                  <p className="text-xs text-muted-foreground">{mockComparison.version2.date}</p>
                  <p className="text-xs text-muted-foreground">{mockComparison.version2.author}</p>
                </div>
              </div>

              {/* Changes */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Alterações Detectadas ({mockComparison.changes.length})
                </h4>

                {mockComparison.changes.map((change, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${getChangeStyle(change.type)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{change.field}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        change.type === 'added' ? 'bg-green-200 text-green-800' :
                        change.type === 'removed' ? 'bg-red-200 text-red-800' :
                        'bg-yellow-200 text-yellow-800'
                      }`}>
                        {change.type === 'added' ? 'Adicionado' :
                         change.type === 'removed' ? 'Removido' : 'Modificado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {change.v1Value && (
                        <span className="text-red-600 line-through bg-red-50 px-2 py-1 rounded">
                          {change.v1Value}
                        </span>
                      )}
                      {change.v1Value && change.v2Value && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      {change.v2Value && (
                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded">
                          {change.v2Value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Integrity Scanner Tab */}
      {activeTab === 'integrity' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Verificados</p>
                  <p className="text-xl font-bold">12,459</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Válidos</p>
                  <p className="text-xl font-bold">12,341</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avisos</p>
                  <p className="text-xl font-bold">98</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Erros</p>
                  <p className="text-xl font-bold">20</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar verificações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Integrity Check Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Resultados da Verificação ({filteredChecks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredChecks.map((check) => (
                  <div key={check.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{check.entityName}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              ({check.entityId})
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{check.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {check.entityType}
                            </span>
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {check.checkType}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(check.status)}`}>
                          {check.status === 'valid' ? 'Válido' :
                           check.status === 'warning' ? 'Aviso' : 'Erro'}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{check.checkedAt}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
