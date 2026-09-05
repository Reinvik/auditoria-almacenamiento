import { 
  WarehouseZone, 
  AuditorAssignment, 
  WorkloadDistributionConfig, 
  BalanceMetric,
  PartitionMode,
  StockItem, 
  RackConfig, 
  AislePair 
} from '../types/warehouse';
import { WAREHOUSE_RACKS, DEFAULT_AISLES } from '../config/warehouseConfig';

export const AUDITOR_COLORS = [
  '#0a5c36', // 1: Verde Oficial CIAL
  '#1d4ed8', // 2: Azul Eléctrico
  '#d97706', // 3: Ámbar / Naranja
  '#7e22ce', // 4: Violeta Intenso
  '#e11d48', // 5: Carmesí / Rosa
  '#0891b2', // 6: Cian Oscuro
  '#4338ca', // 7: Índigo
  '#65a30d', // 8: Verde Lima
];

// Puntos de esfuerzo añadidos por cada rack recorrido físicamente (100 puntos por rack)
export const TRAVEL_POINTS_PER_RACK = 100;

export interface AisleWorkload {
  aisle: AislePair;
  rackIds: number[];
  rackCodes: string[];
  effortPoints: number; // total = palletPoints + travelPoints
  palletPoints: number; // 1pt simple, 2pt doble (vacías 0pt)
  travelPoints: number; // 100 pts por cada rack en el pasillo
  singlePalletSlots: number;
  doublePalletSlots: number;
  emptySlots: number;
  totalSlots: number;
  occupiedSlots: number;
  totalPallets: number;
}

export interface RackWorkload {
  rack: RackConfig;
  aisleId: number;
  effortPoints: number; // total = palletPoints + travelPoints
  palletPoints: number; // 1pt simple, 2pt doble (vacías 0pt)
  travelPoints: number; // 100 pts por este rack
  singlePalletSlots: number;
  doublePalletSlots: number;
  emptySlots: number;
  totalSlots: number;
  occupiedSlots: number;
  totalPallets: number;
}

/**
 * Retorna los pasillos que pertenecen a una zona determinada.
 * Congelado: Pasillos 1 al 4 (Racks 1 al 8).
 * Refrigerado: Pasillos 5 al 15 (Racks 9 al 29).
 */
export function getAislesForZone(zone: WarehouseZone): AislePair[] {
  if (zone === 'CONGELADO') {
    return DEFAULT_AISLES.filter(a => a.id >= 1 && a.id <= 4);
  }
  if (zone === 'REFRIGERADO') {
    return DEFAULT_AISLES.filter(a => a.id >= 5 && a.id <= 15);
  }
  return DEFAULT_AISLES;
}

/**
 * Retorna los racks que pertenecen a una zona determinada.
 * Congelado: Racks 1 al 8.
 * Refrigerado: Racks 9 al 29.
 */
export function getRacksForZone(zone: WarehouseZone): RackConfig[] {
  if (zone === 'CONGELADO') {
    return WAREHOUSE_RACKS.filter(r => r.id >= 1 && r.id <= 8);
  }
  if (zone === 'REFRIGERADO') {
    return WAREHOUSE_RACKS.filter(r => r.id >= 9 && r.id <= 29);
  }
  return WAREHOUSE_RACKS;
}

/**
 * Verifica si un rack pertenece a una zona.
 */
export function isRackInZone(rackId: number, zone: WarehouseZone): boolean {
  if (zone === 'ALL') return true;
  if (zone === 'CONGELADO') return rackId >= 1 && rackId <= 8;
  if (zone === 'REFRIGERADO') return rackId >= 9 && rackId <= 29;
  return true;
}

/**
 * Verifica si un pasillo pertenece a una zona.
 */
export function isAisleInZone(aisleId: number, zone: WarehouseZone): boolean {
  if (zone === 'ALL') return true;
  if (zone === 'CONGELADO') return aisleId >= 1 && aisleId <= 4;
  if (zone === 'REFRIGERADO') return aisleId >= 5 && aisleId <= 15;
  return true;
}

