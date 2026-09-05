import React from 'react';
import { 
  Search, 
  Upload, 
  ClipboardCheck, 
  FileText, 
  Boxes,
  X,
  Scale,
  TrendingUp
} from 'lucide-react';
import cialLogo from '../assets/cial-alimentos-logo.png';

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
  onOpenWorkload: () => void;
  onOpenOccupancy?: () => void;
  activeAuditorName?: string | null;
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
  onOpenWorkload,
  onOpenOccupancy,
  activeAuditorName,
}) => {

  return (
    <header className="bg-[#0a5c36] text-white shadow-lg shadow-emerald-950/20 select-none shrink-0 sticky top-0 z-40 border-b border-[#08482a]">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* CIAL Brand Header (Identical to Pallets Outbound & Dock Inbound) */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <img 
              src={cialLogo} 
              alt="CiAL Alimentos" 
              className="w-12 h-12 object-contain bg-white rounded-xl p-1 shadow-md shrink-0 ring-1 ring-white/30" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wider leading-none text-white drop-shadow-sm">
                  AUDITORÍA ALMACENAMIENTO
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-800 text-emerald-200 border border-emerald-400/30">
                  SAN JORGE
                </span>
              </div>
              <span className="text-[10.5px] text-emerald-200 font-bold tracking-widest uppercase mt-0.5 block">
                Control de Altura y Pasillos — CD San Jorge
              </span>
            </div>
          </div>

          {/* Quick mobile buttons */}
          <div className="flex md:hidden items-center gap-1.5">
            {onOpenOccupancy && (
              <button
                onClick={onOpenOccupancy}
                className="p-2 rounded-lg bg-[#08482a] border border-emerald-700 text-emerald-100 hover:text-white"
                title="Ocupación Frío"
              >
                <TrendingUp className="w-4 h-4 text-emerald-300" />
              </button>
            )}
            <button
              onClick={onOpenWorkload}
              className="p-2 rounded-lg bg-[#08482a] border border-emerald-700 text-emerald-100 hover:text-white"
              title="Repartir Trabajo"
            >
              <Scale className="w-4 h-4 text-emerald-300" />
            </button>
            <button
              onClick={onToggleAuditMode}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                auditMode 
                  ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-md' 
                  : 'bg-[#08482a] border-emerald-700 text-emerald-100'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              {auditCount > 0 && <span>({auditCount})</span>}
            </button>
            <button
              onClick={onOpenImport}
              className="p-2 rounded-lg bg-emerald-500 text-slate-950 font-black shadow-md"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Warehouse Stats Summary */}
        <div className="hidden lg:flex items-center gap-3 bg-[#08482a]/90 px-3.5 py-1.5 rounded-xl border border-white/10 text-xs shadow-inner">
          <div className="flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-emerald-200 font-medium">Capacidad:</span>
            <span className="font-extrabold text-white">{totalSlots.toLocaleString()}</span>
          </div>
          <div className="w-px h-3 bg-emerald-700/60" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="text-emerald-200 font-medium">Ocupadas:</span>
            <span className="font-black text-emerald-300">{occupiedSlots.toLocaleString()}</span>
          </div>
          <div className="w-px h-3 bg-emerald-700/60" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-emerald-200 font-medium">Vacías:</span>
            <span className="font-black text-white">{emptySlots.toLocaleString()}</span>
          </div>
          <div className="w-px h-3 bg-emerald-700/60" />
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-200 font-medium">Ocupación:</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-black text-[11px]">
              {occupancyRate}%
            </span>
          </div>
          <div className="w-px h-3 bg-emerald-700/60" />
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-200 font-medium">Pallets:</span>
            <span className="font-extrabold text-white">{totalPallets.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300" />
            <input
              type="text"
              placeholder="Buscar Material / Lote / Ubic..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full bg-[#08482a] border border-emerald-600/60 rounded-xl pl-9 pr-7 py-1.5 text-xs text-white placeholder-emerald-300/60 focus:outline-none focus:border-emerald-300 focus:bg-[#073d23] transition-all shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop action buttons */}
          <div className="hidden md:flex items-center gap-2">
            {/* Ocupación Frío */}
            {onOpenOccupancy && (
              <button
                onClick={onOpenOccupancy}
                className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 bg-[#08482a] border border-emerald-600/60 text-emerald-100 hover:bg-[#063921] hover:text-white transition-all shadow-sm cursor-pointer"
                title="Ver Reporte y Gráfico de Ocupación por Tipo de Frío (Congelados vs Refrigerados)"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                <span>Ocupación Frío</span>
              </button>
            )}

            {/* Repartir Trabajo */}
            <button
              onClick={onOpenWorkload}
              className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 bg-[#08482a] border border-emerald-600/60 text-emerald-100 hover:bg-[#063921] hover:text-white transition-all shadow-sm cursor-pointer"
              title="Distribuir equitativamente el trabajo de auditoría entre auditores"
            >
              <Scale className="w-3.5 h-3.5 text-emerald-300" />
              <span>Repartir Trabajo</span>
            </button>

            {/* Toggle Audit Mode */}
            <button
              onClick={onToggleAuditMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                auditMode
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-105 ring-2 ring-amber-200'
                  : 'bg-[#08482a] border border-emerald-600/60 text-emerald-100 hover:bg-[#063921] hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Modo Auditoría</span>
              {auditCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-slate-950 text-amber-300 rounded-full text-[10px] font-black">
                  {auditCount}
                </span>
              )}
            </button>

            {/* Open Report */}
            <button
              onClick={onOpenReport}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-[#0a5c36] shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#0a5c36]" />
              <span>Informe</span>
            </button>

            {/* Import SAP / Excel */}
            <button
              onClick={onOpenImport}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
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
