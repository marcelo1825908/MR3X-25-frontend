import { useRef, useState, useCallback, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Eraser, Check, RotateCcw, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface SignatureCaptureProps {
  onSignatureChange: (signature: string | null) => void;
  onGeolocationConsent?: (consent: boolean) => void;
  geolocationRequired?: boolean;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function SignatureCapture({
  onSignatureChange,
  onGeolocationConsent,
  geolocationRequired = true,
  label = 'Assinatura',
  className,
  disabled = false,
}: SignatureCaptureProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const fullscreenSignatureRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [geoConsent, setGeoConsent] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 150 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        
        const height = window.innerWidth < 640 ? 150 : 200;
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleClear = useCallback(() => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
      onSignatureChange(null);
    }
  }, [onSignatureChange]);

  const handleEnd = useCallback(() => {
    if (signatureRef.current) {
      const isCanvasEmpty = signatureRef.current.isEmpty();
      setIsEmpty(isCanvasEmpty);

      if (!isCanvasEmpty) {
        try {
          const dataUrl = signatureRef.current.getTrimmedCanvas().toDataURL('image/png');
          onSignatureChange(dataUrl);
        } catch {
          const canvas = signatureRef.current.getCanvas();
          const dataUrl = canvas.toDataURL('image/png');
          onSignatureChange(dataUrl);
        }
      } else {
        onSignatureChange(null);
      }
    }
  }, [onSignatureChange]);

  const handleFullscreenEnd = useCallback(() => {
    if (fullscreenSignatureRef.current) {
      const isCanvasEmpty = fullscreenSignatureRef.current.isEmpty();
      if (!isCanvasEmpty) {
        let dataUrl: string;
        try {
          dataUrl = fullscreenSignatureRef.current.getTrimmedCanvas().toDataURL('image/png');
        } catch {
          const canvas = fullscreenSignatureRef.current.getCanvas();
          dataUrl = canvas.toDataURL('image/png');
        }

        if (signatureRef.current) {
          signatureRef.current.fromDataURL(dataUrl);
        }
        setIsEmpty(false);
        onSignatureChange(dataUrl);
      }
    }
  }, [onSignatureChange]);

  const handleFullscreenClear = useCallback(() => {
    if (fullscreenSignatureRef.current) {
      fullscreenSignatureRef.current.clear();
    }
  }, []);

  const handleFullscreenConfirm = useCallback(() => {
    handleFullscreenEnd();
    setShowFullscreen(false);
  }, [handleFullscreenEnd]);

  const handleGeoConsentChange = useCallback((checked: boolean) => {
    setGeoConsent(checked);
    onGeolocationConsent?.(checked);
  }, [onGeolocationConsent]);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          {}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFullscreen(true)}
            disabled={disabled}
            className="sm:hidden"
          >
            <Maximize2 className="w-4 h-4 mr-1" />
            Tela cheia
          </Button>
        </div>

        <div
          ref={containerRef}
          className="relative border rounded-lg bg-white overflow-hidden touch-none"
        >
          <SignatureCanvas
            ref={signatureRef}
            onEnd={handleEnd}
            penColor="black"
            canvasProps={{
              width: canvasSize.width,
              height: canvasSize.height,
              className: cn(
                'w-full touch-none',
                disabled && 'pointer-events-none opacity-50'
              ),
              style: { touchAction: 'none' },
            }}
            backgroundColor="white"
          />

          {}
          <div
            className="absolute left-4 right-4 border-b border-dashed border-gray-300 pointer-events-none"
            style={{ bottom: '30px' }}
          />

          {}
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-muted-foreground text-xs sm:text-sm text-center px-4">
                Desenhe sua assinatura aqui
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={disabled || isEmpty}
            className="text-xs sm:text-sm"
          >
            <Eraser className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Limpar
          </Button>

          {!isEmpty && (
            <div className="flex items-center text-xs sm:text-sm text-green-600">
              <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden xs:inline">Assinatura capturada</span>
              <span className="xs:hidden">OK</span>
            </div>
          )}
        </div>
      </div>

      {geolocationRequired && (
        <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2 sm:space-y-3">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <Checkbox
              id="geoConsent"
              checked={geoConsent}
              onCheckedChange={handleGeoConsentChange}
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="space-y-1 flex-1 min-w-0">
              <Label
                htmlFor="geoConsent"
                className="text-xs sm:text-sm font-medium cursor-pointer leading-tight"
              >
                Autorizo o compartilhamento da minha localização
              </Label>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                A geolocalização é obrigatória para validar a assinatura do contrato.
                <span className="hidden sm:inline"> Sua localização será registrada junto com a assinatura para fins de segurança e validade jurídica.</span>
              </p>
            </div>
          </div>

          {!geoConsent && (
            <div className="flex items-center text-amber-700 text-xs sm:text-sm">
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
              <span className="hidden sm:inline">Aguardando consentimento de geolocalização...</span>
              <span className="sm:hidden">Aguardando consentimento...</span>
            </div>
          )}
        </div>
      )}

      {}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-full w-full h-[100dvh] max-h-[100dvh] p-0 m-0 rounded-none">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Desenhe sua assinatura</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col p-4">
            <div className="flex-1 border rounded-lg bg-white relative overflow-hidden">
              <SignatureCanvas
                ref={fullscreenSignatureRef}
                penColor="black"
                canvasProps={{
                  className: 'w-full h-full touch-none',
                  style: { touchAction: 'none' },
                }}
                backgroundColor="white"
              />
              {}
              <div className="absolute bottom-16 left-8 right-8 border-b border-dashed border-gray-300 pointer-events-none" />
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handleFullscreenClear}
                className="flex-1"
              >
                <Eraser className="w-4 h-4 mr-2" />
                Limpar
              </Button>
              <Button
                onClick={handleFullscreenConfirm}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SignatureCapture;
