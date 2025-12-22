import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI, contractsAPI } from '../../api';
import { formatCurrency } from '../../lib/utils';
import { useState, useRef, useEffect } from 'react';
import {
  FileText, Calendar, DollarSign, Download, CheckCircle,
  Clock, AlertCircle, User, Home, FileSignature,
  PenTool, X, RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';

function SignaturePad({
  onSave,
  onClear,
  width = 400,
  height = 200,
}: {
  onSave: (signature: string) => void;
  onClear: () => void;
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [width, height]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    setHasSignature(false);
    onClear();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const signature = canvas.toDataURL('image/png');
    onSave(signature);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Use o mouse ou o dedo para desenhar sua assinatura acima
      </p>
      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={clearCanvas} type="button">
          <RotateCcw className="w-4 h-4 mr-2" />
          Limpar
        </Button>
        <Button
          onClick={saveSignature}
          disabled={!hasSignature}
          className="bg-green-600 hover:bg-green-700"
          type="button"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Confirmar Assinatura
        </Button>
      </div>
    </div>
  );
}

export function TenantContract() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signing, setSigning] = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['tenant-dashboard', user?.id],
    queryFn: () => dashboardAPI.getDashboard(),
  });

  const signContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      if (!signature) throw new Error('Assinatura necessaria');
      return contractsAPI.signContract(contractId, {
        signature,
        signatureType: 'tenant',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-dashboard'] });
      setShowSignatureModal(false);
      setSignature(null);
      setAcceptTerms(false);
      toast.success('Contrato assinado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao assinar contrato');
    },
  });

  const handleDownloadContract = async () => {
    try {
      if (!dashboard?.contract?.id) {
        toast.error('Contrato nao encontrado');
        return;
      }

      const blob = await contractsAPI.downloadContract(dashboard.contract.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato-${dashboard.contract.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Contrato baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao baixar contrato. Tente novamente.');
    }
  };

  const handleSignContract = async () => {
    if (!dashboard?.contract?.id) return;
    if (!signature) {
      toast.error('Por favor, desenhe sua assinatura');
      return;
    }
    if (!acceptTerms) {
      toast.error('Voce deve aceitar os termos do contrato');
      return;
    }

    setSigning(true);
    try {
      await signContractMutation.mutateAsync(dashboard.contract.id);
    } finally {
      setSigning(false);
    }
  };

  const openSignatureModal = () => {
    setSignature(null);
    setAcceptTerms(false);
    setShowSignatureModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const property = dashboard?.property;
  const contract = dashboard?.contract;

  const isSigned = contract?.tenantSignature || contract?.status === 'ATIVO';
  const canSign = contract?.status === 'PENDENTE' && !contract?.tenantSignature;

  const getContractDuration = () => {
    if (!contract?.startDate || !contract?.endDate) return null;

    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return `${months} meses`;
  };

  const getRemainingTime = () => {
    if (!contract?.endDate) return null;

    const now = new Date();
    const end = new Date(contract.endDate);
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (days < 0) return { value: Math.abs(days), unit: 'dias', status: 'expired' };
    if (days <= 30) return { value: days, unit: 'dias', status: 'ending' };
    if (days <= 90) return { value: Math.round(days / 30), unit: 'meses', status: 'warning' };
    return { value: Math.round(days / 30), unit: 'meses', status: 'ok' };
  };

  const remainingTime = getRemainingTime();

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 rounded-lg">
          <FileText className="w-6 h-6 text-purple-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Meu Contrato</h1>
          <p className="text-muted-foreground">Visualize os detalhes do seu contrato de locacao</p>
        </div>
      </div>

      {contract ? (
        <>
          {}
          {canSign && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <PenTool className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-700">Assinatura Pendente</h4>
                    <p className="text-sm text-orange-600 mt-1">
                      Seu contrato esta aguardando sua assinatura digital. Revise os termos e assine para ativar o contrato.
                    </p>
                    <Button
                      className="mt-3 bg-orange-600 hover:bg-orange-700"
                      size="sm"
                      onClick={openSignatureModal}
                    >
                      <FileSignature className="w-4 h-4 mr-2" />
                      Assinar Agora
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  <CardTitle className="text-lg">Status do Contrato</CardTitle>
                </div>
                <Badge className={
                  contract.status === 'ATIVO'
                    ? 'bg-green-100 text-green-700'
                    : contract.status === 'ENCERRADO'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-yellow-100 text-yellow-700'
                }>
                  {contract.status === 'ATIVO' ? 'Ativo' :
                   contract.status === 'ENCERRADO' ? 'Encerrado' :
                   contract.status === 'PENDENTE' ? 'Pendente Assinatura' :
                   contract.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-muted-foreground">Inicio</p>
                  <p className="font-semibold">
                    {contract.startDate
                      ? new Date(contract.startDate).toLocaleDateString('pt-BR')
                      : '-'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="text-sm text-muted-foreground">Termino</p>
                  <p className="font-semibold">
                    {contract.endDate
                      ? new Date(contract.endDate).toLocaleDateString('pt-BR')
                      : '-'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm text-muted-foreground">Duracao</p>
                  <p className="font-semibold">{getContractDuration() || '-'}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm text-muted-foreground">Valor Mensal</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(Number(contract.monthlyRent) || 0)}
                  </p>
                </div>
              </div>

              {}
              {remainingTime && contract.status === 'ATIVO' && (
                <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                  remainingTime.status === 'expired' ? 'bg-red-50 text-red-700' :
                  remainingTime.status === 'ending' ? 'bg-yellow-50 text-yellow-700' :
                  remainingTime.status === 'warning' ? 'bg-orange-50 text-orange-700' :
                  'bg-green-50 text-green-700'
                }`}>
                  {remainingTime.status === 'expired' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : remainingTime.status === 'ending' || remainingTime.status === 'warning' ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  <span>
                    {remainingTime.status === 'expired'
                      ? `Contrato expirado ha ${remainingTime.value} ${remainingTime.unit}`
                      : `Faltam ${remainingTime.value} ${remainingTime.unit} para o termino do contrato`
                    }
                  </span>
                </div>
              )}

              {}
              {isSigned && (
                <div className="mt-4 p-4 rounded-lg bg-green-50 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <span className="text-green-700 font-medium">Contrato Assinado</span>
                    {contract.tenantSignedAt && (
                      <p className="text-sm text-green-600">
                        Assinado em: {new Date(contract.tenantSignedAt).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {}
          {property && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">Imovel Locado</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{property.name || 'Imovel'}</h3>
                    <p className="text-muted-foreground">{property.address}</p>
                  </div>

                  {property.owner && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Locador / Administrador</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">{property.owner.name}</p>
                          <p className="text-sm text-muted-foreground">{property.owner.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Acoes do Contrato</CardTitle>
              <CardDescription>Documentos e assinaturas relacionados ao seu contrato</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={handleDownloadContract}
                >
                  <Download className="w-6 h-6 text-blue-500" />
                  <span>Baixar Contrato (PDF)</span>
                </Button>

                <Button
                  variant={canSign ? 'default' : 'outline'}
                  className={`h-auto py-4 flex flex-col items-center gap-2 ${
                    canSign ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''
                  }`}
                  disabled={!canSign}
                  onClick={openSignatureModal}
                >
                  <FileSignature className={`w-6 h-6 ${canSign ? 'text-white' : 'text-purple-500'}`} />
                  <span>
                    {isSigned
                      ? 'Contrato Assinado'
                      : canSign
                      ? 'Assinar Contrato'
                      : 'Aguardando Contrato'}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resumo das Condicoes</CardTitle>
              <CardDescription>Principais termos do seu contrato</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Dia de Vencimento</p>
                    <p className="font-semibold">Todo dia {contract.dueDay || property?.dueDay || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Ultimo Pagamento</p>
                    <p className="font-semibold">
                      {contract.lastPaymentDate
                        ? new Date(contract.lastPaymentDate).toLocaleDateString('pt-BR')
                        : 'Nenhum registro'}
                    </p>
                  </div>
                </div>

                {contract.deposit && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Caucao/Deposito</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(Number(contract.deposit) || 0)}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Importante</p>
                      <p>
                        Para questoes sobre renovacao, rescisao ou alteracoes no contrato,
                        entre em contato com seu locador ou administrador.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-xl mb-2">Nenhum contrato encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Voce ainda nao possui um contrato ativo vinculado a sua conta.
            </p>
          </CardContent>
        </Card>
      )}

      {}
      <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-purple-500" />
              Assinar Contrato
            </DialogTitle>
            <DialogDescription>
              Desenhe sua assinatura abaixo para assinar digitalmente o contrato de locacao.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {}
            <div className="p-4 bg-gray-50 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">Resumo do Contrato</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Imovel:</span>
                  <p className="font-medium">{property?.name || property?.address}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor:</span>
                  <p className="font-medium text-green-600">
                    {formatCurrency(Number(contract?.monthlyRent) || 0)}/mes
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Inicio:</span>
                  <p className="font-medium">
                    {contract?.startDate ? new Date(contract.startDate).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Termino:</span>
                  <p className="font-medium">
                    {contract?.endDate ? new Date(contract.endDate).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>
            </div>

            {}
            <div>
              <Label className="mb-2 block">Sua Assinatura</Label>
              <SignaturePad
                width={380}
                height={150}
                onSave={(sig) => setSignature(sig)}
                onClear={() => setSignature(null)}
              />
            </div>

            {}
            {signature && (
              <div className="p-3 border rounded-lg bg-green-50">
                <p className="text-sm text-green-700 font-medium mb-2">Assinatura capturada:</p>
                <img src={signature} alt="Sua assinatura" className="max-h-16 mx-auto" />
              </div>
            )}

            {}
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
              <Checkbox
                id="accept-terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              />
              <Label htmlFor="accept-terms" className="text-sm text-yellow-800 cursor-pointer">
                Declaro que li e aceito todos os termos e condicoes do contrato de locacao.
                Entendo que esta assinatura digital tem validade juridica.
              </Label>
            </div>

            {}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSignatureModal(false)}
                disabled={signing}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSignContract}
                disabled={!signature || !acceptTerms || signing}
                className="bg-green-600 hover:bg-green-700"
              >
                {signing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assinando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Assinar Contrato
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
