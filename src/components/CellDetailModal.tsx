import React, { useState } from 'react';
import { SlotData, AuditFinding, DiscrepancyType } from '../types/warehouse';
import { 
  X, 
  Package, 
  MapPin, 
  Calendar, 
  Scale, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  FileWarning, 
  RotateCcw,
  ClipboardCheck
} from 'lucide-react';

interface CellDetailModalProps {
  slot: SlotData | null;
  onClose: () => void;
  auditFinding?: AuditFinding;
  onSaveAudit: (finding: AuditFinding) => void;
  onClearAudit: (ubicacion: string) => void;
}

export const CellDetailModal: React.FC<CellDetailModalProps> = ({
  slot,
  onClose,
  auditFinding,
  onSaveAudit,
  onClearAudit,
}) => {
  if (!slot) return null;

  const [physicalPallets, setPhysicalPallets] = useState<number>(
    auditFinding ? auditFinding.physicalPallets : slot.palletCount
  );
  const [physicalMaterial, setPhysicalMaterial] = useState<string>(
    auditFinding?.physicalMaterial || slot.materialCode || ''
  );
  const [physicalLote, setPhysicalLote] = useState<string>(
    auditFinding?.physicalLote || (slot.items[0]?.lote || '')
  );
  const [discrepancyType, setDiscrepancyType] = useState<DiscrepancyType>(
    auditFinding ? auditFinding.discrepancyType : 'NONE'
  );
  const [notes, setNotes] = useState<string>(auditFinding?.notes || '');

  // Quick preset buttons
  const handleSetConforme = () => {
    setDiscrepancyType('NONE');
    setPhysicalPallets(slot.palletCount);
    setPhysicalMaterial(slot.materialCode || '');
    setPhysicalLote(slot.items[0]?.lote || '');
  };

  const handleSetFalta = () => {
    setDiscrepancyType('FALTA_FISICA');
    setPhysicalPallets(0);
  };

  const handleSetSobra = () => {
    setDiscrepancyType('SOBRA_FISICA');
    setPhysicalPallets(Math.max(1, slot.palletCount + 1));
  };

  const handleSetLoteDistinto = () => {
    setDiscrepancyType('LOTE_DISTINTO');
  };

  const handleSave = () => {
    onSaveAudit({
      ubicacion: slot.ubicacion,
      rackId: slot.rackId,
      systemPallets: slot.palletCount,
      physicalPallets,
      systemMaterial: slot.materialCode,
      physicalMaterial: physicalMaterial || undefined,
      systemLote: slot.items[0]?.lote,
      physicalLote: physicalLote || undefined,
      discrepancyType,
      notes: notes.trim() || undefined,
      timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
              slot.isEmpty ? 'bg-slate-800 text-slate-300' : 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white font-mono tracking-wide">
                  {slot.ubicacion}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  slot.isEmpty ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {slot.isEmpty ? 'ESPACIO VACÍO' : `${slot.palletCount} PALLET(S)`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rack {slot.rackId} • Módulo {slot.colNumber} ({slot.moduloStr}) • Nivel {slot.nivel}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Slot System Details */}
          {!slot.isEmpty ? (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Material Sistémico
                  </span>
                  <div className="text-base font-extrabold text-white flex items-center gap-2">
                    <span className="text-cyan-400">{slot.materialCode}</span>
                    <span>-</span>
                    <span>{slot.items[0]?.descripcion || 'Sin descripción'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Unidades
                  </span>
                  <div className="text-base font-black text-emerald-400">
                    {slot.totalStock.toLocaleString()} {slot.items[0]?.unidad || 'UN'}
                  </div>
                </div>
              </div>

              {/* Table of Lots */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                      <th className="py-1.5 px-2">Lote</th>
                      <th className="py-1.5 px-2">Stock</th>
                      <th className="py-1.5 px-2">F. Caducidad</th>
                      <th className="py-1.5 px-2">Peso (kg)</th>
                      <th className="py-1.5 px-2">Tipo Alm.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {slot.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60 text-slate-200">
                        <td className="py-2 px-2 font-bold text-cyan-300">{it.lote || '—'}</td>
                        <td className="py-2 px-2 font-semibold text-emerald-300">{it.stockDisponible} {it.unidad}</td>
                        <td className="py-2 px-2">{it.fechaCaducidad || '—'}</td>
                        <td className="py-2 px-2">{it.peso ? it.peso.toFixed(2) : '—'}</td>
                        <td className="py-2 px-2 font-sans text-slate-400">{it.tipoAlmacen || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center py-6">
              <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">Posición vacía en el sistema SAP</p>
              <p className="text-xs text-slate-500">No hay stock ni pallets asignados a esta ubicación.</p>
            </div>
          )}

          {/* Toma de Auditoría en Terreno */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Verificación de Auditoría Física
                </h4>
              </div>
              {auditFinding && (
                <button
                  onClick={() => { onClearAudit(slot.ubicacion); onClose(); }}
                  className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                >
                  Eliminar registro
                </button>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleSetConforme}
                className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  discrepancyType === 'NONE'
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Conforme</span>
              </button>

              <button
                type="button"
                onClick={handleSetFalta}
                className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  discrepancyType === 'FALTA_FISICA'
                    ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileWarning className="w-4 h-4 text-rose-400" />
                <span>Falta Física</span>
              </button>

              <button
                type="button"
                onClick={handleSetSobra}
                className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  discrepancyType === 'SOBRA_FISICA'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Sobra Física</span>
              </button>

              <button
                type="button"
                onClick={handleSetLoteDistinto}
                className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  discrepancyType === 'LOTE_DISTINTO'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md shadow-blue-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Tag className="w-4 h-4 text-blue-400" />
                <span>Lote/Cod Dif.</span>
              </button>
            </div>

            {/* Inputs for discrepancies */}
            {discrepancyType !== 'NONE' && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Pallets Físicos
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={physicalPallets}
                      onChange={e => setPhysicalPallets(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Código Físico
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 2713"
                      value={physicalMaterial}
                      onChange={e => setPhysicalMaterial(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Lote Físico
                    </label>
                    <input
                      type="text"
                      placeholder="Lote..."
                      value={physicalLote}
                      onChange={e => setPhysicalLote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Observación / Detalle de la Discrepancia
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Se encontró pallet con etiqueta rota, material distinto al sistémico..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            Guardar Verificación
          </button>
        </div>
      </div>
    </div>
  );
};
