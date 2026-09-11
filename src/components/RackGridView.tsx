import React from 'react';
import { SlotData, AuditFinding, RackConfig } from '../types/warehouse';
import { ViewMode, FilterType } from './RackTabs';
import { Check, RefreshCw } from 'lucide-react';

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
}) => {
  const query = searchQuery.trim().toLowerCase();

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
  const renderAuditBadge = (slot: SlotData) => {
    const finding = auditFindings.get(slot.ubicacion);
    if (!finding) return null;

    if (finding.discrepancyType === 'NONE') {
      return (
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-sm">
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </span>
      );
    }
    if (finding.discrepancyType === 'FALTA_FISICA') {
      return (
        <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded bg-rose-600 text-white flex items-center gap-0.5 text-[9px] font-black shadow-sm tracking-tighter">
          {finding.badgeLabel || 'FALTA'}
        </span>
      );
    }
    if (finding.discrepancyType === 'SOBRA_FISICA') {
      return (
        <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 flex items-center gap-0.5 text-[9px] font-black shadow-sm tracking-tighter">
          {finding.badgeLabel || 'SOBRA'}
        </span>
      );
    }
    return (
      <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded bg-blue-600 text-white flex items-center gap-0.5 text-[9px] font-black shadow-sm tracking-tighter">
        {finding.badgeLabel || 'DIF'}
      </span>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // MODO 1: FORMATO AUDITORÍA (EXCEL OFICIAL CIAL) - STICKY Y ANCHO COMPLETO
  // ══════════════════════════════════════════════════════════════════════════
  if (viewMode === 'audit_excel') {
    return (
      <div className="w-full overflow-x-auto pb-16 sm:pb-8">
        <div className="w-full min-w-full">
          {/* Barra superior de la Hoja con botón de sincronización individual */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 mb-3 rounded-2xl shadow-xs border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#e6f4ea] border border-[#a3cfb6] flex items-center justify-center font-black text-[#08482a] text-xs shadow-xs">
                {rack.sheet}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                    Hoja: {rack.sheet} — {rack.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                    {rack.moduleCount} Módulos ({rack.moduleCount * 6} celdas)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onSyncRack && (
                <button
                  onClick={() => onSyncRack(rack.id)}
                  disabled={isSyncingRack}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] active:scale-95 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  title={`Sincronizar Hoja ${rack.sheet} (Rack ${rack.id}) con diferencias de auditores`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRack ? 'animate-spin' : ''}`} />
                  <span>{isSyncingRack ? `Sincronizando Hoja ${rack.sheet}...` : `Sincronizar Hoja ${rack.sheet}`}</span>
                  {rackDiscrepanciesCount !== undefined && rackDiscrepanciesCount > 0 && (
                    <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                      {rackDiscrepanciesCount} dif
                    </span>
                  )}
                  {lastSyncTime && (
                    <span className="text-[10px] text-emerald-200 font-mono hidden sm:inline">
                      ({lastSyncTime})
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-sm border border-slate-200 w-full">
            <table className="border-collapse text-center select-none w-full table-fixed min-w-[700px]">
              {/* Encabezado negro idéntico a Excel - Sticky top */}
              <thead>
                <tr className="bg-black text-white font-black text-sm tracking-wider sticky top-0 z-20 shadow-md">
                  <th className="border border-slate-700 px-2 sm:px-4 py-3 text-base w-[10%] bg-white text-black font-black sticky left-0 z-30 shadow-xs">
                    {rack.id}
                  </th>
                  <th className="border border-slate-700 px-2 sm:px-3 py-3 w-[15%] text-white text-xs sm:text-sm">Nivel 6</th>
                  <th className="border border-slate-700 px-2 sm:px-3 py-3 w-[15%] text-white text-xs sm:text-sm">Nivel 5</th>
                  <th className="border border-slate-700 px-2 sm:px-3 py-3 w-[15%] text-white text-xs sm:text-sm">Nivel 4</th>
                  <th className="border border-slate-700 px-2 sm:px-3 py-3 w-[15%] text-white text-xs sm:text-sm">Nivel 3</th>
                  <th className="border border-slate-700 px-2 sm:px-3 py-3 w-[15%] text-white text-xs sm:text-sm">Nivel 2</th>
                  <th className="border border-slate-700 px-2 sm:px-3 py-3 w-[15%] text-white text-xs sm:text-sm">Nivel 1</th>
                </tr>
              </thead>
              <tbody>
                {slotsGrid.map((rowSlots, rowIdx) => {
                  const moduloCode = rack.modules[rowIdx];
                  return (
                    <tr key={moduloCode} className="hover:bg-slate-50 transition-colors">
                      {/* Código de Módulo (ej: 00801) - Sticky left */}
                      <td className="border border-slate-400 bg-white text-black font-black text-xs sm:text-sm py-2 px-2 sm:px-3 tracking-wide select-text sticky left-0 z-10 shadow-xs">
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
                          textClass = 'font-black text-xs sm:text-base tracking-tight text-amber-950 underline decoration-amber-500 decoration-2';
                        } else if (slot.isEmpty) {
                          cellClass = 'bg-black text-white hover:bg-slate-900 border-slate-700 active:scale-98';
                          textClass = 'font-bold text-xs sm:text-sm tracking-wider';
                        } else {
                          cellClass = 'bg-white text-black hover:bg-emerald-50/60 border-slate-400 shadow-2xs active:scale-98';
                          textClass = 'font-extrabold text-xs sm:text-sm tracking-tight';
                        }

                        // Si hay búsqueda activa, atenuar las celdas que no coinciden para que las coincidencias resalten inmediatamente
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
                            className={`relative border py-3 sm:py-3.5 px-2 cursor-pointer transition-all duration-150 select-none ${cellClass} ${opacityClass} ${highlightClass}`}
                          >
                            <div className="flex flex-col items-center justify-center min-h-[38px] sm:min-h-[46px]">
                              {searchMatch && (
                                <span className="px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider mb-0.5">
                                  COINCIDENCIA
                                </span>
                              )}
                              <span className={textClass}>
                                {slot.displayText}
                              </span>
                              {slot.hasTransfer && (
                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter mt-0.5">
                                  TRANSF
                                </span>
                              )}
                            </div>

                            {renderAuditBadge(slot)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODO 2: ELEVACIÓN FRONTAL (MURO 2D DE ESTANTERÍA)
  // ══════════════════════════════════════════════════════════════════════════
  const levels = [6, 5, 4, 3, 2, 1];

  return (
    <div className="w-full overflow-x-auto pb-16 sm:pb-8 px-1 sm:px-2">
      <div className="inline-block min-w-full">
        {/* Barra superior de la Hoja con botón de sincronización individual */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 mb-3 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#e6f4ea] border border-[#a3cfb6] flex items-center justify-center font-black text-[#08482a] text-xs shadow-xs">
              {rack.sheet}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                  Muro Frontal: {rack.sheet} — {rack.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                  {rack.moduleCount} Módulos ({rack.moduleCount * 6} celdas)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSyncRack && (
              <button
                onClick={() => onSyncRack(rack.id)}
                disabled={isSyncingRack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] active:scale-95 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                title={`Sincronizar Hoja ${rack.sheet} (Rack ${rack.id}) con diferencias de auditores`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRack ? 'animate-spin' : ''}`} />
                <span>{isSyncingRack ? `Sincronizando Hoja ${rack.sheet}...` : `Sincronizar Hoja ${rack.sheet}`}</span>
                {rackDiscrepanciesCount !== undefined && rackDiscrepanciesCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {rackDiscrepanciesCount} dif
                  </span>
                )}
                {lastSyncTime && (
                  <span className="text-[10px] text-emerald-200 font-mono hidden sm:inline">
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
  );
};
