import { 
  WarehouseZone, 
  AuditorAssignment, 
  WorkloadDistributionConfig, 
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

export interface AisleWorkload {
  aisle: AislePair;
  rackIds: number[];
  rackCodes: string[];
  totalSlots: number;
  occupiedSlots: number;
  totalPallets: number;
}

/**
 * Retorna los pasillos que pertenecen a una zona determinada.
 * Congelado: Pasillos 1 al 8.
 * Refrigerado: Pasillos 9 al 15.
 */
export function getAislesForZone(zone: WarehouseZone): AislePair[] {
  if (zone === 'CONGELADO') {
    return DEFAULT_AISLES.filter(a => a.id >= 1 && a.id <= 8);
  }
  if (zone === 'REFRIGERADO') {
    return DEFAULT_AISLES.filter(a => a.id >= 9 && a.id <= 15);
  }
  return DEFAULT_AISLES;
}

/**
 * Retorna los racks que pertenecen a una zona determinada.
 * Congelado: Racks 1 al 16.
 * Refrigerado: Racks 17 al 29.
 */
export function getRacksForZone(zone: WarehouseZone): RackConfig[] {
  if (zone === 'CONGELADO') {
    return WAREHOUSE_RACKS.filter(r => r.id >= 1 && r.id <= 16);
  }
  if (zone === 'REFRIGERADO') {
    return WAREHOUSE_RACKS.filter(r => r.id >= 17 && r.id <= 29);
  }
  return WAREHOUSE_RACKS;
}

/**
 * Verifica si un rack pertenece a una zona.
 */
export function isRackInZone(rackId: number, zone: WarehouseZone): boolean {
  if (zone === 'ALL') return true;
  if (zone === 'CONGELADO') return rackId >= 1 && rackId <= 16;
  if (zone === 'REFRIGERADO') return rackId >= 17 && rackId <= 29;
  return true;
}

/**
 * Verifica si un pasillo pertenece a una zona.
 */
export function isAisleInZone(aisleId: number, zone: WarehouseZone): boolean {
  if (zone === 'ALL') return true;
  if (zone === 'CONGELADO') return aisleId >= 1 && aisleId <= 8;
  if (zone === 'REFRIGERADO') return aisleId >= 9 && aisleId <= 15;
  return true;
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
    const rackCodes: string[] = [];

    for (const rId of rackIds) {
      const rack = WAREHOUSE_RACKS.find(r => r.id === rId);
      if (!rack) continue;
      rackCodes.push(rack.code);

      // Total physical slots (moduleCount * 6)
      totalSlots += rack.moduleCount * 6;

      // Occupied slots & pallets for this rack
      for (const mod of rack.modules) {
        for (let lvl = 1; lvl <= 6; lvl++) {
          const nivelStr = String(lvl).padStart(2, '0');
          const ubi = `${mod}${nivelStr}`;
          const items = stockIndex.get(ubi);
          if (items && items.length > 0) {
            occupiedSlots++;
            totalPallets += items.length;
          }
        }
      }
    }

    return {
      aisle,
      rackIds,
      rackCodes,
      totalSlots,
      occupiedSlots,
      totalPallets
    };
  });
}

/**
 * Algoritmo de partición contigua óptima:
 * Divide N pasillos contiguos entre K auditores minimizando la varianza
 * de la métrica elegida (totalSlots, occupiedSlots o totalPallets).
 * Garantiza que cada auditor reciba un bloque continuo de pasillos contiguos.
 */
