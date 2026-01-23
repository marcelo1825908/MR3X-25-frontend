import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import {
  Database, Eye, History, CheckCircle, Edit, Trash2, Plus, AlertTriangle, Hash
} from 'lucide-react';
import { auditorAPI } from '../../../api';


export function AuditorDataIntegrity() {
  const [documentId, setDocumentId] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [entityIdFilter, setEntityIdFilter] = useState('');

  const { data: integrityData, isLoading } = useQuery({
    queryKey: ['auditor-integrity'],
    queryFn: () => auditorAPI.getDataIntegrity(),
  });

  const { data: inconsistencyAlerts } = useQuery({
    queryKey: ['auditor-inconsistency-alerts'],
    queryFn: () => auditorAPI.getInconsistencyAlerts(),
  });

  const { data: changeHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['auditor-change-history', entityFilter, entityIdFilter],
    queryFn: () => auditorAPI.getChangeHistory({
      entity: entityFilter || undefined,
      entityId: entityIdFilter || undefined,
    }),
  });

  const { data: documentVersions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ['auditor-document-versions', documentId],
    queryFn: () => auditorAPI.getDocumentVersions(documentId),
    enabled: !!documentId,
  });

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
      case 'healthy': return 'Íntegro';
      case 'warning': return 'Atenção';
      case 'critical': return 'Comprometido';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-100 rounded-lg">
          <Database className="w-6 h-6 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Integridade de Dados</h1>
          <p className="text-muted-foreground">Histórico de alterações e integridade do sistema (somente leitura)</p>
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
                    <Skeleton className="h-3 w-28 mb-2" />
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
                {[...Array(5)].map((_, i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <History className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Alterações (30d)</p>
                  <p className="text-xl font-bold">{integrityData?.totalChanges || 0}</p>
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
                  <p className="text-xl font-bold">{integrityData?.creates || 0}</p>
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
                  <p className="text-xl font-bold">{integrityData?.updates || 0}</p>
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
                  <p className="text-xl font-bold">{integrityData?.deletes || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Visão Geral de Integridade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Total de alterações registradas</p>
                      <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{integrityData?.totalChanges || 0}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Registros criados</p>
                      <p className="text-sm text-muted-foreground">Novos dados inseridos</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{integrityData?.creates || 0}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Edit className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">Registros atualizados</p>
                      <p className="text-sm text-muted-foreground">Dados modificados</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">{integrityData?.updates || 0}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium">Registros excluídos</p>
                      <p className="text-sm text-muted-foreground">Dados removidos</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{integrityData?.deletes || 0}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Status de Integridade</p>
                      <p className="text-sm text-muted-foreground">Avaliação geral dos dados</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(integrityData?.integrityStatus)}`}>
                    {getStatusLabel(integrityData?.integrityStatus)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inconsistency Alerts */}
          {inconsistencyAlerts && inconsistencyAlerts.totalAlerts !== undefined && (
            <Card className={inconsistencyAlerts.totalAlerts > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${inconsistencyAlerts.totalAlerts > 0 ? 'text-red-600' : 'text-green-600'}`} />
                  Alertas de Inconsistência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Contratos sem Assinatura</p>
                    <p className="text-lg font-bold">{inconsistencyAlerts.contractsWithoutSignatures || 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Pagamentos sem Contrato</p>
                    <p className="text-lg font-bold">{inconsistencyAlerts.paymentsWithoutContracts || 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Propriedades sem Proprietário</p>
                    <p className="text-lg font-bold">{inconsistencyAlerts.propertiesWithoutOwners || 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Documentos sem Propriedade</p>
                    <p className="text-lg font-bold">{inconsistencyAlerts.documentsWithoutProperty || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Hash Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Verificação de Hash de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="documentId">ID do Documento</Label>
                    <Input
                      id="documentId"
                      placeholder="Digite o ID do documento"
                      value={documentId}
                      onChange={(e) => setDocumentId(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={async () => {
                        if (!documentId) return;
                        try {
                          const result = await auditorAPI.verifyDocumentHash(documentId);
                          // Display result (could use a toast or modal)
                          console.log('Verification result:', result);
                        } catch (error) {
                          console.error('Verification error:', error);
                        }
                      }}
                      disabled={!documentId}
                    >
                      Verificar
                    </Button>
                  </div>
                </div>
                {versionsLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : documentVersions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Histórico de Versões:</p>
                    {documentVersions.map((version: any) => (
                      <div key={version.id} className="p-3 bg-gray-50 rounded-lg border text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Versão {version.version} - {version.event}</span>
                          <Badge className="bg-blue-100 text-blue-700">{new Date(version.timestamp).toLocaleString('pt-BR')}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Por: {version.user} ({version.userRole}) | IP: {version.ip}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          Hash: {version.integrityHash?.substring(0, 32) || 'N/A'}...
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Change History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4" />
                Histórico Completo de Alterações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entityFilter">Entidade</Label>
                    <Input
                      id="entityFilter"
                      placeholder="Ex: Contract, Payment, User"
                      value={entityFilter}
                      onChange={(e) => setEntityFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entityIdFilter">ID da Entidade</Label>
                    <Input
                      id="entityIdFilter"
                      placeholder="ID específico"
                      value={entityIdFilter}
                      onChange={(e) => setEntityIdFilter(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {historyLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : changeHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma alteração encontrada</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {changeHistory.map((change: any) => (
                    <div key={change.id} className="p-3 bg-gray-50 rounded-lg border text-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={
                              change.event.includes('CREATE') ? 'bg-green-100 text-green-700' :
                              change.event.includes('UPDATE') ? 'bg-yellow-100 text-yellow-700' :
                              change.event.includes('DELETE') ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {change.event}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{change.entity} #{change.entityId}</span>
                          </div>
                          <p className="font-medium">{change.user} ({change.userRole})</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(change.timestamp).toLocaleString('pt-BR')} | IP: {change.ip}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground mt-1">
                            Hash: {change.integrityHash?.substring(0, 32) || 'N/A'}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
