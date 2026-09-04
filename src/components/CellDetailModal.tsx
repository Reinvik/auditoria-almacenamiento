import React, { useState, useEffect } from 'react';
import { SlotData, AuditFinding, DiscrepancyType, computeDifferenceLabel } from '../types/warehouse';
import { 
  X, 
  Package, 
  MapPin, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  FileWarning, 
  ClipboardCheck,
  Plus,
  Minus,
  Check
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

  const [physicalPallets, setPhysicalPallets] = useState<number>(() => {
    if (auditFinding !== undefined) return auditFinding.physicalPallets;
    return slot.palletCount;
  });

  const [physicalMaterial, setPhysicalMaterial] = useState<string>(() => {
    return auditFinding?.physicalMaterial || slot.materialCode || '';
  });

  const [physicalLote, setPhysicalLote] = useState<string>(() => {
    return auditFinding?.physicalLote || (slot.items[0]?.lote || '');
  });

  const [isLoteDistinto, setIsLoteDistinto] = useState<boolean>(() => {
    return auditFinding?.discrepancyType === 'LOTE_DISTINTO';
  });

  const [notes, setNotes] = useState<string>(() => auditFinding?.notes || '');

  // Reset state when slot changes
  useEffect(() => {
    if (auditFinding) {
      setPhysicalPallets(auditFinding.physicalPallets);
      setPhysicalMaterial(auditFinding.physicalMaterial || slot.materialCode || '');
      setPhysicalLote(auditFinding.physicalLote || (slot.items[0]?.lote || ''));
      setIsLoteDistinto(auditFinding.discrepancyType === 'LOTE_DISTINTO');
      setNotes(auditFinding.notes || '');
    } else {
      setPhysicalPallets(slot.palletCount);
      setPhysicalMaterial(slot.materialCode || '');
      setPhysicalLote(slot.items[0]?.lote || '');
      setIsLoteDistinto(false);
      setNotes('');
    }
  }, [slot.ubicacion, auditFinding]);

  // Compute live difference description (e.g. "Falta 1 de 2", "Falta 2 de 2")
  const currentDiff = computeDifferenceLabel(
    slot.palletCount,
    physicalPallets,
    isLoteDistinto ? 'LOTE_DISTINTO' : undefined
  );

  const handleSave = () => {
    const calculated = computeDifferenceLabel(
      slot.palletCount,
      physicalPallets,
      isLoteDistinto ? 'LOTE_DISTINTO' : undefined
    );

    onSaveAudit({
      ubicacion: slot.ubicacion,
      rackId: slot.rackId,
      systemPallets: slot.palletCount,
      physicalPallets,
      differenceDetail: calculated.differenceDetail,
      badgeLabel: calculated.badgeLabel,
      systemMaterial: slot.materialCode,
      physicalMaterial: physicalMaterial || undefined,
      systemLote: slot.items[0]?.lote,
      physicalLote: physicalLote || undefined,
      discrepancyType: calculated.type,
      notes: notes.trim() || undefined,
      timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Mobile Drawer / Desktop Dialog */}
      <div className="bg-white border border-slate-300 w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all">
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden w-full flex justify-center pt-2 pb-1 bg-[#0a5c36]">
          <div className="w-12 h-1.5 rounded-full bg-white/40" />
        </div>

        {/* Header con Verde CIAL */}
        <div className="bg-[#0a5c36] text-white px-5 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-mono font-bold text-sm ${
              slot.isEmpty ? 'bg-[#08482a] text-emerald-200' : 'bg-white text-[#0a5c36] shadow-sm'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black font-mono tracking-wide">
                  {slot.ubicacion}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                  slot.isEmpty ? 'bg-black text-white' : 'bg-emerald-300 text-emerald-950 shadow-xs'
                }`}>
                  {slot.isEmpty ? 'ESPACIO VACÍO' : `${slot.palletCount} PALLET(S) SISTÉMICOS`}
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Rack {slot.rackId} • Módulo {slot.colNumber} ({slot.moduloStr}) • Nivel {slot.nivel}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Material & Lote Sistémico */}
          {!slot.isEmpty ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Material Sistémico
                  </span>
                  <div className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-[#e6f4ea] text-[#08482a] font-mono border border-[#a3cfb6]">
                      {slot.materialCode}
                    </span>
                    <span>{slot.items[0]?.descripcion || 'Sin descripción'}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Stock
                  </span>
                  <div className="text-sm font-black text-[#0a5c36]">
                    {slot.totalStock.toLocaleString()} {slot.items[0]?.unidad || 'UN'}
                  </div>
                </div>
              </div>

              {/* Lotes summary chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs font-mono">
                <span className="text-[10px] font-sans font-bold text-slate-400">LOTES:</span>
                {slot.items.map((it, idx) => (
                  <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-bold">
                    {it.lote} ({it.stockDisponible} {it.unidad})
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <Package className="w-7 h-7 text-slate-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-700">Espacio Vacío en el Sistema SAP</p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CONTROL DE DIFERENCIAS TÁCTIL (FALTA 1 DE 2, 2 DE 2, ETC.)     */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="border border-slate-200 bg-slate-50/80 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#0a5c36]" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Verificación Física de Altura
                </h4>
              </div>
              {auditFinding && (
                <button
                  onClick={() => { onClearAudit(slot.ubicacion); onClose(); }}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Borrar auditoría
                </button>
              )}
            </div>

            {/* Selector de Cantidad Física con Stepper Táctil */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Pallets Físicos en Rack:
                  </span>
                  <div className="text-xs font-semibold text-slate-600">
                    Sistémico: <strong className="text-slate-900">{slot.palletCount}</strong> pallet(s)
                  </div>
                </div>

                {/* Touch Stepper for thumbs */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPhysicalPallets(prev => Math.max(0, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 flex items-center justify-center font-bold transition-all cursor-pointer border border-slate-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="w-14 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg font-mono shadow-inner">
                    {physicalPallets}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPhysicalPallets(prev => prev + 1)}
                    className="w-10 h-10 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] active:scale-95 text-white flex items-center justify-center font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live Difference Badge Indicator */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Estado resultante:</span>
                <span className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-xs flex items-center gap-1 ${
                  currentDiff.type === 'NONE'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : currentDiff.type === 'FALTA_FISICA'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {currentDiff.type === 'NONE' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                  {currentDiff.type === 'FALTA_FISICA' && <FileWarning className="w-3.5 h-3.5 text-rose-700" />}
                  {currentDiff.type === 'SOBRA_FISICA' && <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />}
                  <span>{currentDiff.differenceDetail.toUpperCase()}</span>
                </span>
              </div>
            </div>

            {/* BOTONES RÁPIDOS DE 1-TAP SEGÚN CANTIDAD (FALTA 1 DE 2, FALTA 2 DE 2) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Opciones directas de 1 toque:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Botón CONFORME */}
                <button
                  type="button"
                  onClick={() => {
                    setPhysicalPallets(slot.palletCount);
                    setIsLoteDistinto(false);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    physicalPallets === slot.palletCount && !isLoteDistinto
                      ? 'bg-[#e6f4ea] border-[#0a5c36] text-[#08482a] ring-2 ring-[#a3cfb6]'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {slot.palletCount === 0 ? 'Conforme (Vacío)' : `Conforme (${slot.palletCount} de ${slot.palletCount})`}
                  </span>
                </button>

                {/* 2. Botón FALTA 1 DE 2 (si sistémico >= 2) */}
                {slot.palletCount >= 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhysicalPallets(slot.palletCount - 1);
                      setIsLoteDistinto(false);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      physicalPallets === slot.palletCount - 1 && !isLoteDistinto
                        ? 'bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-300'
                        : 'bg-white border-slate-300 text-amber-800 hover:bg-amber-50'
                    }`}
                  >
                    <FileWarning className="w-4 h-4 text-amber-600" />
                    <span>Falta 1 de {slot.palletCount} (Físico {slot.palletCount - 1})</span>
                  </button>
                )}

                {/* 3. Botón FALTA TOTAL (2 de 2 o 1 de 1 -> VACÍO) */}
                {slot.palletCount >= 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhysicalPallets(0);
                      setIsLoteDistinto(false);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      physicalPallets === 0 && !isLoteDistinto
                        ? 'bg-rose-100 border-rose-500 text-rose-950 ring-2 ring-rose-300'
                        : 'bg-white border-slate-300 text-rose-800 hover:bg-rose-50'
                    }`}
                  >
                    <FileWarning className="w-4 h-4 text-rose-600" />
                    <span>Falta {slot.palletCount} de {slot.palletCount} (Vacío)</span>
                  </button>
                )}

                {/* 4. Si sistémico es 0 (vacío), botones para sobra */}
                {slot.palletCount === 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setPhysicalPallets(1);
                        setIsLoteDistinto(false);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        physicalPallets === 1 && !isLoteDistinto
                          ? 'bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-300'
                          : 'bg-white border-slate-300 text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Sobra 1 Pallet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhysicalPallets(2);
                        setIsLoteDistinto(false);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        physicalPallets === 2 && !isLoteDistinto
                          ? 'bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-300'
                          : 'bg-white border-slate-300 text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Sobra 2 Pallets</span>
                    </button>
                  </>
                )}

                {/* 5. Botón LOTE/CÓDIGO DISTINTO */}
                <button
                  type="button"
                  onClick={() => setIsLoteDistinto(prev => !prev)}
                  className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isLoteDistinto
                      ? 'bg-blue-100 border-blue-500 text-blue-950 ring-2 ring-blue-300'
                      : 'bg-white border-slate-300 text-blue-800 hover:bg-blue-50'
                  }`}
                >
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span>{isLoteDistinto ? '✓ Lote Distinto' : 'Marcar Lote Distinto'}</span>
                </button>
              </div>
            </div>

            {/* Inputs de detalle de discrepancia si aplica */}
            {(currentDiff.type !== 'NONE' || isLoteDistinto) && (
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Código Físico Observado
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 2713"
                      value={physicalMaterial}
                      onChange={e => setPhysicalMaterial(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Lote Físico Observado
                    </label>
                    <input
                      type="text"
                      placeholder="Lote..."
                      value={physicalLote}
                      onChange={e => setPhysicalLote(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Observación de la Diferencia
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Posición con 1 pallet menos; pallet reubicado..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions (Optimized for Large Touch Targets) */}
        <div className="bg-slate-50 px-4 sm:px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-initial px-4 py-3 sm:py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer text-center"
          >
            Cerrar
          </button>
          <button
            onClick={handleSave}
            className="flex-2 sm:flex-initial px-6 py-3.5 sm:py-2.5 rounded-xl text-xs font-black bg-[#0a5c36] hover:bg-[#08482a] active:scale-98 text-white shadow-md shadow-emerald-950/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Verificación</span>
          </button>
        </div>
      </div>
    </div>
  );
};
