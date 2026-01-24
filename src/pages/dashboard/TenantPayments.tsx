import { useQuery } from '@tanstack/react-query';
import { dashboardAPI, invoicesAPI, paymentsAPI } from '../../api';
import { useMemo } from 'react';
import { formatCurrency } from '../../lib/utils';
import {
  DollarSign, Calendar, Download, CheckCircle, Clock,
  AlertTriangle, CreditCard, Receipt, FileText,
  Wallet, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface Payment {
  id?: string;
  date?: string;
  amount?: number | string;
  type?: string;
  status?: string;
}

interface Invoice {
  id: string;
  status?: string;
  paidAt?: string;
  dueDate?: string;
  paidValue?: number;
  originalValue?: number;
}

interface Receipt {
  id: string;
  invoiceNumber?: string;
  referenceMonth?: string;
  paidAt?: string;
  paidValue?: number;
  paymentMethod?: string;
  receiptUrl?: string;
}

export function TenantPayments() {
  const { user } = useAuth();

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['tenant-dashboard', user?.id],
    queryFn: () => dashboardAPI.getDashboard(),
  });

  // Fetch invoices separately
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      try {
        const result = await invoicesAPI.getInvoices({ tenantId: user?.id, take: 1000 });
        if (Array.isArray(result)) {
          return result;
        } else if (result?.data && Array.isArray(result.data)) {
          return result.data;
        } else if (result?.items && Array.isArray(result.items)) {
          return result.items;
        }
        return [];
      } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Fetch manual payments separately
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      try {
        const result = await paymentsAPI.getPayments();
        const paymentsArray = Array.isArray(result) ? result : (result?.data || []);
        // Filter to only show payments for this tenant
        return paymentsArray.filter((p: any) => 
          p.tenantId === user?.id || 
          String(p.tenantId) === String(user?.id) ||
          p.userId === user?.id ||
          String(p.userId) === String(user?.id)
        );
      } catch (error) {
        console.error('Error fetching payments:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const isLoading = dashboardLoading || invoicesLoading || paymentsLoading;

  const property = dashboard?.property;
  const dashboardPaymentHistory = dashboard?.paymentHistory || [];
  const manualPayments = Array.isArray(paymentsData) ? paymentsData : [];
  const invoices = Array.isArray(invoicesData) ? invoicesData : [];

  // Combine payments and invoices into a single list
  // IMPORTANT: This useMemo must be called before any conditional returns to follow Rules of Hooks
  const allPaymentsAndInvoices = useMemo(() => {
    // Format invoices to match payment structure
    const formattedInvoices = invoices.map((invoice: any) => ({
      id: `invoice_${invoice.id}`,
      isInvoice: true,
      invoiceId: invoice.id,
      amount: invoice.paidValue || invoice.updatedValue || invoice.originalValue || 0,
      valorPago: invoice.paidValue || invoice.updatedValue || invoice.originalValue || 0,
      date: invoice.paidAt || invoice.dueDate,
      dataPagamento: invoice.paidAt || invoice.dueDate,
      type: invoice.paymentMethod || 'FATURA',
      tipo: invoice.paymentMethod || 'FATURA',
      status: invoice.status === 'PAID' ? 'PAGO' : invoice.status,
      referenceMonth: invoice.referenceMonth,
      invoiceNumber: invoice.invoiceNumber,
    }));

    // Format manual payments
    const formattedPayments = manualPayments.map((payment: any) => ({
      id: payment.id,
      isInvoice: false,
      amount: payment.valorPago || payment.amount || 0,
      valorPago: payment.valorPago || payment.amount || 0,
      date: payment.dataPagamento || payment.paymentDate || payment.date,
      dataPagamento: payment.dataPagamento || payment.paymentDate || payment.date,
      type: payment.tipo || payment.paymentType || 'ALUGUEL',
      tipo: payment.tipo || payment.paymentType || 'ALUGUEL',
      status: payment.status || 'PAGO',
    }));

    // Also include dashboard payment history (for backward compatibility)
    const dashboardPayments = dashboardPaymentHistory.map((payment: Payment) => ({
      id: payment.id || `dashboard_${payment.date}`,
      isInvoice: false,
      amount: Number(payment.amount) || 0,
      valorPago: Number(payment.amount) || 0,
      date: payment.date,
      dataPagamento: payment.date,
      type: payment.type || 'ALUGUEL',
      tipo: payment.type || 'ALUGUEL',
      status: payment.status || 'PAGO',
    }));

    // Combine all and remove duplicates (by id or date+amount)
    const combined = [...formattedInvoices, ...formattedPayments, ...dashboardPayments];
    const unique = combined.filter((item, index, self) => 
      index === self.findIndex((t) => 
        t.id === item.id || 
        (t.date === item.date && Math.abs(Number(t.amount) - Number(item.amount)) < 0.01)
      )
    );

    // Sort by date (most recent first)
    return unique.sort((a, b) => {
      const dateA = new Date(a.date || a.dataPagamento || 0).getTime();
      const dateB = new Date(b.date || b.dataPagamento || 0).getTime();
      return dateB - dateA;
    });
  }, [invoices, manualPayments, dashboardPaymentHistory]);

  const paymentHistory = allPaymentsAndInvoices;
  const totalPaid = paymentHistory.reduce((sum: number, p: any) => sum + (Number(p.amount || p.valorPago) || 0), 0);
  const paymentsCount = paymentHistory.length;

  // Early return AFTER all hooks are called (Rules of Hooks)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getPaymentStatus = () => {
    if (!property?.nextDueDate) return { status: 'unknown', label: 'Sem data', color: 'gray' };

    const daysUntilDue = property.daysUntilDue;
    if (daysUntilDue === null) return { status: 'unknown', label: 'Sem data', color: 'gray' };

    if (daysUntilDue < 0) {
      return { status: 'overdue', label: `${Math.abs(daysUntilDue)} dias em atraso`, color: 'red' };
    } else if (daysUntilDue <= 5) {
      return { status: 'upcoming', label: `Vence em ${daysUntilDue} dias`, color: 'yellow' };
    } else {
      return { status: 'ok', label: 'Em dia', color: 'green' };
    }
  };

  const paymentStatus = getPaymentStatus();

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      toast.info('Gerando comprovante...');
      
      // Check if it's an invoice ID (starts with "invoice_")
      if (paymentId.startsWith('invoice_')) {
        const invoiceId = paymentId.replace('invoice_', '');
        const receiptData = await invoicesAPI.downloadReceipt(invoiceId);
        
        if (receiptData.receiptUrl) {
          window.open(receiptData.receiptUrl, '_blank');
          toast.success('Recibo aberto em nova aba');
        } else {
          toast.error('Recibo não disponível para esta fatura');
        }
        return;
      }
      
      // For regular payments, try to find matching invoice
      const payment = paymentHistory.find((p: any) => p.id === paymentId);
      if (!payment) {
        toast.error('Pagamento não encontrado');
        return;
      }
      
      // If payment already has invoiceId, use it directly
      if (payment.invoiceId) {
        const receiptData = await invoicesAPI.downloadReceipt(payment.invoiceId);
        if (receiptData.receiptUrl) {
          window.open(receiptData.receiptUrl, '_blank');
          toast.success('Recibo aberto em nova aba');
        } else {
          toast.error('Recibo não disponível para este pagamento');
        }
        return;
      }
      
      // Try to find invoice by matching date or amount
      const invoices = await invoicesAPI.getInvoices({ tenantId: user?.id });
      const paidInvoices = invoices.filter((inv: Invoice) => inv.status === 'PAID');
      
      const matchingInvoice = paidInvoices.find((inv: Invoice) => {
        const dateValue = inv.paidAt || inv.dueDate;
        if (!dateValue) return false;
        const invDate = new Date(dateValue).toISOString().split('T')[0];
        const payDate = new Date(payment.date || payment.dataPagamento).toISOString().split('T')[0];
        const amountMatch = Math.abs(Number(inv.paidValue || inv.originalValue) - Number(payment.amount || payment.valorPago)) < 0.01;
        return invDate === payDate || amountMatch;
      });
      
      if (matchingInvoice) {
        const receiptData = await invoicesAPI.downloadReceipt(matchingInvoice.id);
        
        if (receiptData.receiptUrl) {
          window.open(receiptData.receiptUrl, '_blank');
          toast.success('Recibo aberto em nova aba');
        } else {
          toast.error('Recibo não disponível para este pagamento');
        }
      } else {
        toast.error('Fatura correspondente não encontrada');
      }
    } catch (err) {
      console.error('Error downloading receipt:', err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Erro ao baixar comprovante');
    }
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-100 rounded-lg">
          <DollarSign className="w-6 h-6 text-green-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Meus Pagamentos</h1>
          <p className="text-muted-foreground">Acompanhe seus pagamentos e faturas</p>
        </div>
      </div>

      {}
      {property && (
        <Card className={`border-l-4 ${
          paymentStatus.color === 'green' ? 'border-l-green-500' :
          paymentStatus.color === 'yellow' ? 'border-l-yellow-500' :
          paymentStatus.color === 'red' ? 'border-l-red-500' :
          'border-l-gray-500'
        }`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <CardTitle className="text-lg">Próximo Pagamento</CardTitle>
              </div>
              <Badge className={`
                ${paymentStatus.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                ${paymentStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${paymentStatus.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                ${paymentStatus.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
              `}>
                {paymentStatus.status === 'ok' && <CheckCircle className="w-3 h-3 mr-1" />}
                {paymentStatus.status === 'upcoming' && <Clock className="w-3 h-3 mr-1" />}
                {paymentStatus.status === 'overdue' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {paymentStatus.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Wallet className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm text-muted-foreground">Valor do Aluguel</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(Number(property.monthlyRent) || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                <p className="text-xl font-bold">
                  {property.nextDueDate
                    ? new Date(property.nextDueDate).toLocaleDateString('pt-BR')
                    : 'Não definido'}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <FileText className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="text-sm text-muted-foreground">Dia de Vencimento</p>
                <p className="text-xl font-bold">
                  Todo dia {property.dueDay || (property.nextDueDate ? new Date(property.nextDueDate).getDate() : '-')}
                </p>
              </div>
            </div>

            {}
            {paymentStatus.status === 'overdue' && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-700">Pagamento em Atraso</p>
                    <p className="text-sm text-red-600">
                      Regularize sua situação para evitar multas e juros. Entre em contato com a imobiliária para realizar o pagamento.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {paymentStatus.status === 'upcoming' && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-700">Vencimento Próximo</p>
                    <p className="text-sm text-yellow-600">
                      Seu pagamento vence em breve. Entre em contato com a imobiliária para realizar o pagamento.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagamentos Realizados</p>
                <p className="text-2xl font-bold">{paymentsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Mensal</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(Number(property?.monthlyRent) || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-green-500" />
            <CardTitle className="text-lg">Histórico de Pagamentos</CardTitle>
          </div>
          <CardDescription>Todos os pagamentos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {paymentHistory.map((payment: any, index: number) => (
                <div
                  key={payment.id || index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      {payment.isInvoice ? (
                        <FileText className="w-6 h-6 text-green-600" />
                      ) : (
                        <CreditCard className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {payment.type === 'ALUGUEL' || payment.type === 'FATURA' || payment.tipo === 'FATURA' ? 'Aluguel' :
                           payment.type === 'CONDOMINIO' ? 'Condomínio' :
                           payment.type === 'IPTU' ? 'IPTU' :
                           payment.type === 'OUTROS' ? 'Outros' : payment.type || payment.tipo || 'Pagamento'}
                        </p>
                        {payment.isInvoice && (
                          <Badge className="bg-indigo-500 text-white text-xs">Fatura</Badge>
                        )}
                        {payment.referenceMonth && (
                          <Badge variant="outline" className="text-xs">
                            {payment.referenceMonth}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payment.status === 'PAID' || payment.status === 'PAGO' ? 'Pago' : 
                         payment.status === 'PENDING' ? 'Pendente' :
                         payment.status === 'OVERDUE' ? 'Vencido' : 'Pago'} em {payment.date || payment.dataPagamento
                          ? new Date(payment.date || payment.dataPagamento).toLocaleDateString('pt-BR')
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(Number(payment.amount || payment.valorPago) || 0)}
                      </p>
                      <Badge variant="outline" className={`text-xs ${
                        payment.status === 'PAID' || payment.status === 'PAGO' || !payment.status
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : payment.status === 'PENDING'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {payment.status === 'PAID' || payment.status === 'PAGO' || !payment.status ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Pago
                          </>
                        ) : payment.status === 'PENDING' ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Pendente
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Vencido
                          </>
                        )}
                      </Badge>
                    </div>
                    {(payment.isInvoice ? payment.invoiceId : payment.id) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const id = payment.isInvoice ? payment.invoiceId : payment.id;
                          if (id) handleDownloadReceipt(id);
                        }}
                        title="Baixar comprovante"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold text-lg mb-2">Nenhum pagamento encontrado</h3>
              <p>Você ainda não possui pagamentos registrados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipts Section */}
      {dashboard?.receipts && dashboard.receipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Recibos Disponíveis
            </CardTitle>
            <CardDescription>
              Baixe seus recibos de pagamento a qualquer momento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.receipts.map((receipt: Receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <p className="font-semibold">
                        {receipt.invoiceNumber || `Recibo #${receipt.id}`}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {receipt.referenceMonth && (
                        <p>Mês de referência: {receipt.referenceMonth}</p>
                      )}
                      {receipt.paidAt && (
                        <p>
                          Pago em: {new Date(receipt.paidAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      <p>Valor: {formatCurrency(receipt.paidValue || 0)}</p>
                      {receipt.paymentMethod && (
                        <p>Método: {receipt.paymentMethod}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {receipt.receiptUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(receipt.receiptUrl, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Baixar PDF
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const receiptData = await invoicesAPI.downloadReceipt(receipt.id);
                            if (receiptData.receiptUrl) {
                              window.open(receiptData.receiptUrl, '_blank');
                            } else {
                              toast.error('Recibo não disponível');
                            }
                          } catch {
                            toast.error('Erro ao baixar recibo');
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Gerar Recibo
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {} 
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Formas de Pagamento</CardTitle>
          <CardDescription>Métodos disponíveis para realizar seus pagamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                <img src="/pix-icon.svg" alt="PIX" className="w-6 h-6" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} />
                <span className="text-green-600 font-bold text-sm">PIX</span>
              </div>
              <p className="font-medium">PIX</p>
              <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-medium">Boleto</p>
              <p className="text-sm text-muted-foreground">Vencimento em até 3 dias</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <p className="font-medium">Cartão de Crédito</p>
              <p className="text-sm text-muted-foreground">Parcelamento disponível</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
