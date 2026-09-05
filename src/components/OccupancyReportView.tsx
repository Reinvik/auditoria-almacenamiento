import React, { useState, useMemo } from 'react';
import { StockItem } from '../types/warehouse';
import { 
  calculateWarehouseOccupancy, 
  getOccupancyHistory, 
  saveOccupancyHistory, 
  formatCurrentDateLabel,
  OccupancyHistoryPoint,
  INITIAL_OCCUPANCY_HISTORY
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
  Download
} from 'lucide-react';

interface OccupancyReportViewProps {
  stockIndex: Map<string, StockItem[]>;
}

export const OccupancyReportView: React.FC<OccupancyReportViewProps> = ({
  stockIndex,
}) => {
  // 1. Cálculo en tiempo real con la data cargada
  const currentSummary = useMemo(() => {
    return calculateWarehouseOccupancy(stockIndex);
  }, [stockIndex]);

  // 2. Historial de ocupación diario
  const [history, setHistory] = useState<OccupancyHistoryPoint[]>(() => getOccupancyHistory());
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CONGELADOS' | 'REFRIGERADOS'>('ALL');
  const [showRackMatrix, setShowRackMatrix] = useState<boolean>(true);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<OccupancyHistoryPoint | null>(null);

  // Formateador de porcentajes con coma chilena (ej: 81,5%)
  const formatPct = (val: number) => `${val.toFixed(1).replace('.', ',')}%`;

  // Guardar foto de hoy en el historial
  const handleSaveTodaySnapshot = () => {
    const todayLabel = formatCurrentDateLabel();
    const newPoint: OccupancyHistoryPoint = {
      id: `snap_${Date.now()}`,
      date: todayLabel,
      timestamp: new Date().toISOString(),
      congeladoPct: currentSummary.congelado.occupancyPct,
      refrigeradoPct: currentSummary.refrigerado.occupancyPct,
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

  // Puntos para líneas SVG
  const congeladosPolyline = history
    .map((h, i) => `${getX(i)},${getY(h.congeladoPct)}`)
    .join(' ');

  const refrigeradosPolyline = history
    .map((h, i) => `${getX(i)},${getY(h.refrigeradoPct)}`)
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
              Ocupación por posición física: <strong>Dobles = 2</strong> • <strong>Simples = 1</strong> • <strong>Vacías = 0</strong>
            </p>
          </div>
        </div>

        {/* Dropdown y Filtro oficial (Tipo de frio) */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
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

      {/* 2. TARJETAS KPI DE OCUPACIÓN EN TIEMPO REAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CONGELADO */}
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-[#0e4c68] transition-all shadow-sm">
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
            <span className="text-2xl sm:text-3xl font-black text-[#0e4c68]">
              {formatPct(currentSummary.congelado.occupancyPct)}
            </span>
          </div>

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
          </div>

          {/* Barra de Progreso */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div 
              className="h-full bg-[#0e4c68] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, currentSummary.congelado.occupancyPct)}%` }}
            />
          </div>
        </div>

        {/* REFRIGERADO */}
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-[#0a5c36] transition-all shadow-sm">
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
            <span className="text-2xl sm:text-3xl font-black text-[#0a5c36]">
              {formatPct(currentSummary.refrigerado.occupancyPct)}
            </span>
          </div>

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
          </div>

          {/* Barra de Progreso */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div 
              className="h-full bg-[#0a5c36] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, currentSummary.refrigerado.occupancyPct)}%` }}
            />
          </div>
        </div>

        {/* TOTAL ALMACÉN */}
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-800 transition-all shadow-sm">
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
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {formatPct(currentSummary.global.occupancyPct)}
            </span>
          </div>

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
          </div>

          {/* Barra de Progreso */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div 
              className="h-full bg-slate-800 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, currentSummary.global.occupancyPct)}%` }}
            />
          </div>
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
                        {r.zone === 'CONGELADO' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#0e4c68] border border-blue-200">
                            ❄️ Congelado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-[#0a5c36] border border-emerald-200">
                            🧊 Refrigerado
                          </span>
                        )}
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
