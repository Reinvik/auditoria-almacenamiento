import React, { useState, useMemo } from 'react';
import { 
  WarehouseZone, 
  AuditorAssignment, 
  WorkloadDistributionConfig, 
  StockItem 
} from '../types/warehouse';
import { 
  calculateOptimalWorkloadDistribution, 
  generateWorkloadShareText,
  getAislesForZone
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
  Building2
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
  // Configuración local interactiva dentro del modal
  const [selectedZone, setSelectedZone] = useState<WarehouseZone>(() => currentConfig?.zone || 'REFRIGERADO');
  const [auditorCount, setAuditorCount] = useState<number>(() => currentConfig?.auditorCount || 2);
  const [balanceMetric, setBalanceMetric] = useState<'totalSlots' | 'occupiedSlots' | 'totalPallets'>(
    () => currentConfig?.balanceMetric || 'totalSlots'
  );
  const [copied, setCopied] = useState(false);

  // Calcular pasillos disponibles en la zona seleccionada
  const availableAisles = useMemo(() => getAislesForZone(selectedZone), [selectedZone]);
  const maxAuditors = Math.min(8, availableAisles.length);

  // Asegurar que auditorCount esté dentro del rango
  const validAuditorCount = Math.max(1, Math.min(auditorCount, maxAuditors));

  // Calcular en tiempo real la distribución óptima
  const calculatedConfig = useMemo(() => {
    return calculateOptimalWorkloadDistribution(
      selectedZone,
      validAuditorCount,
      balanceMetric,
      stockIndex
    );
  }, [selectedZone, validAuditorCount, balanceMetric, stockIndex]);

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
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh]">
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
                Distribución equitativa por posiciones a auditar en terreno
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
                  Pasillos 9 al 15 (13 Racks)
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
                  Pasillos 1 al 8 (16 Racks)
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
                  Pasillos 1 al 15 (29 Racks)
                </span>
              </button>
            </div>
          </div>

          {/* 2. Cantidad de Auditores & Métrica de Balance */}
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

            {/* Métrica de Balance */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                3. Equilibrar Reparto por
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setBalanceMetric('totalSlots')}
                  className={`w-full px-3 py-1.5 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    balanceMetric === 'totalSlots'
                      ? 'bg-[#0a5c36] text-white border-[#08482a] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>Posiciones Físicas (Huecos en Altura)</span>
                  <span className="text-[10px] font-black opacity-80">(Recomendado)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceMetric('occupiedSlots')}
                  className={`w-full px-3 py-1.5 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    balanceMetric === 'occupiedSlots'
                      ? 'bg-[#0a5c36] text-white border-[#08482a] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>Posiciones con Stock (Celdas SAP)</span>
                  <span className="text-[10px] font-black opacity-80">(Por Carga)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceMetric('totalPallets')}
                  className={`w-full px-3 py-1.5 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    balanceMetric === 'totalPallets'
                      ? 'bg-[#0a5c36] text-white border-[#08482a] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>Total Pallets Registrados</span>
                  <span className="text-[10px] font-black opacity-80">(x1 y x2)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Tarjetas de Asignación Resultantes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Asignación Equitativa Calculada ({calculatedConfig.assignments.length} bloques)
              </label>
              <span className="text-[11px] text-slate-500 font-bold">
                Pasillos contiguos para no cruzarse
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

                    {/* Barra de Porcentaje y Carga */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>
                          <strong className="text-slate-900 font-black">{assignment.totalSlots.toLocaleString()}</strong> posiciones a auditar
                        </span>
                        <span className="text-slate-500 font-semibold">
                          {assignment.occupiedSlots.toLocaleString()} con carga ({assignment.totalPallets.toLocaleString()} pallets) • <strong className="text-[#0a5c36]">{assignment.percentage}%</strong>
                        </span>
                      </div>

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
