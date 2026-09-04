import React, { useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Columns, 
  Grid3X3, 
  SplitSquareVertical, 
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { RackConfig, AislePair } from '../types/warehouse';

export type ViewMode = 'audit_excel' | 'elevation_wall' | 'double_aisle';
export type FilterType = 'ALL' | 'ONLY_EMPTY' | 'ONLY_OCCUPIED' | 'MULTI_PALLETS' | 'WITH_DISCREPANCIES';

interface RackTabsProps {
  racks: RackConfig[];
  selectedRackId: number;
  onSelectRack: (id: number) => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  filterType: FilterType;
  onChangeFilter: (filter: FilterType) => void;
  aisles: AislePair[];
  selectedAisleId: number;
  onSelectAisle: (id: number) => void;
  rackStats: {
    totalSlots: number;
    occupiedSlots: number;
    emptySlots: number;
    totalPallets: number;
    occupancyRate: number;
  };
}

export const RackTabs: React.FC<RackTabsProps> = ({
  racks,
  selectedRackId,
  onSelectRack,
  viewMode,
  onChangeViewMode,
  filterType,
  onChangeFilter,
  aisles,
  selectedAisleId,
  onSelectAisle,
  rackStats,
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active tab into view
  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeTabEl = tabsContainerRef.current.querySelector('[data-active="true"]');
      if (activeTabEl) {
        activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedRackId]);

  const currentIndex = racks.findIndex(r => r.id === selectedRackId);
  const prevRack = currentIndex > 0 ? racks[currentIndex - 1] : null;
  const nextRack = currentIndex < racks.length - 1 ? racks[currentIndex + 1] : null;

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 space-y-2.5">
      {/* Top Row: Rack Switcher & View Mode Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Rack Navigation / Dropdown */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => prevRack && onSelectRack(prevRack.id)}
            disabled={!prevRack}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
            title="Rack anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={selectedRackId}
            onChange={e => onSelectRack(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {racks.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.moduleCount} mód / {r.moduleCount * 6} pos)
              </option>
            ))}
          </select>

          <button
            onClick={() => nextRack && onSelectRack(nextRack.id)}
            disabled={!nextRack}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
            title="Rack siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Current Rack Pill */}
          <div className="hidden sm:flex items-center gap-2 ml-2 px-3 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs">
            <span className="font-extrabold text-cyan-300">RACK {selectedRackId}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">
              <strong className="text-white">{rackStats.occupiedSlots}</strong> ocup / <strong className="text-slate-400">{rackStats.emptySlots}</strong> vac ({rackStats.occupancyRate}%)
            </span>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onChangeViewMode('audit_excel')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'audit_excel'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vista idéntica a la hoja de auditoría de Excel (Módulo x Niveles)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Formato Auditoría (Excel)</span>
            <span className="sm:hidden">Excel</span>
          </button>

          <button
            onClick={() => onChangeViewMode('elevation_wall')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'elevation_wall'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vista de elevación frontal de muro de rack (Módulos horizontales)"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Elevación Muro 2D</span>
            <span className="sm:hidden">Muro</span>
          </button>

          <button
            onClick={() => onChangeViewMode('double_aisle')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'double_aisle'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vista de pasillo con caras izquierda y derecha enfrentadas"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pasillo Doble</span>
            <span className="sm:hidden">Pasillo</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <button
            onClick={() => onChangeFilter('ALL')}
            className={`px-2 py-0.8 rounded text-[11px] font-semibold transition-all ${
              filterType === 'ALL'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => onChangeFilter('ONLY_EMPTY')}
            className={`px-2 py-0.8 rounded text-[11px] font-semibold transition-all ${
              filterType === 'ONLY_EMPTY'
                ? 'bg-slate-200 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            Solo Vacíos
          </button>
          <button
            onClick={() => onChangeFilter('ONLY_OCCUPIED')}
            className={`px-2 py-0.8 rounded text-[11px] font-semibold transition-all ${
              filterType === 'ONLY_OCCUPIED'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            Solo Ocupados
          </button>
          <button
            onClick={() => onChangeFilter('MULTI_PALLETS')}
            className={`px-2 py-0.8 rounded text-[11px] font-semibold transition-all ${
              filterType === 'MULTI_PALLETS'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            x2 Pallets
          </button>
        </div>
      </div>

      {/* Bottom Row: Excel Sheet Style Tabs (RACK 1 to RACK 29) */}
      <div 
        ref={tabsContainerRef}
        className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none text-xs border-t border-slate-800/60 pt-2"
      >
        {racks.map(rack => {
          const isActive = rack.id === selectedRackId;
          return (
            <button
              key={rack.id}
              data-active={isActive}
              onClick={() => onSelectRack(rack.id)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 scale-105'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {rack.sheet}
            </button>
          );
        })}
      </div>
    </div>
  );
};
