import React from 'react';
import { SlotData, AuditFinding, RackConfig } from '../types/warehouse';
import { ViewMode, FilterType } from './RackTabs';
import { Check, AlertCircle, AlertTriangle, HelpCircle, Layers } from 'lucide-react';

interface RackGridViewProps {
  rack: RackConfig;
  slotsGrid: SlotData[][]; // [row_index = module][col_index = level 6 to 1]
  viewMode: ViewMode;
  filterType: FilterType;
  searchQuery: string;
  auditFindings: Map<string, AuditFinding>;
  auditMode: boolean;
  onSlotClick: (slot: SlotData) => void;
}

export const RackGridView: React.FC<RackGridViewProps> = ({
  rack,
  slotsGrid,
  viewMode,
  filterType,
  searchQuery,
  auditFindings,
  auditMode,
  onSlotClick,
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

  // Render audit badge on top of slot
  const renderAuditBadge = (slot: SlotData) => {
    const finding = auditFindings.get(slot.ubicacion);
    if (!finding) return null;

    if (finding.discrepancyType === 'NONE') {
      return (
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow">
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </span>
      );
    }
    if (finding.discrepancyType === 'FALTA_FISICA') {
      return (
        <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-rose-600 text-white flex items-center gap-0.5 text-[9px] font-black shadow">
          FALTA
        </span>
      );
    }
    if (finding.discrepancyType === 'SOBRA_FISICA') {
      return (
        <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-amber-500 text-slate-950 flex items-center gap-0.5 text-[9px] font-black shadow">
          SOBRA
        </span>
      );
    }
    return (
      <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-blue-600 text-white flex items-center gap-0.5 text-[9px] font-black shadow">
        DIF
      </span>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // MODO 1: FORMATO AUDITORÍA (EXCEL CIAL)
  // Idéntico a la captura de pantalla: Col 1 = Módulo, Col 2..7 = Nivel 6 a 1
  // ══════════════════════════════════════════════════════════════════════════
  if (viewMode === 'audit_excel') {
    return (
      <div className="w-full overflow-x-auto pb-8">
        <div className="inline-block min-w-full align-middle">
          <table className="border-collapse text-center select-none shadow-xl mx-auto">
            {/* Encabezado negro idéntico a Excel */}
            <thead>
              <tr className="bg-black text-white font-black text-sm tracking-wider">
                <th className="border border-slate-700 px-4 py-2.5 text-base w-24 bg-white text-black font-extrabold">
                  {rack.id}
                </th>
                <th className="border border-slate-700 px-4 py-2.5 w-28 text-white">Nivel 6</th>
                <th className="border border-slate-700 px-4 py-2.5 w-28 text-white">Nivel 5</th>
                <th className="border border-slate-700 px-4 py-2.5 w-28 text-white">Nivel 4</th>
                <th className="border border-slate-700 px-4 py-2.5 w-28 text-white">Nivel 3</th>
                <th className="border border-slate-700 px-4 py-2.5 w-28 text-white">Nivel 2</th>
                <th className="border border-slate-700 px-4 py-2.5 w-28 text-white">Nivel 1</th>
              </tr>
            </thead>
            <tbody>
              {slotsGrid.map((rowSlots, rowIdx) => {
                const moduloCode = rack.modules[rowIdx];
                return (
                  <tr key={moduloCode} className="hover:bg-slate-800/40 transition-colors">
                    {/* Código de Módulo (ej: 00801) */}
                    <td className="border border-slate-600/80 bg-white text-black font-extrabold text-sm py-1.5 px-3 tracking-wide select-text">
                      {moduloCode}
                    </td>

                    {/* Las 6 celdas de Niveles (Nivel 6 a Nivel 1) */}
                    {rowSlots.map((slot) => {
                      const searchMatch = isSearchMatch(slot);
                      const filterActive = isFilterActive(slot);
                      const finding = auditFindings.get(slot.ubicacion);

                      // Estilos idénticos a la imagen de auditoría
                      let cellClass = '';
                      let textClass = '';

                      if (slot.isEmpty) {
                        // Vacio: Fondo negro sólido, texto blanco negrita
                        cellClass = 'bg-black text-white hover:bg-slate-900 border-slate-700';
                        textClass = 'font-bold text-xs tracking-wider';
                      } else {
                        // Ocupado: Fondo blanco puro, texto negro negrita
                        cellClass = 'bg-white text-black hover:bg-slate-100 border-slate-400';
                        textClass = 'font-extrabold text-xs tracking-tight';
                      }

                      // Opacidad si no coincide con el filtro activo
                      const opacityClass = filterActive ? 'opacity-100' : 'opacity-20 hover:opacity-100';

                      // Resaltado si coincide con la búsqueda
                      const highlightClass = searchMatch 
                        ? 'ring-4 ring-cyan-400 scale-[1.03] z-10 shadow-lg shadow-cyan-500/50 !opacity-100' 
                        : '';

                      return (
                        <td
                          key={slot.ubicacion}
                          onClick={() => onSlotClick(slot)}
                          title={`${slot.ubicacion} • ${slot.isEmpty ? 'Vacío' : `${slot.displayText} - ${slot.items[0]?.descripcion || ''}`}`}
                          className={`relative border py-2 px-2 cursor-pointer transition-all duration-150 select-none ${cellClass} ${opacityClass} ${highlightClass}`}
                        >
                          <div className="flex flex-col items-center justify-center min-h-[30px]">
                            <span className={textClass}>
                              {slot.displayText}
                            </span>
                            {/* Alerta si está en transfer */}
                            {slot.hasTransfer && (
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">
                                TRANSF
                              </span>
                            )}
                          </div>

                          {/* Badge de Auditoría */}
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
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODO 2: ELEVACIÓN FRONTAL (MURO 2D DE ESTANTERÍA)
  // Eje Y = Altura (Nivel 6 arriba, Nivel 1 abajo), Eje X = Módulos horizontales
  // ══════════════════════════════════════════════════════════════════════════
  const levels = [6, 5, 4, 3, 2, 1];

  return (
    <div className="w-full overflow-x-auto pb-8 px-2">
      <div className="inline-block min-w-full">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3">
          {/* Header con módulos */}
          <div className="flex items-center gap-1.5 ml-20">
            {rack.modules.map((m, idx) => (
              <div 
                key={m} 
                className="w-20 text-center font-bold text-[10px] text-slate-400 bg-slate-950 py-1 rounded border border-slate-800"
              >
                M.{idx + 1}
                <div className="text-[9px] text-slate-500">{m.slice(3)}</div>
              </div>
            ))}
          </div>

          {/* Filas de Niveles (Nivel 6 arriba hacia Nivel 1 abajo) */}
          <div className="space-y-2">
            {levels.map((lvl, lvlIdx) => {
              return (
                <div key={lvl} className="flex items-center gap-1.5">
                  {/* Etiqueta lateral del Nivel */}
                  <div className="w-18 flex items-center justify-center font-black text-xs text-cyan-300 bg-slate-950 border border-slate-800 rounded-lg py-3 shadow">
                    Nivel {lvl}
                  </div>

                  {/* Celdas por módulo */}
                  <div className="flex items-center gap-1.5">
                    {slotsGrid.map((rowSlots) => {
                      const slot = rowSlots[lvlIdx]; // lvlIdx 0=6, 1=5, 2=4, 3=3, 4=2, 5=1
                      const searchMatch = isSearchMatch(slot);
                      const filterActive = isFilterActive(slot);

                      let cellBg = slot.isEmpty ? 'bg-black text-white border-slate-800' : 'bg-white text-black border-slate-300';
                      const opacity = filterActive ? 'opacity-100' : 'opacity-20';
                      const ring = searchMatch ? 'ring-4 ring-cyan-400 z-10 scale-105' : '';

                      return (
                        <div
                          key={slot.ubicacion}
                          onClick={() => onSlotClick(slot)}
                          title={`${slot.ubicacion} • ${slot.displayText}`}
                          className={`relative w-20 h-14 rounded-md border flex flex-col items-center justify-center cursor-pointer transition-all ${cellBg} ${opacity} ${ring} hover:scale-105 shadow`}
                        >
                          <span className={`text-[11px] font-extrabold leading-tight text-center px-1 ${slot.isEmpty ? 'text-white' : 'text-black'}`}>
                            {slot.displayText}
                          </span>
                          <span className="text-[8px] opacity-60 font-mono">
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
