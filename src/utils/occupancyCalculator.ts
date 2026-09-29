import { StockItem, RackConfig } from '../types/warehouse';
import { WAREHOUSE_RACKS } from '../config/warehouseConfig';

export interface RackOccupancyMetrics {
  rack: RackConfig;
  zone: 'CONGELADO' | 'REFRIGERADO';
  moduleCount: number;
  physicalSlots: number; // moduleCount * 6
  isDoubleRack: boolean; // true si tiene al menos 1 posición doble (>=2 pallets)
  capacityPositions: number; // isDoubleRack ? physicalSlots * 2 : physicalSlots * 1
  singleOccupiedSlots: number; // celdas con 1 pallet
  doubleOccupiedSlots: number; // celdas con >=2 pallets
  emptySlots: number;
  occupiedPositions: number; // (doubleOccupiedSlots * 2) + (singleOccupiedSlots * 1)
  occupancyPct: number; // (occupiedPositions / capacityPositions) * 100
}

export interface TipoAlmacenBreakdown {
  tipo: 'CGO' | 'PBK' | 'PFW' | 'RCK';
  name: string;
  simplePositions: number;     // Celdas simples (1 pallet)
  doubleSlotsCount: number;    // Celdas dobles (>= 2 pallets)
  doublePositions: number;     // Posiciones aportadas por dobles (doubleSlotsCount * 2)
  totalPositions: number;      // simplePositions + doublePositions
  capacityPositions: number;
  emptyPositions: number;
  occupancyPct: number;
  totalPhysicalSlots: number;
}

export interface ZoneOccupancyMetrics {
  zone: 'CONGELADO' | 'REFRIGERADO' | 'GLOBAL';
  racksCount: number;
  doubleRacksCount: number;
  simpleRacksCount: number;
  capacityPositions: number;
  occupiedPositions: number;
  emptyPositions: number;
  occupancyPct: number;
  simplePositions: number;
  doubleSlotsCount: number;
  doublePositions: number;
  totalPositions: number;
  breakdownByTipo?: {
    CGO?: TipoAlmacenBreakdown;
    PBK?: TipoAlmacenBreakdown;
    PFW?: TipoAlmacenBreakdown;
    RCK?: TipoAlmacenBreakdown;
  };
}

export interface WarehouseOccupancySummary {
  congelado: ZoneOccupancyMetrics;
  refrigerado: ZoneOccupancyMetrics;
  global: ZoneOccupancyMetrics;
  racks: RackOccupancyMetrics[];
}

/**
 * Mapeo determinístico de Tipo de Almacén SAP según rack y nivel (5.093 posiciones de almacenamiento).
 */
export function getSlotTipoAlmacen(rackId: number, nivel: number): 'CGO' | 'PBK' | 'PFW' | 'RCK' {
  if (rackId <= 8) return 'CGO';
  if (rackId === 9 || rackId === 10 || rackId === 11 || rackId === 18) return 'PFW';
  if (rackId === 19) return 'RCK';
  if (rackId === 27 || rackId === 28) return nivel >= 3 ? 'RCK' : 'PBK';
  return 'PBK';
}

/**
 * Determina si una posición pertenece al área de Almacenamiento (5.093 huecos)
 * o si es una posición de Picking en nivel 1 (PCG, PMN, PF1, PPB) que no computa en la capacidad de almacenamiento.
 */
