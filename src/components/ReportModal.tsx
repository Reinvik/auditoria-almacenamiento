import React, { useState } from 'react';
import { AuditFinding } from '../types/warehouse';
import { 
  generateEmailReport, 
  exportFindingsToExcel,
  DEFAULT_EMAIL_TO,
  DEFAULT_EMAIL_CC
} from '../utils/reportGenerator';
import { 
  X, 
  Mail, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Trash2,
  Save,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditFindings: Map<string, AuditFinding>;
  onClearAllAudit: () => void;
}

const STORAGE_KEY_TO = 'cial_report_email_to_v1';
const STORAGE_KEY_CC = 'cial_report_email_cc_v1';

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  auditFindings,
  onClearAllAudit,
}) => {
  if (!isOpen) return null;

  const findingsList = Array.from(auditFindings.values());

  const [emailTo, setEmailTo] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_TO) || DEFAULT_EMAIL_TO;
  });
  const [emailCc, setEmailCc] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_CC) || DEFAULT_EMAIL_CC;
  });
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const report = generateEmailReport(findingsList, emailTo, emailCc);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmailTo(val);
    localStorage.setItem(STORAGE_KEY_TO, val);
  };

  const handleCcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmailCc(val);
    localStorage.setItem(STORAGE_KEY_CC, val);
  };

  const handleManualSave = () => {
    localStorage.setItem(STORAGE_KEY_TO, emailTo);
    localStorage.setItem(STORAGE_KEY_CC, emailCc);
    setSavedFeedback('¡Correos guardados para futuras ocasiones!');
    setTimeout(() => setSavedFeedback(null), 3500);
  };

  const handleResetDefaults = () => {
    setEmailTo(DEFAULT_EMAIL_TO);
    setEmailCc(DEFAULT_EMAIL_CC);
    localStorage.setItem(STORAGE_KEY_TO, DEFAULT_EMAIL_TO);
    localStorage.setItem(STORAGE_KEY_CC, DEFAULT_EMAIL_CC);
    setSavedFeedback('Restablecido a destinatarios CIAL por defecto');
    setTimeout(() => setSavedFeedback(null), 3500);
  };

  const handleOpenOutlook = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?cc=${encodeURIComponent(emailCc)}&subject=${encodeURIComponent(report.subject)}&body=${encodeURIComponent(report.bodyText)}`;
    window.location.href = mailtoUrl;
  };

  const handleCopyHtml = async () => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([report.bodyText], { type: 'text/plain' });
        const htmlBlob = new Blob([report.bodyHtml], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': textBlob,
            'text/html': htmlBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(report.bodyText);
      }
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    } catch {
      await navigator.clipboard.writeText(report.bodyText);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    }
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(report.bodyText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleExportExcel = () => {
    exportFindingsToExcel(findingsList, `Auditoria_Altura_${report.dateStr}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-300 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header con Verde CIAL */}
        <div className="bg-[#0a5c36] text-white px-5 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#08482a] border border-white/20 flex items-center justify-center text-emerald-200">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Informe de Validación de Altura CIAL
                </h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                  report.differencesCount > 0 
                    ? 'bg-rose-500 text-white shadow-xs' 
                    : 'bg-emerald-400 text-slate-950 shadow-xs'
                }`}>
                  {report.differencesCount > 0 
                    ? `${report.differencesCount} diferencia(s)` 
                    : 'Sin diferencias (OK)'}
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Formato oficial de correo para Control de Existencias y Jefatura
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Metadata Recipients Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            {/* Para: */}
            <div className="flex flex-col sm:grid sm:grid-cols-[55px_1fr] sm:items-center gap-1.5">
              <label htmlFor="report-email-to" className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                Para:
              </label>
              <input
                id="report-email-to"
                type="text"
                value={emailTo}
                onChange={handleToChange}
                placeholder="destinatarios separados por punto y coma (;)"
                className="w-full bg-white border border-slate-300 focus:border-[#0a5c36] focus:ring-2 focus:ring-[#0a5c36]/20 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-800 outline-hidden transition-all shadow-xs"
                title="Destinatarios principales (separados por ;)"
              />
            </div>

            {/* CC: */}
            <div className="flex flex-col sm:grid sm:grid-cols-[55px_1fr] sm:items-center gap-1.5">
              <label htmlFor="report-email-cc" className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                CC:
              </label>
              <input
                id="report-email-cc"
                type="text"
                value={emailCc}
                onChange={handleCcChange}
                placeholder="destinatarios en copia separados por punto y coma (;)"
                className="w-full bg-white border border-slate-300 focus:border-[#0a5c36] focus:ring-2 focus:ring-[#0a5c36]/20 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-800 outline-hidden transition-all shadow-xs"
                title="Destinatarios en copia (separados por ;)"
              />
            </div>

            {/* Asunto: */}
            <div className="flex flex-col sm:grid sm:grid-cols-[55px_1fr] sm:items-center gap-1.5">
              <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Asunto:</span>
              <div className="font-bold text-[#0a5c36] bg-[#e6f4ea] border border-[#a3cfb6] px-3 py-1.5 rounded-lg text-[11px] flex items-center justify-between">
                <span>{report.subject}</span>
                <span className="text-[10px] font-normal text-emerald-800 opacity-75 hidden sm:inline">(Fecha automática)</span>
              </div>
            </div>

            {/* Recipients Actions Bar */}
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200 gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSave}
                  className="px-2.5 py-1 rounded-lg bg-[#0a5c36] hover:bg-[#08482a] text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar correos</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Volver a los correos predeterminados CIAL"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer predeterminados</span>
                </button>
              </div>

              {savedFeedback ? (
                <span className="text-emerald-700 font-bold bg-emerald-100/80 border border-emerald-300 px-2.5 py-0.5 rounded-md text-[11px] flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3 h-3 text-emerald-700" />
                  {savedFeedback}
                </span>
              ) : (
                <span className="text-slate-400 text-[10px] italic">
                  💾 Guardado automáticamente en este navegador para futuras ocasiones.
                </span>
              )}
            </div>
          </div>

          {/* Email Preview Container */}
          <div className="bg-white border border-slate-300 p-5 rounded-xl shadow-inner overflow-x-auto select-text font-sans">
            <div dangerouslySetInnerHTML={{ __html: report.bodyHtml }} />
          </div>

          {/* Audit Count stats */}
          <div className="flex items-center justify-between text-slate-600 text-xs px-1">
            <span>
              Total de ubicaciones verificadas: <strong className="text-slate-900">{findingsList.length}</strong>
            </span>
            {findingsList.length > 0 && (
              <button
                onClick={onClearAllAudit}
                className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar registros de auditoría
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={findingsList.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-[#e6f4ea] border border-[#a3cfb6] text-[#08482a] hover:bg-[#d4edd8] font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#0a5c36]" />
              <span>Descargar Excel</span>
            </button>
            <button
              onClick={handleCopyText}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Texto Copiado' : 'Copiar Texto'}</span>
            </button>
            <button
              onClick={handleOpenOutlook}
              className="px-3.5 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Abrir directamente en Outlook con los destinatarios y asunto listos"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
              <span>Abrir en Outlook</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handleCopyHtml}
              className="px-5 py-2 rounded-xl text-xs font-black bg-[#0a5c36] hover:bg-[#08482a] text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedHtml ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copiedHtml ? '¡Copiado para Outlook!' : 'Copiar Formato Correo (Outlook)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
