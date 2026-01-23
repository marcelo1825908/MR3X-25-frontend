import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import {
  FileSignature, Eye, CheckCircle, Clock, Hash, AlertTriangle
} from 'lucide-react';
import { auditorAPI } from '../../../api';

interface SignatureActivity {
  total: number;
  valid: number;
  pending: number;
  expired: number;
}

export function AuditorSignatures() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { data: signatureData, isLoading } = useQuery<SignatureActivity>({
    queryKey: ['auditor-signature-activity'],
    queryFn: () => auditorAPI.getSignatureActivity(),
  });

  const { data: signatures = [], isLoading: signaturesLoading } = useQuery({
    queryKey: ['auditor-signatures', statusFilter, dateFrom, dateTo],
    queryFn: () => auditorAPI.getSignatures({ 
      status: statusFilter || undefined,
      startDate: dateFrom || undefined,
      endDate: dateTo || undefined,
    }),
  });

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 rounded-lg">
          <FileSignature className="w-6 h-6 text-purple-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Assinaturas Digitais</h1>
          <p className="text-muted-foreground">Validação e histórico de assinaturas (somente leitura)</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Hash className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Assinaturas</p>
                  <p className="text-xl font-bold">{signatureData?.total || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Válidas</p>
                  <p className="text-xl font-bold">{signatureData?.valid || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-xl font-bold">{signatureData?.pending || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expiradas</p>
                  <p className="text-xl font-bold">{signatureData?.expired || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Visão Geral de Assinaturas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Hash className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Total de assinaturas</p>
                      <p className="text-sm text-muted-foreground">Todos os registros de assinatura</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{signatureData?.total || 0}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Assinaturas válidas</p>
                      <p className="text-sm text-muted-foreground">Documentos assinados e verificados</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{signatureData?.valid || 0}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">Aguardando assinatura</p>
                      <p className="text-sm text-muted-foreground">Documentos pendentes de assinatura</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">{signatureData?.pending || 0}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium">Assinaturas expiradas</p>
                      <p className="text-sm text-muted-foreground">Documentos com prazo vencido</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{signatureData?.expired || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Signatures List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Documentos Assinados - Detalhes Técnicos
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="SIGNED">Assinados</SelectItem>
                      <SelectItem value="PENDING">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">Data Inicial</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTo">Data Final</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {signaturesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : signatures.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileSignature className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum documento assinado encontrado</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {signatures.map((sig: any) => (
                    <div key={sig.id} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{sig.documentName}</p>
                          <p className="text-sm text-muted-foreground">Propriedade: {sig.propertyName}</p>
                        </div>
                        <Badge className={sig.status === 'SIGNED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {sig.status === 'SIGNED' ? 'Assinado' : 'Pendente'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mt-3">
                        <p className="text-xs font-medium text-muted-foreground">Partes Assinantes:</p>
                        {sig.parties && sig.parties.length > 0 ? (
                          sig.parties.map((party: any, idx: number) => (
                            <div key={idx} className="p-3 bg-white rounded border text-sm">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium">{party.name} ({party.role})</p>
                                  <p className="text-xs text-muted-foreground">CPF: {party.cpf}</p>
                                  <p className="text-xs text-muted-foreground">Email: {party.email}</p>
                                </div>
                                <Badge className="bg-blue-100 text-blue-700">Assinado</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                <div>
                                  <p className="text-muted-foreground">Data/Hora:</p>
                                  <p className="font-mono">{party.signedAt ? new Date(party.signedAt).toLocaleString('pt-BR') : 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">IP:</p>
                                  <p className="font-mono">{party.signedIP || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhuma parte assinou ainda</p>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Hash do Documento:</p>
                            <p className="font-mono break-all">{sig.hash?.substring(0, 32) || 'N/A'}...</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Método de Assinatura:</p>
                            <p>{sig.signatureMethod || 'EMAIL'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Nível de Confiança:</p>
                            <p>{sig.signatureConfidence || 'MEDIUM'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Criado em:</p>
                            <p>{new Date(sig.createdAt).toLocaleString('pt-BR')}</p>
                          </div>
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