export function isAlmacenamientoSlot(rackId: number, nivel: number): boolean {
  if (nivel === 1) {
    if (
      (rackId >= 6 && rackId <= 8) ||
      (rackId >= 10 && rackId <= 17) ||
      rackId === 19 ||
      (rackId >= 20 && rackId <= 23)
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Determina la profundidad física oficial de almacenamiento según el diseño de CIAL CD San Jorge.
 * Profundidad 1 = Simple, Profundidad 2 = Doble, Profundidad 3 = Triple.
 */
export function getSlotProfundidad(rackId: number): 1 | 2 | 3 {
  if (rackId === 19) return 3;
  if (
    rackId === 1 || 
    rackId === 8 || 
    rackId === 9 || 
    rackId === 10 || 
    rackId === 11 || 
    rackId === 18 || 
    (rackId >= 20 && rackId <= 23)
  ) {
    return 2;
  }
  return 1;
}

export interface OccupancyHistoryPoint {
  id: string;
  date: string; // ej: "03-ago", "05-ago", "02-sept", "14-sept"
  timestamp: string; // ISO date
  congeladoPct: number;
  refrigeradoPct: number;
  totalPct: number;
  congeladoOccupied?: number;
  congeladoCapacity?: number;
  refrigeradoOccupied?: number;
  refrigeradoCapacity?: number;
  totalOccupied?: number;
  totalCapacity?: number;
  // Métricas específicas según criterio de cálculo
  operativoCongeladoPct?: number;
  operativoRefrigeradoPct?: number;
  operativoTotalPct?: number;
  excelCongeladoPct?: number;
  excelRefrigeradoPct?: number;
  excelTotalPct?: number;
}

export interface ExcelPivotRow {
  tipo: 'CGO' | 'PBK' | 'PFW' | 'RCK' | 'TOTAL';
  nombre: string;
  simplesVacias: number;
  doblesVacias: number;
  triplesVacias: number;
  total: number;
  ocupadas: number;
  disponibles: number;
  pctOcupacion: number;
}

export interface ExcelOccupancySummary {
  rows: ExcelPivotRow[];
  totalRow: ExcelPivotRow;
  congelado: {
    total: number;
    ocupadas: number;
    disponibles: number;
    pctOcupacion: number;
    simplesVacias: number;
    doblesVacias: number;
  };
  refrigerado: {
    total: number;
    ocupadas: number;
    disponibles: number;
    pctOcupacion: number;
    simplesVacias: number;
    doblesVacias: number;
  };
  global: {
    total: number;
    ocupadas: number;
    disponibles: number;
    pctOcupacion: number;
    simplesVacias: number;
    doblesVacias: number;
  };
}

export const EXCEL_MASTER_CAPACITIES = {
  CGO: { total: 1024, name: 'CGO - Cámara Congelado' },
  PBK: { total: 2881, name: 'PBK - Push Back' },
  PFW: { total: 682,  name: 'PFW - Post Forward' },
  RCK: { total: 506,  name: 'RCK - Producto Crítico' },
  MNL: { total: 0,    name: 'MNL - Multi Nivel' },
} as const;

export const LOCAL_STORAGE_OCCUPANCY_HISTORY_KEY = 'auditoria_almacenamiento_occupancy_history_v2';

/**
 * Registros históricos oficiales de CIAL CD San Jorge (Hoja 'EVOL. PLANIFICACION' 03-ago al 14-sept)
 */
export const INITIAL_OCCUPANCY_HISTORY: OccupancyHistoryPoint[] = [
  { id: '1',  date: '03-ago',  timestamp: '2026-08-03T08:00:00.000Z', congeladoPct: 77.1, refrigeradoPct: 81.5, totalPct: 80.6 },
  { id: '2',  date: '05-ago',  timestamp: '2026-08-05T08:00:00.000Z', congeladoPct: 72.0, refrigeradoPct: 84.3, totalPct: 81.8 },
  { id: '3',  date: '06-ago',  timestamp: '2026-08-06T08:00:00.000Z', congeladoPct: 71.8, refrigeradoPct: 85.9, totalPct: 83.0 },
  { id: '4',  date: '10-ago',  timestamp: '2026-08-10T08:00:00.000Z', congeladoPct: 77.7, refrigeradoPct: 92.1, totalPct: 89.2 },
  { id: '5',  date: '11-ago',  timestamp: '2026-08-11T08:00:00.000Z', congeladoPct: 75.3, refrigeradoPct: 89.5, totalPct: 86.6 },
  { id: '6',  date: '12-ago',  timestamp: '2026-08-12T08:00:00.000Z', congeladoPct: 76.0, refrigeradoPct: 88.9, totalPct: 86.3 },
  { id: '7',  date: '13-ago',  timestamp: '2026-08-13T08:00:00.000Z', congeladoPct: 77.7, refrigeradoPct: 91.7, totalPct: 88.9 },
  { id: '8',  date: '14-ago',  timestamp: '2026-08-14T08:00:00.000Z', congeladoPct: 77.6, refrigeradoPct: 93.7, totalPct: 90.4 },
  { id: '9',  date: '17-ago',  timestamp: '2026-08-17T08:00:00.000Z', congeladoPct: 74.3, refrigeradoPct: 95.4, totalPct: 91.1 },
  { id: '10', date: '19-ago',  timestamp: '2026-08-19T08:00:00.000Z', congeladoPct: 72.9, refrigeradoPct: 95.8, totalPct: 91.2 },
  { id: '11', date: '20-ago',  timestamp: '2026-08-20T08:00:00.000Z', congeladoPct: 71.6, refrigeradoPct: 97.3, totalPct: 92.1 },
  { id: '12', date: '21-ago',  timestamp: '2026-08-21T08:00:00.000Z', congeladoPct: 69.2, refrigeradoPct: 96.0, totalPct: 90.6 },
  { id: '13', date: '24-ago',  timestamp: '2026-08-24T08:00:00.000Z', congeladoPct: 71.2, refrigeradoPct: 96.3, totalPct: 91.3 },
  { id: '14', date: '26-ago',  timestamp: '2026-08-26T08:00:00.000Z', congeladoPct: 75.4, refrigeradoPct: 92.4, totalPct: 89.0 },
  { id: '15', date: '27-ago',  timestamp: '2026-08-27T08:00:00.000Z', congeladoPct: 78.5, refrigeradoPct: 87.4, totalPct: 85.6 },
  { id: '16', date: '02-sept', timestamp: '2026-09-02T08:00:00.000Z', congeladoPct: 71.2, refrigeradoPct: 78.9, totalPct: 77.4 },
  { id: '17', date: '04-sept', timestamp: '2026-09-04T08:00:00.000Z', congeladoPct: 74.5, refrigeradoPct: 78.3, totalPct: 77.5 },
  { id: '18', date: '07-sept', timestamp: '2026-09-07T08:00:00.000Z', congeladoPct: 79.7, refrigeradoPct: 89.7, totalPct: 87.6 },
  { id: '19', date: '08-sept', timestamp: '2026-09-08T08:00:00.000Z', congeladoPct: 77.6, refrigeradoPct: 86.9, totalPct: 85.0 },
  { id: '20', date: '14-sept', timestamp: '2026-09-14T08:00:00.000Z', congeladoPct: 82.0, refrigeradoPct: 88.5, totalPct: 87.2, excelCongeladoPct: 82.03, excelRefrigeradoPct: 88.45, excelTotalPct: 87.16 },
  { id: '21', date: '17-sept', timestamp: '2026-09-17T08:00:00.000Z', congeladoPct: 80.8, refrigeradoPct: 78.6, totalPct: 79.0, excelCongeladoPct: 80.76, excelRefrigeradoPct: 78.57, excelTotalPct: 79.01 },
  { id: '22', date: '21-sept', timestamp: '2026-09-21T08:00:00.000Z', congeladoPct: 80.2, refrigeradoPct: 75.8, totalPct: 76.7, excelCongeladoPct: 80.18, excelRefrigeradoPct: 75.77, excelTotalPct: 76.65 },
  { id: '23', date: '22-sept', timestamp: '2026-09-22T08:00:00.000Z', congeladoPct: 76.8, refrigeradoPct: 62.6, totalPct: 65.5, excelCongeladoPct: 76.8, excelRefrigeradoPct: 62.6, excelTotalPct: 65.5 },
  { id: '24', date: '23-sept', timestamp: '2026-09-23T08:00:00.000Z', congeladoPct: 79.0, refrigeradoPct: 63.9, totalPct: 66.9, excelCongeladoPct: 79.0, excelRefrigeradoPct: 63.9, excelTotalPct: 66.9 },
  { id: '25', date: '24-sept', timestamp: '2026-09-24T08:00:00.000Z', congeladoPct: 79.6, refrigeradoPct: 63.9, totalPct: 67.1, excelCongeladoPct: 79.6, excelRefrigeradoPct: 63.9, excelTotalPct: 67.1 },
  { id: '26', date: '28-sept', timestamp: '2026-09-28T08:00:00.000Z', congeladoPct: 81.8, refrigeradoPct: 70.8, totalPct: 73.0, excelCongeladoPct: 81.8, excelRefrigeradoPct: 70.8, excelTotalPct: 73.0 },
];

/**
 * Calcula la ocupación por posición del almacén aplicando la regla de negocio:
 * 1. Todo rack que tenga al menos 1 posición con 2 pallets es "Rack Doble Completo" (capacidad = huecos * 2).
 * 2. Todo rack sin posiciones dobles es "Rack Simple" (capacidad = huecos * 1).
 * 3. Las posiciones dobles cuentan por 2 y las simples por 1.
 */
export function calculateWarehouseOccupancy(
  stockIndex: Map<string, StockItem[]>
): WarehouseOccupancySummary {
  const rackMetrics: RackOccupancyMetrics[] = [];

  for (const rack of WAREHOUSE_RACKS) {
    const physicalSlots = rack.moduleCount * 6;
    let singleOccupiedSlots = 0;
    let doubleOccupiedSlots = 0;

    for (const mod of rack.modules) {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const ubi = `${mod}${String(lvl).padStart(2, '0')}`;
        const items = stockIndex.get(ubi);
        if (items && items.length > 0) {
          if (items.length === 1) {
            singleOccupiedSlots++;
          } else {
            // 2 o más pallets
            doubleOccupiedSlots++;
          }
        }
      }
    }

    // Regla: si tiene al menos 1 posición doble, es rack doble completo
    const isDoubleRack = doubleOccupiedSlots > 0;
    const capacityPositions = isDoubleRack ? physicalSlots * 2 : physicalSlots * 1;
    const occupiedPositions = (doubleOccupiedSlots * 2) + (singleOccupiedSlots * 1);
    const emptySlots = Math.max(0, physicalSlots - (singleOccupiedSlots + doubleOccupiedSlots));
    const occupancyPct = capacityPositions > 0 
      ? Math.round((occupiedPositions / capacityPositions) * 1000) / 10 
      : 0;

    const zone: 'CONGELADO' | 'REFRIGERADO' = rack.id <= 8 ? 'CONGELADO' : 'REFRIGERADO';

    rackMetrics.push({
      rack,
      zone,
      moduleCount: rack.moduleCount,
      physicalSlots,
      isDoubleRack,
      capacityPositions,
      singleOccupiedSlots,
      doubleOccupiedSlots,
      emptySlots,
      occupiedPositions,
      occupancyPct,
    });
  }

  // Agrupación por Zona
  const congeladoRacks = rackMetrics.filter(r => r.zone === 'CONGELADO');
  const refrigeradoRacks = rackMetrics.filter(r => r.zone === 'REFRIGERADO');

  const cCapacity = congeladoRacks.reduce((sum, r) => sum + r.capacityPositions, 0);
  const cOccupied = congeladoRacks.reduce((sum, r) => sum + r.occupiedPositions, 0);
  const cPct = cCapacity > 0 ? Math.round((cOccupied / cCapacity) * 1000) / 10 : 0;

  const rCapacity = refrigeradoRacks.reduce((sum, r) => sum + r.capacityPositions, 0);
  const rOccupied = refrigeradoRacks.reduce((sum, r) => sum + r.occupiedPositions, 0);
  const rPct = rCapacity > 0 ? Math.round((rOccupied / rCapacity) * 1000) / 10 : 0;

  const gCapacity = cCapacity + rCapacity;
  const gOccupied = cOccupied + rOccupied;
  const gPct = gCapacity > 0 ? Math.round((gOccupied / gCapacity) * 1000) / 10 : 0;

  // Calcular desglose exacto por tipo de almacén (CGO, PBK, PFW, RCK)
  const tipoNames: Record<'CGO' | 'PBK' | 'PFW' | 'RCK', string> = {
    CGO: 'CGO - Cámara Congelado',
    PBK: 'PBK - Push Back',
    PFW: 'PFW - Post Forward',
    RCK: 'RCK - Producto Crítico',
  };

  const tipoData: Record<'CGO' | 'PBK' | 'PFW' | 'RCK', TipoAlmacenBreakdown> = {
    CGO: { tipo: 'CGO', name: tipoNames.CGO, simplePositions: 0, doubleSlotsCount: 0, doublePositions: 0, totalPositions: 0, capacityPositions: 0, emptyPositions: 0, totalPhysicalSlots: 0, occupancyPct: 0 },
    PBK: { tipo: 'PBK', name: tipoNames.PBK, simplePositions: 0, doubleSlotsCount: 0, doublePositions: 0, totalPositions: 0, capacityPositions: 0, emptyPositions: 0, totalPhysicalSlots: 0, occupancyPct: 0 },
    PFW: { tipo: 'PFW', name: tipoNames.PFW, simplePositions: 0, doubleSlotsCount: 0, doublePositions: 0, totalPositions: 0, capacityPositions: 0, emptyPositions: 0, totalPhysicalSlots: 0, occupancyPct: 0 },
    RCK: { tipo: 'RCK', name: tipoNames.RCK, simplePositions: 0, doubleSlotsCount: 0, doublePositions: 0, totalPositions: 0, capacityPositions: 0, emptyPositions: 0, totalPhysicalSlots: 0, occupancyPct: 0 },
  };

  for (const r of rackMetrics) {
    for (const mod of r.rack.modules) {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const ubi = `${mod}${String(lvl).padStart(2, '0')}`;
        const tipo = getSlotTipoAlmacen(r.rack.id, lvl);
        const slotCapacity = r.isDoubleRack ? 2 : 1;
        const td = tipoData[tipo];
        td.totalPhysicalSlots++;
        td.capacityPositions += slotCapacity;

        const items = stockIndex.get(ubi) || [];
        if (items.length === 0) {
          td.emptyPositions += slotCapacity;
        } else if (items.length === 1) {
          td.simplePositions += 1;
          td.totalPositions += 1;
          if (slotCapacity === 2) td.emptyPositions += 1;
        } else {
          td.doubleSlotsCount += 1;
          td.doublePositions += 2;
          td.totalPositions += 2;
        }
      }
    }
  }

  for (const td of Object.values(tipoData)) {
    td.occupancyPct = td.capacityPositions > 0 ? Math.round((td.totalPositions / td.capacityPositions) * 1000) / 10 : 0;
  }

  const refSimple = tipoData.PBK.simplePositions + tipoData.PFW.simplePositions + tipoData.RCK.simplePositions;
  const refDoubleSlots = tipoData.PBK.doubleSlotsCount + tipoData.PFW.doubleSlotsCount + tipoData.RCK.doubleSlotsCount;
  const refDoublePos = tipoData.PBK.doublePositions + tipoData.PFW.doublePositions + tipoData.RCK.doublePositions;
  const refTotal = tipoData.PBK.totalPositions + tipoData.PFW.totalPositions + tipoData.RCK.totalPositions;

  const congelado: ZoneOccupancyMetrics = {
    zone: 'CONGELADO',
    racksCount: congeladoRacks.length,
    doubleRacksCount: congeladoRacks.filter(r => r.isDoubleRack).length,
    simpleRacksCount: congeladoRacks.filter(r => !r.isDoubleRack).length,
    capacityPositions: cCapacity,
    occupiedPositions: cOccupied,
    emptyPositions: Math.max(0, cCapacity - cOccupied),
    occupancyPct: cPct,
    simplePositions: tipoData.CGO.simplePositions,
    doubleSlotsCount: tipoData.CGO.doubleSlotsCount,
    doublePositions: tipoData.CGO.doublePositions,
    totalPositions: tipoData.CGO.totalPositions,
    breakdownByTipo: {
      CGO: tipoData.CGO,
    },
  };

  const refrigerado: ZoneOccupancyMetrics = {
    zone: 'REFRIGERADO',
    racksCount: refrigeradoRacks.length,
    doubleRacksCount: refrigeradoRacks.filter(r => r.isDoubleRack).length,
    simpleRacksCount: refrigeradoRacks.filter(r => !r.isDoubleRack).length,
    capacityPositions: rCapacity,
    occupiedPositions: rOccupied,
    emptyPositions: Math.max(0, rCapacity - rOccupied),
    occupancyPct: rPct,
    simplePositions: refSimple,
    doubleSlotsCount: refDoubleSlots,
    doublePositions: refDoublePos,
    totalPositions: refTotal,
    breakdownByTipo: {
      PBK: tipoData.PBK,
      PFW: tipoData.PFW,
      RCK: tipoData.RCK,
    },
  };

  const global: ZoneOccupancyMetrics = {
    zone: 'GLOBAL',
    racksCount: rackMetrics.length,
    doubleRacksCount: rackMetrics.filter(r => r.isDoubleRack).length,
    simpleRacksCount: rackMetrics.filter(r => !r.isDoubleRack).length,
    capacityPositions: gCapacity,
    occupiedPositions: gOccupied,
    emptyPositions: Math.max(0, gCapacity - gOccupied),
    occupancyPct: gPct,
    simplePositions: tipoData.CGO.simplePositions + refSimple,
    doubleSlotsCount: tipoData.CGO.doubleSlotsCount + refDoubleSlots,
    doublePositions: tipoData.CGO.doublePositions + refDoublePos,
    totalPositions: tipoData.CGO.totalPositions + refTotal,
    breakdownByTipo: tipoData,
  };

  return {
    congelado,
    refrigerado,
    global,
    racks: rackMetrics,
  };
}

/**
 * Sanitiza el historial de ocupación asegurando que:
 * 1. Los puntos históricos oficiales de agosto y septiembre reflejen los valores certificados de Excel.
 * 2. Se remuevan snapshots duplicados erróneos (ej. 15-sept y 16-sept repetidos con 82.0%/88.5%).
 * 3. 17-sept y 21-sept contengan sus valores reales de evolución (80.8%/78.6% y 80.2%/75.8%).
 */
export function sanitizeOccupancyHistory(points: OccupancyHistoryPoint[]): OccupancyHistoryPoint[] {
  if (!Array.isArray(points) || points.length === 0) {
    return INITIAL_OCCUPANCY_HISTORY;
  }

  const officialMap = new Map<string, OccupancyHistoryPoint>();
  for (const pt of INITIAL_OCCUPANCY_HISTORY) {
    officialMap.set(pt.date, pt);
  }

  const result: OccupancyHistoryPoint[] = [];

  for (const pt of points) {
    // Si es un snapshot falso repetido del 15 o 16 de septiembre producto del bug anterior de isBaseline, omitir
    if (
      (pt.date === '15-sept' || pt.date === '16-sept') && 
      Math.abs(pt.congeladoPct - 82) < 0.2 && 
      Math.abs(pt.refrigeradoPct - 88.45) < 0.2
    ) {
      continue;
    }

    // Si coincide con una fecha oficial del reporte, priorizar siempre los valores certificados
    if (officialMap.has(pt.date)) {
      result.push(officialMap.get(pt.date)!);
    } else {
      result.push(pt);
    }
  }

  // Asegurar que 17-sept y 21-sept estén presentes
  if (!result.some(p => p.date === '17-sept') && officialMap.has('17-sept')) {
    result.push(officialMap.get('17-sept')!);
  }
  if (!result.some(p => p.date === '21-sept') && officialMap.has('21-sept')) {
    result.push(officialMap.get('21-sept')!);
  }

  return result;
}

/**
 * Obtiene el historial de ocupación desde localStorage o inicializa con la data histórica oficial.
 */
export function getOccupancyHistory(): OccupancyHistoryPoint[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_OCCUPANCY_HISTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeOccupancyHistory(parsed);
      }
    }
  } catch (e) {
    console.error('Error loading occupancy history', e);
  }
  return INITIAL_OCCUPANCY_HISTORY;
}

