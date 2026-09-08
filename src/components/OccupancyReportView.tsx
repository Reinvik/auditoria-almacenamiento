import React, { useState, useMemo } from 'react';
import { StockItem } from '../types/warehouse';
import { 
  calculateWarehouseOccupancy, 
  calculateExcelPivotSummary,
  getOccupancyHistory, 
  saveOccupancyHistory, 
  formatCurrentDateLabel,
  OccupancyHistoryPoint,
  INITIAL_OCCUPANCY_HISTORY,
  ExcelOccupancySummary,
  ExcelPivotRow
} from '../utils/occupancyCalculator';
import cialLogo from '../assets/cial-alimentos-logo.png';
import { 
  Camera, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Check, 
  Snowflake, 
  TrendingUp, 
  Layers, 
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Download,
  FileSpreadsheet,
  Boxes,
  Copy,
  Table
} from 'lucide-react';

interface OccupancyReportViewProps {
  stockIndex: Map<string, StockItem[]>;
  onBackToRacks?: () => void;
}

export const OccupancyReportView: React.FC<OccupancyReportViewProps> = ({
  stockIndex,
  onBackToRacks,
}) => {
  // Selector de Criterio de Medición: 'EXCEL' (Ubicaciones Físicas) o 'OPERATIVO' (Posiciones de Pallet)
  const [calculationMode, setCalculationMode] = useState<'EXCEL' | 'OPERATIVO'>('EXCEL');
  const [copiedTable, setCopiedTable] = useState<boolean>(false);

  // 1. Cálculo en tiempo real con la data cargada (Criterio Operativo por Posiciones de Pallet)
  const currentSummary = useMemo(() => {
    return calculateWarehouseOccupancy(stockIndex);
  }, [stockIndex]);

  // 2. Cálculo en tiempo real bajo Criterio Clásico de Excel (Ubicaciones Físicas / Huecos)
  const excelSummary = useMemo(() => {
    return calculateExcelPivotSummary(stockIndex);
  }, [stockIndex]);

  // 3. Historial de ocupación diario
  const [history, setHistory] = useState<OccupancyHistoryPoint[]>(() => getOccupancyHistory());
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CONGELADOS' | 'REFRIGERADOS'>('ALL');
  const [showRackMatrix, setShowRackMatrix] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<OccupancyHistoryPoint | null>(null);

  // Formateador de porcentajes con coma chilena (ej: 81,5%)
  const formatPct = (val: number) => `${val.toFixed(1).replace('.', ',')}%`;

  // Copiar Tabla Dinámica de Excel al Portapapeles (formato TSV para pegar directo en Excel)
  const handleCopyExcelTable = () => {
    const headers = [
      'Etiquetas de fila',
      'Suma de Ubicaciones simples vacías disponibles',
      'Suma de Ubicaciones dobles vacías disponibles',
      'Suma de Ubicaciones triples, vacías disponibles',
      'TOTAL',
      '%  OCUPACIÓN',
      'Ubicaciones disponibles',
      'Ubicaciones ocupadas con carga'
    ].join('\t');

    const rowsText = excelSummary.rows.map(r => [
      r.tipo,
      r.simplesVacias,
      r.doblesVacias,
      r.triplesVacias,
      r.total,
      `${r.pctOcupacion.toFixed(2).replace('.', ',')}%`,
      r.disponibles,
      r.ocupadas
    ].join('\t')).join('\n');

    const totalText = [
      excelSummary.totalRow.nombre,
      excelSummary.totalRow.simplesVacias,
      excelSummary.totalRow.doblesVacias,
      excelSummary.totalRow.triplesVacias,
      excelSummary.totalRow.total,
      `${excelSummary.totalRow.pctOcupacion.toFixed(2).replace('.', ',')}%`,
      excelSummary.totalRow.disponibles,
      excelSummary.totalRow.ocupadas
    ].join('\t');

    const full = `${headers}\n${rowsText}\n${totalText}`;
    navigator.clipboard.writeText(full);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2500);
  };

  // Guardar foto de hoy en el historial (registra ambos criterios)
  const handleSaveTodaySnapshot = () => {
    const todayLabel = formatCurrentDateLabel();
    const newPoint: OccupancyHistoryPoint = {
      id: `snap_${Date.now()}`,
      date: todayLabel,
      timestamp: new Date().toISOString(),
      congeladoPct: calculationMode === 'EXCEL' ? excelSummary.congelado.pctOcupacion : currentSummary.congelado.occupancyPct,
      refrigeradoPct: calculationMode === 'EXCEL' ? excelSummary.refrigerado.pctOcupacion : currentSummary.refrigerado.occupancyPct,
      excelCongeladoPct: excelSummary.congelado.pctOcupacion,
      excelRefrigeradoPct: excelSummary.refrigerado.pctOcupacion,
      operativoCongeladoPct: currentSummary.congelado.occupancyPct,
      operativoRefrigeradoPct: currentSummary.refrigerado.occupancyPct,
      congeladoOccupied: currentSummary.congelado.occupiedPositions,
      congeladoCapacity: currentSummary.congelado.capacityPositions,
      refrigeradoOccupied: currentSummary.refrigerado.occupiedPositions,
      refrigeradoCapacity: currentSummary.refrigerado.capacityPositions,
    };

    // Si ya existe hoy, reemplazarlo; si no, agregarlo al final
    const existingIdx = history.findIndex(h => h.date === todayLabel);
    let updated: OccupancyHistoryPoint[];
    if (existingIdx !== -1) {
      updated = [...history];
      updated[existingIdx] = newPoint;
    } else {
      updated = [...history, newPoint];
    }

    setHistory(updated);
    saveOccupancyHistory(updated);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  // Restablecer al historial oficial inicial
  const handleResetHistory = () => {
    if (window.confirm('¿Deseas restablecer el historial a los datos oficiales de agosto/septiembre?')) {
      setHistory(INITIAL_OCCUPANCY_HISTORY);
      saveOccupancyHistory(INITIAL_OCCUPANCY_HISTORY);
    }
  };

  // Eliminar un punto del historial
  const handleDeletePoint = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    saveOccupancyHistory(updated);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // DIMENSIONES Y MATEMÁTICAS DEL GRÁFICO SVG (IDÉNTICO A IMAGEN 2)
  // ══════════════════════════════════════════════════════════════════════════
  const svgWidth = 1000;
  const svgHeight = 420;
  const paddingLeft = 65;
  const paddingRight = 45;
  const paddingTop = 55;
  const paddingBottom = 45;

  const chartAreaWidth = svgWidth - paddingLeft - paddingRight;
  const chartAreaHeight = svgHeight - paddingTop - paddingBottom;

  const pointsCount = history.length;
  const stepX = pointsCount > 1 ? chartAreaWidth / (pointsCount - 1) : chartAreaWidth;

  const getY = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    return paddingTop + chartAreaHeight - (clamped / 100) * chartAreaHeight;
  };

  const getX = (idx: number) => {
    return paddingLeft + idx * stepX;
  };

  // Obtiene los porcentajes según el modo de cálculo activo
  const getPointCongeladoPct = (h: OccupancyHistoryPoint) => {
    if (calculationMode === 'EXCEL') {
      return h.excelCongeladoPct ?? h.congeladoPct;
    }
    return h.operativoCongeladoPct ?? h.congeladoPct;
  };

  const getPointRefrigeradoPct = (h: OccupancyHistoryPoint) => {
    if (calculationMode === 'EXCEL') {
      return h.excelRefrigeradoPct ?? h.refrigeradoPct;
    }
    return h.operativoRefrigeradoPct ?? h.refrigeradoPct;
  };

  // Puntos para líneas SVG
  const congeladosPolyline = history
    .map((h, i) => `${getX(i)},${getY(getPointCongeladoPct(h))}`)
    .join(' ');

  const refrigeradosPolyline = history
    .map((h, i) => `${getX(i)},${getY(getPointRefrigeradoPct(h))}`)
    .join(' ');

  return (
    <div className="space-y-6 pb-12 w-full animate-fadeIn select-none">
      {/* 1. CABECERA OFICIAL CIAL (Idéntico a Imagen 2) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src={cialLogo} 
            alt="CiAL Alimentos" 
            className="w-14 h-14 object-contain bg-white rounded-xl p-1 shadow-md shrink-0 border border-slate-200" 
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              Reporte de ocupación por tipo de frio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
              {calculationMode === 'EXCEL' ? (
                <span>
                  Criterio Clásico Excel: <strong>1 Hueco = 1 Ubicación Física</strong> (Huecos vacíos = 0 • Huecos con carga = 1)
                </span>
              ) : (
                <span>
                  Criterio Operativo: <strong>Dobles = 2 pallets</strong> • <strong>Simples = 1 pallet</strong> • <strong>Vacías = 0</strong>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Dropdown y Filtro oficial (Tipo de frio) */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {onBackToRacks && (
            <button
              onClick={onBackToRacks}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Regresar a la visualización y auditoría de racks"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
              <span>Volver a Racks</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-300">
            <span className="text-xs font-black text-slate-700">Tipo de frio:</span>
            <select
              value={selectedFilter}
              onChange={e => setSelectedFilter(e.target.value as any)}
              className="bg-transparent text-xs font-black text-[#0a5c36] focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Sectores</option>
              <option value="CONGELADOS">CONGELADOS (Racks 1-8)</option>
              <option value="REFRIGERADOS">REFRIGERADOS (Racks 9-29)</option>
            </select>
          </div>

          <button
            onClick={handleSaveTodaySnapshot}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
              savedFeedback 
                ? 'bg-emerald-600 text-white' 
                : 'bg-[#0a5c36] hover:bg-[#08482a] text-white'
            }`}
            title="Registrar la ocupación calculada de hoy en la serie histórica"
          >
            {savedFeedback ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Foto de Hoy Guardada!</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>📸 Guardar Foto de Hoy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SELECTOR DE CRITERIO DE MEDICIÃ“N (EXCEL VS OPERATIVO) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">CRITERIO DE CÁLCULO ACTIVO</span>
            <div className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
              <span>{calculationMode === 'EXCEL' ? '📊 Criterio Clásico Excel (Ubicaciones Físicas)' : '📦 Criterio Operativo (Capacidad Real Pallets)'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                {calculationMode === 'EXCEL' ? 'Tabla Oficial CIAL' : 'Doble Fondo × 2'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto">
          <button
            onClick={() => setCalculationMode('EXCEL')}
            className={`px-3.5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
              calculationMode === 'EXCEL'
                ? 'bg-[#0a5c36] text-white shadow-md ring-2 ring-emerald-600/30'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-300" />
            <div className="text-left">
              <div className="leading-tight font-black">Criterio Excel (Ubicaciones Físicas)</div>
              <div className={`text-[10px] font-medium ${calculationMode === 'EXCEL' ? 'text-emerald-100' : 'text-slate-500'}`}>
                1 hueco = 1 ubi • CGO 77,6% • PBK 81,8% • Global 85,0%
              </div>
            </div>
          </button>

          <button
            onClick={() => setCalculationMode('OPERATIVO')}
            className={`px-3.5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
              calculationMode === 'OPERATIVO'
                ? 'bg-[#0e4c68] text-white shadow-md ring-2 ring-blue-600/30'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4 shrink-0 text-sky-300" />
            <div className="text-left">
              <div className="leading-tight font-black">Criterio Operativo (Posiciones Pallet)</div>
              <div className={`text-[10px] font-medium ${calculationMode === 'OPERATIVO' ? 'text-blue-100' : 'text-slate-500'}`}>
                Dobles × 2 • CGO 72,0% • REF 94,2% • Global 89,0%
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS KPI DE OCUPACIÓN EN TIEMPO REAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CONGELADO */}
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-[#0e4c68] transition-all shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-[#0e4c68]">
                  <Snowflake className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">CÁMARA CONGELADO</span>
                  <span className="text-sm font-black text-slate-800">Racks 1 al 8 (Pasillos 1-4)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-[#0e4c68]">
                  {formatPct(calculationMode === 'EXCEL' ? excelSummary.congelado.pctOcupacion : currentSummary.congelado.occupancyPct)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 block">
                  {calculationMode === 'EXCEL' ? 'ocupación huecos' : 'ocupación pallets'}
                </span>
              </div>
            </div>

            {calculationMode === 'EXCEL' ? (
              /* Métrica Excel Clásico */
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 font-semibold">
                <div className="flex justify-between">
                  <span>Total Ubicaciones Físicas:</span>
                  <strong className="text-slate-900 font-black">{excelSummary.congelado.total.toLocaleString()} ubis</strong>
                </div>
                <div className="flex justify-between">
                  <span>Ubicaciones con Carga (Ocupadas):</span>
                  <strong className="text-emerald-700 font-black">{excelSummary.congelado.ocupadas.toLocaleString()} ubis</strong>
                </div>
                <div className="flex justify-between">
                  <span>Ubicaciones Disponibles (Vacías):</span>
                  <strong className="text-slate-500 font-black">{excelSummary.congelado.disponibles.toLocaleString()} ubis</strong>
                </div>

                {/* Desglose Excel CGO */}
                <div className="mt-2.5 p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-black text-[#0e4c68] border-b border-blue-200/50 pb-1">
                    <span>Desglose Disponibles (CGO)</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-[#0e4c68] rounded font-bold">Fórmula Excel</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Simples Vacías Disponibles:</span>
                    <strong className="text-slate-900 font-black">{excelSummary.congelado.simplesVacias.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Dobles Vacías Disponibles:</span>
                    <strong className="text-purple-900 font-black">{excelSummary.congelado.doblesVacias.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Triples Vacías Disponibles:</span>
                    <strong className="text-slate-400 font-bold">0</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-blue-200/60 text-[#0e4c68] font-black">
                    <span>Ubicaciones Disponibles:</span>
                    <strong className="text-[#0e4c68] font-black">{excelSummary.congelado.disponibles.toLocaleString()} ubis</strong>
                  </div>
                </div>
              </div>
            ) : (
              /* Métrica Operativa por Posición de Pallet */
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 font-semibold">
                <div className="flex justify-between">
                  <span>Capacidad Almacenamiento:</span>
                  <strong className="text-slate-900 font-black">{currentSummary.congelado.capacityPositions.toLocaleString()} pos</strong>
                </div>
                <div className="flex justify-between">
                  <span>Posiciones Ocupadas:</span>
                  <strong className="text-emerald-700 font-black">{currentSummary.congelado.occupiedPositions.toLocaleString()} pos</strong>
                </div>
                <div className="flex justify-between">
                  <span>Posiciones Vacías:</span>
                  <strong className="text-slate-500 font-black">{currentSummary.congelado.emptyPositions.toLocaleString()} pos</strong>
                </div>
                <div className="flex justify-between text-[11px] pt-1 text-slate-400 font-medium">
                  <span>Racks Dobles: {currentSummary.congelado.doubleRacksCount} (R1, R8)</span>
                  <span>Racks Simples: {currentSummary.congelado.simpleRacksCount}</span>
                </div>

                {/* Desglose Posiciones CGO */}
                <div className="mt-2.5 p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-black text-[#0e4c68] border-b border-blue-200/50 pb-1">
                    <span>Desglose Cámara (CGO)</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-[#0e4c68] rounded font-bold">Racks 1-8</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Posiciones Simples (1 pal):</span>
                    <strong className="text-slate-900 font-black">{currentSummary.congelado.simplePositions.toLocaleString()} pos</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Posiciones Dobles (2 pal):</span>
                    <strong className="text-purple-900 font-black">{currentSummary.congelado.doubleSlotsCount.toLocaleString()} ({currentSummary.congelado.doublePositions.toLocaleString()} pos)</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-blue-200/60 text-[#0e4c68] font-black">
                    <span>Total de Posiciones (CGO):</span>
                    <strong className="text-[#0e4c68] font-black">{currentSummary.congelado.totalPositions.toLocaleString()} pos</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Barra de Progreso */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div 
              className="h-full bg-[#0e4c68] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, calculationMode === 'EXCEL' ? excelSummary.congelado.pctOcupacion : currentSummary.congelado.occupancyPct)}%` }}
            />
          </div>
        </div>

        {/* REFRIGERADO */}
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-[#0a5c36] transition-all shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-[#0a5c36]">
                  <Layers className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">CÁMARA REFRIGERADO</span>
                  <span className="text-sm font-black text-slate-800">Racks 9 al 29 (Pasillos 5-15)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-[#0a5c36]">
                  {formatPct(calculationMode === 'EXCEL' ? excelSummary.refrigerado.pctOcupacion : currentSummary.refrigerado.occupancyPct)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 block">
                  {calculationMode === 'EXCEL' ? 'ocupación huecos' : 'ocupación pallets'}
                </span>
              </div>
            </div>

            {calculationMode === 'EXCEL' ? (
              /* Métrica Excel Clásico */
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 font-semibold">
                <div className="flex justify-between">
                  <span>Total Ubicaciones Físicas:</span>
                  <strong className="text-slate-900 font-black">{excelSummary.refrigerado.total.toLocaleString()} ubis</strong>
                </div>
                <div className="flex justify-between">
                  <span>Ubicaciones con Carga (Ocupadas):</span>
                  <strong className="text-emerald-700 font-black">{excelSummary.refrigerado.ocupadas.toLocaleString()} ubis</strong>
                </div>
                <div className="flex justify-between">
                  <span>Ubicaciones Disponibles (Vacías):</span>
                  <strong className="text-slate-500 font-black">{excelSummary.refrigerado.disponibles.toLocaleString()} ubis</strong>
                </div>

                {/* Desglose Excel por Tipo de Almacén (PBK, PFW, RCK) */}
                <div className="mt-2.5 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-black text-[#0a5c36] border-b border-emerald-200/50 pb-1">
                    <span>Desglose por Tipo de Almacén</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-[#0a5c36] rounded font-bold">Excel Oficial</span>
                  </div>
                  
                  {/* PBK */}
                  <div className="bg-white/90 p-1.5 rounded-lg border border-emerald-100/80 text-[11px] space-y-0.5">
                    <div className="flex justify-between items-center font-black">
                      <span className="text-emerald-900 font-black">PBK (Push Back)</span>
                      <span className="text-emerald-700 font-black">{formatPct(excelSummary.rows[1].pctOcupacion)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-medium">
                      <span>Total: <strong>{excelSummary.rows[1].total.toLocaleString()}</strong></span>
                      <span>Ocupadas: <strong>{excelSummary.rows[1].ocupadas.toLocaleString()}</strong></span>
                      <span>Disp: <strong className="text-emerald-800">{excelSummary.rows[1].disponibles.toLocaleString()} ({excelSummary.rows[1].simplesVacias} s / {excelSummary.rows[1].doblesVacias} d)</strong></span>
                    </div>
                  </div>

                  {/* PFW */}
                  <div className="bg-white/90 p-1.5 rounded-lg border border-emerald-100/80 text-[11px] space-y-0.5">
                    <div className="flex justify-between items-center font-black">
                      <span className="text-amber-900 font-black">PFW (Post Forward / R17-19)</span>
                      <span className="text-amber-700 font-black">{formatPct(excelSummary.rows[2].pctOcupacion)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-medium">
                      <span>Total: <strong>{excelSummary.rows[2].total.toLocaleString()}</strong></span>
                      <span>Ocupadas: <strong>{excelSummary.rows[2].ocupadas.toLocaleString()}</strong></span>
                      <span>Disp: <strong className="text-amber-800">{excelSummary.rows[2].disponibles.toLocaleString()}</strong></span>
                    </div>
                  </div>

                  {/* RCK */}
                  <div className="bg-white/90 p-1.5 rounded-lg border border-emerald-100/80 text-[11px] space-y-0.5">
                    <div className="flex justify-between items-center font-black">
                      <span className="text-indigo-900 font-black">RCK (Producto Crítico / R28)</span>
                      <span className="text-indigo-700 font-black">{formatPct(excelSummary.rows[3].pctOcupacion)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-medium">
                      <span>Total: <strong>{excelSummary.rows[3].total.toLocaleString()}</strong></span>
                      <span>Ocupadas: <strong>{excelSummary.rows[3].ocupadas.toLocaleString()}</strong></span>
                      <span>Disp: <strong className="text-indigo-800">{excelSummary.rows[3].disponibles.toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Métrica Operativa por Posición de Pallet */
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 font-semibold">
                <div className="flex justify-between">
                  <span>Capacidad Almacenamiento:</span>
                  <strong className="text-slate-900 font-black">{currentSummary.refrigerado.capacityPositions.toLocaleString()} pos</strong>
                </div>
                <div className="flex justify-between">
                  <span>Posiciones Ocupadas:</span>
                  <strong className="text-emerald-700 font-black">{currentSummary.refrigerado.occupiedPositions.toLocaleString()} pos</strong>
                </div>
                <div className="flex justify-between">
                  <span>Posiciones Vacías:</span>
                  <strong className="text-slate-500 font-black">{currentSummary.refrigerado.emptyPositions.toLocaleString()} pos</strong>
                </div>
                <div className="flex justify-between text-[11px] pt-1 text-slate-400 font-medium">
                  <span>Racks Dobles: {currentSummary.refrigerado.doubleRacksCount}</span>
                  <span>Racks Simples: {currentSummary.refrigerado.simpleRacksCount}</span>
                </div>

                {/* Desglose Posiciones Refrigerado y desmenuzado por PBK, PFW, RCK */}
                <div className="mt-2.5 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-black text-[#0a5c36] border-b border-emerald-200/50 pb-1">
                    <span>Desglose Cámara Refrigerado</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-[#0a5c36] rounded font-bold">Racks 9-29</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span>Posiciones Simples:</span>
                      <strong className="text-slate-900 font-black">{currentSummary.refrigerado.simplePositions.toLocaleString()} pos</strong>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Posiciones Dobles:</span>
                      <strong className="text-purple-900 font-black">{currentSummary.refrigerado.doubleSlotsCount.toLocaleString()} ({currentSummary.refrigerado.doublePositions.toLocaleString()} pos)</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-emerald-200/60 text-[#0a5c36] font-black">
                      <span>Total de Posiciones:</span>
                      <strong className="text-[#0a5c36] font-black">{currentSummary.refrigerado.totalPositions.toLocaleString()} pos</strong>
                    </div>
                  </div>

                  {/* Desmenuzado por PBK, PFW, RCK */}
                  {currentSummary.refrigerado.breakdownByTipo && (
                    <div className="pt-1.5 border-t border-emerald-200/60 space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Desmenuzado por Tipo de Almacén:
                      </span>
                      
                      {/* PBK */}
                      {currentSummary.refrigerado.breakdownByTipo.PBK && (
                        <div className="bg-white/90 p-1.5 rounded-lg border border-emerald-100/80 text-[11px] space-y-0.5">
                          <div className="flex justify-between items-center font-black">
                            <span className="text-emerald-900 font-black text-[11px]">PBK (Push Back)</span>
                            <span className="text-emerald-800 font-black">{currentSummary.refrigerado.breakdownByTipo.PBK.totalPositions.toLocaleString()} pos</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-600 font-medium">
                            <span>Simples: <strong className="text-slate-800">{currentSummary.refrigerado.breakdownByTipo.PBK.simplePositions.toLocaleString()}</strong></span>
                            <span>Dobles: <strong className="text-purple-800">{currentSummary.refrigerado.breakdownByTipo.PBK.doubleSlotsCount.toLocaleString()} ({currentSummary.refrigerado.breakdownByTipo.PBK.doublePositions.toLocaleString()} pos)</strong></span>
                            <span>Total: <strong className="text-slate-900">{currentSummary.refrigerado.breakdownByTipo.PBK.totalPositions.toLocaleString()} pos</strong></span>
                          </div>
                        </div>
                      )}

                      {/* PFW */}
                      {currentSummary.refrigerado.breakdownByTipo.PFW && (
                        <div className="bg-white/90 p-1.5 rounded-lg border border-emerald-100/80 text-[11px] space-y-0.5">
                          <div className="flex justify-between items-center font-black">
                            <span className="text-amber-900 font-black text-[11px]">PFW (Post Forward / R17-19)</span>
                            <span className="text-amber-800 font-black">{currentSummary.refrigerado.breakdownByTipo.PFW.totalPositions.toLocaleString()} pos</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-600 font-medium">
                            <span>Simples: <strong className="text-slate-800">{currentSummary.refrigerado.breakdownByTipo.PFW.simplePositions.toLocaleString()}</strong></span>
                            <span>Dobles: <strong className="text-purple-800">{currentSummary.refrigerado.breakdownByTipo.PFW.doubleSlotsCount.toLocaleString()} ({currentSummary.refrigerado.breakdownByTipo.PFW.doublePositions.toLocaleString()} pos)</strong></span>
                            <span>Total: <strong className="text-slate-900">{currentSummary.refrigerado.breakdownByTipo.PFW.totalPositions.toLocaleString()} pos</strong></span>
                          </div>
                        </div>
                      )}

                      {/* RCK */}
                      {currentSummary.refrigerado.breakdownByTipo.RCK && (
                        <div className="bg-white/90 p-1.5 rounded-lg border border-emerald-100/80 text-[11px] space-y-0.5">
                          <div className="flex justify-between items-center font-black">
                            <span className="text-indigo-900 font-black text-[11px]">RCK (Producto Crítico / R28 N4-N6)</span>
                            <span className="text-indigo-800 font-black">{currentSummary.refrigerado.breakdownByTipo.RCK.totalPositions.toLocaleString()} pos</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-600 font-medium">
                            <span>Simples: <strong className="text-slate-800">{currentSummary.refrigerado.breakdownByTipo.RCK.simplePositions.toLocaleString()}</strong></span>
                            <span>Dobles: <strong className="text-slate-400">0</strong></span>
                            <span>Total: <strong className="text-slate-900">{currentSummary.refrigerado.breakdownByTipo.RCK.totalPositions.toLocaleString()} pos</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Barra de Progreso */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div 
              className="h-full bg-[#0a5c36] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, calculationMode === 'EXCEL' ? excelSummary.refrigerado.pctOcupacion : currentSummary.refrigerado.occupancyPct)}%` }}
            />
          </div>
        </div>

        {/* TOTAL ALMACÉN */}
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-800 transition-all shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-slate-100 text-slate-800">
                  <TrendingUp className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">TOTAL CD SAN JORGE</span>
                  <span className="text-sm font-black text-slate-800">29 Racks Activos</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {formatPct(calculationMode === 'EXCEL' ? excelSummary.global.pctOcupacion : currentSummary.global.occupancyPct)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 block">
                  {calculationMode === 'EXCEL' ? 'ocupación huecos' : 'ocupación pallets'}
                </span>
              </div>
            </div>

            {calculationMode === 'EXCEL' ? (
              /* Métrica Excel Clásico */
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 font-semibold">
                <div className="flex justify-between">
                  <span>Total Ubicaciones Físicas:</span>
                  <strong className="text-slate-900 font-black">{excelSummary.global.total.toLocaleString()} ubis</strong>
                </div>
                <div className="flex justify-between">
                  <span>Ubicaciones con Carga (Ocupadas):</span>
                  <strong className="text-slate-900 font-black">{excelSummary.global.ocupadas.toLocaleString()} ubis</strong>
                </div>
                <div className="flex justify-between">
                  <span>Ubicaciones Disponibles (Vacías):</span>
                  <strong className="text-slate-500 font-black">{excelSummary.global.disponibles.toLocaleString()} ubis</strong>
                </div>

                {/* Desglose Posiciones Totales Excel */}
                <div className="mt-2.5 p-2.5 bg-slate-100/80 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-black text-slate-900 border-b border-slate-200 pb-1">
                    <span>Desglose Disponibles Global</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-bold">Excel Oficial</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Simples Vacías Disponibles:</span>
                    <strong className="text-slate-900 font-black">{excelSummary.global.simplesVacias.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Dobles Vacías Disponibles:</span>
                    <strong className="text-purple-900 font-black">{excelSummary.global.doblesVacias.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Triples Vacías Disponibles:</span>
                    <strong className="text-slate-400 font-bold">0</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-300 text-slate-900 font-black">
                    <span>Total Ubicaciones Disponibles:</span>
                    <strong className="text-emerald-800 font-black">{excelSummary.global.disponibles.toLocaleString()} ubis</strong>
                  </div>

                  <div className="pt-1 text-[10px] text-slate-500 font-medium flex justify-between border-t border-slate-200/60">
                    <span>❄️ CGO: <strong>{excelSummary.congelado.disponibles.toLocaleString()} disp</strong></span>
                    <span>🧊 Refrigerado: <strong>{excelSummary.refrigerado.disponibles.toLocaleString()} disp</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              /* Métrica Operativa por Posición de Pallet */
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 font-semibold">
                <div className="flex justify-between">
                  <span>Capacidad Global Almacén:</span>
                  <strong className="text-slate-900 font-black">{currentSummary.global.capacityPositions.toLocaleString()} pos</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Posiciones Ocupadas:</span>
                  <strong className="text-slate-900 font-black">{currentSummary.global.occupiedPositions.toLocaleString()} pos</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Posiciones Vacías:</span>
                  <strong className="text-slate-500 font-black">{currentSummary.global.emptyPositions.toLocaleString()} pos</strong>
                </div>
                <div className="flex justify-between text-[11px] pt-1 text-slate-400 font-medium">
                  <span>Total Racks Dobles: {currentSummary.global.doubleRacksCount}</span>
                  <span>Total Racks Simples: {currentSummary.global.simpleRacksCount}</span>
                </div>

                {/* Desglose Posiciones Totales CD San Jorge */}
                <div className="mt-2.5 p-2.5 bg-slate-100/80 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-black text-slate-900 border-b border-slate-200 pb-1">
                    <span>Desglose Total Almacén</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-bold">29 Racks</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Posiciones Totales Simples:</span>
                    <strong className="text-slate-900 font-black">{currentSummary.global.simplePositions.toLocaleString()} pos</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Posiciones Totales Dobles:</span>
                    <strong className="text-purple-900 font-black">{currentSummary.global.doubleSlotsCount.toLocaleString()} ({currentSummary.global.doublePositions.toLocaleString()} pos)</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-300 text-slate-900 font-black">
                    <span>Posiciones Totales:</span>
                    <strong className="text-emerald-800 font-black">{currentSummary.global.totalPositions.toLocaleString()} pos</strong>
                  </div>

                  <div className="pt-1 text-[10px] text-slate-500 font-medium flex justify-between border-t border-slate-200/60">
                    <span>❄️ CGO: <strong>{currentSummary.congelado.totalPositions.toLocaleString()} pos</strong></span>
                    <span>🧊 Refrigerado: <strong>{currentSummary.refrigerado.totalPositions.toLocaleString()} pos</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Barra de Progreso */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div 
              className="h-full bg-slate-800 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, calculationMode === 'EXCEL' ? excelSummary.global.pctOcupacion : currentSummary.global.occupancyPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2.5 TABLA DINÁMICA OFICIAL DE OCUPACIÓN (FORMATO EXCEL CIAL) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 via-slate-50 to-white border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0a5c36] text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Tabla Dinámica de Ocupación (Formato Oficial Excel CIAL)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-100 text-[#08482a] border border-emerald-300">
                  Fórmula Histórica Validada
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Estructura idéntica al Excel de toma de inventario: <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">% OCUPACIÓN = (TOTAL - Ubicaciones disponibles) / TOTAL</code>
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyExcelTable}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
              copiedTable 
                ? 'bg-emerald-600 text-white' 
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
            }`}
            title="Copiar datos delimitados por tabulaciones para pegar directamente en Excel o correos"
          >
            {copiedTable ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Tabla Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>📋 Copiar para Excel</span>
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
                <th className="py-3 px-4">Etiquetas de fila</th>
                <th className="py-3 px-3 text-right">Suma de Ubicaciones simples vacías disponibles</th>
                <th className="py-3 px-3 text-right">Suma de Ubicaciones dobles vacías disponibles</th>
                <th className="py-3 px-3 text-right">Suma de Ubicaciones triples, vacías disponibles</th>
                <th className="py-3 px-3 text-right font-black text-slate-900 bg-slate-200/50">TOTAL</th>
                <th className="py-3 px-4 text-right font-black text-[#0a5c36] bg-emerald-50/80">% OCUPACIÓN</th>
                <th className="py-3 px-3 text-right font-black text-slate-800">Ubicaciones disponibles</th>
                <th className="py-3 px-3 text-right text-slate-500">Ubicaciones con carga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 font-semibold text-slate-700">
              {excelSummary.rows.map(row => (
                <tr key={row.tipo} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-black text-slate-900 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      row.tipo === 'CGO' ? 'bg-[#0e4c68]' : 
                      row.tipo === 'PBK' ? 'bg-[#0a5c36]' : 
                      row.tipo === 'PFW' ? 'bg-amber-500' : 'bg-indigo-500'
                    }`} />
                    <span>{row.tipo}</span>
                    <span className="text-[10px] text-slate-400 font-medium hidden md:inline">({row.nombre.split('-')[1]?.trim() || ''})</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">{row.simplesVacias.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-purple-700 font-bold">{row.doblesVacias.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">{row.triplesVacias}</td>
                  <td className="py-2.5 px-3 text-right font-black font-mono text-slate-900 bg-slate-100/40">{row.total.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right font-black font-mono text-sm text-[#0a5c36] bg-emerald-50/50">
                    {row.pctOcupacion.toFixed(2).replace('.', ',')}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-black font-mono text-slate-900">{row.disponibles.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{row.ocupadas.toLocaleString()}</td>
                </tr>
              ))}

              {/* Fila Total General */}
              <tr className="bg-slate-100 text-slate-900 font-black border-t-2 border-slate-300">
                <td className="py-3 px-4 font-black">Total</td>
                <td className="py-3 px-3 text-right font-mono">{excelSummary.totalRow.simplesVacias.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono text-purple-800">{excelSummary.totalRow.doblesVacias.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono text-slate-400">0</td>
                <td className="py-3 px-3 text-right font-black font-mono bg-slate-200/60">{excelSummary.totalRow.total.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-black font-mono text-base text-[#0a5c36] bg-emerald-100/60">
                  {excelSummary.totalRow.pctOcupacion.toFixed(2).replace('.', ',')}%
                </td>
                <td className="py-3 px-3 text-right font-black font-mono text-slate-900">{excelSummary.totalRow.disponibles.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono text-slate-600">{excelSummary.totalRow.ocupadas.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Nota explicativa de conciliación */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Conciliación de Criterios:</strong> En el Excel cada hueco cuenta como 1 unidad. En el Criterio Operativo, las ubicaciones dobles aportan 2 posiciones de pallet para reflejar la capacidad física real.
            </span>
          </div>
          <span className="font-bold text-slate-600 shrink-0">
            Total Ubicaciones Físicas: 5.093 • Pallets Capacidad: 5.922
          </span>
        </div>
      </div>

      {/* 3. GRÁFICO DE LÍNEAS OFICIAL CIAL (Idéntico a Imagen 2) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Encabezado del Gráfico con Leyenda idéntica a Imagen 2 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Evolución Histórica de Ocupación ({history.length} fechas registradas)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold hidden sm:inline">
              Base oficial: 03-ago al {history[history.length - 1]?.date || 'actual'}
            </span>
          </div>

          {/* Leyenda corporativa con líneas de color */}
          <div className="flex items-center gap-5 text-xs font-bold">
            {(selectedFilter === 'ALL' || selectedFilter === 'CONGELADOS') && (
              <div className="flex items-center gap-2">
                <span className="w-5 h-1 bg-[#0e4c68] rounded-full inline-block" />
                <span className="text-slate-800">CONGELADOS</span>
              </div>
            )}
            {(selectedFilter === 'ALL' || selectedFilter === 'REFRIGERADOS') && (
              <div className="flex items-center gap-2">
                <span className="w-5 h-1 bg-[#0a5c36] rounded-full inline-block" />
                <span className="text-slate-800">REFRIGERADOS</span>
              </div>
            )}
          </div>
        </div>

        {/* Lienzo SVG Interactivo */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[820px] relative">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Líneas horizontales de guía (Gridlines cada 10%) */}
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(pct => {
                const y = getY(pct);
                return (
                  <g key={pct}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[11px] font-bold fill-slate-500"
                    >
                      {pct === 0 ? '0,0%' : `${pct},0%`}
                    </text>
                  </g>
                );
              })}

              {/* Línea CONGELADOS */}
              {(selectedFilter === 'ALL' || selectedFilter === 'CONGELADOS') && (
                <>
                  <polyline
                    fill="none"
                    stroke="#0e4c68"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={congeladosPolyline}
                  />
                  {/* Puntos y Etiquetas CONGELADOS */}
                  {history.map((h, i) => {
                    const x = getX(i);
                    const y = getY(h.congeladoPct);
                    const isHovered = hoveredPoint?.id === h.id;
                    return (
                      <g 
                        key={`c_${h.id}`}
                        onMouseEnter={() => setHoveredPoint(h)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? 6 : 4}
                          fill="#ffffff"
                          stroke="#0e4c68"
                          strokeWidth={isHovered ? 3.5 : 2.5}
                          className="transition-all"
                        />
                        {/* Etiqueta de texto debajo del punto como en la Imagen 2 */}
                        <text
                          x={x}
                          y={y + 16}
                          textAnchor="middle"
                          className="text-[11px] font-extrabold fill-slate-900 tracking-tight"
                        >
                          {formatPct(h.congeladoPct)}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}

              {/* Línea REFRIGERADOS */}
              {(selectedFilter === 'ALL' || selectedFilter === 'REFRIGERADOS') && (
                <>
                  <polyline
                    fill="none"
                    stroke="#0a5c36"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={refrigeradosPolyline}
                  />
                  {/* Puntos y Etiquetas REFRIGERADOS */}
                  {history.map((h, i) => {
                    const x = getX(i);
                    const y = getY(h.refrigeradoPct);
                    const isHovered = hoveredPoint?.id === h.id;
                    return (
                      <g 
                        key={`r_${h.id}`}
                        onMouseEnter={() => setHoveredPoint(h)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? 6 : 4}
                          fill="#ffffff"
                          stroke="#0a5c36"
                          strokeWidth={isHovered ? 3.5 : 2.5}
                          className="transition-all"
                        />
                        {/* Etiqueta de texto arriba del punto como en la Imagen 2 */}
                        <text
                          x={x}
                          y={y - 10}
                          textAnchor="middle"
                          className="text-[11px] font-black fill-[#0a5c36] tracking-tight"
                        >
                          {formatPct(h.refrigeradoPct)}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}

              {/* Etiquetas Eje X (Fechas) */}
              {history.map((h, i) => {
                const x = getX(i);
                return (
                  <text
                    key={`label_${h.id}`}
                    x={x}
                    y={svgHeight - paddingBottom + 25}
                    textAnchor="middle"
                    className="text-[11px] font-bold fill-slate-600"
                  >
                    {h.date}
                  </text>
                );
              })}
            </svg>

            {/* Tooltip flotante al pasar mouse sobre un punto */}
            {hoveredPoint && (
              <div 
                className="absolute top-2 right-4 bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-xs border border-slate-700 pointer-events-none z-30"
              >
                <div className="font-black text-emerald-400 border-b border-slate-700 pb-1 flex items-center justify-between gap-3">
                  <span>📅 Fecha: {hoveredPoint.date}</span>
                  <span className="text-[10px] text-slate-400">{new Date(hoveredPoint.timestamp).toLocaleDateString('es-CL')}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sky-300 font-bold">❄️ Congelados:</span>
                  <strong className="text-white font-black">{formatPct(hoveredPoint.congeladoPct)}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-emerald-300 font-bold">🧊 Refrigerados:</span>
                  <strong className="text-white font-black">{formatPct(hoveredPoint.refrigeradoPct)}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acciones del Historial */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="text-slate-500 font-medium">
            💡 <em>Los puntos se guardan permanentemente en tu navegador. Puedes añadir la foto diaria tras cada auditoría o subida de SAP.</em>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetHistory}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Restablecer serie a los datos oficiales de la gerencia"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Serie</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. MATRIZ DETALLADA DE CAPACIDAD POR RACK (Racks 1 al 29) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowRackMatrix(prev => !prev)}
          className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border-b border-slate-200 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-[#08482a]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Matriz de Capacidad y Clasificación por Rack (1 al 29)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Regla: Si el rack tiene 1 o más posiciones con 2 pallets es <strong>DOBLE (huecos × 2)</strong>; si no, es <strong>SIMPLE (huecos × 1)</strong>
              </p>
            </div>
          </div>
          {showRackMatrix ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showRackMatrix && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                  <th className="py-2.5 px-3">Rack</th>
                  <th className="py-2.5 px-3">Cámara / Sector</th>
                  <th className="py-2.5 px-3 text-center">Tipo Rack</th>
                  <th className="py-2.5 px-3 text-right">Módulos</th>
                  <th className="py-2.5 px-3 text-right">Huecos Físicos</th>
                  <th className="py-2.5 px-3 text-right">Capacidad Pos</th>
                  <th className="py-2.5 px-3 text-right">Simples (1)</th>
                  <th className="py-2.5 px-3 text-right">Dobles (2)</th>
                  <th className="py-2.5 px-3 text-right">Pos Ocupadas</th>
                  <th className="py-2.5 px-3 text-right">Pos Vacías</th>
                  <th className="py-2.5 px-3 text-right">% Ocupación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 font-semibold text-slate-700">
                {currentSummary.racks.map(r => {
                  return (
                    <tr key={r.rack.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-black text-slate-900">
                        {r.rack.name}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {r.zone === 'CONGELADO' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#0e4c68] border border-blue-200">
                              ❄️ CGO (Congelado)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-[#0a5c36] border border-emerald-200">
                              🧊 {r.rack.id === 28 ? 'PBK / RCK' : (r.rack.id >= 17 && r.rack.id <= 19 ? 'PFW' : 'PBK')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {r.isDoubleRack ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                            DOBLE COMPLETO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                            SIMPLE
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">{r.moduleCount}</td>
                      <td className="py-2 px-3 text-right text-slate-500">{r.physicalSlots}</td>
                      <td className="py-2 px-3 text-right font-black text-slate-900">{r.capacityPositions}</td>
                      <td className="py-2 px-3 text-right text-emerald-700">{r.singleOccupiedSlots}</td>
                      <td className="py-2 px-3 text-right text-purple-700">{r.doubleOccupiedSlots}</td>
                      <td className="py-2 px-3 text-right font-black text-slate-900">{r.occupiedPositions}</td>
                      <td className="py-2 px-3 text-right text-slate-400">{r.emptySlots}</td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-black text-slate-900">{r.occupancyPct}%</span>
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${r.isDoubleRack ? 'bg-purple-600' : 'bg-[#0a5c36]'}`}
                              style={{ width: `${Math.min(100, r.occupancyPct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
