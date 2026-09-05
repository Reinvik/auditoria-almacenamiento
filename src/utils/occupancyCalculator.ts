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

export interface ZoneOccupancyMetrics {
  zone: 'CONGELADO' | 'REFRIGERADO' | 'GLOBAL';
  racksCount: number;
  doubleRacksCount: number;
  simpleRacksCount: number;
  capacityPositions: number;
  occupiedPositions: number;
  emptyPositions: number;
  occupancyPct: number;
}

export interface WarehouseOccupancySummary {
  congelado: ZoneOccupancyMetrics;
  refrigerado: ZoneOccupancyMetrics;
  global: ZoneOccupancyMetrics;
  racks: RackOccupancyMetrics[];
}

export interface OccupancyHistoryPoint {
  id: string;
  date: string; // ej: "03-ago", "05-ago", "02-sept"
  timestamp: string; // ISO date
  congeladoPct: number;
  refrigeradoPct: number;
  congeladoOccupied?: number;
  congeladoCapacity?: number;
  refrigeradoOccupied?: number;
  refrigeradoCapacity?: number;
}

export const LOCAL_STORAGE_OCCUPANCY_HISTORY_KEY = 'auditoria_almacenamiento_occupancy_history_v1';

/**
 * Registros históricos oficiales de CIAL CD San Jorge (Imagen 2)
 */
export const INITIAL_OCCUPANCY_HISTORY: OccupancyHistoryPoint[] = [
  { id: '1',  date: '03-ago',  timestamp: '2026-08-03T08:00:00.000Z', congeladoPct: 77.1, refrigeradoPct: 81.5 },
  { id: '2',  date: '05-ago',  timestamp: '2026-08-05T08:00:00.000Z', congeladoPct: 72.0, refrigeradoPct: 84.3 },
  { id: '3',  date: '06-ago',  timestamp: '2026-08-06T08:00:00.000Z', congeladoPct: 71.8, refrigeradoPct: 85.9 },
  { id: '4',  date: '10-ago',  timestamp: '2026-08-10T08:00:00.000Z', congeladoPct: 77.7, refrigeradoPct: 92.1 },
  { id: '5',  date: '11-ago',  timestamp: '2026-08-11T08:00:00.000Z', congeladoPct: 75.3, refrigeradoPct: 89.5 },
  { id: '6',  date: '12-ago',  timestamp: '2026-08-12T08:00:00.000Z', congeladoPct: 76.0, refrigeradoPct: 88.9 },
  { id: '7',  date: '13-ago',  timestamp: '2026-08-13T08:00:00.000Z', congeladoPct: 77.7, refrigeradoPct: 91.7 },
  { id: '8',  date: '14-ago',  timestamp: '2026-08-14T08:00:00.000Z', congeladoPct: 77.6, refrigeradoPct: 93.7 },
  { id: '9',  date: '17-ago',  timestamp: '2026-08-17T08:00:00.000Z', congeladoPct: 74.3, refrigeradoPct: 95.4 },
  { id: '10', date: '19-ago',  timestamp: '2026-08-19T08:00:00.000Z', congeladoPct: 72.9, refrigeradoPct: 95.8 },
  { id: '11', date: '20-ago',  timestamp: '2026-08-20T08:00:00.000Z', congeladoPct: 71.6, refrigeradoPct: 97.3 },
  { id: '12', date: '21-ago',  timestamp: '2026-08-21T08:00:00.000Z', congeladoPct: 69.2, refrigeradoPct: 96.0 },
  { id: '13', date: '24-ago',  timestamp: '2026-08-24T08:00:00.000Z', congeladoPct: 71.2, refrigeradoPct: 96.3 },
  { id: '14', date: '26-ago',  timestamp: '2026-08-26T08:00:00.000Z', congeladoPct: 75.4, refrigeradoPct: 92.4 },
  { id: '15', date: '27-ago',  timestamp: '2026-08-27T08:00:00.000Z', congeladoPct: 78.5, refrigeradoPct: 87.4 },
  { id: '16', date: '02-sept', timestamp: '2026-09-02T08:00:00.000Z', congeladoPct: 71.2, refrigeradoPct: 78.9 },
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

  const congelado: ZoneOccupancyMetrics = {
    zone: 'CONGELADO',
    racksCount: congeladoRacks.length,
    doubleRacksCount: congeladoRacks.filter(r => r.isDoubleRack).length,
    simpleRacksCount: congeladoRacks.filter(r => !r.isDoubleRack).length,
    capacityPositions: cCapacity,
    occupiedPositions: cOccupied,
    emptyPositions: Math.max(0, cCapacity - cOccupied),
    occupancyPct: cPct,
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
  };

  return {
    congelado,
    refrigerado,
    global,
    racks: rackMetrics,
  };
}

/**
 * Obtiene el historial de ocupación desde localStorage o inicializa con la data histórica oficial.
 */
export function getOccupancyHistory(): OccupancyHistoryPoint[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_OCCUPANCY_HISTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
    localStorage.setItem(LOCAL_STORAGE_OCCUPANCY_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Error saving occupancy history', e);
  }
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