/**
 * Calcula la carga y puntaje de esfuerzo de un rack individual:
 * - Posiciones vacías: 0 puntos (revisión inmediata sin conteo).
 * - Posición simple (1 pallet): 1 punto de esfuerzo.
 * - Posición doble (2 pallets): 2 puntos de esfuerzo.
 * - Recorrido físico del rack: +100 puntos de esfuerzo (evita que un auditor termine con 7 racks y otro con 2).
 */
export function calculateSingleRackWorkload(
  rack: RackConfig,
  stockIndex: Map<string, StockItem[]>
): {
  effortPoints: number;
  palletPoints: number;
  travelPoints: number;
  singlePalletSlots: number;
  doublePalletSlots: number;
  emptySlots: number;
  totalSlots: number;
  occupiedSlots: number;
  totalPallets: number;
} {
  const totalSlots = rack.moduleCount * 6;
  let occupiedSlots = 0;
  let totalPallets = 0;
  let singlePalletSlots = 0;
  let doublePalletSlots = 0;
  let palletPoints = 0;

  for (const mod of rack.modules) {
    for (let lvl = 1; lvl <= 6; lvl++) {
      const nivelStr = String(lvl).padStart(2, '0');
      const ubi = `${mod}${nivelStr}`;
      const items = stockIndex.get(ubi);
      if (items && items.length > 0) {
        occupiedSlots++;
        const count = items.length;
        totalPallets += count;
        if (count === 1) {
          singlePalletSlots++;
          palletPoints += 1;
        } else if (count === 2) {
          doublePalletSlots++;
          palletPoints += 2;
        } else {
          palletPoints += count;
        }
      }
    }
  }

  const emptySlots = Math.max(0, totalSlots - occupiedSlots);
  const travelPoints = TRAVEL_POINTS_PER_RACK; // 100 pts de esfuerzo por recorrer físicamente el rack
  const effortPoints = palletPoints + travelPoints;

  return {
    effortPoints,
    palletPoints,
    travelPoints,
    singlePalletSlots,
    doublePalletSlots,
    emptySlots,
    totalSlots,
    occupiedSlots,
    totalPallets,
  };
}

/**
 * Calcula la carga de trabajo detallada por cada pasillo en la zona seleccionada.
 */
export function calculateAislesWorkload(
  zone: WarehouseZone,
  stockIndex: Map<string, StockItem[]>
): AisleWorkload[] {
  const aisles = getAislesForZone(zone);

  return aisles.map(aisle => {
    const rackIds = aisle.leftRackId === aisle.rightRackId 
      ? [aisle.leftRackId] 
      : [aisle.leftRackId, aisle.rightRackId];
    
    let totalSlots = 0;
    let occupiedSlots = 0;
    let totalPallets = 0;
    let singlePalletSlots = 0;
    let doublePalletSlots = 0;
    let emptySlots = 0;
    let palletPoints = 0;
    let travelPoints = 0;
    let effortPoints = 0;
    const rackCodes: string[] = [];

    for (const rId of rackIds) {
      const rack = WAREHOUSE_RACKS.find(r => r.id === rId);
      if (!rack) continue;
      rackCodes.push(rack.code);

      const rMetrics = calculateSingleRackWorkload(rack, stockIndex);
      totalSlots += rMetrics.totalSlots;
      occupiedSlots += rMetrics.occupiedSlots;
      totalPallets += rMetrics.totalPallets;
      singlePalletSlots += rMetrics.singlePalletSlots;
      doublePalletSlots += rMetrics.doublePalletSlots;
      emptySlots += rMetrics.emptySlots;
      palletPoints += rMetrics.palletPoints;
      travelPoints += rMetrics.travelPoints;
      effortPoints += rMetrics.effortPoints;
    }

    return {
      aisle,
      rackIds,
      rackCodes,
      effortPoints,
      palletPoints,
      travelPoints,
      singlePalletSlots,
      doublePalletSlots,
      emptySlots,
      totalSlots,
      occupiedSlots,
      totalPallets,
    };
  });
}

