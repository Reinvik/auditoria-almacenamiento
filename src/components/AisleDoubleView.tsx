import React, { useState } from 'react';
import { RackConfig, SlotData, AuditFinding, AislePair } from '../types/warehouse';
import { Check, ArrowDown, SplitSquareVertical, Compass } from 'lucide-react';

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

  // Sync with selected aisle
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

    let bgClass = slot.isEmpty ? 'bg-black text-white' : 'bg-white text-black';
    let ringClass = searchMatch ? 'ring-2 ring-cyan-400 scale-105' : '';

    return (
      <div
        key={slot.ubicacion}
        onClick={() => onSlotClick(slot)}
        title={`${slot.ubicacion} • ${slot.displayText}`}
        className={`relative border border-slate-700 h-9 px-1.5 flex flex-col items-center justify-center cursor-pointer transition-all ${bgClass} ${ringClass} hover:opacity-90`}
      >
        <span className="text-[10.5px] font-extrabold tracking-tight truncate max-w-full">
          {slot.displayText}
        </span>
        {finding && (
          <span className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${finding.discrepancyType === 'NONE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        )}
      </div>
    );
  };

  const maxModules = Math.max(leftRack.moduleCount, rightRack.moduleCount);

  return (
    <div className="w-full space-y-4 pb-12">
      {/* Pasillo Header & Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <SplitSquareVertical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Recorrido de Pasillo Enfrentado</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500 text-slate-950">
                {currentAisle.name}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Vista simultánea de cara izquierda y cara derecha durante la toma de inventario
            </p>
          </div>
        </div>

        {/* Quick selector of standard aisles */}
        <div className="flex items-center gap-2">
          <select
            value={selectedAisleId}
            onChange={e => onSelectAisle(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
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
        <div className="min-w-[900px] bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl">
          {/* Header Labels for Left & Right */}
          <div className="grid grid-cols-[1fr_80px_1fr] gap-2 mb-3 text-center">
            {/* Left Rack Header */}
            <div className="bg-slate-900 border border-slate-700 p-2 rounded-xl flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">CARA IZQUIERDA:</span>
                <span className="text-sm font-black text-cyan-400">{leftRack.name}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{leftRack.moduleCount} Módulos</span>
            </div>

            {/* Walking Corridor Indicator */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold">
              <ArrowDown className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              PASILLO
            </div>

            {/* Right Rack Header */}
            <div className="bg-slate-900 border border-slate-700 p-2 rounded-xl flex items-center justify-between px-4">
              <span className="text-xs text-slate-400 font-mono">{rightRack.moduleCount} Módulos</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-indigo-400">{rightRack.name}</span>
                <span className="text-xs font-bold text-slate-400">:CARA DERECHA</span>
              </div>
            </div>
          </div>

          {/* Level Labels */}
          <div className="grid grid-cols-[1fr_80px_1fr] gap-2 mb-2 text-center text-[10px] font-bold text-slate-400">
            <div className="grid grid-cols-6 gap-1">
              <span>Niv 6</span><span>Niv 5</span><span>Niv 4</span><span>Niv 3</span><span>Niv 2</span><span>Niv 1</span>
            </div>
            <div className="text-center font-mono">MÓDULO</div>
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
                      <div className="col-span-6 bg-slate-900/30 border border-dashed border-slate-800 h-9 rounded flex items-center justify-center text-[10px] text-slate-600">
                        Sin módulo
                      </div>
                    )}
                  </div>

                  {/* Module Number in Corridor */}
                  <div className="h-9 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center font-mono font-bold text-xs text-slate-300">
                    M.{moduleLabel}
                  </div>

                  {/* Right Rack 6 Levels (Mirrored: Nivel 1 to 6 or 6 to 1) */}
                  <div className="grid grid-cols-6 gap-1">
                    {rightRow ? (
                      // Reversed so Nivel 1 is closer to the center if desired, or standard 6 to 1
                      [...rightRow].reverse().map(slot => renderSlotCell(slot))
                    ) : (
                      <div className="col-span-6 bg-slate-900/30 border border-dashed border-slate-800 h-9 rounded flex items-center justify-center text-[10px] text-slate-600">
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
