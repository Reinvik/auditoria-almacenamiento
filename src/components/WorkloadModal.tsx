import React, { useState, useMemo } from 'react';
import { 
  WarehouseZone, 
  AuditorAssignment, 
  WorkloadDistributionConfig, 
  BalanceMetric,
  PartitionMode,
  StockItem 
} from '../types/warehouse';
import { 
  calculateOptimalWorkloadDistribution, 
  generateWorkloadShareText,
  getAislesForZone,
  getRacksForZone
} from '../utils/workloadDistributor';
import { 
  Users, 
  Scale, 
  Copy, 
  Check, 
  X, 
  Share2, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Sliders,
  Snowflake,
  Flame,
  Building2,
  Box,
  SplitSquareVertical
} from 'lucide-react';

interface WorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockIndex: Map<string, StockItem[]>;
  currentConfig: WorkloadDistributionConfig | null;
  onSaveConfig: (config: WorkloadDistributionConfig) => void;
  activeAuditorId: number | null;
  onSelectAuditor: (id: number | null) => void;
}

export const WorkloadModal: React.FC<WorkloadModalProps> = ({
  isOpen,
  onClose,
  stockIndex,
  currentConfig,
  onSaveConfig,
  activeAuditorId,
  onSelectAuditor,
}) => {
  // Configuración interactiva dentro del modal
  const [selectedZone, setSelectedZone] = useState<WarehouseZone>(() => currentConfig?.zone || 'REFRIGERADO');
  const [auditorCount, setAuditorCount] = useState<number>(() => currentConfig?.auditorCount || 2);
  const [balanceMetric, setBalanceMetric] = useState<BalanceMetric>(() => currentConfig?.balanceMetric || 'effortPoints');
  const [partitionMode, setPartitionMode] = useState<PartitionMode>(() => currentConfig?.partitionMode || 'by_aisles');
  const [copied, setCopied] = useState(false);

  // Calcular pasillos o racks disponibles según el modo
  const availableUnits = useMemo(() => {
    return partitionMode === 'by_racks'
      ? getRacksForZone(selectedZone)
      : getAislesForZone(selectedZone);
  }, [selectedZone, partitionMode]);

  const maxAuditors = Math.min(8, availableUnits.length);
  const validAuditorCount = Math.max(1, Math.min(auditorCount, maxAuditors));

  // Calcular en tiempo real la distribución óptima
  const calculatedConfig = useMemo(() => {
    return calculateOptimalWorkloadDistribution(
      selectedZone,
      validAuditorCount,
      balanceMetric,
      stockIndex,
      partitionMode
    );
  }, [selectedZone, validAuditorCount, balanceMetric, stockIndex, partitionMode]);

  if (!isOpen) return null;

  const handleCopyShareText = () => {
    const text = generateWorkloadShareText(calculatedConfig);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApplyAndClose = () => {
    onSaveConfig(calculatedConfig);
    onClose();
  };

  const handleSelectMyAuditor = (auditorId: number) => {
    onSaveConfig(calculatedConfig);
    onSelectAuditor(auditorId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[94vh]">
        {/* Header CIAL */}
        <div className="bg-[#0a5c36] text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-[#08482a]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#08482a] rounded-xl text-emerald-300 ring-1 ring-white/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide leading-tight">
                REPARTO JUSTO DE AUDITORÍA
              </h2>
              <p className="text-xs text-emerald-200/90 font-medium">
                Puntaje de esfuerzo: 1 pt simple • 2 pts doble • +100 pts por rack recorrido • 0 pts vacías
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#08482a] text-emerald-200 hover:text-white hover:bg-[#063a21] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* 1. Selector de Zona / Cámara */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              1. Selecciona la Cámara o Sector a Auditar
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedZone('REFRIGERADO');
                  setAuditorCount(2);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedZone === 'REFRIGERADO'
                    ? 'border-[#0a5c36] bg-[#e6f4ea] ring-2 ring-[#0a5c36]/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">🧊</span>
                  {selectedZone === 'REFRIGERADO' && (
                    <CheckCircle2 className="w-4 h-4 text-[#0a5c36]" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-900 leading-tight">
                  Refrigerado
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  Racks 9 al 29 (Pasillos 5-15)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedZone('CONGELADO');
                  setAuditorCount(1);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedZone === 'CONGELADO'
                    ? 'border-[#0a5c36] bg-[#e6f4ea] ring-2 ring-[#0a5c36]/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">❄️</span>
                  {selectedZone === 'CONGELADO' && (
                    <CheckCircle2 className="w-4 h-4 text-[#0a5c36]" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-900 leading-tight">
                  Congelado
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  Racks 1 al 8 (Pasillos 1-4)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedZone('ALL');
                  setAuditorCount(3);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedZone === 'ALL'
                    ? 'border-[#0a5c36] bg-[#e6f4ea] ring-2 ring-[#0a5c36]/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">🏢</span>
                  {selectedZone === 'ALL' && (
                    <CheckCircle2 className="w-4 h-4 text-[#0a5c36]" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-900 leading-tight">
                  Todo el CD
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  Racks 1 al 29 (Pasillos 1-15)
                </span>
              </button>
            </div>
          </div>

          {/* 2. Cantidad de Auditores y Modo de Partición */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {/* Control de Auditores */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                2. Número de Auditores ({selectedZone === 'CONGELADO' ? 'Normalmente 1' : 'Variable'})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuditorCount(prev => Math.max(1, prev - 1))}
                  disabled={auditorCount <= 1}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-800 font-black text-base hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center cursor-pointer shadow-xs"
                >
                  -
                </button>
                <div className="flex-1 bg-white border border-slate-300 rounded-xl py-1.5 px-3 flex items-center justify-center gap-2 shadow-inner">
                  <Users className="w-4 h-4 text-[#0a5c36]" />
                  <span className="text-lg font-black text-[#0a5c36]">
                    {validAuditorCount}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">
                    {validAuditorCount === 1 ? 'persona' : 'auditores'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuditorCount(prev => Math.min(maxAuditors, prev + 1))}
                  disabled={auditorCount >= maxAuditors}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-800 font-black text-base hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center cursor-pointer shadow-xs"
                >
                  +
                </button>
              </div>

              {/* Botones rápidos */}
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].filter(n => n <= maxAuditors).map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAuditorCount(n)}
                    className={`flex-1 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                      validAuditorCount === n
                        ? 'bg-[#0a5c36] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Modo de División (Pasillos vs Racks) */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Modo de División
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setPartitionMode('by_aisles')}
                  className={`w-full px-3 py-1.5 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    partitionMode === 'by_aisles'
                      ? 'bg-[#0a5c36] text-white border-[#08482a] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <SplitSquareVertical className="w-3.5 h-3.5" />
                    <span>Por Pasillos Contiguos</span>
                  </div>
                  <span className="text-[10px] font-black opacity-80">(Recomendado)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPartitionMode('by_racks')}
                  className={`w-full px-3 py-1.5 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    partitionMode === 'by_racks'
                      ? 'bg-[#0a5c36] text-white border-[#08482a] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5" />
                    <span>Por Racks Individuales</span>
                  </div>
                  <span className="text-[10px] font-black opacity-80">(Balance Milimétrico)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Métrica de Balance */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              3. Criterio de Equilibrio de Carga
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBalanceMetric('effortPoints')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  balanceMetric === 'effortPoints'
                    ? 'border-[#0a5c36] bg-[#e6f4ea] ring-2 ring-[#0a5c36]/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-[#0a5c36]">
                      ⭐ Puntos de Esfuerzo
                    </span>
                    {balanceMetric === 'effortPoints' && (
                      <CheckCircle2 className="w-4 h-4 text-[#0a5c36]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 font-bold leading-tight">
                    Simple = 1 pt • Doble = 2 pts • +100 pts x rack
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block">
                  Vacías = 0 pts • Recorrido compensado
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBalanceMetric('occupiedSlots')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  balanceMetric === 'occupiedSlots'
                    ? 'border-[#0a5c36] bg-[#e6f4ea] ring-2 ring-[#0a5c36]/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-900">
                      Celdas con Stock
                    </span>
                    {balanceMetric === 'occupiedSlots' && (
                      <CheckCircle2 className="w-4 h-4 text-[#0a5c36]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 font-bold leading-tight">
                    Solo celdas con carga SAP
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block">
                  Sin diferenciar 1 o 2 pallets
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBalanceMetric('totalSlots')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  balanceMetric === 'totalSlots'
                    ? 'border-[#0a5c36] bg-[#e6f4ea] ring-2 ring-[#0a5c36]/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-900">
                      Huecos Totales
                    </span>
                    {balanceMetric === 'totalSlots' && (
                      <CheckCircle2 className="w-4 h-4 text-[#0a5c36]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 font-bold leading-tight">
                    Capacidad física del rack
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block">
                  Incluye vacías y ocupadas por igual
                </span>
              </button>
            </div>
          </div>

          {/* 4. Tarjetas de Asignación Resultantes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Asignación Equitativa Calculada ({calculatedConfig.assignments.length} auditores)
              </label>
              <span className="text-[11px] text-slate-500 font-bold">
                {partitionMode === 'by_aisles' ? 'Pasillos contiguos (no se cruzan)' : 'Racks continuos'}
              </span>
            </div>

            <div className="space-y-2.5">
              {calculatedConfig.assignments.map(assignment => {
                const isMe = activeAuditorId === assignment.id;
                const aislesStr = assignment.aisleIds.length === 1 
                  ? `Pasillo ${assignment.aisleIds[0]}` 
                  : `Pasillos ${assignment.aisleIds.join(', ')}`;
                
                const firstRack = assignment.rackIds[0];
                const lastRack = assignment.rackIds[assignment.rackIds.length - 1];
                const racksStr = firstRack === lastRack 
                  ? `Rack ${firstRack}` 
                  : `Racks ${firstRack} al ${lastRack}`;

                return (
                  <div 
                    key={assignment.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#0a5c36]/50 transition-all shadow-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-7 h-7 rounded-xl text-white font-black text-xs flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: assignment.color }}
                        >
                          #{assignment.id}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">
                              {assignment.name}
                            </span>
                            {isMe && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#0a5c36] border border-emerald-300">
                                Tu Asignación
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-[#0a5c36]">
                            🚪 {aislesStr} • 🏗️ {racksStr}
                          </span>
                        </div>
                      </div>

                      {/* Botón rápido "Soy este Auditor" */}
                      <button
                        type="button"
                        onClick={() => handleSelectMyAuditor(assignment.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isMe
                            ? 'bg-[#0a5c36] text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-[#e6f4ea] text-slate-700 hover:text-[#0a5c36] border border-slate-200'
                        }`}
                        title="Fijar este auditor como tu usuario activo en la app"
                      >
                        {isMe ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Seleccionado</span>
                          </>
                        ) : (
                          <>
                            <span>Soy Auditor {assignment.id}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Puntaje de Esfuerzo y Desglose */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-[#0a5c36] text-sm">
                            🎯 {assignment.effortPoints.toLocaleString()} pts
                          </span>
                          <span className="text-slate-400 font-bold">•</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#08482a] font-black text-[11px]">
                            {assignment.percentage}% del total
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-700 font-bold">
                          <span>
                            📦 <strong>{(assignment.palletPoints ?? (assignment.effortPoints - assignment.rackIds.length * 100)).toLocaleString()} pts</strong> pallets
                          </span>
                          <span>+</span>
                          <span>
                            🚶‍♂️ <strong>{(assignment.travelPoints ?? (assignment.rackIds.length * 100)).toLocaleString()} pts</strong> recorrido ({assignment.rackIds.length} racks)
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 font-semibold border-t border-slate-200/60 pt-1">
                        <span>
                          🟢 <strong className="text-slate-900 font-black">{assignment.singlePalletSlots}</strong> simples (1pt)
                        </span>
                        <span>•</span>
                        <span>
                          🟣 <strong className="text-slate-900 font-black">{assignment.doublePalletSlots}</strong> dobles (2pt)
                        </span>
                        <span>•</span>
                        <span>
                          🚶‍♂️ <strong className="text-slate-900 font-black">{assignment.rackIds.length}</strong> racks (+100 pts c/u)
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">
                          ⬛ {assignment.emptySlots} vacías (0pt)
                        </span>
                      </div>
                    </div>

                    {/* Barra de Porcentaje */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, assignment.percentage)}%`,
                          backgroundColor: assignment.color 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyShareText}
            className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-emerald-50 text-slate-800 border border-slate-300 hover:border-[#0a5c36] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">¡Copiado para WhatsApp!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[#0a5c36]" />
                <span>Copiar Plan para WhatsApp / Correo</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeAuditorId !== null && (
              <button
                type="button"
                onClick={() => {
                  onSelectAuditor(null);
                  onClose();
                }}
                className="flex-1 sm:flex-none px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Ver Todo (Quitar Filtro)
              </button>
            )}
            <button
              type="button"
              onClick={handleApplyAndClose}
              className="flex-1 sm:flex-none px-5 py-2 bg-[#0a5c36] hover:bg-[#08482a] text-white rounded-xl text-xs font-black shadow-md shadow-emerald-950/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Activar Distribución</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
