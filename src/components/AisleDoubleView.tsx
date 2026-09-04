import React, { useState } from 'react';
import { RackConfig, SlotData, AuditFinding, AislePair } from '../types/warehouse';
import { ArrowDown, SplitSquareVertical } from 'lucide-react';

interface AisleDoubleViewProps {
  aisles: AislePair[];
  allRacks: RackConfig[];
  selectedAisleId: number;
  onSelectAisle: (id: number) => void;
  getRackSlots: (rackId: number) => SlotData[][];
  auditFindings: Map<string, AuditFinding>;
  searchQuery: string;
  onSlotClick: (slot: SlotData) => void;
}

export const AisleDoubleView: React.FC<AisleDoubleViewProps> = ({
  aisles,
  allRacks,
  selectedAisleId,
  onSelectAisle,
  getRackSlots,
  auditFindings,
  searchQuery,
  onSlotClick,
}) => {
  const currentAisle = aisles.find(a => a.id === selectedAisleId) || aisles[0];

  const [customLeftRackId, setCustomLeftRackId] = useState<number>(currentAisle.leftRackId);
  const [customRightRackId, setCustomRightRackId] = useState<number>(currentAisle.rightRackId);

  React.useEffect(() => {
    setCustomLeftRackId(currentAisle.leftRackId);
    setCustomRightRackId(currentAisle.rightRackId);
  }, [selectedAisleId, currentAisle]);

  const leftRack = allRacks.find(r => r.id === customLeftRackId) || allRacks[0];
  const rightRack = allRacks.find(r => r.id === customRightRackId) || allRacks[1];

  const leftSlotsGrid = getRackSlots(leftRack.id);
  const rightSlotsGrid = getRackSlots(rightRack.id);

  const query = searchQuery.trim().toLowerCase();
  const isSearchMatch = (slot: SlotData): boolean => {
    if (!query) return false;
    if (slot.ubicacion.toLowerCase().includes(query)) return true;
    if (slot.materialCode && slot.materialCode.toLowerCase().includes(query)) return true;
    if (slot.items.some(it => it.lote.toLowerCase().includes(query))) return true;
    return false;
  };

  const renderSlotCell = (slot: SlotData) => {
    const searchMatch = isSearchMatch(slot);
    const finding = auditFindings.get(slot.ubicacion);

    let bgClass = slot.isEmpty 
      ? 'bg-black text-white border-slate-700' 
      : 'bg-white text-black border-slate-300 hover:border-[#0a5c36]';
    let ringClass = searchMatch ? 'ring-2 ring-emerald-500 scale-105 shadow-md shadow-emerald-500/40' : '';

    return (
      <div
        key={slot.ubicacion}
        onClick={() => onSlotClick(slot)}
        title={`${slot.ubicacion} • ${slot.displayText}`}
        className={`relative border h-9 px-1.5 flex flex-col items-center justify-center cursor-pointer transition-all ${bgClass} ${ringClass} hover:opacity-90 shadow-2xs`}
      >
        <span className="text-[10.5px] font-black tracking-tight truncate max-w-full">
          {slot.displayText}
        </span>
        {finding && (
          <span className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full ${finding.discrepancyType === 'NONE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        )}
      </div>
    );
  };

  const maxModules = Math.max(leftRack.moduleCount, rightRack.moduleCount);

  return (
    <div className="w-full space-y-4 pb-12">
      {/* Pasillo Header & Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e6f4ea] border border-[#a3cfb6] flex items-center justify-center text-[#0a5c36]">
            <SplitSquareVertical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>Recorrido de Pasillo Enfrentado</span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-[#0a5c36] text-white">
                {currentAisle.name}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Vista simultánea de cara izquierda y cara derecha durante la auditoría en terreno
            </p>
          </div>
        </div>

        {/* Quick selector of standard aisles */}
        <div className="flex items-center gap-2">
          <select
            value={selectedAisleId}
            onChange={e => onSelectAisle(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-black rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#0a5c36] shadow-sm cursor-pointer"
          >
            {aisles.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Facing Grid View */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[900px] bg-white border border-slate-200 rounded-2xl p-4 shadow-md">
          {/* Header Labels for Left & Right */}
          <div className="grid grid-cols-[1fr_80px_1fr] gap-2 mb-3 text-center">
            {/* Left Rack Header */}
            <div className="bg-[#0a5c36] text-white p-2.5 rounded-xl flex items-center justify-between px-4 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-200 uppercase">Cara Izquierda:</span>
                <span className="text-sm font-black text-white tracking-wide">{leftRack.name}</span>
              </div>
              <span className="text-xs text-emerald-100 font-mono font-bold">{leftRack.moduleCount} Módulos</span>
            </div>

            {/* Walking Corridor Indicator */}
            <div className="bg-[#e6f4ea] border border-[#a3cfb6] rounded-xl flex flex-col items-center justify-center text-[#08482a] text-[10px] font-black">
              <ArrowDown className="w-3.5 h-3.5 text-[#0a5c36] animate-pulse" />
              PASILLO
            </div>

            {/* Right Rack Header */}
            <div className="bg-[#08482a] text-white p-2.5 rounded-xl flex items-center justify-between px-4 shadow-xs">
              <span className="text-xs text-emerald-100 font-mono font-bold">{rightRack.moduleCount} Módulos</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white tracking-wide">{rightRack.name}</span>
                <span className="text-xs font-bold text-emerald-200 uppercase">:Cara Derecha</span>
              </div>
            </div>
          </div>

          {/* Level Labels */}
          <div className="grid grid-cols-[1fr_80px_1fr] gap-2 mb-2 text-center text-[10px] font-extrabold text-slate-600 uppercase">
            <div className="grid grid-cols-6 gap-1">
              <span>Niv 6</span><span>Niv 5</span><span>Niv 4</span><span>Niv 3</span><span>Niv 2</span><span>Niv 1</span>
            </div>
            <div className="text-center font-mono text-[#08482a]">MÓDULO</div>
            <div className="grid grid-cols-6 gap-1">
              <span>Niv 1</span><span>Niv 2</span><span>Niv 3</span><span>Niv 4</span><span>Niv 5</span><span>Niv 6</span>
            </div>
          </div>

          {/* Rows of Modules Side by Side */}
          <div className="space-y-1.5">
            {Array.from({ length: maxModules }).map((_, modIdx) => {
              const leftRow = leftSlotsGrid[modIdx];
              const rightRow = rightSlotsGrid[modIdx];
              const moduleLabel = String(modIdx + 1).padStart(2, '0');

              return (
                <div key={modIdx} className="grid grid-cols-[1fr_80px_1fr] gap-2 items-center">
                  {/* Left Rack 6 Levels (Nivel 6 to 1) */}
                  <div className="grid grid-cols-6 gap-1">
                    {leftRow ? (
                      leftRow.map(slot => renderSlotCell(slot))
                    ) : (
                      <div className="col-span-6 bg-slate-100 border border-dashed border-slate-200 h-9 rounded flex items-center justify-center text-[10px] text-slate-400">
                        Sin módulo
                      </div>
                    )}
                  </div>

                  {/* Module Number in Corridor */}
                  <div className="h-9 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center font-mono font-black text-xs text-slate-800">
                    M.{moduleLabel}
                  </div>

                  {/* Right Rack 6 Levels */}
                  <div className="grid grid-cols-6 gap-1">
                    {rightRow ? (
                      [...rightRow].reverse().map(slot => renderSlotCell(slot))
                    ) : (
                      <div className="col-span-6 bg-slate-100 border border-dashed border-slate-200 h-9 rounded flex items-center justify-center text-[10px] text-slate-400">
                        Sin módulo
                      </div>
                    )}
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
