import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  FileText, Search, Eye, FileSignature, ClipboardCheck, Bell, Upload, CheckCircle, Clock, Hash, User, Building2
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { auditorAPI } from '../../../api';

type DocumentType = 'contract' | 'agreement' | 'notification' | 'inspection' | 'document';

interface Document {
  id: string;
  type: DocumentType;
  name: string;
  description?: string;
  agency?: string;
  createdBy?: string;
  createdAt: string;
  status: 'draft' | 'active' | 'signed' | 'archived' | 'PENDING' | 'SIGNED' | 'ACTIVE';
  fileSize?: string;
  version?: number;
  tenant?: string;
  owner?: string;
  propertyName?: string;
  hash?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

const mapApiDocToDocument = (doc: any): Document => {
  const typeMap: Record<string, DocumentType> = {
    'CONTRACT': 'contract',
    'AGREEMENT': 'agreement',
    'NOTIFICATION': 'notification',
    'INSPECTION': 'inspection',
    'DOCUMENT': 'document',
  };

  const statusMap: Record<string, Document['status']> = {
    'SIGNED': 'signed',
    'PENDING': 'draft',
    'ACTIVE': 'active',
    'DRAFT': 'draft',
    'ARCHIVED': 'archived',
  };

  return {
    id: doc.id,
    type: typeMap[doc.type] || 'document',
    name: doc.name || `Documento #${doc.id}`,
    description: doc.tenant ? `Inquilino: ${doc.tenant}` : 'Documento do sistema',
    agency: doc.agency || 'N/A',
    createdBy: doc.uploadedBy || 'Sistema',
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : '',
    status: statusMap[doc.status] || 'active',
    fileSize: 'N/A',
    version: 1,
    tenant: doc.tenant,
    owner: doc.owner,
    propertyName: doc.propertyName,
    hash: doc.hash,
    uploadedAt: doc.uploadedAt,
    uploadedBy: doc.uploadedBy,
  };
};

export function AuditorDocuments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'documents' | 'uploads'>('documents');
  const [typeFilter, setTypeFilter] = useState<'all' | DocumentType>('all');

  const { data: apiDocs = [], isLoading } = useQuery({
    queryKey: ['auditor-documents'],
    queryFn: () => auditorAPI.getDocuments(),
  });

  const { data: uploadLogsData = [] } = useQuery({
    queryKey: ['auditor-document-upload-logs'],
    queryFn: () => auditorAPI.getDocumentUploadLogs(),
  });

  const documents: Document[] = Array.isArray(apiDocs) ? apiDocs.map(mapApiDocToDocument) : [];
  const uploadLogs = Array.isArray(uploadLogsData) ? uploadLogsData : [];

  const filteredDocuments = documents.filter(doc => {
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
    return doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.agency && doc.agency.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'contract': return <FileText className="w-4 h-4" />;
      case 'agreement': return <FileSignature className="w-4 h-4" />;
      case 'notification': return <Bell className="w-4 h-4" />;
      case 'inspection': return <ClipboardCheck className="w-4 h-4" />;
      case 'document': return <Upload className="w-4 h-4" />;
    }
  };

  const getTypeStyle = (type: DocumentType) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-700';
      case 'agreement': return 'bg-purple-100 text-purple-700';
      case 'notification': return 'bg-yellow-100 text-yellow-700';
      case 'inspection': return 'bg-green-100 text-green-700';
      case 'document': return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'contract': return 'Contrato';
      case 'agreement': return 'Acordo';
      case 'notification': return 'Notificação';
      case 'inspection': return 'Vistoria';
      case 'document': return 'Documento';
    }
  };

  const getStatusStyle = (status: Document['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'signed': return 'bg-green-100 text-green-700';
      case 'archived': return 'bg-orange-100 text-orange-700';
    }
  };

  const getStatusLabel = (status: Document['status']) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'active': return 'Ativo';
      case 'signed': return 'Assinado';
      case 'archived': return 'Arquivado';
    }
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-100 rounded-lg">
          <FileText className="w-6 h-6 text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Visualização de documentos e logs de upload (somente leitura)</p>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Documentos</p>
              <p className="text-xl font-bold">{isLoading ? '...' : documents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assinados</p>
              <p className="text-xl font-bold">{isLoading ? '...' : documents.filter(d => d.status === 'signed').length}</p>
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
              <p className="text-xl font-bold">{isLoading ? '...' : documents.filter(d => d.status === 'draft').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ativos</p>
              <p className="text-xl font-bold">{isLoading ? '...' : documents.filter(d => d.status === 'active').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'documents' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('documents')}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Documentos
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'uploads' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('uploads')}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Logs de Upload
        </button>
      </div>

      {}
      {activeTab === 'documents' && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            Todos
          </Button>
          {(['contract', 'agreement', 'notification', 'inspection', 'document'] as DocumentType[]).map(type => (
            <Button
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(type)}
              className="flex items-center gap-1"
            >
              {getTypeIcon(type)}
              {getTypeLabel(type)}
            </Button>
          ))}
        </div>
      )}

      {}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'documents' ? 'Buscar documentos...' : 'Buscar uploads...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Lista de Documentos ({filteredDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">Documento</th>
                    <th className="text-left p-4 text-sm font-medium">Tipo</th>
                    <th className="text-left p-4 text-sm font-medium">Propriedade</th>
                    <th className="text-left p-4 text-sm font-medium">Proprietário</th>
                    <th className="text-left p-4 text-sm font-medium">Inquilino</th>
                    <th className="text-left p-4 text-sm font-medium">Status</th>
                    <th className="text-left p-4 text-sm font-medium">Upload por</th>
                    <th className="text-left p-4 text-sm font-medium">Data</th>
                    <th className="text-left p-4 text-sm font-medium">Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-medium text-sm">{doc.name}</p>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground">{doc.description}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getTypeStyle(doc.type)}`}>
                          {getTypeIcon(doc.type)}
                          {getTypeLabel(doc.type)}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        {doc.propertyName && doc.propertyName !== 'N/A' ? (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {doc.propertyName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {doc.owner && doc.owner !== 'N/A' ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {doc.owner}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {doc.tenant && doc.tenant !== 'N/A' ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {doc.tenant}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(doc.status)}`}>
                          {getStatusLabel(doc.status)}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        {doc.uploadedBy && doc.uploadedBy !== 'Sistema' ? (
                          <span>{doc.uploadedBy}</span>
                        ) : (
                          <span className="text-muted-foreground">Sistema</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('pt-BR') : new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-xs font-mono text-muted-foreground">
                        {doc.hash && doc.hash !== 'N/A' ? (
                          <span className="flex items-center gap-1" title={doc.hash}>
                            <Hash className="w-3 h-3" />
                            {doc.hash.substring(0, 12)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {}
      {activeTab === 'uploads' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Logs de Upload de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (uploadLogs || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Upload className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum log de upload</p>
                  <p className="text-sm">Os logs de upload estarão disponíveis em breve.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(uploadLogs || []).map((log: any) => (
                    <div key={log.id} className="p-3 bg-gray-50 rounded-lg border text-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{log.documentType} - {log.fileName}</p>
                          <p className="text-xs text-muted-foreground">Propriedade: {log.propertyName}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700">
                          {new Date(log.uploadedAt).toLocaleDateString('pt-BR')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        <div>
                          <p className="text-muted-foreground">Upload por:</p>
                          <p className="font-medium">{log.uploadedBy} ({log.uploadedByRole})</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">IP:</p>
                          <p className="font-mono">{log.ip}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Hash:</p>
                          <p className="font-mono text-xs">{log.hash}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
