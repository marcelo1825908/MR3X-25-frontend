import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  FileText, Search, Eye, FileSignature, ClipboardCheck, Bell, Upload, Download
} from 'lucide-react';

type DocumentType = 'contract' | 'agreement' | 'notification' | 'inspection';

interface Document {
  id: string;
  type: DocumentType;
  name: string;
  description: string;
  agency: string;
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'active' | 'signed' | 'archived';
  fileSize: string;
  version: number;
}

interface UploadLog {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
  status: 'success' | 'failed';
  documentId?: string;
}

const mockDocuments: Document[] = [
  {
    id: 'doc_001',
    type: 'contract',
    name: 'Contrato de Locação - Apt 501',
    description: 'Contrato de locação residencial por 12 meses',
    agency: 'Imobiliária Centro',
    createdBy: 'gestor@imobcentro.com',
    createdAt: '2024-11-15',
    status: 'signed',
    fileSize: '245 KB',
    version: 3,
  },
  {
    id: 'doc_002',
    type: 'contract',
    name: 'Contrato de Locação - Casa 12',
    description: 'Contrato de locação residencial por 24 meses',
    agency: 'Imobiliária Norte',
    createdBy: 'diretor@imobnorte.com',
    createdAt: '2024-11-20',
    status: 'active',
    fileSize: '312 KB',
    version: 2,
  },
  {
    id: 'doc_003',
    type: 'agreement',
    name: 'Acordo de Rescisão - Sala 302',
    description: 'Acordo de rescisão antecipada do contrato comercial',
    agency: 'Imobiliária Centro',
    createdBy: 'corretor@imobcentro.com',
    createdAt: '2024-11-28',
    status: 'draft',
    fileSize: '156 KB',
    version: 1,
  },
  {
    id: 'doc_004',
    type: 'notification',
    name: 'Notificação de Reajuste',
    description: 'Notificação de reajuste anual de aluguel',
    agency: 'Imobiliária Centro',
    createdBy: 'sistema',
    createdAt: '2024-12-01',
    status: 'active',
    fileSize: '45 KB',
    version: 1,
  },
  {
    id: 'doc_005',
    type: 'inspection',
    name: 'Vistoria de Entrada - Apt 501',
    description: 'Relatório de vistoria com fotos e observações',
    agency: 'Imobiliária Centro',
    createdBy: 'corretor@imobcentro.com',
    createdAt: '2024-11-10',
    status: 'signed',
    fileSize: '2.4 MB',
    version: 1,
  },
];

const mockUploadLogs: UploadLog[] = [
  {
    id: 'upl_001',
    fileName: 'contrato_apt501_v3.pdf',
    uploadedBy: 'gestor@imobcentro.com',
    uploadedAt: '2024-12-01 10:45:00',
    fileSize: '245 KB',
    status: 'success',
    documentId: 'doc_001',
  },
  {
    id: 'upl_002',
    fileName: 'vistoria_fotos.zip',
    uploadedBy: 'corretor@imobcentro.com',
    uploadedAt: '2024-12-01 09:30:00',
    fileSize: '15.6 MB',
    status: 'success',
    documentId: 'doc_005',
  },
  {
    id: 'upl_003',
    fileName: 'documento_corrompido.pdf',
    uploadedBy: 'admin@imobnorte.com',
    uploadedAt: '2024-12-01 08:15:00',
    fileSize: '0 KB',
    status: 'failed',
  },
  {
    id: 'upl_004',
    fileName: 'acordo_rescisao.pdf',
    uploadedBy: 'corretor@imobcentro.com',
    uploadedAt: '2024-11-30 16:20:00',
    fileSize: '156 KB',
    status: 'success',
    documentId: 'doc_003',
  },
];

export function AuditorDocuments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'documents' | 'uploads'>('documents');
  const [typeFilter, setTypeFilter] = useState<'all' | DocumentType>('all');

  const filteredDocuments = mockDocuments.filter(doc => {
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
    return doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.agency.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'contract': return <FileText className="w-4 h-4" />;
      case 'agreement': return <FileSignature className="w-4 h-4" />;
      case 'notification': return <Bell className="w-4 h-4" />;
      case 'inspection': return <ClipboardCheck className="w-4 h-4" />;
    }
  };

  const getTypeStyle = (type: DocumentType) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-700';
      case 'agreement': return 'bg-purple-100 text-purple-700';
      case 'notification': return 'bg-yellow-100 text-yellow-700';
      case 'inspection': return 'bg-green-100 text-green-700';
    }
  };

  const getTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'contract': return 'Contrato';
      case 'agreement': return 'Acordo';
      case 'notification': return 'Notificação';
      case 'inspection': return 'Vistoria';
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-100 rounded-lg">
          <FileText className="w-6 h-6 text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Visualização de documentos e logs de upload (somente leitura)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contratos</p>
              <p className="text-xl font-bold">2,834</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileSignature className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Acordos</p>
              <p className="text-xl font-bold">456</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Notificações</p>
              <p className="text-xl font-bold">1,234</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClipboardCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vistorias</p>
              <p className="text-xl font-bold">892</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
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

      {/* Type Filter (for documents tab) */}
      {activeTab === 'documents' && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            Todos
          </Button>
          {(['contract', 'agreement', 'notification', 'inspection'] as DocumentType[]).map(type => (
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

      {/* Search */}
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

      {/* Documents Tab */}
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
                    <th className="text-left p-4 text-sm font-medium">Agência</th>
                    <th className="text-left p-4 text-sm font-medium">Status</th>
                    <th className="text-left p-4 text-sm font-medium">Data</th>
                    <th className="text-left p-4 text-sm font-medium">Versão</th>
                    <th className="text-left p-4 text-sm font-medium">Tamanho</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.description}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getTypeStyle(doc.type)}`}>
                          {getTypeIcon(doc.type)}
                          {getTypeLabel(doc.type)}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{doc.agency}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(doc.status)}`}>
                          {getStatusLabel(doc.status)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-sm">v{doc.version}</td>
                      <td className="p-4 text-sm text-muted-foreground">{doc.fileSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploads Tab */}
      {activeTab === 'uploads' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Logs de Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">Arquivo</th>
                    <th className="text-left p-4 text-sm font-medium">Enviado por</th>
                    <th className="text-left p-4 text-sm font-medium">Data/Hora</th>
                    <th className="text-left p-4 text-sm font-medium">Tamanho</th>
                    <th className="text-left p-4 text-sm font-medium">Status</th>
                    <th className="text-left p-4 text-sm font-medium">Documento</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mockUploadLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-mono">{log.fileName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{log.uploadedBy}</td>
                      <td className="p-4 text-sm text-muted-foreground">{log.uploadedAt}</td>
                      <td className="p-4 text-sm text-muted-foreground">{log.fileSize}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.status === 'success' ? 'Sucesso' : 'Falhou'}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-mono text-muted-foreground">
                        {log.documentId || '-'}
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
