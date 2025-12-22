import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI, contractsAPI, contractTemplatesAPI } from '../../api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  FileText, Calendar, DollarSign, Download, CheckCircle,
  Clock, AlertCircle, User, Home, FileSignature,
  PenTool, PenLine, Lock, Eye, Printer, Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { SignatureCapture } from '../../components/contracts/SignatureCapture';
import { safeGetCurrentPosition, isSecureOrigin } from '../../hooks/use-geolocation';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

const formatCreci = (creci?: string | null): string => {
  if (!creci) return '';
  const cleaned = creci.replace(/\D/g, '');
  if (cleaned.length >= 5) {
    return cleaned.replace(/(\d{5})(\d{2})(\d{2})/, '$1-$2/$3');
  }
  return creci;
};


export function TenantContract() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [geoConsent, setGeoConsent] = useState(false);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [signing, setSigning] = useState(false);
  const [viewingContract, setViewingContract] = useState(false);
  const [contractPreview, setContractPreview] = useState<string>('');
  const [previewToken, setPreviewToken] = useState<string>('');
  const [fullContractData, setFullContractData] = useState<any>(null);
  const [printing, setPrinting] = useState(false);

  const { data: contract, isLoading: contractLoading } = useQuery({
    queryKey: ['my-contract', user?.id],
    queryFn: () => contractsAPI.getMyContract(),
  });

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['tenant-dashboard', user?.id],
    queryFn: () => dashboardAPI.getDashboard(),
    enabled: !!contract, // Only fetch dashboard if we have a contract
  });

  const isLoading = contractLoading || dashboardLoading;

  const captureBarcodeAsRotatedImage = async (): Promise<{ rotated: string; original: string; width: number; height: number } | null> => {
    try {
      let svgElement: SVGElement | null = null;

      const allSvgs = document.querySelectorAll('#contract-preview-content svg');

      for (const svg of allSvgs) {
        const bbox = svg.getBoundingClientRect();
        const aspectRatio = bbox.width / bbox.height;

        if (aspectRatio > 2 && svg.querySelectorAll('rect').length > 10) {
          svgElement = svg as SVGElement;
          break;
        }
      }

      if (!svgElement) return null;

      const bbox = svgElement.getBoundingClientRect();
      const svgWidth = bbox.width || 300;
      const svgHeight = bbox.height || 80;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const originalCanvas = document.createElement('canvas');
          originalCanvas.width = img.width || svgWidth;
          originalCanvas.height = img.height || svgHeight;
          const origCtx = originalCanvas.getContext('2d');
          if (origCtx) {
            origCtx.fillStyle = 'white';
            origCtx.fillRect(0, 0, originalCanvas.width, originalCanvas.height);
            origCtx.drawImage(img, 0, 0);
          }

          const rotatedCanvas = document.createElement('canvas');
          rotatedCanvas.width = originalCanvas.height;
          rotatedCanvas.height = originalCanvas.width;
          const rotCtx = rotatedCanvas.getContext('2d');

          if (rotCtx) {
            rotCtx.fillStyle = 'white';
            rotCtx.fillRect(0, 0, rotatedCanvas.width, rotatedCanvas.height);

            rotCtx.translate(rotatedCanvas.width, 0);
            rotCtx.rotate(Math.PI / 2);
            rotCtx.drawImage(originalCanvas, 0, 0);
          }

          URL.revokeObjectURL(url);
          resolve({
            rotated: rotatedCanvas.toDataURL('image/png'),
            original: originalCanvas.toDataURL('image/png'),
            width: rotatedCanvas.width,
            height: rotatedCanvas.height
          });
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };
        img.src = url;
      });
    } catch (error) {
      console.error('Error capturing barcode:', error);
      return null;
    }
  };

  const signContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      if (!signature) throw new Error('Assinatura necessaria');
      return contractsAPI.signContractWithGeo(contractId, {
        signature,
        signatureType: 'tenant',
        geoLat: geoLocation?.lat,
        geoLng: geoLocation?.lng,
        geoConsent: geoConsent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-contract'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-dashboard'] });
      setShowSignatureModal(false);
      setSignature(null);
      setGeoConsent(false);
      setGeoLocation(null);
      toast.success('Contrato assinado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Erro ao assinar contrato');
    },
  });

  const handleDownloadContract = async () => {
    // If preview is not loaded, load it first
    if (!contractPreview || !fullContractData) {
      if (!contractData?.id) {
        toast.error('Contrato não encontrado');
        return;
      }
      
      // Load contract preview first
      try {
        setViewingContract(true);
        const fullContract = await contractsAPI.getContractById(contractData.id);
        setFullContractData(fullContract);
        
        if (fullContract?.contentSnapshot) {
          setContractPreview(fullContract.contentSnapshot);
          setPreviewToken(fullContract.contractToken || '');
        } else if (fullContract?.templateId) {
          try {
            const template = await contractTemplatesAPI.getTemplateById(fullContract.templateId.toString());
            if (template) {
              let content = template.content || '';
              const replacements: Record<string, string> = {
                NOME_LOCATARIO: fullContract.tenantUser?.name || '',
                CPF_LOCATARIO: fullContract.tenantUser?.document?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '',
                ENDERECO_LOCATARIO: [
                  fullContract.tenantUser?.address,
                  fullContract.tenantUser?.number,
                  fullContract.tenantUser?.complement,
                  fullContract.tenantUser?.neighborhood,
                  fullContract.tenantUser?.city,
                  fullContract.tenantUser?.state,
                  fullContract.tenantUser?.cep
                ].filter(Boolean).join(', ') || '',
                NOME_LOCADOR: fullContract.ownerUser?.name || fullContract.property?.owner?.name || '',
                CPF_LOCADOR: fullContract.ownerUser?.document?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '',
                VALOR_ALUGUEL: formatCurrency(Number(fullContract.monthlyRent) || 0),
                DATA_INICIO: fullContract.startDate ? new Date(fullContract.startDate).toLocaleDateString('pt-BR') : '',
                DATA_TERMINO: fullContract.endDate ? new Date(fullContract.endDate).toLocaleDateString('pt-BR') : '',
              };
              
              Object.keys(replacements).forEach(key => {
                content = content.replace(new RegExp(key, 'g'), replacements[key]);
              });
              
              setContractPreview(content);
              setPreviewToken(fullContract.contractToken || '');
            }
          } catch (templateError) {
            console.warn('Could not fetch template:', templateError);
            toast.error('Preview do contrato não disponível');
            setViewingContract(false);
            return;
          }
        } else {
          toast.error('Preview do contrato não disponível');
          setViewingContract(false);
          return;
        }
      } catch (error: any) {
        console.error('Error loading contract:', error);
        toast.error(error?.message || 'Erro ao carregar contrato');
        setViewingContract(false);
        return;
      } finally {
        setViewingContract(false);
      }
    }

    // Wait a bit for the DOM to update if we just loaded the preview
    await new Promise(resolve => setTimeout(resolve, 100));

    let element = document.getElementById('contract-preview-content');
    
    // If element doesn't exist in modal, create a hidden element to render the preview
    if (!element) {
      // Create a hidden container to render the preview content
      const hiddenContainer = document.createElement('div');
      hiddenContainer.id = 'contract-preview-content-hidden';
      hiddenContainer.style.position = 'absolute';
      hiddenContainer.style.left = '-9999px';
      hiddenContainer.style.top = '0';
      hiddenContainer.style.width = '800px';
      hiddenContainer.style.visibility = 'hidden';
      hiddenContainer.style.pointerEvents = 'none';
      document.body.appendChild(hiddenContainer);

      // Render the preview content in the hidden container
      const contractToRender = fullContractData || contractData;
      const resolvedCreci = contractToRender?.creci ||
        formatCreci(contractToRender?.agency?.creci) ||
        contractToRender?.agency?.creci ||
        formatCreci(contractToRender?.property?.agency?.creci) ||
        contractToRender?.property?.agency?.creci ||
        user?.creci ||
        '';

      const securityInfo = `
        <div class="bg-muted p-3 sm:p-4 rounded-lg border">
          <h3 class="font-semibold mb-3">Informações de Segurança</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
            <div class="break-all sm:break-normal">
              <span class="font-medium">Token:</span>
              <span class="font-mono text-xs">${previewToken || contractToRender?.contractToken || '-'}</span>
            </div>
            <div>
              <span class="font-medium">CRECI:</span>
              <span>${resolvedCreci || '⚠️ OBRIGATÓRIO'}</span>
            </div>
            <div>
              <span class="font-medium">Data/Hora:</span>
              <span class="font-mono text-xs">${new Date().toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}</span>
            </div>
            <div class="sm:col-span-2 break-all">
              <span class="font-medium">Hash:</span>
              <span class="font-mono text-xs">${contractToRender?.contentHash || `SHA256:${previewToken ? btoa(previewToken) : '---'}`}</span>
            </div>
          </div>
        </div>
      `;

      // Generate QR Code and Barcode HTML (simplified - will be captured by html2canvas)
      const token = previewToken || contractToRender?.contractToken || 'DRAFT';
      
      const contractContentHtml = contractPreview.split('\n').map((line) => {
        const isSeparator = line.trim().match(/^[─═\-]{20,}$/);
        if (isSeparator) {
          return '<hr class="border-t border-gray-400 w-full my-4" />';
        }
        const isContractTitle = line.startsWith('CONTRATO') && line.includes('–');
        if (isContractTitle) {
          return `<p class="font-bold my-4" style="font-size: 17px;">${line}</p>`;
        }
        const isSectionTitle = line.startsWith('**') && line.endsWith('**');
        const isBold = isSectionTitle || line.includes('CLÁUSULA');
        const cleanLine = line.replace(/\*\*/g, '');
        if (isSectionTitle) {
          return `<p class="font-bold my-3 text-base" style="font-size: 15px;">${cleanLine}</p>`;
        }
        return `<p class="${isBold ? 'font-bold my-2' : 'my-1'}">${cleanLine}</p>`;
      }).join('');

      hiddenContainer.innerHTML = `
        <div id="contract-preview-content" class="space-y-4">
          ${securityInfo}
          <div class="flex flex-col sm:flex-row items-center justify-center p-3 sm:p-4 bg-white border rounded-lg gap-4 sm:gap-6">
            <div class="flex-shrink-0" id="qr-code-container-hidden"></div>
            <div class="flex-shrink-0 w-full sm:w-auto overflow-x-auto flex justify-center" id="barcode-container-hidden"></div>
          </div>
          <div class="prose prose-sm max-w-none bg-white p-4 sm:p-6 border rounded-lg">
            <div class="text-sm leading-relaxed">
              ${contractContentHtml}
            </div>
          </div>
        </div>
      `;

      // Render QR Code and Barcode using React components
      const qrCodeContainer = hiddenContainer.querySelector('#qr-code-container-hidden');
      const barcodeContainer = hiddenContainer.querySelector('#barcode-container-hidden');
      
      let qrRoot: any = null;
      let barcodeRoot: any = null;
      
      if (qrCodeContainer) {
        qrRoot = createRoot(qrCodeContainer);
        qrRoot.render(
          <QRCodeSVG
            value={`https://mr3x.com.br/verify/${token}`}
            size={80}
            level="H"
          />
        );
      }
      
      if (barcodeContainer && token) {
        barcodeRoot = createRoot(barcodeContainer);
        barcodeRoot.render(
          <Barcode
            value={token}
            format="CODE128"
            width={2}
            height={50}
            displayValue={true}
            fontSize={14}
            textMargin={4}
          />
        );
      }

      // Wait for React components to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      element = hiddenContainer;
      
      // Store roots for cleanup
      (element as any).__reactRoots = { qrRoot, barcodeRoot };
    }

    const barcodeData = await captureBarcodeAsRotatedImage();
    const filename = `contrato-${previewToken || contractData?.id || 'draft'}.pdf`;
    const token = previewToken || contractData?.contractToken || 'DRAFT';

    try {
      // Clone the element to capture at fixed width for consistent layout
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.width = '800px';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.background = 'white';
      document.body.appendChild(clone);

      // Use html2canvas-pro which supports OKLCH colors
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        width: 800,
        windowWidth: 800,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(clone);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Margins - proper padding for top/bottom/left/right
      const marginLeft = 10;
      const marginTop = 15; // More top margin
      const marginBottom = 15; // More bottom margin
      const marginRight = 20; // Extra margin for barcode

      const usableWidth = pageWidth - marginLeft - marginRight;
      const usableHeight = pageHeight - marginTop - marginBottom;

      // Calculate the scale to fit width
      const imgScale = usableWidth / canvas.width;
      const pxPerPage = usableHeight / imgScale;

      // Find smart break points between content rows (avoid cutting text)
      const findBreakPoints = (): number[] => {
        const breaks: number[] = [0];
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to simple pagination
          let y = pxPerPage;
          while (y < canvas.height) {
            breaks.push(Math.floor(y));
            y += pxPerPage;
          }
          breaks.push(canvas.height);
          return breaks;
        }

        let currentY = 0;

        while (currentY < canvas.height) {
          const targetY = currentY + pxPerPage;

          if (targetY >= canvas.height) {
            breaks.push(canvas.height);
            break;
          }

          // Search backwards from targetY to find a good break point (white row)
          let bestBreakY = Math.floor(targetY);
          const searchStart = Math.floor(targetY);
          const searchEnd = Math.floor(currentY + pxPerPage * 0.6);

          for (let y = searchStart; y > searchEnd; y -= 2) {
            try {
              const imageData = ctx.getImageData(0, y, canvas.width, 2);
              const pixels = imageData.data;

              let whitePixels = 0;
              const totalPixels = (canvas.width * 2);

              for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                if (r > 245 && g > 245 && b > 245) {
                  whitePixels++;
                }
              }

              // If this row is mostly white (gap between content), use it as break
              if (whitePixels / totalPixels > 0.85) {
                bestBreakY = y;
                break;
              }
            } catch {
              // If getImageData fails, use default position
              break;
            }
          }

          breaks.push(bestBreakY);
          currentY = bestBreakY;
        }

        return breaks;
      };

      const breakPoints = findBreakPoints();

      for (let i = 0; i < breakPoints.length - 1; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const srcY = breakPoints[i];
        const srcHeight = breakPoints[i + 1] - srcY;

        if (srcHeight <= 0) continue;

        const destHeight = srcHeight * imgScale;

        // Create a temporary canvas for this page's portion
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = srcHeight;
        const ctx = pageCanvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

          ctx.drawImage(
            canvas,
            0, srcY, canvas.width, srcHeight,
            0, 0, canvas.width, srcHeight
          );

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(pageImgData, 'JPEG', marginLeft, marginTop, usableWidth, destHeight);
        }

        // Add barcode/token to this page
        if (barcodeData && barcodeData.rotated) {
          const finalWidth = 10;
          const finalHeight = pageHeight * 0.5;

          const xPos = pageWidth - finalWidth - 3;
          const yPos = (pageHeight - finalHeight) / 2;

          pdf.setFillColor(255, 255, 255);
          pdf.rect(xPos - 2, yPos - 2, finalWidth + 4, finalHeight + 4, 'F');

          pdf.addImage(barcodeData.rotated, 'PNG', xPos, yPos, finalWidth, finalHeight);
        } else {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(pageWidth - 15, pageHeight / 2 - 40, 12, 80, 'F');

          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          pdf.text(token, pageWidth - 5, pageHeight / 2, { angle: 90 });
        }
      }

      pdf.save(filename);
      toast.success('PDF baixado com sucesso!');
      
      // Remove hidden container if we created it
      const hiddenContainer = document.getElementById('contract-preview-content-hidden');
      if (hiddenContainer) {
        // Clean up React roots
        const roots = (hiddenContainer as any).__reactRoots;
        if (roots) {
          if (roots.qrRoot) roots.qrRoot.unmount();
          if (roots.barcodeRoot) roots.barcodeRoot.unmount();
        }
        document.body.removeChild(hiddenContainer);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
      
      // Remove hidden container if we created it
      const hiddenContainer = document.getElementById('contract-preview-content-hidden');
      if (hiddenContainer) {
        // Clean up React roots
        const roots = (hiddenContainer as any).__reactRoots;
        if (roots) {
          if (roots.qrRoot) roots.qrRoot.unmount();
          if (roots.barcodeRoot) roots.barcodeRoot.unmount();
        }
        document.body.removeChild(hiddenContainer);
      }
    }
  };

  const handleViewContract = async () => {
    if (!contractData?.id) {
      toast.error('Contrato nao encontrado');
      return;
    }

    setViewingContract(true);
    try {
      const fullContract = await contractsAPI.getContractById(contractData.id);
      setFullContractData(fullContract);
      
      if (fullContract?.contentSnapshot) {
        setContractPreview(fullContract.contentSnapshot);
        setPreviewToken(fullContract.contractToken || '');
        setShowViewModal(true);
      } else if (fullContract?.templateId) {
        // Try to generate preview from template
        try {
          const template = await contractTemplatesAPI.getTemplateById(fullContract.templateId.toString());
          if (template) {
            // Generate preview content (simplified version)
            let content = template.content || '';
            // Basic replacements
            const replacements: Record<string, string> = {
              NOME_LOCATARIO: fullContract.tenantUser?.name || '',
              CPF_LOCATARIO: fullContract.tenantUser?.document?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '',
              ENDERECO_LOCATARIO: [
                fullContract.tenantUser?.address,
                fullContract.tenantUser?.number,
                fullContract.tenantUser?.complement,
                fullContract.tenantUser?.neighborhood,
                fullContract.tenantUser?.city,
                fullContract.tenantUser?.state,
                fullContract.tenantUser?.cep
              ].filter(Boolean).join(', ') || '',
              NOME_LOCADOR: fullContract.ownerUser?.name || fullContract.property?.owner?.name || '',
              CPF_LOCADOR: fullContract.ownerUser?.document?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '',
              VALOR_ALUGUEL: formatCurrency(Number(fullContract.monthlyRent) || 0),
              DATA_INICIO: fullContract.startDate ? new Date(fullContract.startDate).toLocaleDateString('pt-BR') : '',
              DATA_TERMINO: fullContract.endDate ? new Date(fullContract.endDate).toLocaleDateString('pt-BR') : '',
            };
            
            Object.keys(replacements).forEach(key => {
              content = content.replace(new RegExp(key, 'g'), replacements[key]);
            });
            
            setContractPreview(content);
            setPreviewToken(fullContract.contractToken || '');
            setShowViewModal(true);
          } else {
            toast.error('Template do contrato nao encontrado');
          }
        } catch (templateError) {
          console.warn('Could not fetch template:', templateError);
          toast.error('Preview do contrato nao disponivel');
        }
      } else {
        toast.error('Preview do contrato nao disponivel');
      }
    } catch (error: any) {
      console.error('Error loading contract:', error);
      toast.error(error?.message || 'Erro ao carregar contrato');
    } finally {
      setViewingContract(false);
    }
  };

  const handlePrintPreview = async () => {
    setPrinting(true);

    const element = document.getElementById('contract-preview-content');
    if (!element) {
      toast.error('Erro ao imprimir');
      setPrinting(false);
      return;
    }

    const barcodeData = await captureBarcodeAsRotatedImage();

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Erro ao abrir janela de impressão. Verifique se pop-ups estão permitidos.');
      setPrinting(false);
      return;
    }

    const token = previewToken || contractData?.contractToken || 'DRAFT';

    const styles = `
      <style>
        /* Remove browser header/footer (URL, date, page numbers) */
        @page {
          margin: 15mm 10mm 15mm 10mm;
          size: A4;
        }

        body {
          font-family: Arial, sans-serif;
          padding: 0;
          margin: 0;
          padding-right: 15mm;
          position: relative;
        }
        .prose { max-width: 100%; }
        .font-bold { font-weight: bold; }
        .font-semibold { font-weight: 600; }
        .my-1 { margin: 4px 0; }
        .my-2 { margin: 8px 0; }
        .bg-muted { background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .text-sm { font-size: 14px; }
        .text-xs { font-size: 12px; }
        .font-mono { font-family: monospace; }
        .border { border: 1px solid #e5e5e5; }
        .rounded-lg { border-radius: 8px; }
        .p-4, .p-6 { padding: 16px; }
        .mb-2 { margin-bottom: 8px; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .gap-4 { gap: 16px; }
        p { page-break-inside: avoid; }
        .barcode-container {
          position: fixed;
          right: 2mm;
          top: 50%;
          transform: translateY(-50%);
          background: white;
          z-index: 9999;
          padding: 2mm;
        }
        .barcode-img {
          max-height: 60%;
          width: auto;
          max-width: 15mm;
        }
        @media print {
          /* Hide URL, date, title in header/footer */
          @page {
            margin: 15mm 10mm 15mm 10mm;
          }
          body {
            margin: 0;
            padding: 0;
            padding-right: 15mm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .barcode-container { position: fixed; right: 2mm; }
          p { page-break-inside: avoid; }
        }
      </style>
    `;

    const barcodeHtml = barcodeData && barcodeData.rotated
      ? `<img src="${barcodeData.rotated}" class="barcode-img" alt="barcode" />`
      : `<div style="writing-mode: vertical-rl; transform: rotate(180deg); font-family: monospace; font-size: 8pt;">${token}</div>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prévia do Contrato - ${token}</title>
          ${styles}
        </head>
        <body>
          <div class="barcode-container">
            ${barcodeHtml}
          </div>
          ${element.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setPrinting(false);
    }, 500);
  };

  // Handle geolocation consent change
  const handleGeoConsentChange = (consent: boolean) => {
    setGeoConsent(consent);
    if (consent) {
      if (!isSecureOrigin()) {
        toast.warning('Geolocalização requer HTTPS. Continuando sem localização.');
        setGeoLocation(null);
        return;
      }

      toast.info('Obtendo localização...');
      safeGetCurrentPosition(
        (position) => {
          if (position) {
            setGeoLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            toast.success('Localização obtida com sucesso!');
          } else {
            setGeoLocation(null);
            toast.warning('Continuando sem localização.');
          }
        },
        (error) => {
          console.error('Error getting geolocation:', error);
          toast.error('Erro ao obter localização.');
          setGeoConsent(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setGeoLocation(null);
    }
  };

  const handleSignContract = async () => {
    if (!contractData?.id) return;
    if (!signature) {
      toast.error('Por favor, desenhe sua assinatura');
      return;
    }

    // Allow signing without geolocation on HTTP
    if (!geoConsent && isSecureOrigin()) {
      toast.error('É necessário autorizar o compartilhamento de localização');
      return;
    }

    setSigning(true);
    try {
      await signContractMutation.mutateAsync(contractData.id);
    } finally {
      setSigning(false);
    }
  };

  const openSignatureModal = () => {
    setSignature(null);
    setGeoConsent(false);
    setGeoLocation(null);
    setShowSignatureModal(true);
  };

  const closeSignatureModal = () => {
    setShowSignatureModal(false);
    setSignature(null);
    setGeoConsent(false);
    setGeoLocation(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Use contract from getMyContract API, fallback to dashboard if needed
  const contractData = contract || dashboard?.contract;
  const property = contractData?.property || dashboard?.property;

  const isSigned = contractData?.tenantSignature || contractData?.status === 'ATIVO' || contractData?.status === 'ASSINADO';
  const canSign = (contractData?.status === 'PENDENTE' || contractData?.status === 'AGUARDANDO_ASSINATURAS') && !contractData?.tenantSignature;

  const getContractDuration = () => {
    if (!contractData?.startDate || !contractData?.endDate) return null;

    const start = new Date(contractData.startDate);
    const end = new Date(contractData.endDate);
    const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return `${months} meses`;
  };

  const getRemainingTime = () => {
    if (!contractData?.endDate) return null;

    const now = new Date();
    const end = new Date(contractData.endDate);
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

      {contractData ? (
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
                  contractData.status === 'ATIVO'
                    ? 'bg-green-100 text-green-700'
                    : contractData.status === 'ENCERRADO'
                    ? 'bg-gray-100 text-gray-700'
                    : contractData.status === 'ASSINADO'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                }>
                  {contractData.status === 'ATIVO' ? 'Ativo' :
                   contractData.status === 'ENCERRADO' ? 'Encerrado' :
                   contractData.status === 'ASSINADO' ? 'Assinado' :
                   contractData.status === 'PENDENTE' ? 'Pendente Assinatura' :
                   contractData.status === 'AGUARDANDO_ASSINATURAS' ? 'Aguardando Assinaturas' :
                   contractData.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-muted-foreground">Inicio</p>
                  <p className="font-semibold">
                    {contractData.startDate
                      ? new Date(contractData.startDate).toLocaleDateString('pt-BR')
                      : '-'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="text-sm text-muted-foreground">Termino</p>
                  <p className="font-semibold">
                    {contractData.endDate
                      ? new Date(contractData.endDate).toLocaleDateString('pt-BR')
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
                    {formatCurrency(Number(contractData.monthlyRent) || 0)}
                  </p>
                </div>
              </div>

              {}
              {remainingTime && contractData.status === 'ATIVO' && (
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
                    {contractData.tenantSignedAt && (
                      <p className="text-sm text-green-600">
                        Assinado em: {new Date(contractData.tenantSignedAt).toLocaleString('pt-BR')}
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
                  onClick={handleViewContract}
                  disabled={viewingContract}
                >
                  {viewingContract ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span>Carregando...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-6 h-6 text-blue-500" />
                      <span>Ver Contrato</span>
                    </>
                  )}
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
                    <p className="font-semibold">Todo dia {contractData.dueDay || property?.dueDay || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Ultimo Pagamento</p>
                    <p className="font-semibold">
                      {contractData.lastPaymentDate
                        ? new Date(contractData.lastPaymentDate).toLocaleDateString('pt-BR')
                        : 'Nenhum registro'}
                    </p>
                  </div>
                </div>

                {contractData.deposit && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Caucao/Deposito</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(Number(contractData.deposit) || 0)}
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
      <Dialog open={showSignatureModal} onOpenChange={(open) => !open && closeSignatureModal()}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="w-5 h-5 text-green-600" />
              Assinar Contrato
            </DialogTitle>
            <DialogDescription>
              Assinatura como: <strong>Locatário</strong>
            </DialogDescription>
          </DialogHeader>
          {contractData && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Imóvel:</span>
                  <span className="font-medium truncate ml-2">
                    {contractData.property?.name || contractData.property?.address || property?.name || property?.address || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aluguel:</span>
                  <span className="font-medium">
                    {contractData.monthlyRent
                      ? formatCurrency(parseFloat(contractData.monthlyRent))
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período:</span>
                  <span className="font-medium">
                    {formatDate(contractData.startDate)} - {formatDate(contractData.endDate)}
                  </span>
                </div>
              </div>

              <SignatureCapture
                onSignatureChange={setSignature}
                onGeolocationConsent={handleGeoConsentChange}
                geolocationRequired={isSecureOrigin()}
                label="Desenhe sua assinatura"
                disabled={signing}
              />

              {geoLocation && (
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Localização capturada: {geoLocation.lat.toFixed(6)}, {geoLocation.lng.toFixed(6)}
                </div>
              )}

              {!isSecureOrigin() && (
                <div className="text-xs text-amber-600 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Geolocalização indisponível (requer HTTPS)
                </div>
              )}

              <div className="flex flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeSignatureModal}
                  disabled={signing}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleSignContract}
                  disabled={signing || !signature || (isSecureOrigin() && (!geoConsent || !geoLocation))}
                >
                  {signing ? 'Assinando...' : 'Confirmar Assinatura'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Contract Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="w-[95vw] sm:w-auto max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                Prévia do Contrato
              </DialogTitle>
              <DialogDescription className="hidden sm:block">
                Visualize o conteúdo completo do seu contrato de locação
              </DialogDescription>
            </div>
            {contractPreview && (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={handleDownloadContract} title="Baixar PDF">
                  <Download className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handlePrintPreview} disabled={printing} title="Imprimir">
                  {printing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                </Button>
              </div>
            )}
          </DialogHeader>
          {contractPreview ? (
            <div id="contract-preview-content" className="space-y-4">
              {/* Security Information */}
              <div className="bg-muted p-3 sm:p-4 rounded-lg border">
                <h3 className="font-semibold mb-3">Informações de Segurança</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                  <div className="break-all sm:break-normal">
                    <span className="font-medium">Token:</span>{' '}
                    <span className="font-mono text-xs">{previewToken || '-'}</span>
                  </div>
                  <div>
                    <span className="font-medium">CRECI:</span>{' '}
                    {(() => {
                      // Try to get CRECI from multiple sources, in order of priority
                      const resolvedCreci = fullContractData
                        ? (
                            // 1. CRECI directly on contract (immutable snapshot)
                            fullContractData.creci ||
                            // 2. CRECI from agency in contract
                            formatCreci(fullContractData.agency?.creci) ||
                            fullContractData.agency?.creci ||
                            // 3. CRECI from property's agency if available
                            formatCreci(contractData?.property?.agency?.creci) ||
                            contractData?.property?.agency?.creci ||
                            // 4. CRECI from user (broker)
                            user?.creci ||
                            ''
                          )
                        : (
                            // Fallback to contractData if fullContractData not loaded yet
                            contractData?.creci ||
                            formatCreci(contractData?.agency?.creci) ||
                            contractData?.agency?.creci ||
                            formatCreci(property?.agency?.creci) ||
                            property?.agency?.creci ||
                            user?.creci ||
                            ''
                          );
                      const isMissing = !resolvedCreci;
                      return (
                        <span className={isMissing ? 'text-red-500 font-semibold' : ''}>
                          {resolvedCreci || '⚠️ OBRIGATÓRIO'}
                        </span>
                      );
                    })()}
                  </div>
                  <div>
                    <span className="font-medium">Data/Hora:</span>{' '}
                    <span className="font-mono text-xs">
                      {new Date().toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="sm:col-span-2 break-all">
                    <span className="font-medium">Hash:</span>{' '}
                    <span className="font-mono text-xs">
                      {fullContractData?.contentHash || `SHA256:${previewToken ? btoa(previewToken) : '---'}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code and Barcode */}
              {previewToken && (
                <div className="flex flex-col sm:flex-row items-center justify-center p-3 sm:p-4 bg-white border rounded-lg gap-4 sm:gap-6">
                  <div className="flex-shrink-0">
                    <QRCodeSVG
                      value={`https://mr3x.com.br/verify/${previewToken}`}
                      size={80}
                      level="H"
                    />
                  </div>
                  <div className="flex-shrink-0 w-full sm:w-auto overflow-x-auto flex justify-center">
                    <Barcode
                      value={previewToken}
                      format="CODE128"
                      width={2}
                      height={50}
                      displayValue={true}
                      fontSize={14}
                      textMargin={4}
                    />
                  </div>
                </div>
              )}

              {/* Contract Content */}
              <div className="prose prose-sm max-w-none bg-white p-4 sm:p-6 border rounded-lg">
                <div className="text-sm leading-relaxed" style={{ wordBreak: 'normal', overflowWrap: 'normal', hyphens: 'none' }}>
                  {contractPreview.split('\n').map((line, index) => {
                    const isSeparator = line.trim().match(/^[─═\-]{20,}$/);
                    if (isSeparator) {
                      return (
                        <div key={index} className="my-4">
                          <hr className="border-t border-gray-400 w-full" />
                        </div>
                      );
                    }

                    const isContractTitle = line.startsWith('CONTRATO') && line.includes('–');
                    if (isContractTitle) {
                      return (
                        <p key={index} className="font-bold my-4" style={{ wordBreak: 'normal', overflowWrap: 'normal', whiteSpace: 'normal', fontSize: '17px' }}>
                          {line}
                        </p>
                      );
                    }

                    const isSectionTitle = line.startsWith('**') && line.endsWith('**');
                    const isBold = isSectionTitle || line.includes('CLÁUSULA');
                    const cleanLine = line.replace(/\*\*/g, '');

                    if (isSectionTitle) {
                      return (
                        <p key={index} className="font-bold my-3 text-base" style={{ wordBreak: 'normal', overflowWrap: 'normal', whiteSpace: 'normal', fontSize: '15px' }}>
                          {cleanLine}
                        </p>
                      );
                    }

                    return (
                      <p key={index} className={isBold ? 'font-bold my-2' : 'my-1'} style={{ wordBreak: 'normal', overflowWrap: 'normal', whiteSpace: 'normal' }}>
                        {cleanLine}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Carregando preview do contrato...</p>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
