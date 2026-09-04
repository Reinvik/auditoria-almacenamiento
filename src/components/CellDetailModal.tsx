import React, { useState } from 'react';
import { SlotData, AuditFinding, DiscrepancyType } from '../types/warehouse';
import { 
  X, 
  Package, 
  MapPin, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  FileWarning, 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-300 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header con Verde CIAL */}
        <div className="bg-[#0a5c36] text-white px-5 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
              slot.isEmpty ? 'bg-[#08482a] text-emerald-200' : 'bg-white text-[#0a5c36] shadow-sm'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black font-mono tracking-wide">
                  {slot.ubicacion}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                  slot.isEmpty ? 'bg-black text-white' : 'bg-emerald-300 text-emerald-950 shadow-xs'
                }`}>
                  {slot.isEmpty ? 'ESPACIO VACÍO' : `${slot.palletCount} PALLET(S)`}
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Rack {slot.rackId} • Módulo {slot.colNumber} ({slot.moduloStr}) • Nivel {slot.nivel}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Slot System Details */}
          {!slot.isEmpty ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Material Sistémico
                  </span>
                  <div className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span className="text-[#0a5c36]">{slot.materialCode}</span>
                    <span>-</span>
                    <span>{slot.items[0]?.descripcion || 'Sin descripción'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Unidades
                  </span>
                  <div className="text-base font-black text-[#0a5c36]">
                    {slot.totalStock.toLocaleString()} {slot.items[0]?.unidad || 'UN'}
                  </div>
                </div>
              </div>

              {/* Table of Lots */}
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse bg-white rounded-lg overflow-hidden border border-slate-200">
                  <thead className="bg-[#e6f4ea] text-[#08482a] text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3">Lote</th>
                      <th className="py-2 px-3">Stock</th>
                      <th className="py-2 px-3">F. Caducidad</th>
                      <th className="py-2 px-3">Peso (kg)</th>
                      <th className="py-2 px-3">Tipo Alm.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                    {slot.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-[#0a5c36]">{it.lote || '—'}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{it.stockDisponible} {it.unidad}</td>
                        <td className="py-2 px-3">{it.fechaCaducidad || '—'}</td>
                        <td className="py-2 px-3">{it.peso ? it.peso.toFixed(2) : '—'}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">{it.tipoAlmacen || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
              <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">Posición vacía en el sistema SAP</p>
              <p className="text-xs text-slate-500">No hay stock ni pallets asignados a esta ubicación.</p>
            </div>
          )}

          {/* Toma de Auditoría en Terreno */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#0a5c36]" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Verificación de Auditoría Física
                </h4>
              </div>
              {auditFinding && (
                <button
                  onClick={() => { onClearAudit(slot.ubicacion); onClose(); }}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Eliminar verificación
                </button>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleSetConforme}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  discrepancyType === 'NONE'
                    ? 'bg-[#e6f4ea] border-[#0a5c36] text-[#08482a] shadow-sm ring-2 ring-[#a3cfb6]'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Conforme</span>
              </button>

              <button
                type="button"
                onClick={handleSetFalta}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  discrepancyType === 'FALTA_FISICA'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm ring-2 ring-rose-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <FileWarning className="w-4 h-4 text-rose-600" />
                <span>Falta Física</span>
              </button>

              <button
                type="button"
                onClick={handleSetSobra}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  discrepancyType === 'SOBRA_FISICA'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm ring-2 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Sobra Física</span>
              </button>

              <button
                type="button"
                onClick={handleSetLoteDistinto}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  discrepancyType === 'LOTE_DISTINTO'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm ring-2 ring-blue-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Lote/Cod Dif.</span>
              </button>
            </div>

            {/* Inputs for discrepancies */}
            {discrepancyType !== 'NONE' && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Pallets Físicos
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={physicalPallets}
                      onChange={e => setPhysicalPallets(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Código Físico
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 2713"
                      value={physicalMaterial}
                      onChange={e => setPhysicalMaterial(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Lote Físico
                    </label>
                    <input
                      type="text"
                      placeholder="Lote..."
                      value={physicalLote}
                      onChange={e => setPhysicalLote(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Observación / Detalle de la Discrepancia
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Se encontró pallet con etiqueta deteriorada, diferencia de bultos..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-black bg-[#0a5c36] hover:bg-[#08482a] text-white shadow-md transition-all cursor-pointer"
          >
            Guardar Verificación
          </button>
        </div>
      </div>
    </div>
  );
};
