import React, { useRef, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Columns, 
  Grid3X3, 
  SplitSquareVertical, 
  Filter,
  Users,
  Scale,
  Building2,
  Snowflake,
  Check,
  X,
  TrendingUp
} from 'lucide-react';
import { 
  RackConfig, 
  AislePair, 
  WarehouseZone, 
  WorkloadDistributionConfig 
} from '../types/warehouse';

export type ViewMode = 'audit_excel' | 'elevation_wall' | 'double_aisle' | 'occupancy_report';
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
  activeZone: WarehouseZone;
  onChangeZone: (zone: WarehouseZone) => void;
  workloadConfig: WorkloadDistributionConfig | null;
  activeAuditorId: number | null;
  onSelectAuditor: (id: number | null) => void;
  onOpenWorkloadModal: () => void;
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
  activeZone,
  onChangeZone,
  workloadConfig,
  activeAuditorId,
  onSelectAuditor,
  onOpenWorkloadModal,
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Determinar auditor activo y sus asignaciones
  const activeAssignment = useMemo(() => {
    if (!workloadConfig || activeAuditorId === null) return null;
    return workloadConfig.assignments.find(a => a.id === activeAuditorId) || null;
  }, [workloadConfig, activeAuditorId]);

  // Racks visibles según auditor activo o zona seleccionada
  const visibleRacks = useMemo(() => {
    if (activeAssignment) {
      return racks.filter(r => activeAssignment.rackIds.includes(r.id));
    }
    if (activeZone === 'CONGELADO') {
      return racks.filter(r => r.id <= 8);
    }
    if (activeZone === 'REFRIGERADO') {
      return racks.filter(r => r.id >= 9);
    }
    return racks;
  }, [racks, activeAssignment, activeZone]);

  // Pasillos visibles según auditor activo o zona seleccionada
  const visibleAisles = useMemo(() => {
    if (activeAssignment) {
      return aisles.filter(a => activeAssignment.aisleIds.includes(a.id));
    }
    if (activeZone === 'CONGELADO') {
      return aisles.filter(a => a.id <= 4);
    }
    if (activeZone === 'REFRIGERADO') {
      return aisles.filter(a => a.id >= 5);
    }
    return aisles;
  }, [aisles, activeAssignment, activeZone]);


  // Auto-seleccionar primer rack visible si el actual no pertenece a la selección
  useEffect(() => {
    if (visibleRacks.length > 0 && !visibleRacks.some(r => r.id === selectedRackId)) {
      onSelectRack(visibleRacks[0].id);
    }
  }, [visibleRacks, selectedRackId, onSelectRack]);

  // Auto-seleccionar primer pasillo visible si el actual no pertenece a la selección
  useEffect(() => {
    if (visibleAisles.length > 0 && !visibleAisles.some(a => a.id === selectedAisleId)) {
      onSelectAisle(visibleAisles[0].id);
    }
  }, [visibleAisles, selectedAisleId, onSelectAisle]);

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      const activeTabEl = container.querySelector('[data-active="true"]') as HTMLElement | null;
      if (activeTabEl) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeTabEl.getBoundingClientRect();
        const offsetLeft = tabRect.left - containerRect.left + container.scrollLeft;
        const targetScrollLeft = offsetLeft - (container.clientWidth / 2) + (tabRect.width / 2);
        container.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: 'smooth' });
      }
    }
  }, [selectedRackId]);

  const currentIndex = visibleRacks.findIndex(r => r.id === selectedRackId);
  const prevRack = currentIndex > 0 ? visibleRacks[currentIndex - 1] : null;
  const nextRack = currentIndex < visibleRacks.length - 1 ? visibleRacks[currentIndex + 1] : null;

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-sm w-full">
      <div className="max-w-[1920px] mx-auto space-y-2.5">
        {/* Row 1: Global Context (Cámara & Auditor) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100 text-xs">
          {/* Cámara / Sector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] font-black text-slate-400 uppercase mr-1 hidden sm:inline">Cámara:</span>
            <button
              onClick={() => {
                onChangeZone('ALL');
                if (activeAuditorId !== null) onSelectAuditor(null);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeZone === 'ALL' && activeAuditorId === null
                  ? 'bg-[#0a5c36] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Todo el CD</span>
            </button>

            <button
              onClick={() => {
                onChangeZone('CONGELADO');
                if (activeAuditorId !== null) onSelectAuditor(null);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeZone === 'CONGELADO' && activeAuditorId === null
                  ? 'bg-[#0a5c36] text-white shadow-xs ring-1 ring-emerald-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-[#e6f4ea] hover:text-[#0a5c36]'
              }`}
              title="Racks 1 al 8 • Pasillos 1 al 4 (1 persona)"
            >
              <Snowflake className="w-3.5 h-3.5 text-sky-500" />
              <span>❄️ Congelado (R1-8)</span>
            </button>

            <button
              onClick={() => {
                onChangeZone('REFRIGERADO');
                if (activeAuditorId !== null) onSelectAuditor(null);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeZone === 'REFRIGERADO' && activeAuditorId === null
                  ? 'bg-[#0a5c36] text-white shadow-xs ring-1 ring-emerald-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-[#e6f4ea] hover:text-[#0a5c36]'
              }`}
              title="Racks 9 al 29 • Pasillos 5 al 15 (Auditores variables)"
            >
              <span>🧊 Refrigerado (R9+)</span>
            </button>
          </div>

          {/* Filtro por Auditor & Botón Repartir */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <span className="text-[10.5px] font-black text-slate-400 uppercase px-1.5 hidden sm:inline">Auditor:</span>
              
              <button
                onClick={() => onSelectAuditor(null)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  activeAuditorId === null
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>

              {workloadConfig?.assignments.map(a => (
                <button
                  key={a.id}
                  onClick={() => onSelectAuditor(a.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeAuditorId === a.id
                      ? 'text-white shadow-xs ring-1 ring-black/20'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                  style={{
                    backgroundColor: activeAuditorId === a.id ? a.color : undefined
                  }}
                  title={`Auditor ${a.id}: Pasillos ${a.aisleIds.join(', ')} (${a.totalSlots} pos)`}
                >
                  <span 
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: activeAuditorId === a.id ? '#ffffff' : a.color }}
                  />
                  <span>#{a.id}</span>
                </button>
              ))}
            </div>

            <button
              onClick={onOpenWorkloadModal}
              className="px-3 py-1 rounded-xl text-xs font-black bg-[#e6f4ea] text-[#08482a] hover:bg-[#d0ebd8] border border-[#a3cfb6] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Configurar y repartir pasillos entre los auditores"
            >
              <Scale className="w-3.5 h-3.5 text-[#0a5c36]" />
              <span className="hidden sm:inline">Repartir Trabajo</span>
              <span className="sm:hidden">Reparto</span>
            </button>
          </div>
        </div>

        {/* Row 2: Rack Selector, Presentation Views & Cell Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
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
              {visibleRacks.map(r => (
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
            <div className="hidden sm:flex items-center gap-2 ml-1 px-3 py-1 rounded-xl bg-[#e6f4ea] border border-[#a3cfb6] text-xs shadow-xs">
              <span className="font-black text-[#08482a]">RACK {selectedRackId}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-700">
                <strong className="text-[#0a5c36] font-extrabold">{rackStats.occupiedSlots}</strong> ocupadas / <strong className="text-slate-900 font-extrabold">{rackStats.emptySlots}</strong> vacías ({rackStats.occupancyRate}%)
              </span>
            </div>
          </div>

          {/* Right Group: View Switcher + Cell Filters */}
          <div className="flex flex-wrap items-center gap-3">
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

              <button
                onClick={() => onChangeViewMode('occupancy_report')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'occupancy_report'
                    ? 'bg-[#0a5c36] text-white shadow-sm ring-1 ring-emerald-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Reporte gráfico de ocupación por tipo de frío (Congelados vs Refrigerados)"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">Ocupación Frío</span>
                <span className="sm:hidden">Ocupación</span>
              </button>
            </div>

            {/* Subtle Divider */}
            <div className="w-px h-5 bg-slate-200 hidden lg:block" />

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
        </div>

      {/* Banner de Auditor Asignado (si hay un auditor activo) */}
      {activeAssignment && (
        <div className="bg-[#e6f4ea] border border-[#a3cfb6] px-3 py-1.5 rounded-xl flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span 
              className="w-5 h-5 rounded-lg text-white font-black text-[10px] flex items-center justify-center shadow-xs"
              style={{ backgroundColor: activeAssignment.color }}
            >
              #{activeAssignment.id}
            </span>
            <span className="font-bold text-slate-800">
              Viendo asignación de <strong>{activeAssignment.name}</strong>:
            </span>
            <span className="text-[#08482a] font-black">
              🚪 Pasillos {activeAssignment.aisleIds.join(', ')} • 🏗️ Racks {activeAssignment.rackIds[0]} al {activeAssignment.rackIds[activeAssignment.rackIds.length - 1]}
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-600 font-semibold hidden sm:inline">
              {activeAssignment.effortPoints.toLocaleString()} pts ({activeAssignment.rackIds.length} racks • {activeAssignment.percentage}%)
            </span>
          </div>
          <button
            onClick={() => onSelectAuditor(null)}
            className="text-xs font-black text-[#0a5c36] hover:text-[#08482a] flex items-center gap-1 underline cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Ver Todo</span>
          </button>
        </div>
      )}

      {/* Bottom Row: CIAL Style Rack Tabs (Filtrados por auditor o zona) */}
      <div 
        ref={tabsContainerRef}
        className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs border-t border-slate-100 pt-2"
      >
        {visibleRacks.map(rack => {
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
    </div>
  );
};

