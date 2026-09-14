import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Layers, 
  Info, 
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';
import { 
  exportSvgToBlob, 
  copyImageBlobToClipboard, 
  triggerDownload, 
  formatOfficialDateDDMMYYYY 
} from '../utils/chartImageExporter';

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  svgElement: SVGSVGElement | null;
  lastDateLabel?: string;
}

const DEFAULT_PARA = [
  'guillermo.krebs@cial.cl',
  'GONZALO.SALINAS@cial.cl',
  'CATALINA.MUNOZ@cial.cl',
  'jose.mella@cial.cl',
  'matias.lastra@cial.cl',
  'hector.muzio@cial.cl',
  'jose.pando@cial.cl',
  'eduardo.reyes@cial.cl',
  'matias.martinez@cial.cl'
].join('; ');

const DEFAULT_CC = [
  'controldeexistencias@cialalimentos.cl',
  'francisco.lara@cial.cl',
  'Alejandro.Ureta@cial.cl',
  'euro.velasquez@cial.cl',
  'christopher.aleman@cial.cl',
  'marcos.primera@cial.cl',
  'cristian.hernandez@cial.cl',
  'Claudio.Sepulveda@cial.cl',
  'planificacion.cd@cial.cl'
].join('; ');

const RUTA_FILESERVER = '\\\\FILESERVER\\Cial Comercial\\04 Logistica y Distribucion\\01 Centro de Distribución\\05 Inventario\\15 Reporte de Capacidad CD';
const URL_APP = 'https://almacenamiento.nexusnetwork.cl';