export function calculateOptimalWorkloadDistribution(
  zone: WarehouseZone,
  auditorCount: number,
  balanceMetric: 'totalSlots' | 'occupiedSlots' | 'totalPallets',
  stockIndex: Map<string, StockItem[]>
): WorkloadDistributionConfig {
  const aisleWorkloads = calculateAislesWorkload(zone, stockIndex);
  const n = aisleWorkloads.length;
  const k = Math.max(1, Math.min(auditorCount, n)); // K no puede superar el número de pasillos

  // Extraer pesos según la métrica seleccionada
  const weights = aisleWorkloads.map(aw => aw[balanceMetric] || 1);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const targetPerAuditor = totalWeight / k;

  // Si K === 1, todo a 1 auditor
  if (k === 1) {
    const allAisleIds = aisleWorkloads.map(aw => aw.aisle.id);
    const allRackIds = Array.from(new Set(aisleWorkloads.flatMap(aw => aw.rackIds))).sort((a, b) => a - b);
    const totalSlots = aisleWorkloads.reduce((acc, aw) => acc + aw.totalSlots, 0);
    const occupiedSlots = aisleWorkloads.reduce((acc, aw) => acc + aw.occupiedSlots, 0);
    const totalPallets = aisleWorkloads.reduce((acc, aw) => acc + aw.totalPallets, 0);

    const assignment: AuditorAssignment = {
      id: 1,
      name: 'Auditor 1',
      color: AUDITOR_COLORS[0],
      aisleIds: allAisleIds,
      rackIds: allRackIds,
      totalSlots,
      occupiedSlots,
      totalPallets,
      percentage: 100,
    };

    return {
      zone,
      auditorCount: 1,
      balanceMetric,
      assignments: [assignment],
      updatedAt: new Date().toISOString(),
    };
  }

  // Búsqueda exhaustiva de partición contigua óptima (K particiones contiguas de N elementos)
  // Genera todos los cortes posibles 0 < c_1 < c_2 < ... < c_{k-1} < n
  // y selecciona el que minimiza la suma de desviaciones cuadradas respecto al objetivo.
  let bestCuts: number[] = [];
  let minVariance = Infinity;

  function findPartitions(auditorIdx: number, currentStart: number, currentCuts: number[]) {
    if (auditorIdx === k - 1) {
      // Último auditor toma desde currentStart hasta n
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

    // Cada auditor restante necesita al menos 1 pasillo
    const maxStartForThis = n - (k - 1 - auditorIdx);
    for (let cut = currentStart + 1; cut <= maxStartForThis; cut++) {
      findPartitions(auditorIdx + 1, cut, [...currentCuts, cut]);
    }
  }

  findPartitions(0, 0, []);

  // Construir asignaciones a partir de los mejores cortes encontrados
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

    const metricValue = balanceMetric === 'totalSlots' ? totalSlots : (balanceMetric === 'occupiedSlots' ? occupiedSlots : totalPallets);
    const percentage = totalWeight > 0 ? Math.round((metricValue / totalWeight) * 1000) / 10 : 0;

    assignments.push({
      id: aIdx + 1,
      name: `Auditor ${aIdx + 1}`,
      color: AUDITOR_COLORS[aIdx % AUDITOR_COLORS.length],
      aisleIds,
      rackIds,
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
    assignments,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Genera el texto formateado para compartir la asignación por WhatsApp o correo.
 */
export function generateWorkloadShareText(config: WorkloadDistributionConfig): string {
  const zoneName = config.zone === 'CONGELADO' 
    ? 'CÁMARA CONGELADO (Pasillos 1 al 8)' 
    : config.zone === 'REFRIGERADO' 
      ? 'CÁMARA REFRIGERADO (Pasillos 9 al 15)' 
      : 'ALMACÉN COMPLETO (Pasillos 1 al 15)';

  const metricLabel = config.balanceMetric === 'totalSlots' 
    ? 'Posiciones Físicas' 
    : config.balanceMetric === 'occupiedSlots' 
      ? 'Posiciones Ocupadas' 
      : 'Pallets SAP';

  let text = `📋 *ASIGNACIÓN DE AUDITORÍA DE ALTURA — CIAL CD SAN JORGE*\n`;
  text += `🏭 *Sector*: ${zoneName}\n`;
  text += `👥 *Total Auditores*: ${config.assignments.length}\n`;
  text += `⚖️ *Balanceado por*: ${metricLabel}\n`;
  text += `📅 *Fecha*: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}\n`;
  text += `──────────────────────\n\n`;

  config.assignments.forEach(a => {
    const aislesStr = a.aisleIds.length === 1 
      ? `Pasillo ${a.aisleIds[0]}` 
      : `Pasillos ${a.aisleIds.join(', ')}`;
    
    const racksStr = a.rackIds.length === 1 
      ? `RACK ${a.rackIds[0]}` 
      : `RACK ${a.rackIds[0]} al ${a.rackIds[a.rackIds.length - 1]} (${a.rackIds.map(r => `R${r}`).join(', ')})`;

    text += `👤 *${a.name}* (ID #${a.id}):\n`;
    text += `  • 🚪 *${aislesStr}*\n`;
    text += `  • 🏗️ ${racksStr}\n`;
    text += `  • 📦 *${a.totalSlots.toLocaleString()} posiciones* (${a.percentage}%) | ${a.occupiedSlots.toLocaleString()} con stock (${a.totalPallets.toLocaleString()} pallets)\n\n`;
  });

  text += `──────────────────────\n`;
  text += `📲 *App de Auditoría:* https://almacenamiento.nexusnetwork.cl/\n`;
  text += `💡 *Instrucción:* Al abrir la app en su teléfono, seleccionen su número de auditor en la barra superior para ver automáticamente solo sus pasillos y racks asignados.`;

  return text;
}