/**
 * Guarda el historial en localStorage.
 */
export function saveOccupancyHistory(history: OccupancyHistoryPoint[]): void {
  try {
    const clean = sanitizeOccupancyHistory(history);
    localStorage.setItem(LOCAL_STORAGE_OCCUPANCY_HISTORY_KEY, JSON.stringify(clean));
  } catch (e) {
    console.warn('Error saving occupancy history', e);
  }
}

/**
 * Combina dos conjuntos de historial de ocupación (ej. local y remoto) sin perder fechas.
 * Mantiene orden cronológico / orden de aparición y actualiza con los datos más completos.
 */
export function mergeOccupancyHistories(
  base: OccupancyHistoryPoint[],
  incoming: OccupancyHistoryPoint[]
): OccupancyHistoryPoint[] {
  const cleanBase = sanitizeOccupancyHistory(base);
  const cleanIncoming = sanitizeOccupancyHistory(incoming);

  const map = new Map<string, OccupancyHistoryPoint>();

  for (const pt of cleanBase) {
    map.set(pt.date, pt);
  }

  for (const pt of cleanIncoming) {
    if (map.has(pt.date)) {
      const existing = map.get(pt.date)!;
      map.set(pt.date, {
        ...existing,
        ...pt,
        congeladoPct: pt.congeladoPct ?? existing.congeladoPct,
        refrigeradoPct: pt.refrigeradoPct ?? existing.refrigeradoPct,
        totalPct: pt.totalPct ?? existing.totalPct,
      });
    } else {
      map.set(pt.date, pt);
    }
  }

  return sanitizeOccupancyHistory(Array.from(map.values()));
}


