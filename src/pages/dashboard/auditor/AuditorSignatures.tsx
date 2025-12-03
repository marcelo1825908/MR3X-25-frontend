import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  FileSignature, Search, Eye, CheckCircle, Clock, Monitor, MapPin, Hash
} from 'lucide-react';

interface SignatureRecord {
  id: string;
  documentId: string;
  documentName: string;
  signerName: string;
  signerEmail: string;
  signedAt: string;
  hash: string;
  ip: string;
  device: string;
  location: string;
  status: 'valid' | 'pending' | 'expired';
}

const mockSignatures: SignatureRecord[] = [
  {
    id: '1',
    documentId: 'DOC-2834',
    documentName: 'Contrato de Locação - Apt 501',
    signerName: 'João Silva',
    signerEmail: 'joao@email.com',
    signedAt: '2024-12-01 10:32:00',
    hash: 'sha256:a7f3c2e1d4b5...9f8e',
    ip: '192.168.1.105',
    device: 'Chrome 120 / Windows 11',
    location: 'São Paulo, SP',
    status: 'valid',
  },
  {
    id: '2',
    documentId: 'DOC-2833',
    documentName: 'Termo de Vistoria - Casa 12',
    signerName: 'Maria Santos',
    signerEmail: 'maria@email.com',
    signedAt: '2024-12-01 09:45:00',
    hash: 'sha256:b8g4d3f2e5c6...0a9b',
    ip: '200.100.50.25',
    device: 'Safari 17 / macOS 14',
    location: 'Rio de Janeiro, RJ',
    status: 'valid',
  },
  {
    id: '3',
    documentId: 'DOC-2832',
    documentName: 'Acordo de Rescisão',
    signerName: 'Pedro Lima',
    signerEmail: 'pedro@email.com',
    signedAt: '',
    hash: '',
    ip: '',
    device: '',
    location: '',
    status: 'pending',
  },
  {
    id: '4',
    documentId: 'DOC-2831',
    documentName: 'Contrato de Locação - Sala 302',
    signerName: 'Ana Costa',
    signerEmail: 'ana@empresa.com',
    signedAt: '2024-11-28 14:20:00',
    hash: 'sha256:c9h5e4g3f6d7...1b0c',
    ip: '45.67.89.123',
    device: 'Firefox 120 / Ubuntu 22',
    location: 'Curitiba, PR',
    status: 'valid',
  },
  {
    id: '5',
    documentId: 'DOC-2820',
    documentName: 'Contrato Comercial - Loja 5',
    signerName: 'Carlos Mendes',
    signerEmail: 'carlos@loja.com',
    signedAt: '2024-10-15 11:30:00',
    hash: 'sha256:d0i6f5h4g7e8...2c1d',
    ip: '177.45.67.89',
    device: 'Edge 119 / Windows 10',
    location: 'Belo Horizonte, MG',
    status: 'expired',
  },
];

export function AuditorSignatures() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSignature, setSelectedSignature] = useState<SignatureRecord | null>(null);

  const filteredSignatures = mockSignatures.filter(sig =>
    sig.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sig.signerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sig.documentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: SignatureRecord['status']) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'expired': return 'bg-red-100 text-red-700';
    }
  };

  const getStatusLabel = (status: SignatureRecord['status']) => {
    switch (status) {
      case 'valid': return 'Válida';
      case 'pending': return 'Pendente';
      case 'expired': return 'Expirada';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 rounded-lg">
          <FileSignature className="w-6 h-6 text-purple-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Assinaturas Digitais</h1>
          <p className="text-muted-foreground">Validação e histórico de assinaturas (somente leitura)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Válidas</p>
              <p className="text-xl font-bold">5,412</p>
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
              <p className="text-xl font-bold">156</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expiradas</p>
              <p className="text-xl font-bold">53</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Hash className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Hashes</p>
              <p className="text-xl font-bold">5,621</p>
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
              placeholder="Buscar por documento, assinante ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signatures List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Registros de Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {filteredSignatures.map((sig) => (
                <div
                  key={sig.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedSignature?.id === sig.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedSignature(sig)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{sig.documentId}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusStyle(sig.status)}`}>
                          {getStatusLabel(sig.status)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{sig.documentName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {sig.signerName} ({sig.signerEmail})
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {sig.signedAt ? new Date(sig.signedAt).toLocaleDateString('pt-BR') : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Signature Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Detalhes da Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSignature ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Documento</p>
                  <p className="font-medium">{selectedSignature.documentId}</p>
                  <p className="text-sm text-muted-foreground">{selectedSignature.documentName}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Assinante</p>
                  <p className="font-medium">{selectedSignature.signerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedSignature.signerEmail}</p>
                </div>

                {selectedSignature.status !== 'pending' && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Data/Hora da Assinatura</p>
                      <p className="font-medium">{selectedSignature.signedAt}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Hash className="w-3 h-3" /> Hash de Verificação
                      </p>
                      <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                        {selectedSignature.hash}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Monitor className="w-3 h-3" /> Dispositivo
                      </p>
                      <p className="text-sm">{selectedSignature.device}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Localização
                      </p>
                      <p className="text-sm">{selectedSignature.location}</p>
                      <p className="text-xs text-muted-foreground">IP: {selectedSignature.ip}</p>
                    </div>
                  </>
                )}

                <Button variant="outline" className="w-full flex items-center gap-2" disabled>
                  <Eye className="w-4 h-4" />
                  Visualizar PDF
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Selecione uma assinatura para ver os detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
