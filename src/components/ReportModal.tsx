import React, { useState } from 'react';
import { AuditFinding } from '../types/warehouse';
import { generateEmailReport, exportFindingsToExcel } from '../utils/reportGenerator';
import { 
  X, 
  Mail, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Trash2, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditFindings: Map<string, AuditFinding>;
  onClearAllAudit: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  auditFindings,
  onClearAllAudit,
}) => {
  if (!isOpen) return null;

  const findingsList = Array.from(auditFindings.values());
  const report = generateEmailReport(findingsList);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Copy HTML for Outlook
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
    } catch (err) {
      // Fallback
      await navigator.clipboard.writeText(report.bodyText);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    }
  };

  // Copy plain text
  const handleCopyText = async () => {
    await navigator.clipboard.writeText(report.bodyText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleExportExcel = () => {
    exportFindingsToExcel(findingsList, `Auditoria_Altura_${report.dateStr}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Informe de Validación de Altura CIAL
                </h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  report.differencesCount > 0 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {report.differencesCount > 0 
                    ? `${report.differencesCount} diferencia(s)` 
                    : 'Sin diferencias (OK)'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Formato oficial de correo para Control de Existencias y Jefatura
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Metadata Recipients */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="grid grid-cols-[60px_1fr] items-center gap-2">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Para:</span>
              <span className="font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded text-[11px] truncate">
                {report.to}
              </span>
            </div>
            <div className="grid grid-cols-[60px_1fr] items-center gap-2">
              <span className="font-bold text-slate-400 uppercase text-[10px]">CC:</span>
              <span className="font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded text-[11px] truncate">
                {report.cc}
              </span>
            </div>
            <div className="grid grid-cols-[60px_1fr] items-center gap-2">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Asunto:</span>
              <span className="font-bold text-cyan-300 bg-slate-900 px-2 py-1 rounded text-[11px]">
                {report.subject}
              </span>
            </div>
          </div>

          {/* Email Preview Container */}
          <div className="bg-white text-slate-900 p-5 rounded-xl shadow-inner overflow-x-auto select-text font-sans">
            <div dangerouslySetInnerHTML={{ __html: report.bodyHtml }} />
          </div>

          {/* Audit Count stats */}
          <div className="flex items-center justify-between text-slate-400 text-xs px-1">
            <span>
              Total de ubicaciones auditadas: <strong className="text-white">{findingsList.length}</strong>
            </span>
            {findingsList.length > 0 && (
              <button
                onClick={onClearAllAudit}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar registros de auditoría
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={findingsList.length === 0}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Descargar Excel</span>
            </button>
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Texto Copiado' : 'Copiar Texto'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cerrar
            </button>
            <button
              onClick={handleCopyHtml}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedHtml ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copiedHtml ? '¡Copiado para Outlook!' : 'Copiar Formato Correo (Outlook)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