/**
 * Formatea una fecha actual en etiqueta corta tipo "05-sept"
 */
export function formatCurrentDateLabel(d = new Date()): string {
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
  const month = months[d.getMonth()];
  return `${day}-${month}`;
}

/**
 * Calcula el resumen de ocupación bajo el Criterio Clásico de Excel (por Ubicaciones Físicas / Huecos).
 * Reproduce exactamente la Tabla Dinámica de CIAL:
 * - Ubicaciones disponibles = Simples vacías + Dobles vacías + Triples vacías
 * - % OCUPACIÓN = (TOTAL - Ubicaciones disponibles) / TOTAL = Ubicaciones Ocupadas / TOTAL
 */
export function calculateExcelPivotSummary(
  stockIndex: Map<string, StockItem[]>
): ExcelOccupancySummary {
  const master = EXCEL_MASTER_CAPACITIES;

  // Contadores por tipo de almacén basados en las 5.093 posiciones físicas oficiales
  const simplesVacias: Record<'CGO' | 'PBK' | 'PFW' | 'RCK', number> = { CGO: 0, PBK: 0, PFW: 0, RCK: 0 };
  const doblesVacias: Record<'CGO' | 'PBK' | 'PFW' | 'RCK', number> = { CGO: 0, PBK: 0, PFW: 0, RCK: 0 };
  const triplesVacias: Record<'CGO' | 'PBK' | 'PFW' | 'RCK', number> = { CGO: 0, PBK: 0, PFW: 0, RCK: 0 };
  const occupiedSlots: Record<'CGO' | 'PBK' | 'PFW' | 'RCK', number> = { CGO: 0, PBK: 0, PFW: 0, RCK: 0 };

  for (const rack of WAREHOUSE_RACKS) {
    const prof = getSlotProfundidad(rack.id);
    for (const mod of rack.modules) {
      for (let lvl = 1; lvl <= 6; lvl++) {
        // Excluir posiciones de picking de nivel 1 que no forman parte de almacenamiento
        if (!isAlmacenamientoSlot(rack.id, lvl)) continue;

        const ubi = `${mod}${String(lvl).padStart(2, '0')}`;
        const tipo = getSlotTipoAlmacen(rack.id, lvl);
        const items = stockIndex.get(ubi);
        const isOccupied = items && items.length > 0;

        if (isOccupied) {
          occupiedSlots[tipo]++;
        } else {
          if (prof === 3) {
            triplesVacias[tipo]++;
          } else if (prof === 2) {
            doblesVacias[tipo]++;
          } else {
            simplesVacias[tipo]++;
          }
        }
      }
    }
  }

  const buildRow = (tipo: 'CGO' | 'PBK' | 'PFW' | 'RCK'): ExcelPivotRow => {
    const total = master[tipo].total;
    const sVac = simplesVacias[tipo];
    const dVac = doblesVacias[tipo];
    const tVac = triplesVacias[tipo];
    const disponibles = sVac + dVac + tVac;
    const ocupadas = Math.max(0, total - disponibles);
    const pctOcupacion = total > 0 ? Math.round(((ocupadas / total) * 100) * 100) / 100 : 0;

    return {
      tipo,
      nombre: master[tipo].name,
      simplesVacias: sVac,
      doblesVacias: dVac,
      triplesVacias: tVac,
      total,
      ocupadas,
      disponibles,
      pctOcupacion,
    };
  };

  const rowCGO = buildRow('CGO');
  const rowPBK = buildRow('PBK');
  const rowPFW = buildRow('PFW');
  const rowRCK = buildRow('RCK');

  const totTotal = rowCGO.total + rowPBK.total + rowPFW.total + rowRCK.total;
  const totDisponibles = rowCGO.disponibles + rowPBK.disponibles + rowPFW.disponibles + rowRCK.disponibles;
  const totOcupadas = rowCGO.ocupadas + rowPBK.ocupadas + rowPFW.ocupadas + rowRCK.ocupadas;
  const totSimples = rowCGO.simplesVacias + rowPBK.simplesVacias + rowPFW.simplesVacias + rowRCK.simplesVacias;
  const totDobles = rowCGO.doblesVacias + rowPBK.doblesVacias + rowPFW.doblesVacias + rowRCK.doblesVacias;
  const totTriples = rowCGO.triplesVacias + rowPBK.triplesVacias + rowPFW.triplesVacias + rowRCK.triplesVacias;
  const totPct = totTotal > 0 ? Math.round(((totOcupadas / totTotal) * 100) * 100) / 100 : 0;

  const totalRow: ExcelPivotRow = {
    tipo: 'TOTAL',
    nombre: 'Total General',
    simplesVacias: totSimples,
    doblesVacias: totDobles,
    triplesVacias: totTriples,
    total: totTotal,
    ocupadas: totOcupadas,
    disponibles: totDisponibles,
    pctOcupacion: totPct,
  };

  const refTotal = rowPBK.total + rowPFW.total + rowRCK.total;
  const refDisponibles = rowPBK.disponibles + rowPFW.disponibles + rowRCK.disponibles;
  const refOcupadas = rowPBK.ocupadas + rowPFW.ocupadas + rowRCK.ocupadas;
  const refPct = refTotal > 0 ? Math.round(((refOcupadas / refTotal) * 100) * 100) / 100 : 0;

  return {
    rows: [rowCGO, rowPBK, rowPFW, rowRCK],
    totalRow,
    congelado: {
      total: rowCGO.total,
      ocupadas: rowCGO.ocupadas,
      disponibles: rowCGO.disponibles,
      pctOcupacion: rowCGO.pctOcupacion,
      simplesVacias: rowCGO.simplesVacias,
      doblesVacias: rowCGO.doblesVacias,
    },
    refrigerado: {
      total: refTotal,
      ocupadas: refOcupadas,
      disponibles: refDisponibles,
      pctOcupacion: refPct,
      simplesVacias: rowPBK.simplesVacias + rowPFW.simplesVacias + rowRCK.simplesVacias,
      doblesVacias: rowPBK.doblesVacias + rowPFW.doblesVacias + rowRCK.doblesVacias,
    },
    global: {
      total: totTotal,
      ocupadas: totOcupadas,
      disponibles: totDisponibles,
      pctOcupacion: totPct,
      simplesVacias: totSimples,
      doblesVacias: totDobles,
    },
  };
}

