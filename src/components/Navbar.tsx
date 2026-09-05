import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Upload, 
  ClipboardCheck, 
  FileText, 
  Boxes,
  X,
  Scale,
  TrendingUp,
  MapPin,
  ExternalLink
} from 'lucide-react';
import cialLogo from '../assets/cial-alimentos-logo.png';
import { WarehouseSearchResult } from '../utils/warehouseSearch';

interface NavbarProps {
  totalSlots: number;
  occupiedSlots: number;
  emptySlots: number;
  occupancyRate: number;
  totalPallets: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResult?: WarehouseSearchResult;
  onSelectRack?: (id: number) => void;
  onSelectSlotByUbicacion?: (ubicacion: string, rackId: number) => void;
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
  searchResult,
  onSelectRack,
  onSelectSlotByUbicacion,
  auditMode,
  onToggleAuditMode,
  auditCount,
  onOpenImport,
  onOpenReport,
  onOpenWorkload,
  onOpenOccupancy,
  activeAuditorName,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#0a5c36] text-white shadow-lg shadow-emerald-950/20 select-none shrink-0 sticky top-0 z-40 border-b border-[#08482a] w-full max-w-full">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-6 py-2 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5">
        {/* CIAL Brand Header (Identical to Pallets Outbound & Dock Inbound) */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start shrink-0">
          <div className="flex items-center gap-2.5">
            <img 
              src={cialLogo} 
              alt="CiAL Alimentos" 
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain bg-white rounded-xl p-1 shadow-md shrink-0 ring-1 ring-white/30" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wider leading-none text-white drop-shadow-sm">
                  AUDITORÍA ALMACENAMIENTO
                </h1>
                <span className="hidden md:inline-block px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-800 text-emerald-200 border border-emerald-400/30">
                  SAN JORGE
                </span>
              </div>
              <span className="text-[10px] sm:text-[10.5px] text-emerald-200 font-bold tracking-widest uppercase mt-0.5 block">
                Control de Altura y Pasillos — CD San Jorge
              </span>
            </div>
          </div>

          {/* Quick mobile buttons */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={() => setShowMobileSearch(prev => !prev)}
              className={`p-1.5 rounded-lg border transition-all ${
                showMobileSearch || searchQuery
                  ? 'bg-amber-400 border-amber-300 text-slate-950 font-bold'
                  : 'bg-[#08482a] border-emerald-700 text-emerald-100 hover:text-white'
              }`}
              title="Buscar Material o Lote"
            >
              <Search className="w-4 h-4" />
            </button>
            {onOpenOccupancy && (
              <button
                onClick={onOpenOccupancy}
                className="p-1.5 rounded-lg bg-[#08482a] border border-emerald-700 text-emerald-100 hover:text-white"
                title="Ocupación Frío"
              >
                <TrendingUp className="w-4 h-4 text-emerald-300" />
              </button>
            )}
            <button
              onClick={onOpenWorkload}
              className="p-1.5 rounded-lg bg-[#08482a] border border-emerald-700 text-emerald-100 hover:text-white"
              title="Repartir Trabajo"
            >
              <Scale className="w-4 h-4 text-emerald-300" />
            </button>
            <button
              onClick={onToggleAuditMode}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
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
              className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black shadow-md"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Search Row (Expandible) */}
        {(showMobileSearch || searchQuery) && (
          <div className="w-full sm:hidden pt-1 pb-1">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300" />
              <input
                type="text"
                placeholder="Buscar Material, Lote..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full bg-[#08482a] border border-emerald-600/60 rounded-xl pl-8 pr-16 py-1.5 text-xs text-white placeholder-emerald-300/60 focus:outline-none focus:border-emerald-300 focus:bg-[#073d23] transition-all shadow-inner font-medium"
              />
              {searchQuery && searchResult && (
                <span className="absolute right-7 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-400">
                  {searchResult.totalLocations} pos
                </span>
              )}
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Global Warehouse Stats Summary */}
        <div 
          onClick={onOpenOccupancy}
          className="hidden xl:flex items-center gap-2 bg-[#08482a]/90 hover:bg-[#073d23] cursor-pointer px-3 py-1.5 rounded-xl border border-white/10 text-xs shadow-inner shrink-0 transition-colors"
          title="Ver Reporte y Gráfico de Ocupación Frío"
        >
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
            <span className="text-emerald-200 font-medium">Ocupación:</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-black text-[11px]">
              {occupancyRate}%
            </span>
          </div>
        </div>

        {/* Actions & Search */}
        <div className="hidden sm:flex items-center gap-2 flex-1 justify-end">
          {/* Search Box */}
          <div ref={searchContainerRef} className="relative w-44 lg:w-56 xl:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300" />
            <input
              type="text"
              placeholder="Buscar Material, Lote..."
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={e => {
                onSearchChange(e.target.value);
                setIsDropdownOpen(true);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchResult && searchResult.matchedRackIds.length > 0) {
                  onSelectRack?.(searchResult.matchedRackIds[0]);
                  setIsDropdownOpen(false);
                }
              }}
              className="w-full bg-[#08482a] border border-emerald-600/60 rounded-xl pl-8 pr-16 py-1.5 text-xs text-white placeholder-emerald-300/60 focus:outline-none focus:border-emerald-300 focus:bg-[#073d23] transition-all shadow-inner font-medium"
            />
            {/* Match Counter Badge inside input */}
            {searchQuery && searchResult && (
              <span className="absolute right-7 top-1/2 -translate-y-1/2 pointer-events-none">
                {searchResult.totalLocations > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 font-black text-[9.5px] shadow-xs animate-pulse">
                    {searchResult.totalLocations} pos
                  </span>
                ) : (
                  <span className="text-rose-300 font-bold text-[9.5px]">0 pos</span>
                )}
              </span>
            )}
            {searchQuery && (
              <button 
                onClick={() => {
                  onSearchChange('');
                  setIsDropdownOpen(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-white cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dropdown flotante con resultados de búsqueda */}
            {isDropdownOpen && searchResult && searchQuery.trim() !== '' && (
              <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150 select-text">
                {/* Header */}
                <div className="bg-[#0a5c36] text-white px-4 py-2.5 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="font-black text-xs block">
                      {searchResult.totalLocations} ubicación(es) con "{searchQuery}"
                    </span>
                    <span className="text-[10.5px] text-emerald-100 font-medium">
                      Encontrado en {searchResult.matchedRackIds.length} rack(s)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-emerald-200 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Jump Buttons by Rack */}
                {searchResult.matchedRackIds.length > 0 && (
                  <div className="bg-amber-50 px-3 py-2 border-b border-amber-200 flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-amber-950 text-[11px]">Ir a Rack:</span>
                    {Array.from(searchResult.rackCounts.entries()).map(([rId, count]) => (
                      <button
                        key={rId}
                        type="button"
                        onClick={() => {
                          onSelectRack?.(rId);
                          setIsDropdownOpen(false);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white border border-amber-300 text-amber-950 hover:bg-amber-500 hover:text-white font-black text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span>Rack {rId}</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-200 text-slate-900 text-[9px] font-black">
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Items List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {searchResult.items.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs">
                      No se encontraron materiales ni lotes que coincidan con "{searchQuery}".
                    </div>
                  ) : (
                    searchResult.items.slice(0, 40).map(item => (
                      <div
                        key={item.ubicacion}
                        onClick={() => {
                          onSelectRack?.(item.rackId);
                          onSelectSlotByUbicacion?.(item.ubicacion, item.rackId);
                          setIsDropdownOpen(false);
                        }}
                        className="p-2.5 hover:bg-emerald-50/80 cursor-pointer transition-colors flex items-start gap-2.5"
                      >
                        <div className="w-14 shrink-0 text-center">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-[#0a5c36] text-white font-black text-[10px]">
                            RACK {item.rackId}
                          </span>
                          <span className="block font-mono text-[9.5px] text-slate-500 mt-0.5 font-bold">
                            Nivel {item.nivel}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-slate-900 text-xs bg-amber-100 text-amber-950 px-1.5 py-0.2 rounded border border-amber-300">
                              {item.displayText}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              Pos: {item.ubicacion}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 font-semibold truncate mt-0.5">
                            {item.descripcion}
                          </p>
                          {item.lote && (
                            <span className="text-[9.5px] text-slate-400 font-mono block">
                              Lote: {item.lote}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer hint */}
                {searchResult.matchedRackIds.length > 0 && (
                  <div className="bg-slate-50 px-3 py-1.5 text-center text-[10px] text-slate-500 border-t border-slate-100 flex items-center justify-between">
                    <span>Haz clic para ir a la posición</span>
                    <span>
                      <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold">Enter</kbd> = Rack {searchResult.matchedRackIds[0]}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Reporte de Ocupación Frío */}
            {onOpenOccupancy && (
              <button
                onClick={onOpenOccupancy}
                className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 bg-[#0e4c68] hover:bg-[#08364b] text-white border border-sky-400/50 shadow-sm transition-all cursor-pointer ring-1 ring-sky-300/30"
                title="Ver Reporte y Gráfico de Ocupación por Tipo de Frío (Congelados vs Refrigerados)"
              >
                <TrendingUp className="w-3.5 h-3.5 text-sky-300" />
                <span>Reporte Ocupación</span>
              </button>
            )}

            {/* Toggle Audit Mode */}
            <button
              onClick={onToggleAuditMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                auditMode
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 ring-2 ring-amber-200'
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