export const EmailReportModal: React.FC<EmailReportModalProps> = ({
  isOpen,
  onClose,
  svgElement,
  lastDateLabel
}) => {
  const [para, setPara] = useState(DEFAULT_PARA);
  const [cc, setCc] = useState(DEFAULT_CC);
  const [asunto, setAsunto] = useState(`Reporte ocupación CD ${formatOfficialDateDDMMYYYY()}`);
  
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Estados de feedback de botones
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [copiedPara, setCopiedPara] = useState<boolean>(false);
  const [copiedCc, setCopiedCc] = useState<boolean>(false);
  const [outlookTriggered, setOutlookTriggered] = useState<boolean>(false);

  // Generar la imagen del gráfico al abrir el modal
  useEffect(() => {
    if (isOpen && svgElement) {
      setIsExporting(true);
      exportSvgToBlob(svgElement, { scale: 2, format: 'image/png' })
        .then(blob => {
          setImageBlob(blob);
          const url = URL.createObjectURL(blob);
          setPreviewImageUrl(url);
        })
        .catch(err => {
          console.error('Error generando previsualización de imagen:', err);
        })
        .finally(() => {
          setIsExporting(false);
        });
    }

    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [isOpen, svgElement]);

  if (!isOpen) return null;

  // 1. Abrir Outlook y copiar gráfico al portapapeles automáticamente
  const handleOpenOutlook = async () => {
    // Si tenemos el blob, copiarlo al portapapeles
    if (imageBlob) {
      await copyImageBlobToClipboard(imageBlob);
      setCopiedImage(true);
    }

    // Construir cuerpo de texto plano para Outlook
    const bodyPlain = `Buen día,\n\n` +
      `Adjunto reporte de ocupación CD.\n\n` +
      `Ruta en donde se puede apreciar el detalle:\n${RUTA_FILESERVER}\n\n` +
      `Plataforma Online CD:\n${URL_APP}\n\n` +
      `--------------------------------------------------\n` +
      `[Gráfico copiado en tu portapapeles: presiona Ctrl + V aquí para incrustar]\n` +
      `--------------------------------------------------\n`;

    const mailtoUrl = `mailto:${encodeURIComponent(para)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(bodyPlain)}`;
    
    // Abrir cliente de correo
    const link = document.createElement('a');
    link.href = mailtoUrl;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setOutlookTriggered(true);
    setTimeout(() => setOutlookTriggered(false), 6000);
  };

  // 2. Copiar gráfico al portapapeles individualmente
  const handleCopyImage = async () => {
    if (!imageBlob) return;
    const ok = await copyImageBlobToClipboard(imageBlob);
    if (ok) {
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 3000);
    }
  };

  // 3. Descargar imagen JPEG idéntica a la macro (ReporteOcupacionCD.jpg)
  const handleDownloadJpg = async () => {
    if (!svgElement) return;
    try {
      const jpgBlob = await exportSvgToBlob(svgElement, { scale: 2, format: 'image/jpeg', quality: 0.95 });
      triggerDownload(jpgBlob, 'ReporteOcupacionCD.jpg');
    } catch (e) {
      console.error('Error al descargar JPG:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#004b87] to-[#0a5c36] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Generador de Correo Oficial de Ocupación CD
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Macro automática de envío a Gerencia y Jefaturas • CIAL Alimentos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Modal con Scroll */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* Banner Informativo */}
          {outlookTriggered ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-emerald-900 animate-fadeIn">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>¡Ventana de Outlook generada con éxito!</strong>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Los destinatarios, CC y asunto fueron cargados. Además, <strong>el gráfico fue copiado a tu portapapeles</strong>: solo presiona <kbd className="px-1.5 py-0.5 bg-white border border-emerald-300 rounded font-mono font-bold">Ctrl + V</kbd> dentro del correo para pegarlo.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5 text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span>
                  Esta función reemplaza completamente la macro de Excel: prepara el correo con los destinatarios de gerencia y te permite copiar o incrustar el gráfico de ocupación en alta resolución con un solo clic.
                </span>
              </div>
            </div>
          )}

          {/* Formulario de Correo (Para, CC, Asunto) */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Para */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-black text-slate-800 flex items-center gap-1.5">
                  <span>Para (Destinatarios Principales):</span>
                  <span className="text-[10px] text-slate-400 font-semibold">9 destinatarios</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(para);
                    setCopiedPara(true);
                    setTimeout(() => setCopiedPara(false), 2000);
                  }}
                  className="text-[11px] text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedPara ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPara ? '¡Copiado!' : 'Copiar lista'}</span>
                </button>
              </div>
              <input
                type="text"
                value={para}
                onChange={e => setPara(e.target.value)}
                className="w-full bg-white px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* CC */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-black text-slate-800 flex items-center gap-1.5">
                  <span>CC (En Copia):</span>
                  <span className="text-[10px] text-slate-400 font-semibold">9 destinatarios</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(cc);
                    setCopiedCc(true);
                    setTimeout(() => setCopiedCc(false), 2000);
                  }}
                  className="text-[11px] text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedCc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCc ? '¡Copiado!' : 'Copiar lista'}</span>
                </button>
              </div>
              <input
                type="text"
                value={cc}
                onChange={e => setCc(e.target.value)}
                className="w-full bg-white px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Asunto */}
            <div>
              <label className="font-black text-slate-800 block mb-1">
                Asunto del Correo:
              </label>
              <input
                type="text"
                value={asunto}
                onChange={e => setAsunto(e.target.value)}
                className="w-full bg-white px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Previsualización del Correo (Formato Exacto Outlook / Calibri) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                Previsualización del Correo (Formato Outlook)
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Fuente: Calibri 11pt</span>
            </div>

            <div className="p-5 bg-white space-y-3 font-sans text-sm text-slate-800 select-text">
              <p>Buen día,</p>
              <p>Adjunto reporte de ocupación CD.</p>
              <p className="text-xs text-slate-600">
                Ruta en donde se puede apreciar el detalle:{' '}
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-blue-700 break-all select-all font-bold text-[11px]">
                  {RUTA_FILESERVER}
                </span>
              </p>
              <p className="text-xs text-slate-600">
                Plataforma Online CD:{' '}
                <a 
                  href={URL_APP} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-700 underline font-bold"
                >
                  {URL_APP}
                </a>
              </p>

              {/* Imagen del Gráfico Incrustada */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center justify-between">
                  <span>Gráfico Oficial de Evolución Histórica:</span>
                  {isExporting && <span className="text-blue-600 font-bold">Renderizando imagen nítida...</span>}
                </div>

                <div className="rounded-xl border border-slate-200 p-2 bg-white overflow-hidden shadow-xs">
                  {previewImageUrl ? (
                    <img 
                      src={previewImageUrl} 
                      alt="Reporte de Ocupación CD" 
                      className="w-full h-auto rounded-lg object-contain"
                    />
                  ) : (
                    <div className="h-44 flex items-center justify-center text-slate-400 font-medium">
                      Generando imagen de alta resolución...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Acciones Inferior */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyImage}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                copiedImage
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
              }`}
              title="Copiar solo la imagen PNG para pegar directo con Ctrl+V"
            >
              {copiedImage ? <Check className="w-4 h-4" /> : <ImageIcon className="w-4 h-4 text-slate-500" />}
              <span>{copiedImage ? '¡Gráfico Copiado!' : 'Copiar Gráfico (PNG)'}</span>
            </button>

            <button
              onClick={handleDownloadJpg}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Descargar archivo ReporteOcupacionCD.jpg idéntico al que generaba la macro de Excel"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Descargar ReporteOcupacionCD.jpg</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              onClick={handleOpenOutlook}
              className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
              title="Abrir Outlook con destinatarios, asunto y copiar gráfico al portapapeles"
            >
              <Send className="w-4 h-4" />
              <span>Abrir y Enviar en Outlook</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
