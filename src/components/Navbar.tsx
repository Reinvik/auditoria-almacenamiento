import React from 'react';
import { 
  Layers, 
  Search, 
  Upload, 
  ClipboardCheck, 
  FileText, 
  RotateCcw,
  Boxes,
  Eye,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface NavbarProps {
  totalSlots: number;
  occupiedSlots: number;
  emptySlots: number;
  occupancyRate: number;
  totalPallets: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  auditMode: boolean;
  onToggleAuditMode: () => void;
  auditCount: number;
  onOpenImport: () => void;
  onOpenReport: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalSlots,
  occupiedSlots,
  emptySlots,
  occupancyRate,
  totalPallets,
  searchQuery,
  onSearchChange,
  auditMode,
  onToggleAuditMode,
  auditCount,
  onOpenImport,
  onOpenReport,
  onResetData,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
                  AUDITORÍA <span className="text-cyan-400">ALMACENAMIENTO</span>
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-cyan-500/30">
                  CIAL • CD SAN JORGE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Auditoría de Altura y Pasillos Visuales
              </p>
            </div>
          </div>

          {/* Quick mobile buttons */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={onToggleAuditMode}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                auditMode 
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              {auditCount > 0 && <span>({auditCount})</span>}
            </button>
            <button
              onClick={onOpenImport}
              className="p-2 rounded-lg bg-cyan-600 text-white text-xs font-semibold"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Warehouse Stats Summary */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Capacidad:</span>
            <span className="font-bold text-white">{totalSlots.toLocaleString()}</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Ocupadas:</span>
            <span className="font-bold text-emerald-400">{occupiedSlots.toLocaleString()}</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-slate-400">Vacías:</span>
            <span className="font-bold text-slate-300">{emptySlots.toLocaleString()}</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Ocupación:</span>
            <span className="font-bold text-cyan-400">{occupancyRate}%</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Pallets:</span>
            <span className="font-bold text-indigo-300">{totalPallets.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions & Search */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar Material / Lote / Ubic..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Desktop action buttons */}
          <div className="hidden md:flex items-center gap-2">
            {/* Toggle Audit Mode */}
            <button
              onClick={onToggleAuditMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                auditMode
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Modo Auditoría</span>
              {auditCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-bold">
                  {auditCount}
                </span>
              )}
            </button>

            {/* Open Report */}
            <button
              onClick={onOpenReport}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Informe</span>
            </button>

            {/* Import SAP / Excel */}
            <button
              onClick={onOpenImport}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Cargar Data SAP</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
