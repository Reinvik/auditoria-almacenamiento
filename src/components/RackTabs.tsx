import React, { useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Columns, 
  Grid3X3, 
  SplitSquareVertical, 
  Filter
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
  rackStats,
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);

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
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 space-y-2.5 shadow-sm">
      {/* Top Row: Rack Switcher & View Mode Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Rack Navigation / Dropdown */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => prevRack && onSelectRack(prevRack.id)}
            disabled={!prevRack}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#e6f4ea] hover:text-[#0a5c36] disabled:opacity-30 disabled:pointer-events-none transition-all border border-slate-200 cursor-pointer"
            title="Rack anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={selectedRackId}
            onChange={e => onSelectRack(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-black rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#0a5c36] shadow-sm cursor-pointer"
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
            className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#e6f4ea] hover:text-[#0a5c36] disabled:opacity-30 disabled:pointer-events-none transition-all border border-slate-200 cursor-pointer"
            title="Rack siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Current Rack Pill */}
          <div className="hidden sm:flex items-center gap-2 ml-2 px-3 py-1 rounded-xl bg-[#e6f4ea] border border-[#a3cfb6] text-xs shadow-xs">
            <span className="font-black text-[#08482a]">RACK {selectedRackId}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-700">
              <strong className="text-[#0a5c36] font-extrabold">{rackStats.occupiedSlots}</strong> ocupadas / <strong className="text-slate-900 font-extrabold">{rackStats.emptySlots}</strong> vacías ({rackStats.occupancyRate}%)
            </span>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => onChangeViewMode('audit_excel')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'audit_excel'
                ? 'bg-[#0a5c36] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Vista idéntica a la hoja de auditoría de Excel (Módulo x Niveles)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Formato Auditoría (Excel)</span>
            <span className="sm:hidden">Excel</span>
          </button>

          <button
            onClick={() => onChangeViewMode('elevation_wall')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'elevation_wall'
                ? 'bg-[#0a5c36] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Vista de elevación frontal de muro de rack (Módulos horizontales)"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Elevación Muro 2D</span>
            <span className="sm:hidden">Muro</span>
          </button>

          <button
            onClick={() => onChangeViewMode('double_aisle')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'double_aisle'
                ? 'bg-[#0a5c36] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
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
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => onChangeFilter('ONLY_EMPTY')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
              filterType === 'ONLY_EMPTY'
                ? 'bg-black text-white ring-2 ring-slate-400'
                : 'text-slate-900 hover:bg-slate-200 bg-white border border-slate-300'
            }`}
          >
            Solo Vacíos
          </button>
          <button
            onClick={() => onChangeFilter('ONLY_OCCUPIED')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filterType === 'ONLY_OCCUPIED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-100 bg-emerald-50 border border-emerald-200'
            }`}
          >
            Solo Ocupados
          </button>
          <button
            onClick={() => onChangeFilter('MULTI_PALLETS')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filterType === 'MULTI_PALLETS'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-purple-800 hover:bg-purple-100 bg-purple-50 border border-purple-200'
            }`}
          >
            x2 Pallets
          </button>
        </div>
      </div>

      {/* Bottom Row: CIAL Style Rack Tabs (RACK 1 to RACK 29) */}
      <div 
        ref={tabsContainerRef}
        className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs border-t border-slate-100 pt-2"
      >
        {racks.map(rack => {
          const isActive = rack.id === selectedRackId;
          return (
            <button
              key={rack.id}
              data-active={isActive}
              onClick={() => onSelectRack(rack.id)}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#0a5c36] text-white shadow-md shadow-emerald-950/20 scale-105 border border-[#08482a]'
                  : 'bg-slate-100 text-slate-600 hover:bg-[#e6f4ea] hover:text-[#0a5c36] border border-slate-200/80'
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
