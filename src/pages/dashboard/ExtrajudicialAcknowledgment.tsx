import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { extrajudicialNotificationsAPI, dashboardAPI } from '../../api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { safeGetCurrentPosition, isSecureOrigin } from '../../hooks/use-geolocation';
import {
  Scale, Shield, MapPin, CheckCircle, FileText, AlertTriangle,
  ArrowLeft, Download, Clock, User, Mail, ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { SignatureCapture } from '../../components/contracts/SignatureCapture';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

export function ExtrajudicialAcknowledgment() {
  const { notificationId } = useParams<{ notificationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [signature, setSignature] = useState<string | null>(null);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoAddress, setGeoAddress] = useState<string>('');
  const [geoConsent, setGeoConsent] = useState(false);
  const [userIp, setUserIp] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  // Guide step: 0 = none, 1 = point to location button, 2 = point to confirm button
  const [guideStep, setGuideStep] = useState<0 | 1 | 2>(0);

  // Fetch notification details
  const { data: notification, isLoading, error } = useQuery({
    queryKey: ['extrajudicial-notification', notificationId],
    queryFn: () => extrajudicialNotificationsAPI.getNotificationById(notificationId!),
    enabled: !!notificationId,
  });

  // Get user IP address and load saved location from modal
  useEffect(() => {
    const getIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIp(data.ip);
      } catch {
        setUserIp('unknown');
      }
    };
    getIp();

    // Load saved geolocation from modal (if available)
    const savedGeo = localStorage.getItem('extrajudicial_geolocation');
    if (savedGeo) {
      try {
        const geoData = JSON.parse(savedGeo);
        // Only use if saved within last 10 minutes
        if (Date.now() - geoData.timestamp < 10 * 60 * 1000) {
          setGeoLocation({ lat: geoData.lat, lng: geoData.lng });
          setGeoAddress(geoData.address || '');
          setGeoConsent(true);
          if (geoData.ip) {
            setUserIp(geoData.ip);
          }
        }
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Reverse geocoding to get address from coordinates
  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR`
      );
      const data = await response.json();
      if (data.address) {
        const { road, suburb, city, town, village, state, country } = data.address;
        const parts = [
          road,
          suburb,
          city || town || village,
          state,
          country
        ].filter(Boolean);
        return parts.join(', ');
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Request geolocation
  const requestGeolocation = useCallback(() => {
    if (!isSecureOrigin()) {
      toast.warning('Geolocalização requer HTTPS. Continuando sem localização.');
      setGeoLocation(null);
      setGeoConsent(true); // Allow to proceed without location
      if (guideStep === 1) {
        setGuideStep(2);
      }
      return;
    }

    safeGetCurrentPosition(
      async (position) => {
        if (position) {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setGeoLocation({ lat, lng });
          setGeoConsent(true);

          // Get address from coordinates
          const address = await getAddressFromCoords(lat, lng);
          setGeoAddress(address);

          // Move guide to step 2 (point to confirm button)
          if (guideStep === 1) {
            setGuideStep(2);
          }

          toast.success('Localização capturada com sucesso');
        } else {
          // No location available but allow to proceed
          setGeoLocation(null);
          setGeoConsent(true);
          if (guideStep === 1) {
            setGuideStep(2);
          }
          toast.warning('Continuando sem localização.');
        }
      },
      () => {
        toast.error('Não foi possível obter sua localização');
        setGeoConsent(false);
      }
    );
  }, [guideStep]);

  // Sign mutation
  const signMutation = useMutation({
    mutationFn: async () => {
      // Record the acknowledgment with signature
      // The acknowledgeExtrajudicial endpoint already saves the signature
      return dashboardAPI.acknowledgeExtrajudicial(notificationId!, {
        acknowledgmentType: 'SIGNATURE',
        ipAddress: userIp,
        geoLat: geoLocation?.lat,
        geoLng: geoLocation?.lng,
        geoConsent,
        userAgent: navigator.userAgent,
        signature: signature || undefined,
      });
    },
    onSuccess: () => {
      // Clear saved geolocation
      localStorage.removeItem('extrajudicial_geolocation');
      queryClient.invalidateQueries({ queryKey: ['extrajudicial-notification', notificationId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-alerts'] });
      toast.success('Ciência registrada com sucesso! Sua assinatura foi salva.');
    },
    onError: () => {
      toast.error('Erro ao registrar ciência. Tente novamente.');
    },
  });

  // Handle sign
  const handleSign = async () => {
    // If location not enabled, start the guide
    if (!geoLocation && guideStep === 0) {
      setGuideStep(1);
      toast.info('Por favor, permita sua localização primeiro');
      return;
    }

    if (!signature) {
      toast.error('Por favor, assine no campo de assinatura');
      return;
    }
    if (!acceptedTerms) {
      toast.error('Por favor, aceite os termos para continuar');
      return;
    }

    // Reset guide and proceed
    setGuideStep(0);
    setIsSigning(true);
    try {
      await signMutation.mutateAsync();
    } finally {
      setIsSigning(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    try {
      const blob = await extrajudicialNotificationsAPI.downloadProvisionalPdf(notificationId!);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notificacao-extrajudicial-${notification?.notificationToken || notificationId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF baixado com sucesso');
    } catch {
      toast.error('Erro ao baixar PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-700 mb-2">Notificação não encontrada</h2>
            <p className="text-red-600 mb-4">
              A notificação solicitada não foi encontrada ou você não tem permissão para acessá-la.
            </p>
            <Button onClick={() => navigate('/dashboard/tenant-dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAlreadySigned = notification.debtorSignedAt || notification.acknowledgedAt;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/dashboard/tenant-dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card className="border-red-200">
        <CardHeader className="bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Scale className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-red-700">
                Notificação Extrajudicial
              </CardTitle>
              <CardDescription className="text-red-600">
                Ciência e Assinatura Digital
              </CardDescription>
            </div>
            <Badge
              className={`ml-auto ${
                isAlreadySigned
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700 animate-pulse'
              }`}
            >
              {isAlreadySigned ? 'Ciência Registrada' : 'Pendente de Ciência'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Token and QR Code */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-6 bg-gray-50 rounded-lg border overflow-visible">
            <div className="text-center flex-shrink-0">
              <QRCodeSVG
                value={`https://mr3x.com.br/verify/extrajudicial/${notification.notificationToken || notificationId}`}
                size={120}
                level="H"
              />
              <p className="text-xs text-gray-500 mt-2">Verificação</p>
            </div>
            <div className="text-center flex-shrink-0 overflow-visible min-w-0">
              <div className="inline-block overflow-visible">
                <Barcode
                  value={notification.notificationToken || notificationId || ''}
                  format="CODE128"
                  width={1.5}
                  height={60}
                  displayValue={true}
                  fontSize={14}
                  margin={10}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Token: {notification.notificationToken || notificationId}</p>
            </div>
          </div>

          {/* Notification Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Debtor Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Dados do Notificado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Nome:</span>
                  <span className="ml-2 font-medium">{notification.debtorName || user?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">CPF/CNPJ:</span>
                  <span className="ml-2 font-medium">{notification.debtorDocument || '-'}</span>
                </div>
                {notification.debtorEmail && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2">{notification.debtorEmail}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Column - Financial Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-500" />
                  Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {notification.principalAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valor Principal:</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(notification.principalAmount)}
                    </span>
                  </div>
                )}
                {notification.fineAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Multa:</span>
                    <span>{formatCurrency(notification.fineAmount)}</span>
                  </div>
                )}
                {notification.interestAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Juros:</span>
                    <span>{formatCurrency(notification.interestAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-bold">
                  <span>Total:</span>
                  <span className="text-red-600">
                    {formatCurrency(
                      (notification.principalAmount || 0) +
                      (notification.fineAmount || 0) +
                      (notification.interestAmount || 0)
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dates and Deadlines */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-800">Prazos</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-yellow-700">Data da Notificação:</span>
                  <p className="font-medium">{formatDate(notification.createdAt)}</p>
                </div>
                {notification.deadlineDate && (
                  <div>
                    <span className="text-yellow-700">Prazo Final:</span>
                    <p className="font-bold text-red-600">
                      {formatDate(notification.deadlineDate)}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-yellow-700">Dias para Prazo:</span>
                  <p className="font-medium">{notification.deadlineDays || 'N/A'} dias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Basis and Demanded Action */}
          {(notification.legalBasis || notification.demandedAction) && (
            <Card>
              <CardContent className="p-4 space-y-3">
                {notification.legalBasis && (
                  <div>
                    <Label className="text-gray-500">Fundamentação Legal:</Label>
                    <p className="text-sm mt-1">{notification.legalBasis}</p>
                  </div>
                )}
                {notification.demandedAction && (
                  <div>
                    <Label className="text-gray-500">Ação Demandada:</Label>
                    <p className="text-sm mt-1 font-medium">{notification.demandedAction}</p>
                  </div>
                )}
                {notification.consequencesText && (
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <Label className="text-red-700">Consequências do não cumprimento:</Label>
                    <p className="text-sm mt-1 text-red-600">{notification.consequencesText}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tracking Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Registro de Ciência
              </CardTitle>
              <CardDescription className="text-blue-600">
                Informações registradas para validade jurídica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Data/Hora:</span>
                  <p className="font-mono">{new Date().toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <span className="text-blue-700">Endereço IP:</span>
                  <p className="font-mono">{userIp || 'Obtendo...'}</p>
                </div>
                <div>
                  <span className="text-blue-700">Navegador:</span>
                  <p className="font-mono text-xs truncate">{navigator.userAgent}</p>
                </div>
                {geoLocation && (
                  <div className="md:col-span-2">
                    <span className="text-blue-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Localização:
                    </span>
                    <p className="text-sm mt-1">
                      {geoAddress || 'Obtendo endereço...'}
                    </p>
                    <p className="font-mono text-xs text-gray-400 mt-1">
                      ({geoLocation.lat.toFixed(6)}, {geoLocation.lng.toFixed(6)})
                    </p>
                  </div>
                )}
              </div>

              {!geoLocation && (
                <div className="relative mt-2">
                  {/* Arrow pointing to location button - Step 1 */}
                  {guideStep === 1 && (
                    <div className="absolute -top-12 left-0 flex flex-col items-start animate-bounce z-10">
                      <div className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
                        Clique aqui primeiro!
                      </div>
                      <ArrowDown className="w-6 h-6 text-blue-600 ml-4" />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestGeolocation}
                    className={`${guideStep === 1 ? 'ring-2 ring-blue-500 ring-offset-2 animate-pulse' : ''}`}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Permitir Localização (recomendado)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signature Section */}
          {!isAlreadySigned ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardHeader>
                <CardTitle className="text-lg">Assinatura Digital</CardTitle>
                <CardDescription>
                  Assine no campo abaixo para confirmar sua ciência desta notificação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SignatureCapture
                  onSignatureChange={setSignature}
                  label="Sua Assinatura"
                />

                {/* Terms */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                      Declaro que estou ciente do teor desta notificação extrajudicial, que entendo
                      seu conteúdo e que os prazos legais passam a contar a partir desta data.
                      Esta assinatura digital tem validade jurídica conforme a legislação brasileira.
                    </label>
                  </div>
                </div>

                {/* Sign Button */}
                <div className="relative">
                  {/* Arrow pointing to confirm button - Step 2 */}
                  {guideStep === 2 && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-10">
                      <div className="bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
                        Agora clique aqui para confirmar!
                      </div>
                      <ArrowDown className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                  <Button
                    className={`w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg ${guideStep === 2 ? 'ring-2 ring-green-500 ring-offset-2 animate-pulse' : ''}`}
                    onClick={handleSign}
                    disabled={isSigning}
                  >
                    {isSigning ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Registrando Ciência...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Confirmar Ciência e Assinar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-700 mb-2">
                  Ciência Registrada com Sucesso
                </h3>
                <p className="text-green-600 mb-4">
                  Sua ciência foi registrada em {formatDate(notification.debtorSignedAt || notification.acknowledgedAt)}.
                  Este registro tem validade jurídica.
                </p>
                {notification.debtorSignature && (
                  <div className="mt-4 p-4 bg-white rounded-lg border">
                    <Label className="text-gray-500">Sua Assinatura:</Label>
                    <img
                      src={notification.debtorSignature}
                      alt="Assinatura"
                      className="max-h-24 mx-auto mt-2"
                    />
                  </div>
                )}
                <Button
                  className="mt-6 bg-green-600 hover:bg-green-700 text-white px-8"
                  onClick={() => navigate('/dashboard/tenant-dashboard')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  OK - Voltar ao Dashboard
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Footer Notice */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>Este documento é protegido por criptografia e tem validade jurídica.</p>
            <p>Token: {notification.notificationToken} | Hash: {(notification.hashFinal || notification.provisionalHash)?.slice(0, 20)}...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
