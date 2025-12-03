import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  Receipt, Search, Eye, DollarSign, ArrowUpRight, ArrowDownRight,
  Clock, AlertTriangle, Building2, User
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'payment' | 'split' | 'chargeback' | 'refund';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'scheduled' | 'failed';
  payer?: string;
  recipient?: string;
  splitDetails?: SplitDetail[];
}

interface SplitDetail {
  recipient: string;
  recipientType: 'agency' | 'owner' | 'platform';
  amount: number;
  percentage: number;
}

const mockTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    type: 'payment',
    description: 'Aluguel Apt 501 - Dezembro/2024',
    amount: 2500.00,
    date: '2024-12-01 10:30:00',
    status: 'completed',
    payer: 'João Silva (Inquilino)',
    recipient: 'Imobiliária Centro',
    splitDetails: [
      { recipient: 'Imobiliária Centro', recipientType: 'agency', amount: 250.00, percentage: 10 },
      { recipient: 'Maria Santos (Proprietário)', recipientType: 'owner', amount: 2125.00, percentage: 85 },
      { recipient: 'MR3X Platform', recipientType: 'platform', amount: 125.00, percentage: 5 },
    ],
  },
  {
    id: 'TXN-002',
    type: 'payment',
    description: 'Aluguel Casa 12 - Dezembro/2024',
    amount: 3500.00,
    date: '2024-12-01 09:15:00',
    status: 'completed',
    payer: 'Pedro Lima (Inquilino)',
    recipient: 'Imobiliária Norte',
    splitDetails: [
      { recipient: 'Imobiliária Norte', recipientType: 'agency', amount: 350.00, percentage: 10 },
      { recipient: 'Carlos Mendes (Proprietário)', recipientType: 'owner', amount: 2975.00, percentage: 85 },
      { recipient: 'MR3X Platform', recipientType: 'platform', amount: 175.00, percentage: 5 },
    ],
  },
  {
    id: 'TXN-003',
    type: 'payment',
    description: 'Aluguel Sala 302 - Dezembro/2024',
    amount: 1800.00,
    date: '2024-12-05',
    status: 'scheduled',
    payer: 'Ana Costa (Inquilino)',
    recipient: 'Imobiliária Centro',
  },
  {
    id: 'TXN-004',
    type: 'chargeback',
    description: 'Estorno - Cobrança duplicada',
    amount: -2500.00,
    date: '2024-11-28 16:45:00',
    status: 'completed',
    payer: 'MR3X Platform',
    recipient: 'Roberto Oliveira (Inquilino)',
  },
  {
    id: 'TXN-005',
    type: 'payment',
    description: 'Aluguel Loja 5 - Novembro/2024',
    amount: 4200.00,
    date: '2024-11-15 14:20:00',
    status: 'failed',
    payer: 'Empresa XYZ (Inquilino)',
    recipient: 'Imobiliária Sul',
  },
];

export function AuditorPayments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = mockTransactions.filter(txn =>
    txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
    }
  };

  const getStatusLabel = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'pending': return 'Pendente';
      case 'scheduled': return 'Agendado';
      case 'failed': return 'Falhou';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-orange-100 rounded-lg">
          <Receipt className="w-6 h-6 text-orange-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Pagamentos e Splits</h1>
          <p className="text-muted-foreground">Histórico de transações e divisões (somente leitura)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recebidos (Mês)</p>
              <p className="text-xl font-bold">R$ 245.680</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Agendados</p>
              <p className="text-xl font-bold">R$ 89.400</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowDownRight className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chargebacks</p>
              <p className="text-xl font-bold">R$ 7.500</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Falhas</p>
              <p className="text-xl font-bold">12</p>
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
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {filteredTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedTransaction?.id === txn.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedTransaction(txn)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{txn.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusStyle(txn.status)}`}>
                          {getStatusLabel(txn.status)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{txn.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{txn.payer}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${txn.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(txn.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(txn.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Detalhes da Transação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTransaction ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">ID da Transação</p>
                  <p className="font-mono font-medium">{selectedTransaction.id}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="text-sm">{selectedTransaction.description}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className={`text-xl font-bold ${selectedTransaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> Pagador
                  </p>
                  <p className="text-sm">{selectedTransaction.payer}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Destinatário
                  </p>
                  <p className="text-sm">{selectedTransaction.recipient}</p>
                </div>

                {selectedTransaction.splitDetails && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Divisão (Split)</p>
                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                      {selectedTransaction.splitDetails.map((split, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              split.recipientType === 'agency' ? 'bg-blue-500' :
                              split.recipientType === 'owner' ? 'bg-green-500' : 'bg-purple-500'
                            }`} />
                            <span className="truncate max-w-[140px]">{split.recipient}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(split.amount)}</p>
                            <p className="text-xs text-muted-foreground">{split.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full flex items-center gap-2" disabled>
                  <Receipt className="w-4 h-4" />
                  Ver Comprovante
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Selecione uma transação para ver os detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
