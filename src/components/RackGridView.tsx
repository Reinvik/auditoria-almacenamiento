import React, { useState, useEffect } from 'react';
import { SlotData, AuditFinding, RackConfig } from '../types/warehouse';
import { ViewMode, FilterType } from './RackTabs';
import { 
  Check, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeftRight,
  Smartphone,
  MoveHorizontal
} from 'lucide-react';

interface RackGridViewProps {
  rack: RackConfig;
  slotsGrid: SlotData[][];
  viewMode: ViewMode;
  filterType: FilterType;
  searchQuery: string;
  auditFindings: Map<string, AuditFinding>;
  auditMode: boolean;
  onSlotClick: (slot: SlotData) => void;
  onSyncRack?: (rackId: number) => void;
  isSyncingRack?: boolean;
  lastSyncTime?: string;
  rackDiscrepanciesCount?: number;
  // Navegación por pasillo y rack
  currentAisleName?: string;
  hasPrevAisle?: boolean;
  hasNextAisle?: boolean;
  onPrevAisle?: () => void;
  onNextAisle?: () => void;
  oppositeRackId?: number;
  onSelectRack?: (rackId: number) => void;
  availableRacks?: RackConfig[];
}

export const RackGridView: React.FC<RackGridViewProps> = ({
  rack,
  slotsGrid,
  viewMode,
  filterType,
  searchQuery,
  auditFindings,
  onSlotClick,
  onSyncRack,
  isSyncingRack,
  lastSyncTime,
  rackDiscrepanciesCount,
  currentAisleName,
  hasPrevAisle,
  hasNextAisle,
  onPrevAisle,
  onNextAisle,
  oppositeRackId,
  onSelectRack,
  availableRacks,
}) => {
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const query = searchQuery.trim().toLowerCase();

  // Modo de ancho en pantalla completa: Ajustar al 100% de la pantalla del celular o Scroll horizontal amplio
  const [fitWidth, setFitWidth] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nexus_rack_fit_width');
      if (saved !== null) return saved === 'true';
      return window.innerWidth < 768;
    } catch {
      return true;
    }
  });

  const handleFitWidthToggle = (fit: boolean) => {
    setFitWidth(fit);
    try {
      localStorage.setItem('nexus_rack_fit_width', String(fit));
    } catch {
      // Ignorado
    }
  };

  // Control nativo de pantalla completa con fallback CSS total para móviles (iOS Safari / Android)
  const toggleFullScreen = async () => {
    if (!isFullScreen) {
      setIsFullScreen(true);
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // En iOS Safari no existe requestFullscreen pero el overlay CSS cubre el 100% de la pantalla
      }
    } else {
      setIsFullScreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignorado
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [isFullScreen]);

  // Helper to check if slot matches search query
  const isSearchMatch = (slot: SlotData): boolean => {
    if (!query) return false;
    if (slot.ubicacion.toLowerCase().includes(query)) return true;
    if (slot.materialCode && slot.materialCode.toLowerCase().includes(query)) return true;
    if (slot.items.some(it => it.lote.toLowerCase().includes(query))) return true;
    if (slot.items.some(it => it.descripcion.toLowerCase().includes(query))) return true;
    return false;
  };

  // Helper to check if slot passes current filter
  const isFilterActive = (slot: SlotData): boolean => {
    if (filterType === 'ALL') return true;
    if (filterType === 'ONLY_EMPTY') return slot.isEmpty;
    if (filterType === 'ONLY_OCCUPIED') return !slot.isEmpty;
    if (filterType === 'MULTI_PALLETS') return slot.palletCount > 1;
    if (filterType === 'WITH_DISCREPANCIES') {
      const finding = auditFindings.get(slot.ubicacion);
      return !!finding && finding.discrepancyType !== 'NONE';
    }
    return true;
  };

  // Render audit badge on top of slot with exact difference (FALTA 1/2, FALTA 2/2)
  const renderAuditBadge = (slot: SlotData, compact: boolean = false) => {
    const finding = auditFindings.get(slot.ubicacion);
    if (!finding) return null;

    if (finding.discrepancyType === 'NONE') {
      return (
        <span className={`absolute top-0.5 right-0.5 ${compact ? 'w-3 h-3' : 'w-4 h-4'} rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-sm`}>
          <Check className={`${compact ? 'w-2 h-2' : 'w-2.5 h-2.5'} stroke-[3]`} />
        </span>
      );
    }
    if (finding.discrepancyType === 'FALTA_FISICA') {
      return (
        <span className={`absolute top-0.5 right-0.5 ${compact ? 'px-1 py-0 text-[7.5px] leading-tight' : 'px-1.5 py-0.2 text-[9px]'} rounded bg-rose-600 text-white flex items-center gap-0.5 font-black shadow-sm tracking-tighter`}>
          {compact ? (finding.badgeLabel?.replace('FALTA', 'F.') || 'F') : (finding.badgeLabel || 'FALTA')}
        </span>
      );
    }
    if (finding.discrepancyType === 'SOBRA_FISICA') {
      return (
        <span className={`absolute top-0.5 right-0.5 ${compact ? 'px-1 py-0 text-[7.5px] leading-tight' : 'px-1.5 py-0.2 text-[9px]'} rounded bg-amber-500 text-slate-950 flex items-center gap-0.5 font-black shadow-sm tracking-tighter`}>
          {compact ? (finding.badgeLabel?.replace('SOBRA', 'S.') || 'S') : (finding.badgeLabel || 'SOBRA')}
        </span>
      );
    }
    return (
      <span className={`absolute top-0.5 right-0.5 ${compact ? 'px-1 py-0 text-[7.5px] leading-tight' : 'px-1.5 py-0.2 text-[9px]'} rounded bg-blue-600 text-white flex items-center gap-0.5 font-black shadow-sm tracking-tighter`}>
        {compact ? (finding.badgeLabel?.replace('DIF', 'D.') || 'D') : (finding.badgeLabel || 'DIF')}
      </span>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER DE LA TABLA EXCEL OFICIAL CIAL (REUTILIZABLE PARA NORMAL Y FULLSCREEN)
  // ══════════════════════════════════════════════════════════════════════════
  const renderExcelTable = (isFs: boolean = false, fit: boolean = false) => (
    <table className={`border-collapse text-center select-none w-full table-fixed ${fit ? 'min-w-0 max-w-full' : (isFs ? 'min-w-[680px]' : 'min-w-[700px]')}`}>
      {/* Encabezado negro idéntico a Excel - Sticky top */}
      <thead>
        <tr className="bg-black text-white font-black text-sm tracking-wider sticky top-0 z-20 shadow-md">
          <th className={`border border-slate-700 ${fit ? 'w-[13%] px-0.5 py-1.5 text-[10px] sm:text-xs' : 'w-[10%] px-2 sm:px-4 py-3 text-base'} bg-white text-black font-black sticky left-0 z-30 shadow-xs`}>
            {rack.id}
          </th>
          <th className={`border border-slate-700 ${fit ? 'w-[14.5%] px-0.5 py-1.5 text-[10px] sm:text-xs' : 'w-[15%] px-2 sm:px-3 py-3 text-xs sm:text-sm'} text-white`}>
            {fit ? 'N.6' : 'Nivel 6'}
          </th>
          <th className={`border border-slate-700 ${fit ? 'w-[14.5%] px-0.5 py-1.5 text-[10px] sm:text-xs' : 'w-[15%] px-2 sm:px-3 py-3 text-xs sm:text-sm'} text-white`}>
            {fit ? 'N.5' : 'Nivel 5'}
          </th>
          <th className={`border border-slate-700 ${fit ? 'w-[14.5%] px-0.5 py-1.5 text-[10px] sm:text-xs' : 'w-[15%] px-2 sm:px-3 py-3 text-xs sm:text-sm'} text-white`}>
            {fit ? 'N.4' : 'Nivel 4'}
          </th>
          <th className={`border border-slate-700 ${fit ? 'w-[14.5%] px-0.5 py-1.5 text-[10px] sm:text-xs' : 'w-[15%] px-2 sm:px-3 py-3 text-xs sm:text-sm'} text-white`}>
            {fit ? 'N.3' : 'Nivel 3'}
          </th>
          <th className={`border border-slate-700 ${fit ? 'w-[14.5%] px-0.5 py-1.5 text-[10px] sm:text-xs' : 'w-[15%] px-2 sm:px-3 py-3 text-xs sm:text-sm'} text-white`}>
            {fit ? 'N.2' : 'Nivel 2'}
          </th>
          <th className={`border border-slate-700 ${fit ? 'w-[14.5%] px-0.5 py-1.5 text-[10px] sm:text-xs' : 'w-[15%] px-2 sm:px-3 py-3 text-xs sm:text-sm'} text-white`}>
            {fit ? 'N.1' : 'Nivel 1'}
          </th>
        </tr>
      </thead>
      <tbody>
        {slotsGrid.map((rowSlots, rowIdx) => {
          const moduloCode = rack.modules[rowIdx];
          return (
            <tr key={moduloCode} className="hover:bg-slate-50 transition-colors">
              {/* Código de Módulo (ej: 00801) - Sticky left */}
              <td className={`border border-slate-400 bg-white text-black font-black ${fit ? 'text-[9.5px] sm:text-xs px-0.5 py-1' : 'text-xs sm:text-sm py-2 px-2 sm:px-3'} tracking-tight select-text sticky left-0 z-10 shadow-xs overflow-hidden text-ellipsis`}>
                {moduloCode}
              </td>

              {/* Las 6 celdas de Niveles (Nivel 6 a Nivel 1) */}
              {rowSlots.map((slot) => {
                const searchMatch = isSearchMatch(slot);
                const filterActive = isFilterActive(slot);

                let cellClass = '';
                let textClass = '';

                if (searchMatch) {
                  cellClass = 'bg-amber-100 text-amber-950 hover:bg-amber-200 border-amber-400 active:scale-98 shadow-md';
                  textClass = fit 
                    ? 'font-black text-[9.5px] sm:text-xs tracking-tighter text-amber-950 underline decoration-amber-500 truncate max-w-full' 
                    : 'font-black text-xs sm:text-base tracking-tight text-amber-950 underline decoration-amber-500 decoration-2';
                } else if (slot.isEmpty) {
                  cellClass = 'bg-black text-white hover:bg-slate-900 border-slate-700 active:scale-98';
                  textClass = fit 
                    ? 'font-bold text-[9px] sm:text-xs tracking-tight truncate max-w-full' 
                    : 'font-bold text-xs sm:text-sm tracking-wider';
                } else {
                  cellClass = 'bg-white text-black hover:bg-emerald-50/60 border-slate-400 shadow-2xs active:scale-98';
                  textClass = fit 
                    ? 'font-extrabold text-[9.5px] sm:text-xs tracking-tight truncate max-w-full' 
                    : 'font-extrabold text-xs sm:text-sm tracking-tight';
                }

                // Si hay búsqueda activa, atenuar las celdas que no coinciden
                let opacityClass = 'opacity-100';
                if (!filterActive) {
                  opacityClass = 'opacity-20 hover:opacity-100';
                } else if (query) {
                  opacityClass = searchMatch ? '!opacity-100' : 'opacity-25 hover:opacity-80 transition-opacity';
                }

                const highlightClass = searchMatch 
                  ? 'ring-4 ring-amber-400 scale-[1.04] z-10 shadow-xl shadow-amber-400/50 !opacity-100 animate-in fade-in duration-200' 
                  : '';

                return (
                  <td
                    key={slot.ubicacion}
                    onClick={() => onSlotClick(slot)}
                    title={`${slot.ubicacion} • ${slot.isEmpty ? 'Vacío' : `${slot.displayText} - ${slot.items[0]?.descripcion || ''}`}`}
                    className={`relative border ${fit ? 'py-1 px-0.5' : (isFs ? 'py-2 sm:py-3 px-1.5' : 'py-3 sm:py-3.5 px-2')} cursor-pointer transition-all duration-150 select-none overflow-hidden ${cellClass} ${opacityClass} ${highlightClass}`}
                  >
                    <div className={`flex flex-col items-center justify-center ${fit ? 'min-h-[28px] sm:min-h-[36px]' : (isFs ? 'min-h-[34px] sm:min-h-[42px]' : 'min-h-[38px] sm:min-h-[46px]')}`}>
                      {searchMatch && (
                        <span className={`px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black uppercase tracking-wider mb-0.5 ${fit ? 'text-[7px]' : 'text-[9px]'}`}>
                          {fit ? 'COINC' : 'COINCIDENCIA'}
                        </span>
                      )}
                      <span className={textClass}>
                        {slot.displayText}
                      </span>
                      {slot.hasTransfer && (
                        <span className={`font-black text-amber-600 uppercase tracking-tighter mt-0.5 ${fit ? 'text-[7px]' : 'text-[9px]'}`}>
                          {fit ? 'TR' : 'TRANSF'}
                        </span>
                      )}
                    </div>

                    {renderAuditBadge(slot, fit)}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MODO PANTALLA COMPLETA TOTAL (100% PANTALLA DEL CELULAR / SIN BARRAS)
  // ══════════════════════════════════════════════════════════════════════════
  const renderFullScreenOverlay = () => {
    if (!isFullScreen) return null;

    return (
      <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col w-screen h-screen h-[100dvh] overflow-hidden select-none animate-in fade-in duration-150">
        {/* Barra Superior Compacta */}
        <div className="bg-slate-900 border-b border-slate-800 px-2 sm:px-4 py-2 flex items-center justify-between gap-2 shrink-0 text-white shadow-md">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              onClick={toggleFullScreen}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs active:scale-95 transition-all cursor-pointer shrink-0 shadow-sm"
              title="Salir de pantalla completa"
            >
              <Minimize2 className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">Salir</span>
            </button>

            <div className="flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="bg-[#0a5c36] text-white font-black text-xs px-2 py-0.5 rounded-lg shrink-0">
                {rack.sheet}
              </span>
              <span className="font-bold text-xs text-slate-200 truncate hidden xs:inline">
                {rack.name}
              </span>
            </div>
          </div>

          {/* Control selector de Ancho: Ajustar al Móvil o Scroll Horizontal Libre */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => handleFitWidthToggle(true)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                fitWidth
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              title="Ajustar todas las columnas al ancho del celular"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px]">Ajustar</span>
            </button>
            <button
              type="button"
              onClick={() => handleFitWidthToggle(false)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !fitWidth
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              title="Permitir scroll horizontal amplio en el eje X"
            >
              <MoveHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px]">Scroll X</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {currentAisleName && (
              <span className="text-[11px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-lg truncate max-w-[90px] sm:max-w-[140px]">
                {currentAisleName.split('(')[0].trim()}
              </span>
            )}

            {oppositeRackId && onSelectRack && (
              <button
                onClick={() => onSelectRack(oppositeRackId)}
                className="flex items-center gap-1 px-2 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-[11px] font-black shadow-xs transition-all cursor-pointer shrink-0"
                title={`Cambiar a cara opuesta: Rack ${oppositeRackId}`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cara R{oppositeRackId}</span>
                <span className="sm:hidden">R{oppositeRackId}</span>
              </button>
            )}

            {onSyncRack && (
              <button
                onClick={() => onSyncRack(rack.id)}
                disabled={isSyncingRack}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] active:scale-95 text-white text-[11px] font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
                title={`Sincronizar Hoja ${rack.sheet}`}
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingRack ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync</span>
                {rackDiscrepanciesCount !== undefined && rackDiscrepanciesCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1 rounded-full">
                    {rackDiscrepanciesCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Banner de ayuda visual al activar Scroll Horizontal */}
        {!fitWidth && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-1 flex items-center justify-between text-amber-300 text-[10px] sm:text-xs font-semibold shrink-0">
            <div className="flex items-center gap-1.5">
              <MoveHorizontal className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
              <span>Desliza horizontalmente (eje X) para recorrer todos los niveles</span>
            </div>
            <button
              onClick={() => handleFitWidthToggle(true)}
              className="underline text-amber-200 hover:text-white ml-2 text-[10px] font-bold shrink-0 cursor-pointer"
            >
              ¿Ajustar a pantalla?
            </button>
          </div>
        )}

        {/* Área de la Hoja de Rack: 100% de la pantalla táctil */}
        <div className={`flex-1 ${fitWidth ? 'overflow-y-auto overflow-x-hidden' : 'overflow-x-auto overflow-y-auto'} bg-slate-200 p-1 sm:p-3 touch-pan-x touch-pan-y min-h-0`}>
          <div className={`bg-white rounded-xl shadow-md border border-slate-300 ${fitWidth ? 'w-full overflow-hidden' : 'inline-block min-w-full align-middle'}`}>
            {renderExcelTable(true, fitWidth)}
          </div>
        </div>

        {/* Barra Inferior en Pantalla Completa: Botones Grandes de Navegación de Pasillo para Pulgar */}
        <div className="bg-slate-900 border-t border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={onPrevAisle}
            disabled={!hasPrevAisle}
            className="flex-1 max-w-[150px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-black border border-slate-700 transition-all cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Ant. Pasillo</span>
          </button>

          {/* Selector Rápido de Racks */}
          <div className="flex items-center justify-center shrink-0">
            <select
              value={rack.id}
              onChange={e => onSelectRack?.(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-amber-300 text-xs font-black rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-400 cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
            >
              {(availableRacks || [rack]).map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.sheet})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onNextAisle}
            disabled={!hasNextAisle}
            className="flex-1 max-w-[150px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-black transition-all cursor-pointer shadow-xs"
          >
            <span className="truncate">Sig. Pasillo</span>
            <ChevronRight className="w-4 h-4 text-emerald-200 shrink-0" />
          </button>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // MODO 1: FORMATO AUDITORÍA (EXCEL OFICIAL CIAL) - VISTA NORMAL
  // ══════════════════════════════════════════════════════════════════════════
  if (viewMode === 'audit_excel') {
    return (
      <>
        {renderFullScreenOverlay()}

        <div className="w-full overflow-x-auto pb-16 sm:pb-8">
          <div className="w-full min-w-full">
            {/* Barra superior de la Hoja con botón de pantalla completa, navegación de pasillo y sincronización */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white px-3 sm:px-4 py-2.5 mb-3 rounded-2xl shadow-xs border border-slate-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#e6f4ea] border border-[#a3cfb6] flex items-center justify-center font-black text-[#08482a] text-xs shadow-xs shrink-0">
                  {rack.sheet}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                      Hoja: {rack.sheet} — {rack.name}
                    </h2>
                    {currentAisleName && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#08482a] border border-emerald-200 truncate">
                        {currentAisleName}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200 hidden xs:inline">
                      {rack.moduleCount} Módulos ({rack.moduleCount * 6} celdas)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap ml-auto">
                {/* Botón Pasillo Anterior */}
                {onPrevAisle && (
                  <button
                    onClick={onPrevAisle}
                    disabled={!hasPrevAisle}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-800 text-xs font-black border border-slate-300 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    title="Ir al pasillo anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                    <span className="hidden sm:inline">Pasillo Ant.</span>
                  </button>
                )}

                {/* Botón Pasillo Siguiente */}
                {onNextAisle && (
                  <button
                    onClick={onNextAisle}
                    disabled={!hasNextAisle}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-800 text-xs font-black border border-slate-300 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    title="Ir al pasillo siguiente"
                  >
                    <span className="hidden sm:inline">Pasillo Sig.</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                )}

                {/* Botón Cara Opuesta del Pasillo */}
                {oppositeRackId && onSelectRack && (
                  <button
                    onClick={() => onSelectRack(oppositeRackId)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black border border-indigo-200 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    title={`Cambiar a cara opuesta del pasillo: Rack ${oppositeRackId}`}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden md:inline">Cara Opuesta</span>
                    <span>(R{oppositeRackId})</span>
                  </button>
                )}

                {/* BOTÓN PANTALLA COMPLETA */}
                <button
                  onClick={toggleFullScreen}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer border border-amber-600 ring-2 ring-amber-300/60"
                  title="Ver hoja de rack en pantalla completa para celular"
                >
                  <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Pantalla Completa</span>
                </button>

                {/* Botón Sincronizar individual de la Hoja */}
                {onSyncRack && (
                  <button
                    onClick={() => onSyncRack(rack.id)}
                    disabled={isSyncingRack}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] active:scale-95 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    title={`Sincronizar Hoja ${rack.sheet} (Rack ${rack.id}) con diferencias de auditores`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRack ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{isSyncingRack ? `Sincronizando...` : `Sincronizar Hoja`}</span>
                    {rackDiscrepanciesCount !== undefined && rackDiscrepanciesCount > 0 && (
                      <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                        {rackDiscrepanciesCount} dif
                      </span>
                    )}
                    {lastSyncTime && (
                      <span className="text-[10px] text-emerald-200 font-mono hidden md:inline">
                        ({lastSyncTime})
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-sm border border-slate-200 inline-block min-w-full align-middle">
              {renderExcelTable(false, false)}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODO 2: ELEVACIÓN FRONTAL (MURO 2D DE ESTANTERÍA)
  // ══════════════════════════════════════════════════════════════════════════
  const levels = [6, 5, 4, 3, 2, 1];

  return (
    <>
      {renderFullScreenOverlay()}

      <div className="w-full overflow-x-auto pb-16 sm:pb-8 px-1 sm:px-2">
        <div className="inline-block min-w-full">
          {/* Barra superior del Muro con controles */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white px-3 sm:px-4 py-2.5 mb-3 rounded-2xl shadow-xs border border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#e6f4ea] border border-[#a3cfb6] flex items-center justify-center font-black text-[#08482a] text-xs shadow-xs shrink-0">
                {rack.sheet}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                    Muro Frontal: {rack.sheet} — {rack.name}
                  </h2>
                  {currentAisleName && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#08482a] border border-emerald-200 truncate">
                      {currentAisleName}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200 hidden xs:inline">
                    {rack.moduleCount} Módulos ({rack.moduleCount * 6} celdas)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap ml-auto">
              {onPrevAisle && (
                <button
                  onClick={onPrevAisle}
                  disabled={!hasPrevAisle}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-800 text-xs font-black border border-slate-300 active:scale-95 transition-all cursor-pointer shadow-2xs"
                  title="Ir al pasillo anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Pasillo Ant.</span>
                </button>
              )}

              {onNextAisle && (
                <button
                  onClick={onNextAisle}
                  disabled={!hasNextAisle}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-800 text-xs font-black border border-slate-300 active:scale-95 transition-all cursor-pointer shadow-2xs"
                  title="Ir al pasillo siguiente"
                >
                  <span className="hidden sm:inline">Pasillo Sig.</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>
              )}

              {oppositeRackId && onSelectRack && (
                <button
                  onClick={() => onSelectRack(oppositeRackId)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black border border-indigo-200 active:scale-95 transition-all cursor-pointer shadow-2xs"
                  title={`Cambiar a cara opuesta del pasillo: Rack ${oppositeRackId}`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden md:inline">Cara Opuesta</span>
                  <span>(R{oppositeRackId})</span>
                </button>
              )}

              {/* Botón Pantalla Completa */}
              <button
                onClick={toggleFullScreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer border border-amber-600 ring-2 ring-amber-300/60"
                title="Ver hoja de rack en pantalla completa para celular"
              >
                <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Pantalla Completa</span>
              </button>

              {onSyncRack && (
                <button
                  onClick={() => onSyncRack(rack.id)}
                  disabled={isSyncingRack}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] active:scale-95 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  title={`Sincronizar Hoja ${rack.sheet} (Rack ${rack.id}) con diferencias de auditores`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRack ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isSyncingRack ? `Sincronizando...` : `Sincronizar Hoja`}</span>
                  {rackDiscrepanciesCount !== undefined && rackDiscrepanciesCount > 0 && (
                    <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                      {rackDiscrepanciesCount} dif
                    </span>
                  )}
                  {lastSyncTime && (
                    <span className="text-[10px] text-emerald-200 font-mono hidden md:inline">
                      ({lastSyncTime})
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            {/* Header con módulos */}
            <div className="flex items-center gap-1.5 ml-20">
              {rack.modules.map((m, idx) => (
                <div 
                  key={m} 
                  className="w-20 text-center font-black text-[10px] text-[#08482a] bg-[#e6f4ea] py-1 rounded-lg border border-[#a3cfb6]"
                >
                  M.{idx + 1}
                  <div className="text-[9px] text-[#0a5c36] font-mono">{m.slice(3)}</div>
                </div>
              ))}
            </div>

            {/* Filas de Niveles (Nivel 6 arriba hacia Nivel 1 abajo) */}
            <div className="space-y-2">
              {levels.map((lvl, lvlIdx) => {
                return (
                  <div key={lvl} className="flex items-center gap-1.5">
                    <div className="w-20 flex items-center justify-center font-black text-xs text-white bg-[#0a5c36] rounded-xl py-3 shadow-sm border border-[#08482a]">
                      Nivel {lvl}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {slotsGrid.map((rowSlots) => {
                        const slot = rowSlots[lvlIdx];
                        const searchMatch = isSearchMatch(slot);
                        const filterActive = isFilterActive(slot);

                        let cellBg = '';
                        let textCol = '';

                        if (searchMatch) {
                          cellBg = 'bg-amber-100 text-amber-950 border-amber-400 font-black';
                          textCol = 'text-amber-950 font-black';
                        } else if (slot.isEmpty) {
                          cellBg = 'bg-black text-white border-slate-800';
                          textCol = 'text-white font-extrabold';
                        } else {
                          cellBg = 'bg-white text-black border-slate-300 hover:border-[#0a5c36]';
                          textCol = 'text-black font-extrabold';
                        }

                        let opacity = 'opacity-100';
                        if (!filterActive) {
                          opacity = 'opacity-20';
                        } else if (query) {
                          opacity = searchMatch ? '!opacity-100' : 'opacity-25 hover:opacity-80 transition-opacity';
                        }

                        const ring = searchMatch ? 'ring-4 ring-amber-400 z-10 scale-110 shadow-xl shadow-amber-400/50 !opacity-100' : '';

                        return (
                          <div
                            key={slot.ubicacion}
                            onClick={() => onSlotClick(slot)}
                            title={`${slot.ubicacion} • ${slot.displayText}`}
                            className={`relative w-20 h-14 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all ${cellBg} ${opacity} ${ring} hover:scale-105 shadow-xs`}
                          >
                            <span className={`text-[11px] leading-tight text-center px-1 ${textCol}`}>
                              {slot.displayText}
                            </span>
                            <span className="text-[8.5px] opacity-60 font-mono">
                              {slot.ubicacion.slice(-4)}
                            </span>

                            {renderAuditBadge(slot)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