/**
 * Calcula la carga de trabajo detallada por cada rack en la zona seleccionada.
 */
export function calculateRacksWorkload(
  zone: WarehouseZone,
  stockIndex: Map<string, StockItem[]>
): RackWorkload[] {
  const racks = getRacksForZone(zone);

  return racks.map(rack => {
    const aisle = DEFAULT_AISLES.find(a => a.leftRackId === rack.id || a.rightRackId === rack.id) || DEFAULT_AISLES[0];
    const metrics = calculateSingleRackWorkload(rack, stockIndex);
    return {
      rack,
      aisleId: aisle.id,
      ...metrics,
    };
  });
}

/**
 * Algoritmo de partición contigua óptima:
 * Divide unidades contiguas (Pasillos o Racks) entre K auditores minimizando la varianza
 * del puntaje de esfuerzo o métrica elegida.
 * - Posición simple = 1 punto
 * - Posición doble = 2 puntos
 * - Posición vacía = 0 puntos
 */
export function calculateOptimalWorkloadDistribution(
  zone: WarehouseZone,
  auditorCount: number,
  balanceMetric: BalanceMetric = 'effortPoints',
  stockIndex: Map<string, StockItem[]>,
  partitionMode: PartitionMode = 'by_aisles'
): WorkloadDistributionConfig {
  if (partitionMode === 'by_racks') {
    return calculateOptimalRacksDistribution(zone, auditorCount, balanceMetric, stockIndex);
  }

  const aisleWorkloads = calculateAislesWorkload(zone, stockIndex);
  const n = aisleWorkloads.length;
  const k = Math.max(1, Math.min(auditorCount, n));

  // Extraer pesos según la métrica seleccionada
  const weights = aisleWorkloads.map(aw => {
    if (balanceMetric === 'effortPoints') return aw.effortPoints || 1;
    if (balanceMetric === 'occupiedSlots') return aw.occupiedSlots || 1;
    if (balanceMetric === 'totalSlots') return aw.totalSlots || 1;
    return aw.totalPallets || 1;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const targetPerAuditor = totalWeight / k;

  // Caso base: 1 auditor toma todo
  if (k === 1) {
    const allAisleIds = aisleWorkloads.map(aw => aw.aisle.id);
    const allRackIds = Array.from(new Set(aisleWorkloads.flatMap(aw => aw.rackIds))).sort((a, b) => a - b);
    const totalSlots = aisleWorkloads.reduce((acc, aw) => acc + aw.totalSlots, 0);
    const occupiedSlots = aisleWorkloads.reduce((acc, aw) => acc + aw.occupiedSlots, 0);
    const totalPallets = aisleWorkloads.reduce((acc, aw) => acc + aw.totalPallets, 0);
    const palletPoints = aisleWorkloads.reduce((acc, aw) => acc + aw.palletPoints, 0);
    const travelPoints = aisleWorkloads.reduce((acc, aw) => acc + aw.travelPoints, 0);
    const effortPoints = palletPoints + travelPoints;
    const singlePalletSlots = aisleWorkloads.reduce((acc, aw) => acc + aw.singlePalletSlots, 0);
    const doublePalletSlots = aisleWorkloads.reduce((acc, aw) => acc + aw.doublePalletSlots, 0);
    const emptySlots = aisleWorkloads.reduce((acc, aw) => acc + aw.emptySlots, 0);

    const assignment: AuditorAssignment = {
      id: 1,
      name: 'Auditor 1',
      color: AUDITOR_COLORS[0],
      aisleIds: allAisleIds,
      rackIds: allRackIds,
      effortPoints,
      palletPoints,
      travelPoints,
      singlePalletSlots,
      doublePalletSlots,
      emptySlots,
      totalSlots,
      occupiedSlots,
      totalPallets,
      percentage: 100,
    };

    return {
      zone,
      auditorCount: 1,
      balanceMetric,
      partitionMode: 'by_aisles',
      assignments: [assignment],
      updatedAt: new Date().toISOString(),
      version: 3,
    };
  }

  // Búsqueda exhaustiva de partición contigua óptima
  let bestCuts: number[] = [];
  let minVariance = Infinity;

  function findPartitions(auditorIdx: number, currentStart: number, currentCuts: number[]) {
    if (auditorIdx === k - 1) {
      const allCuts = [...currentCuts, n];
      let currentVar = 0;
      let prevCut = 0;

      for (const cut of allCuts) {
        let chunkWeight = 0;
        for (let i = prevCut; i < cut; i++) {
          chunkWeight += weights[i];
        }
        currentVar += Math.pow(chunkWeight - targetPerAuditor, 2);
        prevCut = cut;
      }

      if (currentVar < minVariance) {
        minVariance = currentVar;
        bestCuts = allCuts;
      }
      return;
    }

    const maxStartForThis = n - (k - 1 - auditorIdx);
    for (let cut = currentStart + 1; cut <= maxStartForThis; cut++) {
      findPartitions(auditorIdx + 1, cut, [...currentCuts, cut]);
    }
  }

  findPartitions(0, 0, []);

  // Construir asignaciones
  const assignments: AuditorAssignment[] = [];
  let startIdx = 0;

  for (let aIdx = 0; aIdx < k; aIdx++) {
    const endIdx = bestCuts[aIdx];
    const chunkAisles = aisleWorkloads.slice(startIdx, endIdx);

    const aisleIds = chunkAisles.map(aw => aw.aisle.id);
    const rackIds = Array.from(new Set(chunkAisles.flatMap(aw => aw.rackIds))).sort((a, b) => a - b);
    const totalSlots = chunkAisles.reduce((acc, aw) => acc + aw.totalSlots, 0);
    const occupiedSlots = chunkAisles.reduce((acc, aw) => acc + aw.occupiedSlots, 0);
    const totalPallets = chunkAisles.reduce((acc, aw) => acc + aw.totalPallets, 0);
    const palletPoints = chunkAisles.reduce((acc, aw) => acc + aw.palletPoints, 0);
    const travelPoints = chunkAisles.reduce((acc, aw) => acc + aw.travelPoints, 0);
    const effortPoints = palletPoints + travelPoints;
    const singlePalletSlots = chunkAisles.reduce((acc, aw) => acc + aw.singlePalletSlots, 0);
    const doublePalletSlots = chunkAisles.reduce((acc, aw) => acc + aw.doublePalletSlots, 0);
    const emptySlots = chunkAisles.reduce((acc, aw) => acc + aw.emptySlots, 0);

    const metricValue = balanceMetric === 'effortPoints' 
      ? effortPoints 
      : (balanceMetric === 'totalSlots' ? totalSlots : (balanceMetric === 'occupiedSlots' ? occupiedSlots : totalPallets));
    
    const percentage = totalWeight > 0 ? Math.round((metricValue / totalWeight) * 1000) / 10 : 0;

    assignments.push({
      id: aIdx + 1,
      name: `Auditor ${aIdx + 1}`,
      color: AUDITOR_COLORS[aIdx % AUDITOR_COLORS.length],
      aisleIds,
      rackIds,
      effortPoints,
      palletPoints,
      travelPoints,
      singlePalletSlots,
      doublePalletSlots,
      emptySlots,
      totalSlots,
      occupiedSlots,
      totalPallets,
      percentage,
    });

    startIdx = endIdx;
  }

  return {
    zone,
    auditorCount: k,
    balanceMetric,
    partitionMode: 'by_aisles',
    assignments,
    updatedAt: new Date().toISOString(),
    version: 3,
  };
}

/**
 * Reparto óptimo por Racks individuales (para cuando se desea balance granular)
 */
function calculateOptimalRacksDistribution(
  zone: WarehouseZone,
  auditorCount: number,
  balanceMetric: BalanceMetric,
  stockIndex: Map<string, StockItem[]>
): WorkloadDistributionConfig {
  const rackWorkloads = calculateRacksWorkload(zone, stockIndex);
  const n = rackWorkloads.length;
  const k = Math.max(1, Math.min(auditorCount, n));

  const weights = rackWorkloads.map(rw => {
    if (balanceMetric === 'effortPoints') return rw.effortPoints || 1;
    if (balanceMetric === 'occupiedSlots') return rw.occupiedSlots || 1;
    if (balanceMetric === 'totalSlots') return rw.totalSlots || 1;
    return rw.totalPallets || 1;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const targetPerAuditor = totalWeight / k;

  let bestCuts: number[] = [];
  let minVariance = Infinity;

  function findPartitions(auditorIdx: number, currentStart: number, currentCuts: number[]) {
    if (auditorIdx === k - 1) {
      const allCuts = [...currentCuts, n];
      let currentVar = 0;
      let prevCut = 0;

      for (const cut of allCuts) {
        let chunkWeight = 0;
        for (let i = prevCut; i < cut; i++) {
          chunkWeight += weights[i];
        }
        currentVar += Math.pow(chunkWeight - targetPerAuditor, 2);
        prevCut = cut;
      }

      if (currentVar < minVariance) {
        minVariance = currentVar;
        bestCuts = allCuts;
      }
      return;
    }

    const maxStartForThis = n - (k - 1 - auditorIdx);
    for (let cut = currentStart + 1; cut <= maxStartForThis; cut++) {
      findPartitions(auditorIdx + 1, cut, [...currentCuts, cut]);
    }
  }

  findPartitions(0, 0, []);

  const assignments: AuditorAssignment[] = [];
  let startIdx = 0;

  for (let aIdx = 0; aIdx < k; aIdx++) {
    const endIdx = bestCuts[aIdx];
    const chunkRacks = rackWorkloads.slice(startIdx, endIdx);

    const rackIds = chunkRacks.map(rw => rw.rack.id);
    const aisleIds = Array.from(new Set(chunkRacks.map(rw => rw.aisleId))).sort((a, b) => a - b);
    const totalSlots = chunkRacks.reduce((acc, rw) => acc + rw.totalSlots, 0);
    const occupiedSlots = chunkRacks.reduce((acc, rw) => acc + rw.occupiedSlots, 0);
    const totalPallets = chunkRacks.reduce((acc, rw) => acc + rw.totalPallets, 0);
    const palletPoints = chunkRacks.reduce((acc, rw) => acc + rw.palletPoints, 0);
    const travelPoints = chunkRacks.reduce((acc, rw) => acc + rw.travelPoints, 0);
    const effortPoints = palletPoints + travelPoints;
    const singlePalletSlots = chunkRacks.reduce((acc, rw) => acc + rw.singlePalletSlots, 0);
    const doublePalletSlots = chunkRacks.reduce((acc, rw) => acc + rw.doublePalletSlots, 0);
    const emptySlots = chunkRacks.reduce((acc, rw) => acc + rw.emptySlots, 0);

    const metricValue = balanceMetric === 'effortPoints' 
      ? effortPoints 
      : (balanceMetric === 'totalSlots' ? totalSlots : (balanceMetric === 'occupiedSlots' ? occupiedSlots : totalPallets));
    
    const percentage = totalWeight > 0 ? Math.round((metricValue / totalWeight) * 1000) / 10 : 0;

    assignments.push({
      id: aIdx + 1,
      name: `Auditor ${aIdx + 1}`,
      color: AUDITOR_COLORS[aIdx % AUDITOR_COLORS.length],
      aisleIds,
      rackIds,
      effortPoints,
      palletPoints,
      travelPoints,
      singlePalletSlots,
      doublePalletSlots,
      emptySlots,
      totalSlots,
      occupiedSlots,
      totalPallets,
      percentage,
    });

    startIdx = endIdx;
  }

  return {
    zone,
    auditorCount: k,
    balanceMetric,
    partitionMode: 'by_racks',
    assignments,
    updatedAt: new Date().toISOString(),
    version: 3,
  };
}

/**
 * Genera el texto formateado para compartir la asignación por WhatsApp o correo.
 */
export function generateWorkloadShareText(config: WorkloadDistributionConfig): string {
  const zoneName = config.zone === 'CONGELADO' 
    ? 'CÁMARA CONGELADO (Racks 1 al 8 • Pasillos 1 al 4)' 
    : config.zone === 'REFRIGERADO' 
      ? 'CÁMARA REFRIGERADO (Racks 9 al 29 • Pasillos 5 al 15)' 
      : 'ALMACÉN COMPLETO (Racks 1 al 29 • Pasillos 1 al 15)';

  const metricLabel = config.balanceMetric === 'effortPoints' 
    ? 'Puntaje de Esfuerzo (1 pt Simple, 2 pts Doble, +100 pts por Rack Recorrido)' 
    : config.balanceMetric === 'occupiedSlots' 
      ? 'Posiciones Ocupadas' 
      : config.balanceMetric === 'totalSlots'
        ? 'Posiciones Físicas'
        : 'Pallets SAP';

  let text = `📋 *ASIGNACIÓN DE AUDITORÍA DE ALTURA — CIAL CD SAN JORGE*\n`;
  text += `🏭 *Sector*: ${zoneName}\n`;
  text += `👥 *Total Auditores*: ${config.assignments.length}\n`;
  text += `⚖️ *Criterio de Balance*: ${metricLabel}\n`;
  text += `📅 *Fecha*: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}\n`;
  text += `──────────────────────\n\n`;

  config.assignments.forEach(a => {
    const aislesStr = a.aisleIds.length === 1 
      ? `Pasillo ${a.aisleIds[0]}` 
      : `Pasillos ${a.aisleIds.join(', ')}`;
    
    const racksStr = a.rackIds.length === 1 
      ? `RACK ${a.rackIds[0]}` 
      : `RACK ${a.rackIds[0]} al ${a.rackIds[a.rackIds.length - 1]} (${a.rackIds.map(r => `R${r}`).join(', ')})`;

    const pPts = a.palletPoints ?? (a.effortPoints - a.rackIds.length * 100);
    const tPts = a.travelPoints ?? (a.rackIds.length * 100);

    text += `👤 *${a.name}* (ID #${a.id}):\n`;
    text += `  • 🚪 *${aislesStr}*\n`;
    text += `  • 🏗️ ${racksStr} (${a.rackIds.length} racks)\n`;
    text += `  • 🎯 *Puntaje Total*: *${a.effortPoints.toLocaleString()} pts* (${a.percentage}%)\n`;
    text += `  • 📦 *Puntos Pallets*: ${pPts.toLocaleString()} pts (${a.singlePalletSlots.toLocaleString()} simples • ${a.doublePalletSlots.toLocaleString()} dobles)\n`;
    text += `  • 🚶‍♂️ *Puntos Recorrido*: ${tPts.toLocaleString()} pts (${a.rackIds.length} racks × 100 pts)\n`;
    text += `  • ⬜ *Vacías*: ${a.emptySlots.toLocaleString()} huecos (0pt) | Total: ${a.totalSlots.toLocaleString()} pos\n\n`;
  });

  text += `──────────────────────\n`;
  text += `📲 *App de Auditoría:* https://almacenamiento.nexusnetwork.cl/\n`;
  text += `💡 *Instrucción:* Al abrir la app en su teléfono, seleccionen su número de auditor en la barra superior para ver automáticamente solo sus pasillos y racks asignados.`;

  return text;
}
